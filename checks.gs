/**
 * CustomerChecks.gs – ZEIOS ERP SYSTEM (LIBRARY VERSION)
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


// ========== 🔄 ثوابت الشيكات ==========
var CHECK_REF_TYPES = {
  RECEIPT: 'CHECK_RECEIPT',
  EXPORT: 'CHECK_EXPORT',
  RETURN_DEST: 'CHECK_RETURN_DEST',
  RETURN_SOURCE: 'CHECK_RETURN_SOURCE'
};

// ========== 📦 أعمدة جدول الشيكات ==========
var COL_CHECKS = {
  ID: 0, CHECK_NUMBER: 1, RECEIVED_DATE: 2, DUE_DATE: 3, CHECK_OWNER_NAME: 4,
  RECEIVED_FROM: 5, ISSUED_TO: 6, EXPORT_DATE: 7, IS_PAID: 8, BLACKLISTED: 9,
  BANK_NAME: 10, BRANCH: 11, EXPORT_RESPONSE_DATE: 12, CUSTOMER_RESPONSE_DATE: 13,
  NOTES: 14, AMOUNT: 15, CREATED_AT: 16
};

// ========== 📦 دوال السنة المالية ==========
function getActiveFiscalYearForChecks() {
  try {
    if (typeof getActiveFiscalYear === 'function') return getActiveFiscalYear();
    var year = typeof getSys === 'function' ? getSys("ACTIVE_FISCAL_YEAR") : null;
    if (year) return { year_code: year, is_active: true, date_from: '', date_to: '', folder_id: '' };
    return { year_code: null, is_active: false, date_from: '', date_to: '', folder_id: '' };
  } catch (e) { console.error("❌ getActiveFiscalYearForChecks error:", e); return { year_code: null, is_active: false, date_from: '', date_to: '', folder_id: '' }; }
}

function getFiscalYearCodeForChecks() {
  var fy = getActiveFiscalYearForChecks();
  return fy && fy.year_code ? fy.year_code : (typeof getSys === 'function' ? getSys("ACTIVE_FISCAL_YEAR") : null);
}

// ========== 📦 دوال جلب الحسابات ==========
function getAllCheckSourceAccounts() {
  try {
    console.log("🔍 [getAllCheckSourceAccounts] بدء جلب الحسابات...");
    var coaId = typeof getMasterTableId === 'function' ? getMasterTableId("Chart_Of_Accounts") : null;
    if (!coaId) { console.error("❌ جدول شجرة الحسابات غير موجود"); return []; }
    
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
      
      if (!id || !accountName || accountName.trim() === '') continue;
      
      var category = 'أخرى';
      if (bsGroup === 'BS-A') {
        if (accountNo.startsWith('11')) category = 'خزينة/بنك';
        else if (accountNo.startsWith('12')) category = 'عميل';
        else category = 'أصل';
      } else if (bsGroup === 'BS-L') {
        if (accountNo.startsWith('21')) category = 'مورد';
        else category = 'التزام';
      } else if (plGroup === 'PL-E') { category = 'مصروف'; }
      else if (plGroup === 'PL-R') { category = 'إيراد'; }
      
      accounts.push({
        id: id, account_no: accountNo, account_name: accountName,
        account_type: bsGroup === 'BS-A' ? 'ASSET' : (bsGroup === 'BS-L' ? 'LIABILITY' : 'OTHER'),
        phone: phone, category: category, bs_group: bsGroup, pl_group: plGroup
      });
    }
    console.log("✅ تم جلب " + accounts.length + " حساب من شجرة الحسابات");
    return accounts;
  } catch (e) { console.error("❌ getAllCheckSourceAccounts error:", e); return []; }
}

function getAllCheckDestinationAccounts() {
  try { return getAllCheckSourceAccounts(); }
  catch (e) { console.error("❌ getAllCheckDestinationAccounts error:", e); return []; }
}

function getChecksReceivableAccount() {
  try {
    var coaId = typeof getMasterTableId === 'function' ? getMasterTableId("Chart_Of_Accounts") : null;
    if (!coaId) return null;
    
    var sheet = SpreadsheetApp.openById(coaId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    
    for (var i = 1; i < data.length; i++) {
      var accountNo = (data[i][COL.CHART_OF_ACCOUNTS.ACCOUNT_NO] || '').toString().trim().toUpperCase();
      var accountName = (data[i][COL.CHART_OF_ACCOUNTS.ACCOUNT_NAME] || '').toString().trim().toUpperCase();
      var bsGroup = (data[i][COL.CHART_OF_ACCOUNTS.BS_GROUP] || '').toString().trim();
      
      if (bsGroup === 'BS-A' && (accountNo.indexOf('1205') !== -1 || accountName.indexOf('شيك') !== -1 || accountName.indexOf('CHECK') !== -1)) {
        return {
          id: (data[i][COL.CHART_OF_ACCOUNTS.ID] || '').toString().trim(),
          account_no: accountNo,
          account_name: (data[i][COL.CHART_OF_ACCOUNTS.ACCOUNT_NAME] || '').toString().trim(),
          account_type: 'ASSET'
        };
      }
    }
    for (var j = 1; j < data.length; j++) {
      var accNo = (data[j][COL.CHART_OF_ACCOUNTS.ACCOUNT_NO] || '').toString().trim();
      var bsGrp = (data[j][COL.CHART_OF_ACCOUNTS.BS_GROUP] || '').toString().trim();
      if (bsGrp === 'BS-A' && accNo.startsWith('1200')) {
        return {
          id: (data[j][COL.CHART_OF_ACCOUNTS.ID] || '').toString().trim(),
          account_no: accNo,
          account_name: (data[j][COL.CHART_OF_ACCOUNTS.ACCOUNT_NAME] || '').toString().trim(),
          account_type: 'ASSET'
        };
      }
    }
    return null;
  } catch (e) { console.error("❌ getChecksReceivableAccount error:", e); return null; }
}

// ========== 📊 دالة حالة الشيك ==========
function getCheckStatus(check) {
  if (check.customer_response_date && check.customer_response_date.toString().trim() !== "") return "RETURNED_TO_SOURCE";
  if (check.export_response_date && check.export_response_date.toString().trim() !== "") return "RETURNED_FROM_DESTINATION";
  if (check.export_date && check.export_date.toString().trim() !== "") return "EXPORTED";
  if (check.received_date && check.received_date.toString().trim() !== "") return "RECEIVED";
  return "DRAFT";
}

// ========== 📋 قائمة الشيكات ==========
function getCustomerChecksList() {
  try {
    console.log("🔍 [getCustomerChecksList] بدء جلب قائمة الشيكات");
    var fy = getActiveFiscalYearForChecks();
    var year = fy ? fy.year_code : null;
    if (!year) { console.error("❌ لا توجد سنة مالية نشطة"); return []; }
    
    var checksId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Customer_Checks", year) : null;
    if (!checksId) { console.error("❌ جدول Customer_Checks غير موجود للسنة:", year); return []; }

    var sheet = SpreadsheetApp.openById(checksId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    console.log("📊 عدد الصفوف في الجدول: " + data.length);

    var allAccounts = {};
    var allAccountsList = getAllCheckSourceAccounts();
    for (var i = 0; i < allAccountsList.length; i++) { allAccounts[allAccountsList[i].id] = allAccountsList[i].account_name; }

    var checks = [];
    for (var j = 1; j < data.length; j++) {
      if (!data[j][COL_CHECKS.ID] || data[j][COL_CHECKS.ID].toString().trim() === '') continue;
      var amount = parseFloat(data[j][COL_CHECKS.AMOUNT] || '0') || 0;
      var receivedFrom = (data[j][COL_CHECKS.RECEIVED_FROM] || '').toString().trim();
      var issuedTo = (data[j][COL_CHECKS.ISSUED_TO] || '').toString().trim();
      
      checks.push({
        id: data[j][COL_CHECKS.ID], check_number: data[j][COL_CHECKS.CHECK_NUMBER] || '---',
        received_date: data[j][COL_CHECKS.RECEIVED_DATE] || '', due_date: data[j][COL_CHECKS.DUE_DATE] || '',
        check_owner_name: data[j][COL_CHECKS.CHECK_OWNER_NAME] || '',
        received_from: receivedFrom, issued_to: issuedTo,
        export_date: data[j][COL_CHECKS.EXPORT_DATE] || '',
        is_paid: data[j][COL_CHECKS.IS_PAID] === "1" || data[j][COL_CHECKS.IS_PAID] === true,
        blacklisted: data[j][COL_CHECKS.BLACKLISTED] === "1" || data[j][COL_CHECKS.BLACKLISTED] === true,
        bank_name: data[j][COL_CHECKS.BANK_NAME] || '', branch: data[j][COL_CHECKS.BRANCH] || '',
        export_response_date: data[j][COL_CHECKS.EXPORT_RESPONSE_DATE] || '',
        customer_response_date: data[j][COL_CHECKS.CUSTOMER_RESPONSE_DATE] || '',
        notes: data[j][COL_CHECKS.NOTES] || '', amount: amount,
        created_at: data[j][COL_CHECKS.CREATED_AT] || '',
        source_name: allAccounts[receivedFrom] || 'غير معروف',
        destination_name: allAccounts[issuedTo] || 'غير معروف',
        status: getCheckStatus({
          received_date: data[j][COL_CHECKS.RECEIVED_DATE] || '',
          export_date: data[j][COL_CHECKS.EXPORT_DATE] || '',
          export_response_date: data[j][COL_CHECKS.EXPORT_RESPONSE_DATE] || '',
          customer_response_date: data[j][COL_CHECKS.CUSTOMER_RESPONSE_DATE] || ''
        })
      });
    }
    console.log("✅ تم جلب " + checks.length + " شيك");
    return checks;
  } catch (e) { console.error("❌ getCustomerChecksList error:", e); return []; }
}

// ========== 🔍 جلب شيك بالتفصيل ==========
function getCustomerCheckById(id) {
  try {
    console.log("🔍 [getCustomerCheckById] جلب الشيك: " + id);
    var fy = getActiveFiscalYearForChecks();
    var year = fy ? fy.year_code : null;
    if (!year) return null;
    
    var checksId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Customer_Checks", year) : null;
    if (!checksId) return null;

    var sheet = SpreadsheetApp.openById(checksId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][COL_CHECKS.ID]) === String(id)) {
        return {
          id: data[i][COL_CHECKS.ID], check_number: data[i][COL_CHECKS.CHECK_NUMBER],
          received_date: data[i][COL_CHECKS.RECEIVED_DATE], due_date: data[i][COL_CHECKS.DUE_DATE],
          check_owner_name: data[i][COL_CHECKS.CHECK_OWNER_NAME],
          received_from: data[i][COL_CHECKS.RECEIVED_FROM], issued_to: data[i][COL_CHECKS.ISSUED_TO],
          export_date: data[i][COL_CHECKS.EXPORT_DATE],
          is_paid: data[i][COL_CHECKS.IS_PAID], blacklisted: data[i][COL_CHECKS.BLACKLISTED],
          bank_name: data[i][COL_CHECKS.BANK_NAME], branch: data[i][COL_CHECKS.BRANCH],
          export_response_date: data[i][COL_CHECKS.EXPORT_RESPONSE_DATE],
          customer_response_date: data[i][COL_CHECKS.CUSTOMER_RESPONSE_DATE],
          notes: data[i][COL_CHECKS.NOTES] || "",
          amount: parseFloat(data[i][COL_CHECKS.AMOUNT] || '0'),
          created_at: data[i][COL_CHECKS.CREATED_AT]
        };
      }
    }
    return null;
  } catch (e) { console.error("❌ getCustomerCheckById error:", e); return null; }
}

// ========== ✅ التحقق من دورة حياة الشيك ==========
function validateCheckLifecycle(formData, oldCheck) {
  var errors = [];
  if (formData.received_date && formData.received_date.toString().trim() !== "") {
    if (!formData.received_from || formData.received_from.toString().trim() === "") { errors.push("حساب المصدر (ممن استلمنا الشيك) مطلوب"); }
    if (!formData.check_number || formData.check_number.toString().trim() === "") { errors.push("رقم الشيك مطلوب"); }
    if (!formData.amount || parseFloat(formData.amount) <= 0) { errors.push("قيمة الشيك يجب أن تكون أكبر من صفر"); }
  }
  if (formData.export_date && formData.export_date.toString().trim() !== "") {
    if (!formData.received_date || formData.received_date.toString().trim() === "") { errors.push("يجب استلام الشيك قبل تصديره"); }
    if (!formData.issued_to || formData.issued_to.toString().trim() === "") { errors.push("حساب الوجهة (إلى من صدر الشيك) مطلوب"); }
    if (formData.received_from === formData.issued_to) { errors.push("لا يمكن تصدير الشيك لنفس الحساب المصدر"); }
  }
  return errors;
}

// ========== 💰 حساب رصيد الحساب ==========
function calculateAccountBalanceForChecks(sheet, accountId, year) {
  try {
    var data = sheet.getDataRange().getDisplayValues();
    var balance = 0;
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][COL.ACCOUNT_MOVEMENTS.ACCOUNT_ID]).trim() === String(accountId).trim() &&
          String(data[i][COL.ACCOUNT_MOVEMENTS.FISCAL_YEAR]).trim() === String(year).trim()) {
        balance += parseFloat(data[i][COL.ACCOUNT_MOVEMENTS.DEBIT] || '0') - parseFloat(data[i][COL.ACCOUNT_MOVEMENTS.CREDIT] || '0');
      }
    }
    return balance;
  } catch (e) { console.warn("⚠️ calculateAccountBalanceForChecks error:", e); return 0; }
}

// ========== 📝 قيود استلام الشيك ==========
function postCheckReceiptEntryForChecks(checkData, year, accMovSheet, amount) {
  try {
    var now = typeof getNowTimestamp === 'function' ? getNowTimestamp() : generateTimestamp();
    var genId = function() { return typeof generateID === 'function' ? generateID() : generateUniqueId(); };
    
    var sourceBalance = typeof getAccountLastBalance === 'function' ? getAccountLastBalance(accMovSheet, checkData.received_from) : calculateAccountBalanceForChecks(accMovSheet, checkData.received_from, year);
    var checksBalance = typeof getAccountLastBalance === 'function' ? getAccountLastBalance(accMovSheet, checkData.checks_receivable_id) : calculateAccountBalanceForChecks(accMovSheet, checkData.checks_receivable_id, year);
    
    accMovSheet.appendRow([genId(), checkData.received_from, year, checkData.received_date, CHECK_REF_TYPES.RECEIPT, checkData.check_number, "0", amount.toString(), (sourceBalance - amount).toString(), now]);
    accMovSheet.appendRow([genId(), checkData.checks_receivable_id, year, checkData.received_date, CHECK_REF_TYPES.RECEIPT, checkData.check_number, amount.toString(), "0", (checksBalance + amount).toString(), now]);
    console.log("✅ تم تسجيل قيود استلام الشيك " + checkData.check_number);
  } catch (e) { console.error("❌ postCheckReceiptEntryForChecks error:", e); }
}

// ========== 📝 قيود تصدير الشيك ==========
function postCheckExportEntryForChecks(checkData, year, accMovSheet, amount) {
  try {
    var now = typeof getNowTimestamp === 'function' ? getNowTimestamp() : generateTimestamp();
    var genId = function() { return typeof generateID === 'function' ? generateID() : generateUniqueId(); };
    
    var destBalance = typeof getAccountLastBalance === 'function' ? getAccountLastBalance(accMovSheet, checkData.issued_to) : calculateAccountBalanceForChecks(accMovSheet, checkData.issued_to, year);
    var checksBalance = typeof getAccountLastBalance === 'function' ? getAccountLastBalance(accMovSheet, checkData.checks_receivable_id) : calculateAccountBalanceForChecks(accMovSheet, checkData.checks_receivable_id, year);
    
    accMovSheet.appendRow([genId(), checkData.issued_to, year, checkData.export_date, CHECK_REF_TYPES.EXPORT, checkData.check_number, amount.toString(), "0", (destBalance - amount).toString(), now]);
    accMovSheet.appendRow([genId(), checkData.checks_receivable_id, year, checkData.export_date, CHECK_REF_TYPES.EXPORT, checkData.check_number, "0", amount.toString(), (checksBalance - amount).toString(), now]);
    console.log("✅ تم تسجيل قيود تصدير الشيك " + checkData.check_number);
  } catch (e) { console.error("❌ postCheckExportEntryForChecks error:", e); }
}

// ========== 📝 قيود إرجاع من الوجهة ==========
function postCheckReturnFromDestinationEntryForChecks(checkData, year, accMovSheet, amount) {
  try {
    var now = typeof getNowTimestamp === 'function' ? getNowTimestamp() : generateTimestamp();
    var genId = function() { return typeof generateID === 'function' ? generateID() : generateUniqueId(); };
    
    var destBalance = typeof getAccountLastBalance === 'function' ? getAccountLastBalance(accMovSheet, checkData.issued_to) : calculateAccountBalanceForChecks(accMovSheet, checkData.issued_to, year);
    var checksBalance = typeof getAccountLastBalance === 'function' ? getAccountLastBalance(accMovSheet, checkData.checks_receivable_id) : calculateAccountBalanceForChecks(accMovSheet, checkData.checks_receivable_id, year);
    
    accMovSheet.appendRow([genId(), checkData.issued_to, year, checkData.export_response_date, CHECK_REF_TYPES.RETURN_DEST, checkData.check_number, "0", amount.toString(), (destBalance + amount).toString(), now]);
    accMovSheet.appendRow([genId(), checkData.checks_receivable_id, year, checkData.export_response_date, CHECK_REF_TYPES.RETURN_DEST, checkData.check_number, amount.toString(), "0", (checksBalance + amount).toString(), now]);
    console.log("✅ تم عكس قيود تصدير الشيك " + checkData.check_number);
  } catch (e) { console.error("❌ postCheckReturnFromDestinationEntryForChecks error:", e); }
}

// ========== 📝 قيود إرجاع للمصدر ==========
function postCheckReturnToSourceEntryForChecks(checkData, year, accMovSheet, amount) {
  try {
    var now = typeof getNowTimestamp === 'function' ? getNowTimestamp() : generateTimestamp();
    var genId = function() { return typeof generateID === 'function' ? generateID() : generateUniqueId(); };
    
    var sourceBalance = typeof getAccountLastBalance === 'function' ? getAccountLastBalance(accMovSheet, checkData.received_from) : calculateAccountBalanceForChecks(accMovSheet, checkData.received_from, year);
    var checksBalance = typeof getAccountLastBalance === 'function' ? getAccountLastBalance(accMovSheet, checkData.checks_receivable_id) : calculateAccountBalanceForChecks(accMovSheet, checkData.checks_receivable_id, year);
    
    accMovSheet.appendRow([genId(), checkData.received_from, year, checkData.customer_response_date, CHECK_REF_TYPES.RETURN_SOURCE, checkData.check_number, amount.toString(), "0", (sourceBalance + amount).toString(), now]);
    accMovSheet.appendRow([genId(), checkData.checks_receivable_id, year, checkData.customer_response_date, CHECK_REF_TYPES.RETURN_SOURCE, checkData.check_number, "0", amount.toString(), (checksBalance - amount).toString(), now]);
    console.log("✅ تم عكس قيود استلام الشيك " + checkData.check_number);
  } catch (e) { console.error("❌ postCheckReturnToSourceEntryForChecks error:", e); }
}

// ========== 🗑️ مسح قيود الشيك ==========
function clearCheckAccountMovementsForChecks(sheetId, checkNumber) {
  if (!sheetId) return;
  console.log("ℹ️ clearCheckAccountMovementsForChecks: لا يتم حذف القيود في المنطق الجديد للشيكات");
}

// ========== 🗑️ حذف قيود الشيك ==========
function deleteCheckMovementsForChecks(sheetId, checkNumber) {
  if (!sheetId) return;
  try {
    var sheet = SpreadsheetApp.openById(sheetId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    for (var i = data.length - 1; i >= 1; i--) {
      var refType = (data[i][COL.ACCOUNT_MOVEMENTS.REF_TYPE] || '').toString().trim();
      var refId = (data[i][COL.ACCOUNT_MOVEMENTS.REF_ID] || '').toString().trim();
      if (refId === checkNumber && (refType === CHECK_REF_TYPES.RECEIPT || refType === CHECK_REF_TYPES.EXPORT || refType === CHECK_REF_TYPES.RETURN_DEST || refType === CHECK_REF_TYPES.RETURN_SOURCE)) {
        sheet.deleteRow(i + 1);
      }
    }
    console.log("🗑️ تم حذف جميع القيود للشيك " + checkNumber);
  } catch (e) { console.warn("⚠️ deleteCheckMovementsForChecks error:", e); }
}

// ========== 💾 حفظ شيك العميل ==========
function saveCustomerCheck(formData) {
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
    console.log("\n" + "=".repeat(70));
    console.log("💳 [saveCustomerCheck] بدء حفظ شيك: " + (formData.check_number || 'جديد'));
    console.log("=".repeat(70));
    
    var fy = getActiveFiscalYearForChecks();
    var year = fy ? fy.year_code : null;
    if (!year) throw new Error("لا توجد سنة مالية نشطة");
    
    if (fy && fy.date_from && fy.date_to) {
      var dates = [
        { date: formData.received_date, name: 'تاريخ الاستلام' },
        { date: formData.export_date, name: 'تاريخ التصدير' },
        { date: formData.export_response_date, name: 'تاريخ الإرجاع من الوجهة' },
        { date: formData.customer_response_date, name: 'تاريخ الإرجاع للمصدر' }
      ];
      for (var i = 0; i < dates.length; i++) {
        var d = dates[i];
        if (d.date && d.date.toString().trim() !== '') {
          var checkDate = new Date(d.date);
          var from = new Date(fy.date_from);
          var to = new Date(fy.date_to);
          if (checkDate < from || checkDate > to) {
            throw new Error(d.name + " (" + d.date + ") يجب أن يكون بين " + fy.date_from + " و " + fy.date_to);
          }
        }
      }
    }

    var checksId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Customer_Checks", year) : null;
    var accMovId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Account_Movements", year) : null;
    if (!checksId || !accMovId) throw new Error("جداول النظام غير موجودة");

    var checksReceivable = getChecksReceivableAccount();
    if (!checksReceivable) { throw new Error("لم يتم العثور على حساب الشيكات. يرجى إنشاء حساب تحت الأصول باسم 'شيكات تحت التحصيل'"); }

    var amount = parseFloat(formData.amount) || 0;
    if (formData.received_date && formData.received_date.toString().trim() !== "" && amount <= 0) {
      throw new Error("قيمة الشيك يجب أن تكون أكبر من صفر عند تسجيل الاستلام");
    }

    var now = typeof getNowTimestamp === 'function' ? getNowTimestamp() : generateTimestamp();
    var checkNumber = formData.check_number || generateCheckNumber();
    var checkId = formData.id || (typeof generateID === 'function' ? generateID() : generateUniqueId());

    console.log("📄 معرف الشيك: " + checkId + " | رقم الشيك: " + checkNumber);

    var checkData = {
      id: checkId, check_number: checkNumber,
      received_date: formData.received_date || "", due_date: formData.due_date || "",
      check_owner_name: formData.check_owner_name || "",
      received_from: formData.received_from || "", issued_to: formData.issued_to || "",
      export_date: formData.export_date || "",
      is_paid: formData.is_paid ? "1" : "0", blacklisted: formData.blacklisted ? "1" : "0",
      bank_name: formData.bank_name || "", branch: formData.branch || "",
      export_response_date: formData.export_response_date || "",
      customer_response_date: formData.customer_response_date || "",
      notes: formData.notes || "", amount: amount.toString(),
      created_at: formData.id ? formData.created_at : now,
      checks_receivable_id: checksReceivable.id
    };

    var oldCheck = null;
    if (formData.id) { oldCheck = getCustomerCheckById(formData.id); console.log("🔄 تحديث شيك موجود: " + checkNumber); }
    else { console.log("➕ إنشاء شيك جديد: " + checkNumber); }
    
    var validationErrors = validateCheckLifecycle(checkData, oldCheck);
    if (validationErrors.length > 0) { throw new Error("فشل التحقق:\n• " + validationErrors.join("\n• ")); }

    var checksSheet = SpreadsheetApp.openById(checksId).getSheets()[0];
    var accMovSheet = SpreadsheetApp.openById(accMovId).getSheets()[0];

    if (formData.id) {
      var existingData = checksSheet.getDataRange().getDisplayValues();
      var rowIndex = -1;
      for (var j = 1; j < existingData.length; j++) {
        if (String(existingData[j][COL_CHECKS.ID]) === String(checkId)) { rowIndex = j + 1; break; }
      }
      if (rowIndex === -1) throw new Error("لم يتم العثور على الشيك للتحديث");
      
      var newMovements = {
        receipt: (!oldCheck.received_date || oldCheck.received_date.toString().trim() === "") && (checkData.received_date && checkData.received_date.toString().trim() !== ""),
        export: (!oldCheck.export_date || oldCheck.export_date.toString().trim() === "") && (checkData.export_date && checkData.export_date.toString().trim() !== ""),
        returnFromDest: (!oldCheck.export_response_date || oldCheck.export_response_date.toString().trim() === "") && (checkData.export_response_date && checkData.export_response_date.toString().trim() !== ""),
        returnToSource: (!oldCheck.customer_response_date || oldCheck.customer_response_date.toString().trim() === "") && (checkData.customer_response_date && checkData.customer_response_date.toString().trim() !== "")
      };
      console.log("🔍 الحركات الجديدة: استلام=" + newMovements.receipt + ", تصدير=" + newMovements.export + ", إرجاع_من_وجهة=" + newMovements.returnFromDest + ", إرجاع_لمصدر=" + newMovements.returnToSource);
      
      checksSheet.getRange(rowIndex, 1, 1, 17).setValues([[checkData.id, checkData.check_number, checkData.received_date, checkData.due_date, checkData.check_owner_name, checkData.received_from, checkData.issued_to, checkData.export_date, checkData.is_paid, checkData.blacklisted, checkData.bank_name, checkData.branch, checkData.export_response_date, checkData.customer_response_date, checkData.notes, checkData.amount, checkData.created_at]]);
      
      if (newMovements.receipt) { console.log("📝 تسجيل قيد استلام جديد..."); postCheckReceiptEntryForChecks(checkData, year, accMovSheet, amount); }
      if (newMovements.export) { console.log("📝 تسجيل قيد تصدير جديد..."); postCheckExportEntryForChecks(checkData, year, accMovSheet, amount); }
      if (newMovements.returnFromDest) { console.log("📝 تسجيل قيد إرجاع من الوجهة جديد..."); postCheckReturnFromDestinationEntryForChecks(checkData, year, accMovSheet, amount); }
      if (newMovements.returnToSource) { console.log("📝 تسجيل قيد إرجاع للمصدر جديد..."); postCheckReturnToSourceEntryForChecks(checkData, year, accMovSheet, amount); }
    } else {
      checksSheet.appendRow([checkData.id, checkData.check_number, checkData.received_date, checkData.due_date, checkData.check_owner_name, checkData.received_from, checkData.issued_to, checkData.export_date, checkData.is_paid, checkData.blacklisted, checkData.bank_name, checkData.branch, checkData.export_response_date, checkData.customer_response_date, checkData.notes, checkData.amount, checkData.created_at]);
      if (checkData.received_date && checkData.received_date.toString().trim() !== "") { console.log("📝 تسجيل قيد استلام للشيك الجديد..."); postCheckReceiptEntryForChecks(checkData, year, accMovSheet, amount); }
    }

    console.log("=".repeat(70));
    console.log("✅ [saveCustomerCheck] انتهى الحفظ بنجاح");
    console.log("=".repeat(70) + "\n");

    // ✅ تم إصلاح السطر هنا - إضافة مفتاح "data" قبل الكائن
    return { 
      success: true, 
      message: formData.id ? "تم تحديث الشيك بنجاح" : "تم حفظ الشيك بنجاح",data:
       { check_number: checkNumber, id: checkId } 
    };
    
  } catch (e) {
    console.error("❌ saveCustomerCheck error:", e);
    return { success: false, message: "خطأ: " + e.toString() };
  }
}
// ========== 🗑️ حذف شيك العميل ==========
function deleteCustomerCheck(id) {
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
    var fy = getActiveFiscalYearForChecks();
    var year = fy ? fy.year_code : null;
    if (!year) throw new Error("لا توجد سنة مالية نشطة");
    
    var checksId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Customer_Checks", year) : null;
    var accMovId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Account_Movements", year) : null;
    if (!checksId) throw new Error("جدول الشيكات غير موجود");

    var checksSheet = SpreadsheetApp.openById(checksId).getSheets()[0];
    var existingData = checksSheet.getDataRange().getDisplayValues();
    var checkNumber = null;
    
    for (var i = existingData.length - 1; i >= 1; i--) {
      if (String(existingData[i][COL_CHECKS.ID]) === String(id)) {
        checkNumber = (existingData[i][COL_CHECKS.CHECK_NUMBER] || '').toString().trim();
        checksSheet.deleteRow(i + 1);
        break;
      }
    }
    if (!checkNumber) throw new Error("الشيك غير موجود");
    if (accMovId) { deleteCheckMovementsForChecks(accMovId, checkNumber); }
    return { success: true, message: "تم حذف الشيك والقيود المرتبطة به بنجاح" };
  } catch (e) { console.error("❌ deleteCustomerCheck error:", e); return { success: false, message: "خطأ: " + e.toString() }; }
}

// ========== 🔧 دوال مساعدة ==========
function generateCheckNumber() {
  var year = new Date().getFullYear().toString().slice(-2);
  var month = (new Date().getMonth() + 1).toString().padStart(2, '0');
  var random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return 'CHK-' + year + month + '-' + random;
}

function generateTimestamp() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
}

function generateUniqueId() {
  return Utilities.getUuid().replace(/-/g, '');
}

function loadPageDataForChecks() {
  try {
    return {
      checks: getCustomerChecksList(),
      sourceAccounts: getAllCheckSourceAccounts(),
      destinationAccounts: getAllCheckDestinationAccounts(),
      checksReceivable: getChecksReceivableAccount()
    };
  } catch (e) {
    console.error("❌ loadPageDataForChecks error:", e);
    return { checks: [], sourceAccounts: [], destinationAccounts: [], checksReceivable: null };
  }
}

function filterCustomerChecks(filters) {
  try {
    var allChecks = getCustomerChecksList();
    return allChecks.filter(function(check) {
      if (filters.checkNumber && filters.checkNumber.trim() !== "") { if (!check.check_number.toLowerCase().includes(filters.checkNumber.toLowerCase())) return false; }
      if (filters.ownerName && filters.ownerName.trim() !== "") { if (!check.check_owner_name.toLowerCase().includes(filters.ownerName.toLowerCase())) return false; }
      if (filters.source && filters.source.trim() !== "") { if (!check.source_name.toLowerCase().includes(filters.source.toLowerCase())) return false; }
      if (filters.destination && filters.destination.trim() !== "") { if (!check.destination_name.toLowerCase().includes(filters.destination.toLowerCase())) return false; }
      if (filters.status && filters.status.trim() !== "") { if (check.status !== filters.status) return false; }
      if (filters.bank && filters.bank.trim() !== "") { if (!check.bank_name.toLowerCase().includes(filters.bank.toLowerCase())) return false; }
      return true;
    });
  } catch (e) { console.error("❌ filterCustomerChecks error:", e); return []; }
}

function showStoredDataInLog() {
  try {
    var props = getDocProperties();
    var allKeys = props.getKeys();
    console.log('ZEIOS ERP - CustomerChecks data');
    console.log('Keys:', allKeys.length);
    return { success: true, count: allKeys.length, keys: allKeys };
  } catch (e) { console.error('Error:', e); return { success: false, error: e.toString() }; }
}

function getLibraryVersion() { return LIBRARY_VERSION; }

function testChecks() {
  console.log("🔍 اختبار جلب الشيكات...");
  var checks = getCustomerChecksList();
  console.log("📊 عدد الشيكات: " + checks.length);
  if (checks.length > 0) { console.log("📋 أول 3 شيكات:", checks.slice(0, 3)); }
  return checks;
}
/**
 * الحصول على شيك للتعديل المباشر
 */
function getCheckForDirectEdit(checkId, fiscalYear) {
  try {
    if (!checkId) { return { success: false, message: '❌ معرف الشيك مطلوب' }; }
    
    var year = typeof getFiscalYearCode === 'function' ? getFiscalYearCode(fiscalYear) : null;
    if (!year && typeof getFiscalYearInfo === 'function') {
      var fy = getFiscalYearInfo(fiscalYear);
      year = fy && fy.year_code ? fy.year_code : null;
    }
    if (!year) { year = new Date().getFullYear().toString(); }
    
    var tableId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Checks", year) : null;
    if (!tableId) { return { success: false, message: '❌ جدول الشيكات غير موجود' }; }
    
    var ss = SpreadsheetApp.openById(tableId);
    var sheet = ss.getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    
    var check = null;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] && String(data[i][0]).trim() === String(checkId).trim()) {
        check = {
          id: data[i][0], check_no: data[i][1] || '', fiscal_year: data[i][2] || year,
          check_date: data[i][3] || '', due_date: data[i][4] || '',
          bank_name: data[i][5] || '', account_id: data[i][6] || '',
          amount: parseFloat(data[i][7]) || 0, status: data[i][8] || 'معلق',
          notes: data[i][9] || '', created_at: data[i][10] || ''
        };
        
        // اسم الطرف
        if (check.account_id && typeof getAccountInfo === 'function') {
          var account = getAccountInfo(check.account_id);
          if (account) {
            check.account_name = account.account_name || account.contact_name || '';
            check.account_phone = account.phone || '';
          }
        }
        // حالة الشيك
        check.status_label = getCheckStatusLabel(check.status);
        break;
      }
    }
    if (!check) { return { success: false, message: '❌ لم يتم العثور على الشيك' }; }
    
    return { success: true, data: check, message: 'تم جلب بيانات الشيك بنجاح' };
    
  } catch (e) {
    console.error('❌ getCheckForDirectEdit error:', e);
    return { success: false, message: 'خطأ: ' + e.toString() };
  }
}

// دالة مساعدة لعرض حالة الشيك
function getCheckStatusLabel(status) {
  var labels = {
    'pending': '🟡 معلق', 'cleared': '🟢 تم الصرف',
    'bounced': '🔴 رجع', 'cancelled': '⚪ ملغى'
  };
  return labels[status] || status;
}


/**
 * CustomerChecks_client.gs – ZEIOS ERP SYSTEM (SHEET VERSION)
 * دوال بنفس أسماء المكتبة عشان الكود يشتغل من غير تعديل
 * 
 * ⚠️ قبل التشغيل: أضف المكتبة من Extensions → Libraries
 */

// ========== 🔗 ربط المكتبة ==========
var ZEIOS = ZEIOS; // غيّر للاسم اللي أنت سميته


// ========== 🔄 ثوابت ==========
var CHECK_REF_TYPES = ZEIOS.CHECK_REF_TYPES;
var COL_CHECKS = ZEIOS.COL_CHECKS;

// ========== 📦 دوال السنة المالية ==========
function getActiveFiscalYearForChecks() { try { return ZEIOS.getActiveFiscalYearForChecks(); } catch (e) { return {year_code:null,is_active:false,date_from:'',date_to:'',folder_id:''}; } }
function getFiscalYearCodeForChecks() { try { return ZEIOS.getFiscalYearCodeForChecks(); } catch (e) { return null; } }

// ========== 📦 دوال الحسابات ==========
function getAllCheckSourceAccounts() { try { return ZEIOS.getAllCheckSourceAccounts(); } catch (e) { return []; } }
function getAllCheckDestinationAccounts() { try { return ZEIOS.getAllCheckDestinationAccounts(); } catch (e) { return []; } }
function getChecksReceivableAccount() { try { return ZEIOS.getChecksReceivableAccount(); } catch (e) { return null; } }

// ========== 📊 حالة الشيك ==========
function getCheckStatus(check) { try { return ZEIOS.getCheckStatus(check); } catch (e) { return "DRAFT"; } }

// ========== 📋 قائمة الشيكات ==========
function getCustomerChecksList() { try { return ZEIOS.getCustomerChecksList(); } catch (e) { return []; } }
function getCustomerCheckById(id) { try { return ZEIOS.getCustomerCheckById(id); } catch (e) { return null; } }

// ========== ✅ التحقق ==========
function validateCheckLifecycle(formData, oldCheck) { try { return ZEIOS.validateCheckLifecycle(formData, oldCheck); } catch (e) { return []; } }

// ========== 💾 حفظ/حذف ==========
function saveCustomerCheck(formData) { try { return ZEIOS.saveCustomerCheck(formData); } catch (e) { return {success:false,message:'❌ '+e.toString()}; } }
function deleteCustomerCheck(id) { try { return ZEIOS.deleteCustomerCheck(id); } catch (e) { return {success:false,message:'❌ '+e.toString()}; } }

// ========== 🔧 مساعدة ==========
function generateCheckNumber() { try { return ZEIOS.generateCheckNumber(); } catch (e) { var y=new Date().getFullYear().toString().slice(-2),m=(new Date().getMonth()+1).toString().padStart(2,'0'),r=Math.floor(Math.random()*10000).toString().padStart(4,'0'); return 'CHK-'+y+m+'-'+r; } }
function generateTimestamp() { try { return ZEIOS.generateTimestamp(); } catch (e) { return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss'); } }
function generateUniqueId() { try { return ZEIOS.generateUniqueId(); } catch (e) { return Utilities.getUuid().replace(/-/g, ''); } }
function loadPageDataForChecks() { try { return ZEIOS.loadPageDataForChecks(); } catch (e) { return {checks:[],sourceAccounts:[],destinationAccounts:[],checksReceivable:null}; } }
function filterCustomerChecks(filters) { try { return ZEIOS.filterCustomerChecks(filters); } catch (e) { return []; } }
function showStoredDataInLog() { try { return ZEIOS.showStoredDataInLog(); } catch (e) { return {success:false,error:e.toString()}; } }
function getLibraryVersion() { try { return ZEIOS.getLibraryVersion(); } catch (e) { return 'غير متصل'; } }
function testChecks() { try { return ZEIOS.testChecks(); } catch (e) { return []; } }

// ========== 🎨 دوال الواجهة (في الشيت فقط - مش في المكتبة) ==========
function isSpreadsheetContext() {
  try { SpreadsheetApp.getUi(); return true; }
  catch (e) { return false; }
}

function openCustomerChecksPage() {
  try {
    var pageName = 'customer_checks';
    var title = '📋 إدارة شيكات العملاء - ZEIOS ERP';
    if (isSpreadsheetContext()) {
      var html = HtmlService.createHtmlOutputFromFile(pageName)
        .setTitle(title).setWidth(1300).setHeight(850)
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      SpreadsheetApp.getUi().showModalDialog(html, title);
      return { success: true, mode: "spreadsheet" };
    }
    var baseUrl = ScriptApp.getService() ? ScriptApp.getService().getUrl() : null;
    if (baseUrl) return { success: true, mode: "webapp", url: baseUrl + "?page=" + pageName };
    return { success: false, message: "لا يمكن تحديد بيئة التشغيل" };
  } catch (e) { console.error("❌ openCustomerChecksPage error:", e); return { success: false, message: e.toString() }; }
}

function openCustomerCheckForm(checkId) {
  var id = checkId || null;
  try {
    var pageName = 'customer_checks';
    var title = id ? '✏️ تعديل شيك - ZEIOS ERP' : '➕ إضافة شيك جديد - ZEIOS ERP';
    if (isSpreadsheetContext()) {
      var html = HtmlService.createHtmlOutputFromFile(pageName)
        .setTitle(title).setWidth(1000).setHeight(750)
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      SpreadsheetApp.getUi().showModalDialog(html, title);
      return { success: true, mode: "spreadsheet" };
    }
    var baseUrl = ScriptApp.getService() ? ScriptApp.getService().getUrl() : null;
    if (baseUrl) {
      var params = id ? '?page=customer_checks&edit=' + encodeURIComponent(id) : '?page=customer_checks&new=1';
      return { success: true, mode: "webapp", url: baseUrl + params };
    }
    return { success: false, message: "لا يمكن تحديد بيئة التشغيل" };
  } catch (e) { console.error("❌ openCustomerCheckForm error:", e); return { success: false, message: e.toString() }; }
} 
/**
 * ✅ دالة واجهة لاستدعاء جلب شيك للتعديل المباشر
 * ⚠️ يجب أن تكون في مشروع الجدول (ليس في المكتبة)
 * ⚠️ مطلوبة من الـ HTML عبر google.script.run
 */
function getCheckForDirectEdit(checkId, fiscalYear) {
  try {
    // ✅ التحقق من المدخلات
    if (!checkId) {
      return { success: false, message: '❌ معرف الشيك مطلوب' };
    }
    
    // ✅ استدعاء الدالة من المكتبة إذا كانت متاحة
    if (typeof ZEIOS !== 'undefined' && typeof ZEIOS.getCheckForDirectEdit === 'function') {
      return ZEIOS.getCheckForDirectEdit(checkId, fiscalYear);
    }
    
    // ✅ Fallback: استدعاء الدالة المحلية إذا كانت موجودة في ملف آخر
    if (typeof getCheckForDirectEdit === 'function' && 
        getCheckForDirectEdit !== arguments.callee) {
      return getCheckForDirectEdit(checkId, fiscalYear);
    }
    
    return { success: false, message: 'دالة جلب الشيك غير متاحة' };
    
  } catch (e) {
    console.error('❌ getCheckForDirectEdit (client) error:', e);
    return {
      success: false,
      message: 'خطأ: ' + e.toString(),
      error: e.toString()
    };
  }
}
