/**
 * Receipts.gs – ZEIOS ERP SYSTEM (LIBRARY VERSION)
 * الإصدار: 3.3.0
 * ⚠️ هذه المكتبة تحتوي على دوال Backend فقط (بدون HtmlService)
 * ⚠️ تستخدم DocumentProperties لعزل بيانات كل شيت
 * 📞 الدعم: zeioszeios0@gmail.com | WhatsApp: 00201205951462
 */

// ========== 🔐 ثوابت النظام ==========
var HASH_ALGORITHM = 'SHA_256';
var SCRIPT_TZ = Session.getScriptTimeZone();
var DATE_FORMAT = 'dd-MM-yyyy HH:mm:ss';
var LIBRARY_VERSION = '3.3.0';


// ========== 🔄 ثوابت المتحصلات ==========
var RECEIPT_REF_TYPE = 'RECEIPT';

// ========== 📦 دوال جلب البيانات ==========
function getAccountsForReceiptRecipient() {
  try {
    var coaId = typeof getMasterTableId === 'function' ? getMasterTableId("Chart_Of_Accounts") : null;
    if (!coaId) return [];
    
    var sheet = SpreadsheetApp.openById(coaId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    
    var accounts = [];
    for (var i = 1; i < data.length; i++) {
      var id = (data[i][0] || '').toString().trim();
      var accountNo = (data[i][1] || '').toString().trim();
      var accountName = (data[i][2] || '').toString().trim();
      var bsGroup = (data[i][4] || '').toString().trim();
      var plGroup = (data[i][5] || '').toString().trim();
      var phone = (data[i][8] || '').toString().trim();
      
      if (!bsGroup && !plGroup) continue;
      
      var category = "أخرى";
      if (bsGroup === 'BS-A') category = "أصول";
      else if (bsGroup === 'BS-L') category = "التزامات";
      else if (plGroup === 'PL-E') category = "مصروفات";
      else if (plGroup === 'PL-R') category = "إيرادات";
      
      accounts.push({
        id: id, account_no: accountNo, account_name: accountName,
        category: category, bs_group: bsGroup, pl_group: plGroup, phone: phone
      });
    }
    console.log(`✅ تم تحميل ${accounts.length} حساب من شجرة الحسابات`);
    return accounts;
  } catch (e) {
    console.error("❌ getAccountsForReceiptRecipient error:", e);
    return [];
  }
}

function getCashAccounts() {
  try { return typeof getSafes === 'function' ? getSafes() : []; }
  catch (e) { console.error("❌ getCashAccounts error:", e); return []; }
}

// ========== 📋 قائمة المتحصلات ==========
function getReceiptsList() {
  try {
    var fy = typeof getActiveFiscalYear === 'function' ? getActiveFiscalYear() : null;
    var year = fy ? fy.year_code : null;
    if (!year) return [];
    
    var receiptsId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Receipts", year) : null;
    if (!receiptsId) return [];

    var sheet = SpreadsheetApp.openById(receiptsId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();

    var allAccounts = {};
    var allPhones = {};
    var accounts = getAccountsForReceiptRecipient();
    for (var i = 0; i < accounts.length; i++) {
      allAccounts[accounts[i].id] = accounts[i].account_name;
      if (accounts[i].phone) allPhones[accounts[i].id] = accounts[i].phone;
    }
    var safes = getCashAccounts();
    for (var j = 0; j < safes.length; j++) { allAccounts[safes[j].id] = safes[j].account_name; }

    var receipts = [];
    for (var k = 1; k < data.length; k++) {
      var partnerId = (data[k][6] || '').toString().trim();
      var safeId = (data[k][7] || '').toString().trim();
      var amount = parseFloat(data[k][5]) || 0;
      
      if (!data[k][0] || (!partnerId && !safeId && amount === 0)) continue;
      
      receipts.push({
        id: data[k][0], receipt_no: data[k][4] || '---', fiscal_year: data[k][1],
        date: data[k][2], partner_id: partnerId, account_id: safeId, amount: amount, safe_id: safeId,
        notes: data[k][8] || "", created_at: data[k][9],
        partner_name: allAccounts[partnerId] || 'غير معروف',
        account_name: allAccounts[safeId] || 'غير معروف',
        partner_phone: allPhones[partnerId] || '',
        ref_type: (data[k][3] || '').toString().trim()
      });
    }
    console.log(`✅ تم تحميل ${receipts.length} متحصلة`);
    return receipts;
  } catch (e) {
    console.error("❌ getReceiptsList error:", e);
    return [];
  }
}

// ========== 🔍 جلب متحصلة بالتفصيل ==========
function getReceiptById(id) {
  try {
    var fy = typeof getActiveFiscalYear === 'function' ? getActiveFiscalYear() : null;
    var year = fy ? fy.year_code : null;
    if (!year) return null;
    
    var receiptsId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Receipts", year) : null;
    if (!receiptsId) return null;

    var sheet = SpreadsheetApp.openById(receiptsId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    
    var accounts = getAccountsForReceiptRecipient();
    var phonesMap = {};
    for (var i = 0; i < accounts.length; i++) { if (accounts[i].phone) phonesMap[accounts[i].id] = accounts[i].phone; }

    for (var j = 1; j < data.length; j++) {
      if (String(data[j][0]) === String(id)) {
        var partnerId = (data[j][6] || '').toString().trim();
        var safeId = (data[j][7] || '').toString().trim();
        var amount = parseFloat(data[j][5]) || 0;
        
        return {
          id: data[j][0], receipt_no: data[j][4], fiscal_year: data[j][1],
          date: data[j][2], partner_id: partnerId, account_id: safeId, amount: amount, safe_id: safeId,
          notes: data[j][8] || "", created_at: data[j][9],
          partner_phone: phonesMap[partnerId] || '',
          ref_type: (data[j][3] || '').toString().trim()
        };
      }
    }
    return null;
  } catch (e) {
    console.error("❌ getReceiptById error:", e);
    return null;
  }
}

// ========== 💰 رصيد الحساب ==========
function getAccountBalanceForReceipt(accountId) {
  try {
    var fy = typeof getActiveFiscalYear === 'function' ? getActiveFiscalYear() : null;
    var year = fy ? fy.year_code : null;
    if (!year || !accountId) { return { balance: "0.00", display_balance: "0.00", account_type: "unknown" }; }
    
    var accMovId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Account_Movements", year) : null;
    if (!accMovId) { return { balance: "0.00", display_balance: "0.00", account_type: "unknown" }; }
    
    var sheet = SpreadsheetApp.openById(accMovId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    var balance = 0;
    var accountType = 'unknown';
    
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][1]).trim() === String(accountId).trim()) {
        var debit = parseFloat(data[i][6] || '0');
        var credit = parseFloat(data[i][7] || '0');
        balance += (debit - credit);
      }
    }
    
    return { balance: balance.toFixed(2), display_balance: balance.toFixed(2), account_type: accountType };
  } catch (e) {
    console.error("❌ getAccountBalanceForReceipt error:", e);
    return { balance: "0.00", display_balance: "0.00", account_type: "unknown" };
  }
}

// ========== 🗑️ مسح القيود المحاسبية ==========
function clearReceiptAccountMovementsForReceipts(sheetId, receiptNo) {
  if (!sheetId) return;
  try {
    var sheet = SpreadsheetApp.openById(sheetId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    for (var i = data.length - 1; i >= 1; i--) {
      var refType = (data[i][4] || '').toString().trim();
      var refId = (data[i][5] || '').toString().trim();
      if (refType === RECEIPT_REF_TYPE && refId === receiptNo) { sheet.deleteRow(i + 1); }
    }
  } catch (e) { console.warn("⚠️ clearReceiptAccountMovementsForReceipts error:", e); }
}

// ========== 💰 حساب رصيد الحساب ==========
function calculateAccountBalanceForReceipts(sheet, accountId) {
  try {
    var data = sheet.getDataRange().getDisplayValues();
    var lastBalance = 0;
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][1]) === String(accountId)) {
        var bal = parseFloat(data[i][8]);
        if (!isNaN(bal)) { lastBalance = bal; }
      }
    }
    return lastBalance;
  } catch (e) { console.warn("⚠️ calculateAccountBalanceForReceipts error:", e); return 0; }
}

// ========== 📝 تسجيل القيود المحاسبية ==========
function recordReceiptAccountingEntriesForReceipts(formData, receiptNo, year, now, accMovId) {
  try {
    var accSheet = SpreadsheetApp.openById(accMovId).getSheets()[0];
    var amount = parseFloat(formData.amount) || 0;
    if (amount <= 0) return;
    
    var genId = function() { return typeof generateID === 'function' ? generateID() : generateUniqueId(); };
    
    var safeBalance = calculateAccountBalanceForReceipts(accSheet, formData.account_id);
    accSheet.appendRow([genId(), formData.account_id, year, formData.date, RECEIPT_REF_TYPE, receiptNo, amount.toString(), "0", (safeBalance + amount).toString(), now]);
    
    var partnerBalance = calculateAccountBalanceForReceipts(accSheet, formData.partner_id);
    accSheet.appendRow([genId(), formData.partner_id, year, formData.date, RECEIPT_REF_TYPE, receiptNo, "0", amount.toString(), (partnerBalance - amount).toString(), now]);
    
    return true;
  } catch (e) { console.warn("⚠️ recordReceiptAccountingEntriesForReceipts error:", e); return false; }
}

// ========== 💾 حفظ المتحصلة ==========
function saveReceipt(formData) {
  try {
    // ✅ التحقق من صلاحية الترخيص أولاً
    var licenseCheck = validateLicenseFromServer();
    if (!licenseCheck || licenseCheck.valid !== true) {
      return { 
        success: false, 
        message: licenseCheck?.message || 'ترخيصك منتهي رجاء التجديد',
        license_expired: true
      };
    }
    if (!formData.date || formData.date.toString().trim() === '') { throw new Error("تاريخ المتحصلة مطلوب"); }
    
    var fy = typeof getActiveFiscalYear === 'function' ? getActiveFiscalYear() : null;
    var year = fy ? fy.year_code : null;
    if (!year) throw new Error("لا توجد سنة مالية نشطة");
    
    if (fy && fy.date_from && fy.date_to) {
      var receiptDate = new Date(formData.date);
      var from = new Date(fy.date_from);
      var to = new Date(fy.date_to);
      if (receiptDate < from || receiptDate > to) {
        throw new Error("تاريخ المتحصلة يجب أن يكون بين " + fy.date_from + " و " + fy.date_to);
      }
    }
    
    var amount = parseFloat(formData.amount) || 0;
    if (amount <= 0) throw new Error("مبلغ المتحصلة يجب أن يكون أكبر من صفر");
    if (!formData.partner_id) throw new Error("يرجى اختيار الطرف");
    if (!formData.account_id) throw new Error("يرجى اختيار حساب الخزنة/البنك");
    if (formData.account_id === formData.partner_id) { throw new Error("لا يمكن أن يكون حساب الخزنة هو نفس حساب الطرف"); }

    var receiptsId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Receipts", year) : null;
    var accMovId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Account_Movements", year) : null;
    if (!receiptsId || !accMovId) throw new Error("جداول النظام غير موجودة");

    var now = typeof getNowTimestamp === 'function' ? getNowTimestamp() : generateTimestamp();
    var receiptNo = formData.receipt_no || "REC-" + (typeof generateID === 'function' ? generateID().toString().slice(-8) : Date.now().toString().slice(-8));
    var receiptId = formData.id || (typeof generateID === 'function' ? generateID() : generateUniqueId());

    var receiptRow = [
      receiptId, year, formData.date, RECEIPT_REF_TYPE, receiptNo,
      amount.toString(), formData.partner_id, formData.account_id, formData.notes || "", now
    ];

    var recSheet = SpreadsheetApp.openById(receiptsId).getSheets()[0];

    if (formData.id) {
      var recData = recSheet.getDataRange().getDisplayValues();
      var found = false;
      for (var i = 1; i < recData.length; i++) {
        if (String(recData[i][0]) === String(receiptId)) {
          recSheet.getRange(i + 1, 1, 1, receiptRow.length).setValues([receiptRow]);
          found = true; break;
        }
      }
      if (!found) throw new Error("لم يتم العثور على المتحصلة للتحديث");
      if (accMovId) clearReceiptAccountMovementsForReceipts(accMovId, receiptNo);
    } else {
      recSheet.appendRow(receiptRow);
    }

    if (accMovId) { recordReceiptAccountingEntriesForReceipts(formData, receiptNo, year, now, accMovId); }

    // ✅ تم إصلاح السطر هنا - إضافة مفتاح "data" قبل الكائن
    return { 
      success: true, 
      message: formData.id ? "تم تحديث المتحصلة بنجاح" : "تم حفظ المتحصلة بنجاح",
      data: { receipt_no: receiptNo } 
    };
    
  } catch (e) {
    console.error("❌ saveReceipt error:", e);
    return { success: false, message: "خطأ: " + e.toString() };
  }
}
// ========== 🗑️ حذف المتحصلة ==========
function deleteReceipt(id) {
  try {
    // ✅ التحقق من صلاحية الترخيص أولاً
    var licenseCheck = validateLicenseFromServer();
    if (!licenseCheck || licenseCheck.valid !== true) {
      return { 
        success: false, 
        message: licenseCheck?.message || 'ترخيصك منتهي رجاء التجديد',
        license_expired: true
      };
    }
    var fy = typeof getActiveFiscalYear === 'function' ? getActiveFiscalYear() : null;
    var year = fy ? fy.year_code : null;
    if (!year) throw new Error("لا توجد سنة مالية نشطة");
    
    var receiptsId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Receipts", year) : null;
    var accMovId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Account_Movements", year) : null;
    if (!receiptsId) throw new Error("جدول المتحصلات غير موجود");

    var recSheet = SpreadsheetApp.openById(receiptsId).getSheets()[0];
    var recData = recSheet.getDataRange().getDisplayValues();
    var receiptNo = null;
    
    for (var i = 1; i < recData.length; i++) {
      if (String(recData[i][0]) === String(id)) {
        receiptNo = (recData[i][4] || '').toString().trim();
        recSheet.deleteRow(i + 1);
        break;
      }
    }

    if (!receiptNo) throw new Error("المتحصلة غير موجودة");
    if (accMovId) { clearReceiptAccountMovementsForReceipts(accMovId, receiptNo); }

    return { success: true, message: "تم حذف المتحصلة والقيود المرتبطة بها بنجاح" };
  } catch (e) {
    console.error("❌ deleteReceipt error:", e);
    return { success: false, message: "خطأ: " + e.toString() };
  }
}

// ========== 🔧 دوال مساعدة ==========
function generateTimestamp() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
}

function generateUniqueId() {
  return Utilities.getUuid().replace(/-/g, '');
}

function showStoredDataInLog() {
  try {
    var props = getDocProperties();
    var allKeys = props.getKeys();
    console.log('ZEIOS ERP - Receipts data');
    console.log('Keys:', allKeys.length);
    return { success: true, count: allKeys.length, keys: allKeys };
  } catch (e) { console.error('Error:', e); return { success: false, error: e.toString() }; }
}

function getLibraryVersion() { return LIBRARY_VERSION; }

function testReceipts() {
  console.log("🔍 اختبار جلب المتحصلات...");
  var receipts = getReceiptsList();
  console.log(`📊 عدد المتحصلات: ${receipts.length}`);
  if (receipts.length > 0) { console.log("📋 أول 3 متحصلات:", receipts.slice(0, 3)); }
  return receipts;
}
/**
 * الحصول على قبض/متحصلات للتعديل المباشر
 */
function getReceiptForDirectEdit(receiptId, fiscalYear) {
  try {
    if (!receiptId) { return { success: false, message: '❌ معرف القبض مطلوب' }; }
    
    var year = typeof getFiscalYearCode === 'function' ? getFiscalYearCode(fiscalYear) : null;
    if (!year && typeof getFiscalYearInfo === 'function') {
      var fy = getFiscalYearInfo(fiscalYear);
      year = fy && fy.year_code ? fy.year_code : null;
    }
    if (!year) { year = new Date().getFullYear().toString(); }
    
    var tableId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Receipts", year) : null;
    if (!tableId) { return { success: false, message: '❌ جدول القبض غير موجود' }; }
    
    var ss = SpreadsheetApp.openById(tableId);
    var sheet = ss.getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    
    var receipt = null;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] && String(data[i][0]).trim() === String(receiptId).trim()) {
        receipt = {
          id: data[i][0], receipt_no: data[i][1] || '', fiscal_year: data[i][2] || year,
          receipt_date: data[i][3] || '', ref_type: data[i][4] || '',
          ref_id: data[i][5] || '', amount: parseFloat(data[i][6]) || 0,
          account_id: data[i][7] || '', safe_id: data[i][8] || '',
          notes: data[i][9] || '', created_at: data[i][10] || ''
        };
        
        // اسم الطرف
        if (receipt.account_id && typeof getAccountInfo === 'function') {
          var account = getAccountInfo(receipt.account_id);
          if (account) {
            receipt.account_name = account.account_name || account.contact_name || '';
            receipt.account_phone = account.phone || '';
          }
        }
        // اسم الخزينة
        if (typeof getSafeNameById === 'function') {
          receipt.safe_name = getSafeNameById(receipt.safe_id);
        }
        receipt.ref_label = getRefTypeLabel(receipt.ref_type);
        break;
      }
    }
    if (!receipt) { return { success: false, message: '❌ لم يتم العثور على القبض' }; }
    
    return { success: true, data: receipt, message: 'تم جلب بيانات القبض بنجاح' };
    
  } catch (e) {
    console.error('❌ getReceiptForDirectEdit error:', e);
    return { success: false, message: 'خطأ: ' + e.toString() };
  }
}


/**
 * Receipts_client.gs – ZEIOS ERP SYSTEM (SHEET VERSION)
 * دوال بنفس أسماء المكتبة عشان الكود يشتغل من غير تعديل
 * 
 * ⚠️ قبل التشغيل: أضف المكتبة من Extensions → Libraries
 */

// ========== 🔗 ربط المكتبة ==========
var ZEIOS = ZEIOS; // غيّر للاسم اللي أنت سميته

// ========== 🔄 ثوابت ==========
var RECEIPT_REF_TYPE = ZEIOS.RECEIPT_REF_TYPE;

// ========== 📦 دوال البيانات الأساسية ==========
function getAccountsForReceiptRecipient() { try { return ZEIOS.getAccountsForReceiptRecipient(); } catch (e) { return []; } }
function getCashAccounts() { try { return ZEIOS.getCashAccounts(); } catch (e) { return []; } }

// ========== 📋 قائمة المتحصلات ==========
function getReceiptsList() { try { return ZEIOS.getReceiptsList(); } catch (e) { return []; } }
function getReceiptById(id) { try { return ZEIOS.getReceiptById(id); } catch (e) { return null; } }

// ========== 💰 الرصيد ==========
function getAccountBalanceForReceipt(accountId) { try { return ZEIOS.getAccountBalanceForReceipt(accountId); } catch (e) { return {balance:"0.00",display_balance:"0.00",account_type:"unknown"}; } }

// ========== 💾 حفظ/حذف ==========
function saveReceipt(formData) { try { return ZEIOS.saveReceipt(formData); } catch (e) { return {success:false,message:'❌ '+e.toString()}; } }
function deleteReceipt(id) { try { return ZEIOS.deleteReceipt(id); } catch (e) { return {success:false,message:'❌ '+e.toString()}; } }

// ========== 🔧 مساعدة ==========
function generateTimestamp() { try { return ZEIOS.generateTimestamp(); } catch (e) { return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss'); } }
function generateUniqueId() { try { return ZEIOS.generateUniqueId(); } catch (e) { return Utilities.getUuid().replace(/-/g, ''); } }
function showStoredDataInLog() { try { return ZEIOS.showStoredDataInLog(); } catch (e) { return {success:false,error:e.toString()}; } }
function getLibraryVersion() { try { return ZEIOS.getLibraryVersion(); } catch (e) { return 'غير متصل'; } }
function testReceipts() { try { return ZEIOS.testReceipts(); } catch (e) { return []; } }

// ========== 🎨 دوال الواجهة (في الشيت فقط - مش في المكتبة) ==========
function isSpreadsheetContext() {
  try { SpreadsheetApp.getUi(); return true; }
  catch (e) { return false; }
}

function openReceiptsPage() {
  try {
    var pageName = 'receipts';
    var title = '🧾 إدارة المتحصلات - ZEIOS ERP';
    if (isSpreadsheetContext()) {
      var html = HtmlService.createHtmlOutputFromFile(pageName)
        .setTitle(title).setWidth(1200).setHeight(800)
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      SpreadsheetApp.getUi().showModalDialog(html, title);
      return { success: true, mode: "spreadsheet" };
    }
    var baseUrl = ScriptApp.getService() ? ScriptApp.getService().getUrl() : null;
    if (baseUrl) return { success: true, mode: "webapp", url: baseUrl + "?page=" + pageName };
    return { success: false, message: "لا يمكن تحديد بيئة التشغيل" };
  } catch (e) { console.error("❌ openReceiptsPage error:", e); return { success: false, message: e.toString() }; }
}

function openReceiptForm(receiptId) {
  var id = receiptId || null;
  try {
    var pageName = 'receipts';
    var title = id ? '✏️ تعديل متحصلة - ZEIOS ERP' : '➕ إضافة متحصلة جديدة - ZEIOS ERP';
    if (isSpreadsheetContext()) {
      var html = HtmlService.createHtmlOutputFromFile(pageName)
        .setTitle(title).setWidth(900).setHeight(700)
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      SpreadsheetApp.getUi().showModalDialog(html, title);
      return { success: true, mode: "spreadsheet" };
    }
    var baseUrl = ScriptApp.getService() ? ScriptApp.getService().getUrl() : null;
    if (baseUrl) {
      var params = id ? '?page=receipts&edit=' + encodeURIComponent(id) : '?page=receipts&new=1';
      return { success: true, mode: "webapp", url: baseUrl + params };
    }
    return { success: false, message: "لا يمكن تحديد بيئة التشغيل" };
  } catch (e) { console.error("❌ openReceiptForm error:", e); return { success: false, message: e.toString() }; }
}
/**
 * ✅ دالة واجهة لاستدعاء جلب قبض/متحصلات للتعديل المباشر
 * ⚠️ يجب أن تكون في مشروع الجدول (ليس في المكتبة)
 * ⚠️ مطلوبة من الـ HTML عبر google.script.run
 */
function getReceiptForDirectEdit(receiptId, fiscalYear) {
  try {
    // ✅ التحقق من المدخلات
    if (!receiptId) {
      return { success: false, message: '❌ معرف القبض مطلوب' };
    }
    
    // ✅ استدعاء الدالة من المكتبة إذا كانت متاحة
    if (typeof ZEIOS !== 'undefined' && typeof ZEIOS.getReceiptForDirectEdit === 'function') {
      return ZEIOS.getReceiptForDirectEdit(receiptId, fiscalYear);
    }
    
    // ✅ Fallback: استدعاء الدالة المحلية إذا كانت موجودة في ملف آخر
    if (typeof getReceiptForDirectEdit === 'function' && 
        getReceiptForDirectEdit !== arguments.callee) {
      return getReceiptForDirectEdit(receiptId, fiscalYear);
    }
    
    return { success: false, message: 'دالة جلب القبض غير متاحة' };
    
  } catch (e) {
    console.error('❌ getReceiptForDirectEdit (client) error:', e);
    return {
      success: false,
      message: 'خطأ: ' + e.toString(),
      error: e.toString()
    };
  }
}
