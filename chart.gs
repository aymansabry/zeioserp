/**
 * ChartOfAccounts_Library.gs – ZEIOS ERP SYSTEM (LIBRARY VERSION)
 * الإصدار: 3.3.0
 * ⚠️ هذه المكتبة تحتوي على دوال Backend فقط (بدون HtmlService)
 * ⚠️ تستخدم دوال القراءة من core_client.gs
 * 📞 الدعم: zeioszeios0@gmail.com | WhatsApp: 00201205951462
 */

// ========== 🔐 ثوابت النظام ==========
var HASH_ALGORITHM = 'SHA_256';
var SCRIPT_TZ = Session.getScriptTimeZone();
var DATE_FORMAT = 'dd-MM-yyyy HH:mm:ss';
var LIBRARY_VERSION = '3.3.0';

// ========== 📋 خريطة أعمدة شجرة الحسابات (مطابقة للجدول الفعلي) ==========
var COA_COL = {
  ID: 0,
  ACCOUNT_NO: 1,
  ACCOUNT_NAME: 2,
  PARENT_ACCOUNT_ID: 3,
  BS_GROUP_ID: 4,
  PL_GROUP_ID: 5,
  CONTACT_NAME: 6,
  ADDRESS: 7,
  PHONE: 8,
  EMAIL: 9,
  CREDIT_LIMIT: 10,
  CREATED_AT: 11,
  LOCKED: 12
};

// ========== 📋 أنواع الحسابات ==========
var ACCOUNT_TYPES = [
  { value: "customers", label: "عملاء", bs_group_id: "BS-A", pl_group_id: "", description: "حسابات القبض والعملاء", prefix: "1200", default_parent: "1200", parent_account_no: "1200" },
  { value: "suppliers", label: "موردين", bs_group_id: "BS-L", pl_group_id: "", description: "حسابات الدفع والموردين", prefix: "2100", default_parent: "2100", parent_account_no: "2100" },
  { value: "expenses", label: "مصروفات تشغيلية", bs_group_id: "", pl_group_id: "PL-E", description: "المصروفات التشغيلية", prefix: "6000", default_parent: "6000", parent_account_no: "6000" },
  { value: "revenue", label: "إيرادات مبيعات", bs_group_id: "", pl_group_id: "PL-R", description: "إيرادات المبيعات", prefix: "4000", default_parent: "4000", parent_account_no: "4000" },
  { value: "other_revenue", label: "إيرادات أخرى", bs_group_id: "", pl_group_id: "PL-OR", description: "الإيرادات الأخرى (خصم مكتسب)", prefix: "4100", default_parent: "4100", parent_account_no: "4100" },
  { value: "cash", label: "خزائن", bs_group_id: "BS-A", pl_group_id: "", description: "النقدية والخزائن", prefix: "1100", default_parent: "1100", parent_account_no: "1100" },
  { value: "banks", label: "بنوك", bs_group_id: "BS-A", pl_group_id: "", description: "الحسابات البنكية", prefix: "1100", default_parent: "1100", parent_account_no: "1100" },
  { value: "inventory", label: "مخزون", bs_group_id: "BS-A", pl_group_id: "", description: "المخزون والسلع", prefix: "1300", default_parent: "1300", parent_account_no: "1300" },
  { value: "fixed_assets", label: "أصول ثابتة", bs_group_id: "BS-A", pl_group_id: "", description: "المعدات والعقارات", prefix: "1500", default_parent: "1500", parent_account_no: "1500" },
  { value: "equity", label: "حقوق ملكية", bs_group_id: "BS-E", pl_group_id: "", description: "رأس المال والأرباح", prefix: "3000", default_parent: "3000", parent_account_no: "3000" },
  { value: "cost_of_sales", label: "تكلفة مبيعات", bs_group_id: "", pl_group_id: "PL-C", description: "تكلفة البضائع المباعة", prefix: "5000", default_parent: "5000", parent_account_no: "5000" },
  { value: "other_expenses", label: "مصروفات أخرى", bs_group_id: "", pl_group_id: "PL-OE", description: "المصروفات الأخرى (خصم ممنوح)", prefix: "5100", default_parent: "5100", parent_account_no: "5100" },
  { value: "other_assets", label: "أصول أخرى", bs_group_id: "BS-A", pl_group_id: "", description: "أصول متداولة أخرى", prefix: "1900", default_parent: "1900", parent_account_no: "1900" },
  { value: "other_liabilities", label: "التزامات أخرى", bs_group_id: "BS-L", pl_group_id: "", description: "التزامات متداولة أخرى", prefix: "2900", default_parent: "2900", parent_account_no: "2900" }
];

// ========== 📦 دوال جلب مجموعات الميزانية وقائمة الدخل ==========
function getBSGroupsForChartOfAccounts() {
  try {
    var id = typeof getMasterTableId === 'function' ? getMasterTableId("Balance_Sheet_Groups") : null;
    if (!id) return [];
    var sheet = SpreadsheetApp.openById(id).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    return data.length > 1 ? data.slice(1).map(function(row) {
      return { code: (row[0] || '').toString().trim(), name: (row[1] || '').toString().trim() };
    }) : [];
  } catch (e) { console.error("❌ getBSGroupsForChartOfAccounts error:", e); return []; }
}

function getPLGroupsForChartOfAccounts() {
  try {
    var id = typeof getMasterTableId === 'function' ? getMasterTableId("Profit_Loss_Groups") : null;
    if (!id) return [];
    var sheet = SpreadsheetApp.openById(id).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    return data.length > 1 ? data.slice(1).map(function(row) {
      return { code: (row[0] || '').toString().trim(), name: (row[1] || '').toString().trim() };
    }) : [];
  } catch (e) { console.error("❌ getPLGroupsForChartOfAccounts error:", e); return []; }
}

function getBSGroupsByTypeForChartOfAccounts(accountType) {
  try {
    var allGroups = getBSGroupsForChartOfAccounts();
    var selectedType = null;
    for (var i = 0; i < ACCOUNT_TYPES.length; i++) {
      if (ACCOUNT_TYPES[i].value === accountType) { selectedType = ACCOUNT_TYPES[i]; break; }
    }
    if (!selectedType || !selectedType.bs_group_id) return allGroups;
    return allGroups.filter(function(group) { return group.code === selectedType.bs_group_id; });
  } catch (e) { console.error("❌ getBSGroupsByTypeForChartOfAccounts error:", e); return []; }
}

function getPLGroupsByTypeForChartOfAccounts(accountType) {
  try {
    var allGroups = getPLGroupsForChartOfAccounts();
    var selectedType = null;
    for (var i = 0; i < ACCOUNT_TYPES.length; i++) {
      if (ACCOUNT_TYPES[i].value === accountType) { selectedType = ACCOUNT_TYPES[i]; break; }
    }
    if (!selectedType || !selectedType.pl_group_id) return allGroups;
    return allGroups.filter(function(group) { return group.code === selectedType.pl_group_id; });
  } catch (e) { console.error("❌ getPLGroupsByTypeForChartOfAccounts error:", e); return []; }
}

// ========== 📦 دوال جلب الحسابات ==========
function getAccountsListForChartOfAccounts() {
  try {
    var coaId = typeof getMasterTableId === 'function' ? getMasterTableId("Chart_Of_Accounts") : null;
    if (!coaId) return [];
    
    var sheet = SpreadsheetApp.openById(coaId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    
    if (data.length <= 1) return [];
    
    // ✅ خريطة الأعمدة الصحيحة حسب الهيكل الفعلي باستخدام COA_COL
    return data.slice(1).map(function(row) {
      var safe = row.map(function(cell) { return (cell || '').toString().trim(); });
      return {
        id: safe[COA_COL.ID],
        account_no: safe[COA_COL.ACCOUNT_NO],
        account_name: safe[COA_COL.ACCOUNT_NAME],
        parent_account_id: safe[COA_COL.PARENT_ACCOUNT_ID],
        bs_group_id: safe[COA_COL.BS_GROUP_ID],
        pl_group_id: safe[COA_COL.PL_GROUP_ID],
        contact_name: safe[COA_COL.CONTACT_NAME],
        address: safe[COA_COL.ADDRESS],
        phone: safe[COA_COL.PHONE],
        email: safe[COA_COL.EMAIL],
        credit_limit: safe[COA_COL.CREDIT_LIMIT],
        created_at: safe[COA_COL.CREATED_AT],
        locked: safe[COA_COL.LOCKED]
      };
    }).filter(function(item) { return item.account_no !== ''; });
  } catch (e) { console.error("❌ getAccountsListForChartOfAccounts error:", e); return []; }
}

function getAccountByIdForChartOfAccounts(id) {
  try {
    var items = getAccountsListForChartOfAccounts();
    for (var i = 0; i < items.length; i++) {
      if (String(items[i].id).trim() === String(id).trim()) return items[i];
    }
    return null;
  } catch (e) { console.error("❌ getAccountByIdForChartOfAccounts error:", e); return null; }
}

function getAccountByNumberForChartOfAccounts(accountNo) {
  try {
    var items = getAccountsListForChartOfAccounts();
    for (var i = 0; i < items.length; i++) {
      if (String(items[i].account_no).trim() === String(accountNo).trim()) return items[i];
    }
    return null;
  } catch (e) { console.error("❌ getAccountByNumberForChartOfAccounts error:", e); return null; }
}

function getAccountsByTypeForChartOfAccounts(accountType) {
  try {
    var allAccounts = getAccountsListForChartOfAccounts();
    var selectedType = null;
    for (var i = 0; i < ACCOUNT_TYPES.length; i++) {
      if (ACCOUNT_TYPES[i].value === accountType) { selectedType = ACCOUNT_TYPES[i]; break; }
    }
    if (!selectedType) return allAccounts;
    return allAccounts.filter(function(account) {
      if (selectedType.bs_group_id && account.bs_group_id === selectedType.bs_group_id) return true;
      if (selectedType.pl_group_id && account.pl_group_id === selectedType.pl_group_id) return true;
      return false;
    });
  } catch (e) { console.error("❌ getAccountsByTypeForChartOfAccounts error:", e); return []; }
}

// ========== 🔄 دوال توليد المعرفات ==========
function generateSequentialIdForChartOfAccounts(accountType, accountNo) {
  try {
    var accounts = getAccountsListForChartOfAccounts();
    var typePrefix = '';
    for (var i = 0; i < ACCOUNT_TYPES.length; i++) {
      if (ACCOUNT_TYPES[i].value === accountType) { typePrefix = ACCOUNT_TYPES[i].prefix; break; }
    }
    if (!typePrefix && accountNo) { typePrefix = accountNo.substring(0, 4); }
    if (!typePrefix) return typeof generateID === 'function' ? generateID() : generateUniqueIdForChartOfAccounts();
    
    var maxNum = 0;
    for (var j = 0; j < accounts.length; j++) {
      var accNo = accounts[j].account_no;
      if (accNo && accNo.indexOf(typePrefix) === 0) {
        var numStr = accNo.replace(/[^0-9]/g, '');
        var num = parseInt(numStr);
        if (!isNaN(num) && num > maxNum) { maxNum = num; }
      }
    }
    return (maxNum + 1).toString();
  } catch (e) {
    console.error("❌ generateSequentialIdForChartOfAccounts error:", e);
    return typeof generateID === 'function' ? generateID() : generateUniqueIdForChartOfAccounts();
  }
}

function generateAccountNumberForChartOfAccounts(accountType, parentAccountNo) {
  try {
    var selectedType = null;
    for (var i = 0; i < ACCOUNT_TYPES.length; i++) {
      if (ACCOUNT_TYPES[i].value === accountType) { selectedType = ACCOUNT_TYPES[i]; break; }
    }
    if (!selectedType) return "";
    
    var prefix = selectedType.prefix;
    var accounts = getAccountsListForChartOfAccounts();
    var similarAccounts = accounts.filter(function(acc) {
      return acc.account_no && acc.account_no.indexOf(prefix) === 0;
    });
    
    var maxNum = 0;
    similarAccounts.forEach(function(acc) {
      var numStr = acc.account_no.replace(prefix, '').replace(/[^0-9]/g, '');
      var num = parseInt(numStr);
      if (!isNaN(num) && num > maxNum) { maxNum = num; }
    });
    
    if (parentAccountNo && parentAccountNo !== selectedType.default_parent) {
      var parent = getAccountByNumberForChartOfAccounts(parentAccountNo);
      if (parent) {
        var parentPrefix = parentAccountNo;
        var childAccounts = accounts.filter(function(acc) {
          return acc.account_no && acc.account_no.indexOf(parentPrefix + '-') === 0;
        });
        var maxChild = 0;
        childAccounts.forEach(function(acc) {
          var parts = acc.account_no.split('-');
          if (parts.length > 1) {
            var num = parseInt(parts[1]);
            if (!isNaN(num) && num > maxChild) { maxChild = num; }
          }
        });
        var nextChild = (maxChild + 1).toString().padStart(2, '0');
        return parentPrefix + '-' + nextChild;
      }
    }
    
    if (maxNum > 0) { return (maxNum + 1).toString(); }
    return prefix + "01";
  } catch (e) {
    console.error("❌ generateAccountNumberForChartOfAccounts error:", e);
    return "";
  }
}

// ========== 💾 دالة الحفظ الرئيسية (مُصححة) ==========
function saveAccountForChartOfAccounts(formData) {
  try {
    var coaId = typeof getMasterTableId === 'function' ? getMasterTableId("Chart_Of_Accounts") : null;
    if (!coaId) throw new Error("لم يتم العثور على جدول الأستاذ.");
    
    var sheet = SpreadsheetApp.openById(coaId).getSheets()[0];
    var now = typeof getNowTimestamp === 'function' ? getNowTimestamp() : getNowTimestampForChartOfAccounts();
    
    var accountType = formData.account_type || '';
    if (!accountType) { throw new Error("⚠️ نوع الحساب مطلوب. يرجى اختيار نوع الحساب من القائمة."); }
    
    var typeInfo = getAccountTypeInfoForChartOfAccounts(accountType);
    if (!typeInfo) { throw new Error("⚠️ نوع الحساب غير صالح: " + accountType); }
    
    var accountNo = formData.account_no;
    if (!accountNo || String(accountNo).trim() === '') {
      accountNo = generateAccountNumberForChartOfAccounts(accountType, formData.parent_account_no);
    }
    if (!accountNo) throw new Error("رمز الحساب مطلوب أو لم يتم توليده تلقائياً.");
    
    var existingAccount = getAccountByNumberForChartOfAccounts(accountNo);
    if (existingAccount && (!formData.id || String(existingAccount.id) !== String(formData.id))) {
      throw new Error("⚠️ رمز الحساب " + accountNo + " مستخدم مسبقاً للحساب: " + existingAccount.account_name);
    }
    
    var id;
    if (formData.id && String(formData.id).trim() !== '') {
      id = String(formData.id).trim();
    } else {
      id = generateSequentialIdForChartOfAccounts(accountType, accountNo);
    }
    
    var bsGroupId = '';
    if (formData.bs_group_id !== undefined && formData.bs_group_id !== null && String(formData.bs_group_id).trim() !== '') {
      bsGroupId = String(formData.bs_group_id).trim();
    } else if (typeInfo.bs_group_id && String(typeInfo.bs_group_id).trim() !== '') {
      bsGroupId = String(typeInfo.bs_group_id).trim();
    }
    
    var plGroupId = '';
    if (formData.pl_group_id !== undefined && formData.pl_group_id !== null && String(formData.pl_group_id).trim() !== '') {
      plGroupId = String(formData.pl_group_id).trim();
    } else if (typeInfo.pl_group_id && String(typeInfo.pl_group_id).trim() !== '') {
      plGroupId = String(typeInfo.pl_group_id).trim();
    }
    
    var parentId = '';
    if (formData.parent_account_id && String(formData.parent_account_id).trim() !== '') {
      parentId = String(formData.parent_account_id).trim();
    } else if (formData.parent_account_no && String(formData.parent_account_no).trim() !== '') {
      var parentAcc = getAccountByNumberForChartOfAccounts(formData.parent_account_no);
      if (parentAcc) { parentId = parentAcc.id; }
      else if (typeInfo.parent_account_no) {
        var defaultParent = getAccountByNumberForChartOfAccounts(typeInfo.parent_account_no);
        if (defaultParent) parentId = defaultParent.id;
      }
    } else if (typeInfo.parent_account_no) {
      var defaultParent = getAccountByNumberForChartOfAccounts(typeInfo.parent_account_no);
      if (defaultParent) parentId = defaultParent.id;
    }
    
    // ✅ الصف الجديد يطابق الهيكل الفعلي: 13 عمود حسب خريطة COA_COL
    var newRow = [
      id,                                    // 0: id
      String(accountNo).trim(),              // 1: account_no
      (formData.account_name || '').toString().trim(),  // 2: account_name
      String(parentId).trim(),               // 3: parent_account_id
      String(bsGroupId).trim(),              // 4: bs_group_id
      String(plGroupId).trim(),              // 5: pl_group_id
      (formData.contact_name || '').toString().trim(),   // 6: contact_name
      (formData.address || '').toString().trim(),        // 7: address
      (formData.phone || '').toString().trim(),          // 8: phone
      (formData.email || '').toString().trim(),          // 9: email
      (formData.credit_limit || '0').toString().trim(),  // 10: credit_limit
      now,                                  // 11: created_at
      (formData.locked === true || formData.locked === 'true') ? 'TRUE' : ''  // 12: locked
    ];
    
    if (formData.id && String(formData.id).trim() !== '') {
      var data = sheet.getDataRange().getDisplayValues();
      var rowIndex = -1;
      // ✅ البحث باستخدام العمود الصحيح (العمود 0 = id)
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][COA_COL.ID]).trim() === String(formData.id).trim()) { 
          rowIndex = i + 1; 
          break; 
        }
      }
      if (rowIndex === -1) throw new Error("لم يتم العثور على الحساب للتحديث.");
      sheet.getRange(rowIndex, 1, 1, newRow.length).setValues([newRow]);
    } else {
      sheet.appendRow(newRow);
    }
    
    // ✅ تم إصلاح السطر هنا - إضافة مفتاح "data" قبل الكائن
    return { 
      success: true, 
      message: "تم حفظ الحساب بنجاح.", data:
       { id: id, account_no: accountNo, bs_group_id: bsGroupId, pl_group_id: plGroupId } 
    };
  } catch (e) {
    console.error("❌ saveAccountForChartOfAccounts error:", e);
    return { success: false, message: e.toString() };
  }
}

// ========== 🗑️ دوال الحذف ==========
function deleteAccountForChartOfAccounts(id) {
  try {
    if (!id) throw new Error("معرف الحساب مطلوب للحذف.");
    var coaId = typeof getMasterTableId === 'function' ? getMasterTableId("Chart_Of_Accounts") : null;
    if (!coaId) throw new Error("لم يتم العثور على الجدول.");
    
    var sheet = SpreadsheetApp.openById(coaId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    
    // ✅ البحث باستخدام العمود الصحيح (العمود 0 = id)
    for (var i = data.length - 1; i >= 1; i--) {
      if (String(data[i][COA_COL.ID]).trim() === String(id).trim()) {
        sheet.deleteRow(i + 1);
        return { success: true, message: "تم حذف الحساب بنجاح." };
      }
    }
    return { success: false, message: "لم يتم العثور على الحساب." };
  } catch (e) {
    console.error("❌ deleteAccountForChartOfAccounts error:", e);
    return { success: false, message: e.toString() };
  }
}

// ========== ✅ التحقق من البيانات ==========
function validateAccountDataForChartOfAccounts(formData) {
  var errors = [];
  if (!formData.account_name || formData.account_name.trim() === '') errors.push("⚠️ اسم الحساب مطلوب");
  if (!formData.account_type) errors.push("⚠️ نوع الحساب مطلوب");
  
  if (formData.account_no && formData.account_no.trim() !== '') {
    var accountNo = formData.account_no.trim();
    var validFormat = /^\d{4,6}(-\d{2,3})?$/.test(accountNo);
    if (!validFormat) errors.push("⚠️ تنسيق رقم الحساب غير صحيح. استخدم: 4-6 أرقام أو 4-6 أرقام + واصلة + 2-3 أرقام");
  }
  
  if (!formData.id && formData.account_no && formData.account_no.trim() !== '') {
    var existing = getAccountByNumberForChartOfAccounts(formData.account_no.trim());
    if (existing) errors.push("⚠️ رمز الحساب هذا مستخدم مسبقاً");
  }
  
  if (formData.account_type) {
    var validType = false;
    for (var j = 0; j < ACCOUNT_TYPES.length; j++) {
      if (ACCOUNT_TYPES[j].value === formData.account_type) { validType = true; break; }
    }
    if (!validType) errors.push("⚠️ نوع الحساب غير صالح");
  }
  
  if (formData.bs_group_id && formData.bs_group_id.trim() !== '') {
    var bsGroups = getBSGroupsForChartOfAccounts();
    var validBS = false;
    for (var k = 0; k < bsGroups.length; k++) {
      if (bsGroups[k].code === formData.bs_group_id) { validBS = true; break; }
    }
    if (!validBS) errors.push("⚠️ بند الميزانية غير صالح");
  }
  
  if (formData.pl_group_id && formData.pl_group_id.trim() !== '') {
    var plGroups = getPLGroupsForChartOfAccounts();
    var validPL = false;
    for (var l = 0; l < plGroups.length; l++) {
      if (plGroups[l].code === formData.pl_group_id) { validPL = true; break; }
    }
    if (!validPL) errors.push("⚠️ بند الربح والخسارة غير صالح");
  }
  
  if (formData.email && formData.email.trim() !== '') {
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) errors.push("⚠️ تنسيق البريد الإلكتروني غير صحيح");
  }
  
  return { valid: errors.length === 0, errors: errors };
}

// ========== 🔍 دوال مساعدة ==========
function getSuggestedAccountNumberForChartOfAccounts(accountType, parentAccountNo) {
  if (parentAccountNo === undefined) parentAccountNo = '';
  return generateAccountNumberForChartOfAccounts(accountType, parentAccountNo);
}

function getParentAccountsForChartOfAccounts(accountType) {
  try {
    var allAccounts = getAccountsListForChartOfAccounts();
    var selectedType = null;
    for (var i = 0; i < ACCOUNT_TYPES.length; i++) {
      if (ACCOUNT_TYPES[i].value === accountType) { selectedType = ACCOUNT_TYPES[i]; break; }
    }
    if (!selectedType) return [];
    
    var result = [];
    for (var j = 0; j < allAccounts.length; j++) {
      var account = allAccounts[j];
      if (selectedType.bs_group_id && account.bs_group_id !== selectedType.bs_group_id) continue;
      if (selectedType.pl_group_id && account.pl_group_id !== selectedType.pl_group_id) continue;
      if (!account.parent_account_id || account.parent_account_id.trim() === '') {
        result.push({ value: account.account_no, label: account.account_no + ' - ' + account.account_name, id: account.id });
      }
    }
    return result;
  } catch (e) { console.error("❌ getParentAccountsForChartOfAccounts error:", e); return []; }
}

function getAccountTypeInfoForChartOfAccounts(accountType) {
  var typeInfo = null;
  for (var i = 0; i < ACCOUNT_TYPES.length; i++) {
    if (ACCOUNT_TYPES[i].value === accountType) { typeInfo = ACCOUNT_TYPES[i]; break; }
  }
  if (!typeInfo) return null;
  return {
    value: typeInfo.value, label: typeInfo.label, description: typeInfo.description,
    bs_group_id: typeInfo.bs_group_id, pl_group_id: typeInfo.pl_group_id,
    suggested_prefix: typeInfo.prefix, default_parent: typeInfo.default_parent,
    parent_account_no: typeInfo.parent_account_no,
    suggested_number: getSuggestedAccountNumberForChartOfAccounts(accountType)
  };
}

function searchAccountsForChartOfAccounts(query, filters) {
  if (filters === undefined) filters = {};
  try {
    var results = getAccountsListForChartOfAccounts();
    
    // 🔍 تصفية حسب نص البحث
    if (query && query.trim() !== '') {
      var q = query.toLowerCase();
      results = results.filter(function(acc) {
        return acc.account_no.toLowerCase().indexOf(q) !== -1 ||
               acc.account_name.toLowerCase().indexOf(q) !== -1 ||
               (acc.contact_name && acc.contact_name.toLowerCase().indexOf(q) !== -1);
      });
    }
    
    // 🔍 تصفية حسب نوع الحساب
    if (filters.account_type) {
      results = getAccountsByTypeForChartOfAccounts(filters.account_type);
    }
    
    // 🔍 تصفية حسب بند الميزانية
    if (filters.bs_group_id) {
      results = results.filter(function(acc) { 
        return acc.bs_group_id === filters.bs_group_id; 
      });
    }
    
    // 🔍 تصفية حسب بند الربح والخسارة
    if (filters.pl_group_id) {
      results = results.filter(function(acc) { 
        return acc.pl_group_id === filters.pl_group_id; 
      });
    }
    
    // ✅ تم الإصلاح: إضافة مفتاح "data:" قبل النتائج
    return { 
      success: true, 
      data: results, 
      count: results.length 
    };
    
  } catch (e) { 
    console.error("❌ searchAccountsForChartOfAccounts error:", e); 
    // ✅ تم الإصلاح: إضافة مفتاح "data:" قبل المصفوفة الفارغة
    return { 
      success: false, 
      message: e.toString(), 
      data: [] 
    }; 
  }
}

// ========== 📤 تصدير الحسابات ==========
function exportAccountsToCSVForChartOfAccounts() {
  try {
    var accounts = getAccountsListForChartOfAccounts();
    if (accounts.length === 0) return { success: false, message: "لا توجد حسابات للتصدير" };
    
    var headers = ["id", "account_no", "account_name", "parent_account_id", "bs_group_id", "pl_group_id", "contact_name", "address", "phone", "email", "credit_limit", "created_at", "locked"];
    var csv = headers.join(",") + "\n";
    
    for (var i = 0; i < accounts.length; i++) {
      var acc = accounts[i];
      var row = [
        acc.id, acc.account_no, '"' + (acc.account_name || '').replace(/"/g, '""') + '"',
        acc.parent_account_id, acc.bs_group_id, acc.pl_group_id,
        '"' + (acc.contact_name || '').replace(/"/g, '""') + '"',
        '"' + (acc.address || '').replace(/"/g, '""') + '"',
        acc.phone, acc.email, acc.credit_limit, acc.created_at, acc.locked
      ];
      csv += row.join(",") + "\n";
    }
    
    var filename = "ChartOfAccounts_" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd") + ".csv";
    return { success: true, message: "تم تجهيز الملف للتصدير", csv: csv, filename: filename };
  } catch (e) { console.error("❌ exportAccountsToCSVForChartOfAccounts error:", e); return { success: false, message: e.toString() }; }
}

// ========== 🔧 تصحيح شجرة الحسابات ==========
function fixChartOfAccountsForChartOfAccounts() {
  try {
    console.log("🚀 بدء تصحيح شجرة الحسابات...");
    var coaId = typeof getMasterTableId === 'function' ? getMasterTableId("Chart_Of_Accounts") : null;
    if (!coaId) { console.error("❌ لم يتم العثور على جدول شجرة الحسابات"); return { success: false, message: "لم يتم العثور على الجدول" }; }
    
    var sheet = SpreadsheetApp.openById(coaId).getSheets()[0];
    var now = typeof getNowTimestamp === 'function' ? getNowTimestamp() : getNowTimestampForChartOfAccounts();
    var data = sheet.getDataRange().getDisplayValues();
    var accounts = [];
    var accountsMap = {};
    
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var account = {
        id: row[COA_COL.ID] || '', 
        account_no: row[COA_COL.ACCOUNT_NO] || '', 
        account_name: row[COA_COL.ACCOUNT_NAME] || '',
        parent_account_id: row[COA_COL.PARENT_ACCOUNT_ID] || '', 
        bs_group_id: row[COA_COL.BS_GROUP_ID] || '', 
        pl_group_id: row[COA_COL.PL_GROUP_ID] || '',
        contact_name: row[COA_COL.CONTACT_NAME] || '', 
        address: row[COA_COL.ADDRESS] || '', 
        phone: row[COA_COL.PHONE] || '',
        email: row[COA_COL.EMAIL] || '', 
        credit_limit: row[COA_COL.CREDIT_LIMIT] || '0', 
        created_at: row[COA_COL.CREATED_AT] || now, 
        locked: row[COA_COL.LOCKED] || ''
      };
      accounts.push(account);
      accountsMap[account.account_no] = account;
    }
    
    var standardAccounts = [
      { account_no: "1000", account_name: "الأصول", parent: "0", bs_group: "BS-A", pl_group: "" },
      { account_no: "1100", account_name: "الأصول المتداولة", parent: "1000", bs_group: "BS-A", pl_group: "" },
      { account_no: "110001", account_name: "صندوق الكاش الرئيسي", parent: "1100", bs_group: "BS-A", pl_group: "" },
      { account_no: "110002", account_name: "حساب بنكي - رئيسي", parent: "1100", bs_group: "BS-A", pl_group: "" },
      { account_no: "110003", account_name: "صندوق مصروفات", parent: "1100", bs_group: "BS-A", pl_group: "" },
      { account_no: "1200", account_name: "حسابات القبض", parent: "1100", bs_group: "BS-A", pl_group: "" },
      { account_no: "120001", account_name: "عملاء", parent: "1200", bs_group: "BS-A", pl_group: "" },
      { account_no: "120002", account_name: "شيكات تحت التحصيل", parent: "1200", bs_group: "BS-A", pl_group: "" },
      { account_no: "1300", account_name: "المخزون", parent: "1100", bs_group: "BS-A", pl_group: "" },
      { account_no: "130001", account_name: "بضاعة", parent: "1300", bs_group: "BS-A", pl_group: "" },
      { account_no: "130002", account_name: "مواد خام", parent: "1300", bs_group: "BS-A", pl_group: "" },
      { account_no: "1500", account_name: "الأصول الثابتة", parent: "1000", bs_group: "BS-A", pl_group: "" },
      { account_no: "150001", account_name: "أثاث ومعدات", parent: "1500", bs_group: "BS-A", pl_group: "" },
      { account_no: "150002", account_name: "أجهزة وحاسبات", parent: "1500", bs_group: "BS-A", pl_group: "" },
      { account_no: "2000", account_name: "الالتزامات", parent: "0", bs_group: "BS-L", pl_group: "" },
      { account_no: "2100", account_name: "الالتزامات المتداولة", parent: "2000", bs_group: "BS-L", pl_group: "" },
      { account_no: "210001", account_name: "حسابات الدفع", parent: "2100", bs_group: "BS-L", pl_group: "" },
      { account_no: "210002", account_name: "موردون", parent: "2100", bs_group: "BS-L", pl_group: "" },
      { account_no: "2200", account_name: "الضرائب المستحقة", parent: "2100", bs_group: "BS-L", pl_group: "" },
      { account_no: "220001", account_name: "ضريبة القيمة المضافة", parent: "2200", bs_group: "BS-L", pl_group: "" },
      { account_no: "3000", account_name: "حقوق الملكية", parent: "0", bs_group: "BS-E", pl_group: "" },
      { account_no: "3100", account_name: "رأس المال", parent: "3000", bs_group: "BS-E", pl_group: "" },
      { account_no: "310001", account_name: "رأس المال المدفوع", parent: "3100", bs_group: "BS-E", pl_group: "" },
      { account_no: "3200", account_name: "الأرباح المحتجزة", parent: "3000", bs_group: "BS-E", pl_group: "" },
      { account_no: "320001", account_name: "أرباح سنوات سابقة", parent: "3200", bs_group: "BS-E", pl_group: "" },
      { account_no: "4000", account_name: "إيرادات المبيعات", parent: "0", bs_group: "", pl_group: "PL-R" },
      { account_no: "400001", account_name: "مبيعات المنتجات", parent: "4000", bs_group: "", pl_group: "PL-R" },
      { account_no: "400002", account_name: "مبيعات الخدمات", parent: "4000", bs_group: "", pl_group: "PL-R" },
      { account_no: "400003", account_name: "مبيعات نقدية", parent: "4000", bs_group: "", pl_group: "PL-R" },
      { account_no: "400004", account_name: "مبيعات آجلة", parent: "4000", bs_group: "", pl_group: "PL-R" },
      { account_no: "4100", account_name: "إيرادات أخرى", parent: "0", bs_group: "", pl_group: "PL-OR" },
      { account_no: "410001", account_name: "خصم مكتسب", parent: "4100", bs_group: "", pl_group: "PL-OR" },
      { account_no: "410002", account_name: "إيرادات متنوعة", parent: "4100", bs_group: "", pl_group: "PL-OR" },
      { account_no: "5000", account_name: "تكلفة البضاعة المباعة", parent: "0", bs_group: "", pl_group: "PL-C" },
      { account_no: "500001", account_name: "تكلفة مبيعات المنتجات", parent: "5000", bs_group: "", pl_group: "PL-C" },
      { account_no: "500002", account_name: "تكلفة مبيعات الخدمات", parent: "5000", bs_group: "", pl_group: "PL-C" },
      { account_no: "500003", account_name: "مشتريات", parent: "5000", bs_group: "", pl_group: "PL-C" },
      { account_no: "5100", account_name: "مصروفات أخرى", parent: "0", bs_group: "", pl_group: "PL-OE" },
      { account_no: "510001", account_name: "خصم ممنوح", parent: "5100", bs_group: "", pl_group: "PL-OE" },
      { account_no: "510002", account_name: "فوائد بنكية", parent: "5100", bs_group: "", pl_group: "PL-OE" },
      { account_no: "510003", account_name: "عمولات بنكية", parent: "5100", bs_group: "", pl_group: "PL-OE" },
      { account_no: "6000", account_name: "المصروفات التشغيلية", parent: "0", bs_group: "", pl_group: "PL-E" },
      { account_no: "600001", account_name: "مصروفات نقل وشحن", parent: "6000", bs_group: "", pl_group: "PL-E" },
      { account_no: "600002", account_name: "إيجارات", parent: "6000", bs_group: "", pl_group: "PL-E" },
      { account_no: "600003", account_name: "رواتب وأجور", parent: "6000", bs_group: "", pl_group: "PL-E" },
      { account_no: "600004", account_name: "مصروفات إدارية", parent: "6000", bs_group: "", pl_group: "PL-E" },
      { account_no: "600005", account_name: "مصروفات تسويق وإعلان", parent: "6000", bs_group: "", pl_group: "PL-E" },
      { account_no: "600006", account_name: "مصروفات صيانة", parent: "6000", bs_group: "", pl_group: "PL-E" },
      { account_no: "600007", account_name: "مصروفات كهرباء ومياه", parent: "6000", bs_group: "", pl_group: "PL-E" },
      { account_no: "600008", account_name: "مصروفات اتصالات", parent: "6000", bs_group: "", pl_group: "PL-E" },
      { account_no: "600009", account_name: "مصروفات سفر وانتقال", parent: "6000", bs_group: "", pl_group: "PL-E" }
    ];
    
    var added = [], updated = [], skipped = [];
    
    for (var j = 0; j < standardAccounts.length; j++) {
      var acc = standardAccounts[j];
      if (!accountsMap[acc.account_no]) {
        var newId = generateSequentialIdForChartOfAccounts('', acc.account_no);
        var newRow = [
          acc.account_no, acc.account_no, acc.account_name, acc.parent, acc.bs_group, acc.pl_group,
          "", "", "", "", "0", now, "TRUE"
        ];
        sheet.appendRow(newRow);
        added.push(acc.account_no + " - " + acc.account_name);
        console.log("➕ إضافة:", acc.account_no, acc.account_name);
      } else {
        var existing = accountsMap[acc.account_no];
        var needsUpdate = false;
        if (existing.account_name !== acc.account_name) needsUpdate = true;
        if (existing.parent_account_id !== acc.parent) needsUpdate = true;
        if (existing.bs_group_id !== acc.bs_group) needsUpdate = true;
        if (existing.pl_group_id !== acc.pl_group) needsUpdate = true;
        
        if (needsUpdate) {
          for (var k = 1; k < data.length; k++) {
            if (String(data[k][COA_COL.ACCOUNT_NO]).trim() === acc.account_no) {
              var rowIndex = k + 1;
              var updates = [];
              if (existing.account_name !== acc.account_name) { sheet.getRange(rowIndex, COA_COL.ACCOUNT_NAME + 1).setValue(acc.account_name); updates.push("الاسم"); }
              if (existing.parent_account_id !== acc.parent) { sheet.getRange(rowIndex, COA_COL.PARENT_ACCOUNT_ID + 1).setValue(acc.parent); updates.push("الأب"); }
              if (existing.bs_group_id !== acc.bs_group) { sheet.getRange(rowIndex, COA_COL.BS_GROUP_ID + 1).setValue(acc.bs_group); updates.push("مجموعة الميزانية"); }
              if (existing.pl_group_id !== acc.pl_group) { sheet.getRange(rowIndex, COA_COL.PL_GROUP_ID + 1).setValue(acc.pl_group); updates.push("مجموعة الدخل"); }
              updated.push(acc.account_no + " - " + acc.account_name + " (" + updates.join(", ") + ")");
              console.log("🔄 تحديث:", acc.account_no, acc.account_name, updates);
              break;
            }
          }
        } else { skipped.push(acc.account_no + " - " + acc.account_name); }
      }
    }
    
    console.log("\n" + "=".repeat(50));
    console.log("✅ تم الانتهاء من تصحيح شجرة الحسابات");
    console.log("=".repeat(50));
    console.log("📊 الإحصائيات:");
    console.log("   ➕ حسابات مضافة: " + added.length);
    console.log("   🔄 حسابات محدثة: " + updated.length);
    console.log("   ⏭️ حسابات مطابقة: " + skipped.length);
    
    // ✅ تم الإصلاح: إضافة مفتاح "data:" قبل الكائن
    return { 
      success: true, 
      data: { added: added, updated: updated, skipped: skipped, total: accounts.length },
      message: "✅ تم تصحيح شجرة الحسابات بنجاح" 
    };
  } catch (e) {
    console.error("❌ fixChartOfAccountsForChartOfAccounts error:", e);
    return { success: false, message: "❌ خطأ: " + e.toString() };
  }
}
// ========== 🔧 دوال مساعدة ==========
function getNowTimestampForChartOfAccounts() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
}

function generateUniqueIdForChartOfAccounts() {
  return Utilities.getUuid().replace(/-/g, '');
}

function showStoredDataInLogForChartOfAccounts() {
  try {
    var props = typeof getDocProperties === 'function' ? getDocProperties() : PropertiesService.getDocumentProperties();
    var allKeys = props.getKeys();
    console.log('ZEIOS ERP - ChartOfAccounts data');
    console.log('Keys:', allKeys.length);
    return { success: true, count: allKeys.length, keys: allKeys };
  } catch (e) { console.error('Error:', e); return { success: false, error: e.toString() }; }
}

function getLibraryVersionForChartOfAccounts() { return LIBRARY_VERSION; }


/**
 * ChartOfAccounts_Client.gs – ZEIOS ERP ChartOfAccounts (SHEET VERSION)
 * دوال بنفس أسماء المكتبة عشان الكود يشتغل من غير تعديل
 * 
 * ⚠️ قبل التشغيل: أضف المكتبة من Extensions → Libraries
 */

// ========== 🔗 ربط المكتبة ==========
var ZEIOS = ZEIOS; // غيّر للاسم اللي أنت سميته

// ========== 📦 دوال شجرة الحسابات ==========
function getBSGroups() { try { return ZEIOS.getBSGroupsForChartOfAccounts(); } catch (e) { return []; } }
function getPLGroups() { try { return ZEIOS.getPLGroupsForChartOfAccounts(); } catch (e) { return []; } }
function getBSGroupsByType(accountType) { try { return ZEIOS.getBSGroupsByTypeForChartOfAccounts(accountType); } catch (e) { return []; } }
function getPLGroupsByType(accountType) { try { return ZEIOS.getPLGroupsByTypeForChartOfAccounts(accountType); } catch (e) { return []; } }
function getAccountsList() { try { return ZEIOS.getAccountsListForChartOfAccounts(); } catch (e) { return []; } }
function getAccountById(id) { try { return ZEIOS.getAccountByIdForChartOfAccounts(id); } catch (e) { return null; } }
function getAccountByNumber(accountNo) { try { return ZEIOS.getAccountByNumberForChartOfAccounts(accountNo); } catch (e) { return null; } }
function getAccountsByType(accountType) { try { return ZEIOS.getAccountsByTypeForChartOfAccounts(accountType); } catch (e) { return []; } }
function generateSequentialId(accountType, accountNo) { try { return ZEIOS.generateSequentialIdForChartOfAccounts(accountType, accountNo); } catch (e) { return typeof generateID === 'function' ? generateID() : Utilities.getUuid().replace(/-/g, ''); } }
function generateAccountNumber(accountType, parentAccountNo) { try { return ZEIOS.generateAccountNumberForChartOfAccounts(accountType, parentAccountNo); } catch (e) { return ""; } }
function saveAccount(formData) { try { return ZEIOS.saveAccountForChartOfAccounts(formData); } catch (e) { return {success:false,message:e.toString()}; } }
function deleteAccount(id) { try { return ZEIOS.deleteAccountForChartOfAccounts(id); } catch (e) { return {success:false,message:e.toString()}; } }
function validateAccountData(formData) { try { return ZEIOS.validateAccountDataForChartOfAccounts(formData); } catch (e) { return {valid:false,errors:[e.toString()]}; } }
function getSuggestedAccountNumber(accountType, parentAccountNo) { try { return ZEIOS.getSuggestedAccountNumberForChartOfAccounts(accountType, parentAccountNo); } catch (e) { return ''; } }
function getParentAccounts(accountType) { try { return ZEIOS.getParentAccountsForChartOfAccounts(accountType); } catch (e) { return []; } }
function getAccountTypeInfo(accountType) { try { return ZEIOS.getAccountTypeInfoForChartOfAccounts(accountType); } catch (e) { return null; } }
function searchAccounts(query, filters) { try { return ZEIOS.searchAccountsForChartOfAccounts(query, filters); } catch (e) { return {success:false,message:e.toString(),data:[]}; } }
function exportAccountsToCSV() { try { return ZEIOS.exportAccountsToCSVForChartOfAccounts(); } catch (e) { return {success:false,message:e.toString()}; } }
function fixChartOfAccounts() { try { return ZEIOS.fixChartOfAccountsForChartOfAccounts(); } catch (e) { return {success:false,message:e.toString()}; } }

// ========== 🔧 مساعدة ==========
function getNowTimestampForChartOfAccounts() { try { return ZEIOS.getNowTimestampForChartOfAccounts(); } catch (e) { return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss'); } }
function generateUniqueIdForChartOfAccounts() { try { return ZEIOS.generateUniqueIdForChartOfAccounts(); } catch (e) { return Utilities.getUuid().replace(/-/g, ''); } }
function showStoredDataInLogForChartOfAccounts() { try { return ZEIOS.showStoredDataInLogForChartOfAccounts(); } catch (e) { return {success:false,error:e.toString()}; } }
function getLibraryVersionForChartOfAccounts() { try { return ZEIOS.getLibraryVersionForChartOfAccounts(); } catch (e) { return 'غير متصل'; } }
