/**
 * Payments.gs – ZEIOS ERP SYSTEM (LIBRARY VERSION)
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


// ========== 📦 دوال جلب البيانات ==========
function getAccountsForPaymentRecipient() {
  try {
    var coaId = typeof getMasterTableId === 'function' ? getMasterTableId("Chart_Of_Accounts") : null;
    if (!coaId) return [];
    
    var sheet = SpreadsheetApp.openById(coaId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    
    var accounts = [];
    for (var i = 1; i < data.length; i++) {
      var id = (data[i][COL.CHART_OF_ACCOUNTS.ID] || '').toString().trim();
      var accountNo = (data[i][COL.CHART_OF_ACCOUNTS.ACCOUNT_NO] || '').toString().trim();
      var accountName = (data[i][COL.CHART_OF_ACCOUNTS.ACCOUNT_NAME] || '').toString().trim();
      var bsGroup = (data[i][COL.CHART_OF_ACCOUNTS.BS_GROUP] || '').toString().trim();
      var plGroup = (data[i][COL.CHART_OF_ACCOUNTS.PL_GROUP] || '').toString().trim();
      var phone = (data[i][COL.CHART_OF_ACCOUNTS.PHONE] || '').toString().trim();
      
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
    console.error("❌ getAccountsForPaymentRecipient error:", e);
    return [];
  }
}

function getCashAccounts() {
  try { return typeof getSafes === 'function' ? getSafes() : []; }
  catch (e) { console.error("❌ getCashAccounts error:", e); return []; }
}

// ========== 📋 قائمة المدفوعات ==========
function getPaymentsList() {
  try {
    var fy = typeof getActiveFiscalYear === 'function' ? getActiveFiscalYear() : null;
    var year = fy ? fy.year_code : null;
    if (!year) return [];
    
    var paymentsId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Payments", year) : null;
    if (!paymentsId) return [];

    var sheet = SpreadsheetApp.openById(paymentsId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();

    var allAccounts = {};
    var allPhones = {};
    var accounts = getAccountsForPaymentRecipient();
    for (var i = 0; i < accounts.length; i++) {
      allAccounts[accounts[i].id] = accounts[i].account_name;
      if (accounts[i].phone) allPhones[accounts[i].id] = accounts[i].phone;
    }
    var safes = getCashAccounts();
    for (var j = 0; j < safes.length; j++) { allAccounts[safes[j].id] = safes[j].account_name; }

    var payments = [];
    for (var k = 1; k < data.length; k++) {
      var partnerId = (data[k][COL.PAYMENTS_RECEIPTS.ACCOUNT_ID] || '').toString().trim();
      var safeId = (data[k][COL.PAYMENTS_RECEIPTS.SAFE_ID] || '').toString().trim();
      var amount = parseFloat(data[k][COL.PAYMENTS_RECEIPTS.AMOUNT]) || 0;
      
      if (!data[k][COL.PAYMENTS_RECEIPTS.ID] || (!partnerId && !safeId && amount === 0)) continue;
      
      payments.push({
        id: data[k][COL.PAYMENTS_RECEIPTS.ID],
        payment_no: data[k][COL.PAYMENTS_RECEIPTS.REF_ID] || '---',
        fiscal_year: data[k][COL.PAYMENTS_RECEIPTS.FISCAL_YEAR],
        date: data[k][COL.PAYMENTS_RECEIPTS.DATE],
        partner_id: partnerId, account_id: safeId, amount: amount, safe_id: safeId,
        notes: data[k][COL.PAYMENTS_RECEIPTS.NOTES] || "",
        created_at: data[k][COL.PAYMENTS_RECEIPTS.CREATED_AT],
        partner_name: allAccounts[partnerId] || 'غير معروف',
        safe_name: allAccounts[safeId] || 'غير معروف',
        partner_phone: allPhones[partnerId] || '',
        ref_type: (data[k][COL.PAYMENTS_RECEIPTS.REF_TYPE] || '').toString().trim()
      });
    }
    console.log(`✅ تم تحميل ${payments.length} دفعة`);
    return payments;
  } catch (e) {
    console.error("❌ getPaymentsList error:", e);
    return [];
  }
}

// ========== 🔍 جلب دفعة بالتفصيل ==========
function getPaymentById(id) {
  try {
    var fy = typeof getActiveFiscalYear === 'function' ? getActiveFiscalYear() : null;
    var year = fy ? fy.year_code : null;
    if (!year) return null;
    
    var paymentsId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Payments", year) : null;
    if (!paymentsId) return null;

    var sheet = SpreadsheetApp.openById(paymentsId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    
    var accounts = getAccountsForPaymentRecipient();
    var phonesMap = {};
    for (var i = 0; i < accounts.length; i++) { if (accounts[i].phone) phonesMap[accounts[i].id] = accounts[i].phone; }

    for (var j = 1; j < data.length; j++) {
      if (String(data[j][COL.PAYMENTS_RECEIPTS.ID]) === String(id)) {
        var partnerId = (data[j][COL.PAYMENTS_RECEIPTS.ACCOUNT_ID] || '').toString().trim();
        var safeId = (data[j][COL.PAYMENTS_RECEIPTS.SAFE_ID] || '').toString().trim();
        var amount = parseFloat(data[j][COL.PAYMENTS_RECEIPTS.AMOUNT]) || 0;
        
        return {
          id: data[j][COL.PAYMENTS_RECEIPTS.ID],
          payment_no: data[j][COL.PAYMENTS_RECEIPTS.REF_ID],
          fiscal_year: data[j][COL.PAYMENTS_RECEIPTS.FISCAL_YEAR],
          date: data[j][COL.PAYMENTS_RECEIPTS.DATE],
          partner_id: partnerId, account_id: safeId, amount: amount, safe_id: safeId,
          notes: data[j][COL.PAYMENTS_RECEIPTS.NOTES] || "",
          created_at: data[j][COL.PAYMENTS_RECEIPTS.CREATED_AT],
          partner_phone: phonesMap[partnerId] || '',
          ref_type: (data[j][COL.PAYMENTS_RECEIPTS.REF_TYPE] || '').toString().trim()
        };
      }
    }
    return null;
  } catch (e) {
    console.error("❌ getPaymentById error:", e);
    return null;
  }
}

// ========== 💰 رصيد الحساب ==========
function getAccountBalanceForPayment(accountId) {
  try {
    if (!accountId) { return { balance: "0.00", display_balance: "0.00", account_type: "unknown" }; }
    
    if (typeof getPartnerBalance === 'function') {
      var balance = getPartnerBalance(accountId);
      var account = typeof getAccountInfo === 'function' ? getAccountInfo(accountId) : null;
      
      var accountType = 'unknown';
      if (account) {
        if (account.bs_group === 'BS-A') accountType = 'asset';
        else if (account.bs_group === 'BS-L') accountType = 'liability';
        else if (account.pl_group === 'PL-E') accountType = 'expense';
        else if (account.pl_group === 'PL-R') accountType = 'revenue';
      }
      return { balance: balance.balance || "0.00", display_balance: balance.display_balance || "0.00", account_type: accountType };
    }
    
    var fy = typeof getActiveFiscalYear === 'function' ? getActiveFiscalYear() : null;
    var year = fy ? fy.year_code : null;
    if (!year) { return { balance: "0.00", display_balance: "0.00", account_type: "unknown" }; }
    
    var accMovId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Account_Movements", year) : null;
    if (!accMovId) { return { balance: "0.00", display_balance: "0.00", account_type: "unknown" }; }
    
    var sheet = SpreadsheetApp.openById(accMovId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    var balance = 0;
    var accountType = 'unknown';
    
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][COL.ACCOUNT_MOVEMENTS.ACCOUNT_ID]).trim() === String(accountId).trim()) {
        var debit = parseFloat(data[i][COL.ACCOUNT_MOVEMENTS.DEBIT] || '0');
        var credit = parseFloat(data[i][COL.ACCOUNT_MOVEMENTS.CREDIT] || '0');
        balance += (debit - credit);
      }
    }
    
    try {
      var coaId = typeof getMasterTableId === 'function' ? getMasterTableId("Chart_Of_Accounts") : null;
      if (coaId) {
        var coaSheet = SpreadsheetApp.openById(coaId).getSheets()[0];
        var coaData = coaSheet.getDataRange().getDisplayValues();
        for (var j = 1; j < coaData.length; j++) {
          if (String(coaData[j][COL.CHART_OF_ACCOUNTS.ID]).trim() === String(accountId).trim()) {
            var bsGroup = (coaData[j][COL.CHART_OF_ACCOUNTS.BS_GROUP] || '').toString().trim();
            var plGroup = (coaData[j][COL.CHART_OF_ACCOUNTS.PL_GROUP] || '').toString().trim();
            if (bsGroup === 'BS-A') accountType = 'asset';
            else if (bsGroup === 'BS-L') accountType = 'liability';
            else if (plGroup === 'PL-E') accountType = 'expense';
            else if (plGroup === 'PL-R') accountType = 'revenue';
            break;
          }
        }
      }
    } catch (e) { console.warn('⚠️ تعذر تحديد نوع الحساب:', e); }
    
    return { balance: balance.toFixed(2), display_balance: balance.toFixed(2), account_type: accountType };
  } catch (e) {
    console.error("❌ getAccountBalanceForPayment error:", e);
    return { balance: "0.00", display_balance: "0.00", account_type: "unknown" };
  }
}

// ========== 🗑️ مسح القيود المحاسبية ==========
function clearPaymentAccountMovementsForPayments(sheetId, paymentNo) {
  if (!sheetId) return;
  try {
    var sheet = SpreadsheetApp.openById(sheetId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    for (var i = data.length - 1; i >= 1; i--) {
      var refType = (data[i][COL.ACCOUNT_MOVEMENTS.REF_TYPE] || '').toString().trim();
      var refId = (data[i][COL.ACCOUNT_MOVEMENTS.REF_ID] || '').toString().trim();
      if (refType === REF_TYPES.PAYMENT && refId === paymentNo) { sheet.deleteRow(i + 1); }
    }
  } catch (e) { console.warn("⚠️ clearPaymentAccountMovementsForPayments error:", e); }
}

// ========== 💰 حساب رصيد الحساب ==========
function calculateAccountBalanceForPayments(sheet, accountId) {
  try {
    var data = sheet.getDataRange().getDisplayValues();
    var lastBalance = 0;
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][COL.ACCOUNT_MOVEMENTS.ACCOUNT_ID]) === String(accountId)) {
        var bal = parseFloat(data[i][COL.ACCOUNT_MOVEMENTS.BALANCE_AFTER]);
        if (!isNaN(bal)) { lastBalance = bal; }
      }
    }
    return lastBalance;
  } catch (e) { console.warn("⚠️ calculateAccountBalanceForPayments error:", e); return 0; }
}

// ========== 📝 تسجيل القيود المحاسبية ==========
function recordPaymentAccountingEntriesForPayments(formData, paymentNo, year, now, accMovId) {
  try {
    var accSheet = SpreadsheetApp.openById(accMovId).getSheets()[0];
    var amount = parseFloat(formData.amount) || 0;
    if (amount <= 0) return;
    
    var genId = function() { return typeof generateID === 'function' ? generateID() : generateUniqueId(); };
    
    var partnerBalance = calculateAccountBalanceForPayments(accSheet, formData.partner_id);
    accSheet.appendRow([genId(), formData.partner_id, year, formData.date, REF_TYPES.PAYMENT, paymentNo, amount.toString(), "0", (partnerBalance + amount).toString(), now]);
    
    var safeBalance = calculateAccountBalanceForPayments(accSheet, formData.account_id);
    accSheet.appendRow([genId(), formData.account_id, year, formData.date, REF_TYPES.PAYMENT, paymentNo, "0", amount.toString(), (safeBalance - amount).toString(), now]);
    
    return true;
  } catch (e) { console.warn("⚠️ recordPaymentAccountingEntriesForPayments error:", e); return false; }
}

// ========== 💾 حفظ الدفعة ==========
function savePayment(formData) {
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
    if (!formData.date || formData.date.toString().trim() === '') { throw new Error("تاريخ الدفعة مطلوب"); }
    
    var fy = typeof getActiveFiscalYear === 'function' ? getActiveFiscalYear() : null;
    var year = fy ? fy.year_code : null;
    if (!year) throw new Error("لا توجد سنة مالية نشطة");
    
    if (fy && fy.date_from && fy.date_to) {
      var paymentDate = new Date(formData.date);
      var from = new Date(fy.date_from);
      var to = new Date(fy.date_to);
      if (paymentDate < from || paymentDate > to) {
        throw new Error("تاريخ الدفعة يجب أن يكون بين " + fy.date_from + " و " + fy.date_to);
      }
    }
    
    var amount = parseFloat(formData.amount) || 0;
    if (amount <= 0) throw new Error("مبلغ الدفعة يجب أن يكون أكبر من صفر");
    if (!formData.partner_id) throw new Error("يرجى اختيار الحساب المستلم");
    if (!formData.account_id) throw new Error("يرجى اختيار حساب الخزنة/البنك");
    if (formData.account_id === formData.partner_id) { throw new Error("لا يمكن أن يكون حساب الخزنة هو نفس الحساب المستلم"); }

    var paymentsId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Payments", year) : null;
    var accMovId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Account_Movements", year) : null;
    if (!paymentsId || !accMovId) throw new Error("جداول النظام غير موجودة");

    var now = typeof getNowTimestamp === 'function' ? getNowTimestamp() : generateTimestamp();
    var paymentNo = formData.payment_no || "PAY-" + (typeof generateID === 'function' ? generateID().toString().slice(-8) : Date.now().toString().slice(-8));
    var paymentId = formData.id || (typeof generateID === 'function' ? generateID() : generateUniqueId());

    var paymentRow = [
      paymentId, year, formData.date, REF_TYPES.PAYMENT, paymentNo,
      amount.toString(), formData.partner_id, formData.account_id, formData.notes || "", now
    ];

    var paySheet = SpreadsheetApp.openById(paymentsId).getSheets()[0];

    if (formData.id) {
      var payData = paySheet.getDataRange().getDisplayValues();
      var found = false;
      for (var i = 1; i < payData.length; i++) {
        if (String(payData[i][COL.PAYMENTS_RECEIPTS.ID]) === String(paymentId)) {
          paySheet.getRange(i + 1, 1, 1, paymentRow.length).setValues([paymentRow]);
          found = true; break;
        }
      }
      if (!found) throw new Error("لم يتم العثور على الدفعة للتحديث");
      if (accMovId) clearPaymentAccountMovementsForPayments(accMovId, paymentNo);
    } else {
      paySheet.appendRow(paymentRow);
    }

    if (accMovId) { recordPaymentAccountingEntriesForPayments(formData, paymentNo, year, now, accMovId); }

    // ✅ تم إصلاح السطر هنا - إضافة مفتاح "data" قبل الكائن
    return { 
      success: true, 
      message: formData.id ? "تم تحديث الدفعة بنجاح" : "تم حفظ الدفعة بنجاح",
      data: { payment_no: paymentNo } 
    };
    
  } catch (e) {
    console.error("❌ savePayment error:", e);
    return { success: false, message: "خطأ: " + e.toString() };
  }
}

// ========== 🗑️ حذف الدفعة ==========
function deletePayment(id) {
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
    
    var paymentsId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Payments", year) : null;
    var accMovId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Account_Movements", year) : null;
    if (!paymentsId) throw new Error("جدول المدفوعات غير موجود");

    var paySheet = SpreadsheetApp.openById(paymentsId).getSheets()[0];
    var payData = paySheet.getDataRange().getDisplayValues();
    var paymentNo = null;
    
    for (var i = 1; i < payData.length; i++) {
      if (String(payData[i][COL.PAYMENTS_RECEIPTS.ID]) === String(id)) {
        paymentNo = (payData[i][COL.PAYMENTS_RECEIPTS.REF_ID] || '').toString().trim();
        paySheet.deleteRow(i + 1);
        break;
      }
    }

    if (!paymentNo) throw new Error("الدفعة غير موجودة");
    if (accMovId) { clearPaymentAccountMovementsForPayments(accMovId, paymentNo); }

    return { success: true, message: "تم حذف الدفعة والقيود المرتبطة بها بنجاح" };
  } catch (e) {
    console.error("❌ deletePayment error:", e);
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
    console.log('ZEIOS ERP - Payments data');
    console.log('Keys:', allKeys.length);
    return { success: true, count: allKeys.length, keys: allKeys };
  } catch (e) { console.error('Error:', e); return { success: false, error: e.toString() }; }
}

function getLibraryVersion() { return LIBRARY_VERSION; }

function testPayments() {
  console.log("🔍 اختبار جلب المدفوعات...");
  var payments = getPaymentsList();
  console.log(`📊 عدد المدفوعات: ${payments.length}`);
  if (payments.length > 0) { console.log("📋 أول 3 مدفوعات:", payments.slice(0, 3)); }
  return payments;
}
/**
 * الحصول على دفعة للتعديل المباشر
 */
function getPaymentForDirectEdit(paymentId, fiscalYear) {
  try {
    if (!paymentId) { return { success: false, message: '❌ معرف الدفعة مطلوب' }; }
    
    var year = typeof getFiscalYearCode === 'function' ? getFiscalYearCode(fiscalYear) : null;
    if (!year && typeof getFiscalYearInfo === 'function') {
      var fy = getFiscalYearInfo(fiscalYear);
      year = fy && fy.year_code ? fy.year_code : null;
    }
    if (!year) { year = new Date().getFullYear().toString(); }
    
    var tableId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Payments", year) : null;
    if (!tableId) { return { success: false, message: '❌ جدول المدفوعات غير موجود' }; }
    
    var ss = SpreadsheetApp.openById(tableId);
    var sheet = ss.getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    
    var payment = null;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] && String(data[i][0]).trim() === String(paymentId).trim()) {
        payment = {
          id: data[i][0], payment_no: data[i][1] || '', fiscal_year: data[i][2] || year,
          payment_date: data[i][3] || '', ref_type: data[i][4] || '',
          ref_id: data[i][5] || '', amount: parseFloat(data[i][6]) || 0,
          account_id: data[i][7] || '', safe_id: data[i][8] || '',
          notes: data[i][9] || '', created_at: data[i][10] || ''
        };
        
        // اسم الطرف (مورد/عميل)
        if (payment.account_id && typeof getAccountInfo === 'function') {
          var account = getAccountInfo(payment.account_id);
          if (account) {
            payment.account_name = account.account_name || account.contact_name || '';
            payment.account_phone = account.phone || '';
          }
        }
        // اسم الخزينة
        if (typeof getSafeNameById === 'function') {
          payment.safe_name = getSafeNameById(payment.safe_id);
        }
        // نوع المرجع
        payment.ref_label = getRefTypeLabel(payment.ref_type);
        break;
      }
    }
    if (!payment) { return { success: false, message: '❌ لم يتم العثور على الدفعة' }; }
    
    return { success: true, data: payment, message: 'تم جلب بيانات الدفعة بنجاح' };
    
  } catch (e) {
    console.error('❌ getPaymentForDirectEdit error:', e);
    return { success: false, message: 'خطأ: ' + e.toString() };
  }
}

// دالة مساعدة لعرض نوع المرجع
function getRefTypeLabel(refType) {
  var labels = {
    'PURCHASE': 'فاتورة مشتريات', 'SALE': 'فاتورة مبيعات',
    'PURCHASE_RETURN': 'مرتجع مشتريات', 'SALES_RETURN': 'مرتجع مبيعات',
    'EXPENSE': 'مصروف', 'ORDER': 'طلبية', 'JOURNAL': 'قيد يومية'
  };
  return labels[refType] || refType;
}


/**
 * Payments_client.gs – ZEIOS ERP SYSTEM (SHEET VERSION)
 * دوال بنفس أسماء المكتبة عشان الكود يشتغل من غير تعديل
 * 
 * ⚠️ قبل التشغيل: أضف المكتبة من Extensions → Libraries
 */

// ========== 🔗 ربط المكتبة ==========
var ZEIOS = ZEIOS; // غيّر للاسم اللي أنت سميته


// ========== 📦 دوال البيانات الأساسية ==========
function getAccountsForPaymentRecipient() { try { return ZEIOS.getAccountsForPaymentRecipient(); } catch (e) { return []; } }
function getCashAccounts() { try { return ZEIOS.getCashAccounts(); } catch (e) { return []; } }

// ========== 📋 قائمة المدفوعات ==========
function getPaymentsList() { try { return ZEIOS.getPaymentsList(); } catch (e) { return []; } }
function getPaymentById(id) { try { return ZEIOS.getPaymentById(id); } catch (e) { return null; } }

// ========== 💰 الرصيد ==========
function getAccountBalanceForPayment(accountId) { try { return ZEIOS.getAccountBalanceForPayment(accountId); } catch (e) { return {balance:"0.00",display_balance:"0.00",account_type:"unknown"}; } }

// ========== 💾 حفظ/حذف ==========
function savePayment(formData) { try { return ZEIOS.savePayment(formData); } catch (e) { return {success:false,message:'❌ '+e.toString()}; } }
function deletePayment(id) { try { return ZEIOS.deletePayment(id); } catch (e) { return {success:false,message:'❌ '+e.toString()}; } }

// ========== 🔧 مساعدة ==========
function generateTimestamp() { try { return ZEIOS.generateTimestamp(); } catch (e) { return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss'); } }
function generateUniqueId() { try { return ZEIOS.generateUniqueId(); } catch (e) { return Utilities.getUuid().replace(/-/g, ''); } }
function showStoredDataInLog() { try { return ZEIOS.showStoredDataInLog(); } catch (e) { return {success:false,error:e.toString()}; } }
function getLibraryVersion() { try { return ZEIOS.getLibraryVersion(); } catch (e) { return 'غير متصل'; } }
function testPayments() { try { return ZEIOS.testPayments(); } catch (e) { return []; } }

// ========== 🎨 دوال الواجهة (في الشيت فقط - مش في المكتبة) ==========
function isSpreadsheetContext() {
  try { SpreadsheetApp.getUi(); return true; }
  catch (e) { return false; }
}

function openPaymentsPage() {
  try {
    var pageName = 'payments';
    var title = '💳 إدارة المدفوعات - ZEIOS ERP';
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
  } catch (e) { console.error("❌ openPaymentsPage error:", e); return { success: false, message: e.toString() }; }
}

function openPaymentForm(paymentId) {
  var id = paymentId || null;
  try {
    var pageName = 'payments';
    var title = id ? '✏️ تعديل دفعة - ZEIOS ERP' : '➕ إضافة دفعة جديدة - ZEIOS ERP';
    if (isSpreadsheetContext()) {
      var html = HtmlService.createHtmlOutputFromFile(pageName)
        .setTitle(title).setWidth(900).setHeight(700)
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      SpreadsheetApp.getUi().showModalDialog(html, title);
      return { success: true, mode: "spreadsheet" };
    }
    var baseUrl = ScriptApp.getService() ? ScriptApp.getService().getUrl() : null;
    if (baseUrl) {
      var params = id ? '?page=payments&edit=' + encodeURIComponent(id) : '?page=payments&new=1';
      return { success: true, mode: "webapp", url: baseUrl + params };
    }
    return { success: false, message: "لا يمكن تحديد بيئة التشغيل" };
  } catch (e) { console.error("❌ openPaymentForm error:", e); return { success: false, message: e.toString() }; }
}
/**
 * ✅ دالة واجهة لاستدعاء جلب دفعة للتعديل المباشر
 * ⚠️ يجب أن تكون في مشروع الجدول (ليس في المكتبة)
 * ⚠️ مطلوبة من الـ HTML عبر google.script.run
 */
function getPaymentForDirectEdit(paymentId, fiscalYear) {
  try {
    // ✅ التحقق من المدخلات
    if (!paymentId) {
      return { success: false, message: '❌ معرف الدفعة مطلوب' };
    }
    
    // ✅ استدعاء الدالة من المكتبة إذا كانت متاحة
    if (typeof ZEIOS !== 'undefined' && typeof ZEIOS.getPaymentForDirectEdit === 'function') {
      return ZEIOS.getPaymentForDirectEdit(paymentId, fiscalYear);
    }
    
    // ✅ Fallback: استدعاء الدالة المحلية إذا كانت موجودة في ملف آخر
    if (typeof getPaymentForDirectEdit === 'function' && 
        getPaymentForDirectEdit !== arguments.callee) {
      return getPaymentForDirectEdit(paymentId, fiscalYear);
    }
    
    return { success: false, message: 'دالة جلب الدفعة غير متاحة' };
    
  } catch (e) {
    console.error('❌ getPaymentForDirectEdit (client) error:', e);
    return {
      success: false,
      message: 'خطأ: ' + e.toString(),
      error: e.toString()
    };
  }
}
