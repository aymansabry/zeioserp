/**
 * GeneralJournal.gs – ZEIOS ERP SYSTEM (LIBRARY VERSION)
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


// ========== 🔄 ثوابت اليومية ==========
var JOURNAL_REF_TYPE = 'JOURNAL';

// ========== 📦 دوال السنة المالية ==========
function getActiveFiscalYearForJournal() {
  try {
    if (typeof getActiveFiscalYear === 'function') return getActiveFiscalYear();
    var year = typeof getSys === 'function' ? getSys("ACTIVE_FISCAL_YEAR") : null;
    if (year) return { year_code: year, is_active: true, date_from: '', date_to: '', folder_id: '' };
    return { year_code: null, is_active: false, date_from: '', date_to: '', folder_id: '' };
  } catch (e) { console.error("❌ getActiveFiscalYearForJournal error:", e); return { year_code: null, is_active: false, date_from: '', date_to: '', folder_id: '' }; }
}

function getFiscalYearCodeForJournal() {
  var fy = getActiveFiscalYearForJournal();
  return fy && fy.year_code ? fy.year_code : (typeof getSys === 'function' ? getSys("ACTIVE_FISCAL_YEAR") : null);
}

// ========== 📦 دوال جلب الحسابات ==========
function getAllAccountsForJournal() {
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
      
      if (!bsGroup && !plGroup) continue;
      
      accounts.push({
        id: id, account_no: accountNo, account_name: accountName,
        bs_group: bsGroup, pl_group: plGroup
      });
    }
    console.log("✅ تم تحميل " + accounts.length + " حساب لليومية");
    return accounts;
  } catch (e) { console.error("❌ getAllAccountsForJournal error:", e); return []; }
}

// ========== 📋 قائمة قيود اليومية ==========
function getJournalEntries() {
  try {
    var fy = getActiveFiscalYearForJournal();
    var year = fy ? fy.year_code : null;
    if (!year) return [];
    
    var accMovId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Account_Movements", year) : null;
    if (!accMovId) return [];

    var sheet = SpreadsheetApp.openById(accMovId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();

    var journalMap = {};
    
    for (var i = 1; i < data.length; i++) {
      var refType = (data[i][4] || '').toString().trim();
      if (refType !== JOURNAL_REF_TYPE) continue;
      
      var journalNo = (data[i][5] || '').toString().trim();
      if (!journalNo) continue;
      
      if (!journalMap[journalNo]) {
        journalMap[journalNo] = {
          id: journalNo, journal_no: journalNo, date: data[i][3] || '',
          description: '', total_debit: 0, total_credit: 0, lines_count: 0
        };
      }
      
      var debit = parseFloat(data[i][6] || '0');
      var credit = parseFloat(data[i][7] || '0');
      
      journalMap[journalNo].total_debit += debit;
      journalMap[journalNo].total_credit += credit;
      journalMap[journalNo].lines_count++;
    }

    var journals = [];
    for (var key in journalMap) { journals.push(journalMap[key]); }
    console.log("✅ تم تحميل " + journals.length + " قيد يومية");
    return journals;
  } catch (e) { console.error("❌ getJournalEntries error:", e); return []; }
}

// ========== 🔍 جلب قيد يومية بالتفصيل ==========
function getJournalEntryById(journalNo) {
  try {
    var fy = getActiveFiscalYearForJournal();
    var year = fy ? fy.year_code : null;
    if (!year) return null;
    
    var accMovId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Account_Movements", year) : null;
    if (!accMovId) return null;

    var sheet = SpreadsheetApp.openById(accMovId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();

    var entry = { id: journalNo, journal_no: journalNo, date: '', description: '', lines: [] };
    var firstRow = true;
    
    for (var i = 1; i < data.length; i++) {
      var refType = (data[i][4] || '').toString().trim();
      var refId = (data[i][5] || '').toString().trim();
      
      if (refId === journalNo && refType === JOURNAL_REF_TYPE) {
        if (firstRow) { entry.date = data[i][3] || ''; firstRow = false; }
        entry.lines.push({
          account_id: data[i][1] || '',
          debit: parseFloat(data[i][6] || '0'),
          credit: parseFloat(data[i][7] || '0')
        });
      }
    }
    return entry.lines.length > 0 ? entry : null;
  } catch (e) { console.error("❌ getJournalEntryById error:", e); return null; }
}

// ========== 💰 حساب رصيد الحساب ==========
function calculateAccountBalanceForJournal(sheet, accountId) {
  try {
    var data = sheet.getDataRange().getDisplayValues();
    var lastBalance = 0;
    for (var i = data.length - 1; i >= 1; i--) {
      if (String(data[i][1]) === String(accountId)) {
        lastBalance = parseFloat(data[i][8]) || 0;
        break;
      }
    }
    return lastBalance;
  } catch (e) { console.warn("⚠️ calculateAccountBalanceForJournal error:", e); return 0; }
}

// ========== 🔄 إعادة حساب الأرصدة ==========
function recalculateAllBalancesForJournal(year, accMovId) {
  try {
    var accSheet = SpreadsheetApp.openById(accMovId).getSheets()[0];
    var data = accSheet.getDataRange().getDisplayValues();
    if (data.length <= 1) return;
    
    var accountMovements = {};
    for (var i = 1; i < data.length; i++) {
      var accountId = (data[i][1] || '').toString().trim();
      if (!accountId) continue;
      if (!accountMovements[accountId]) { accountMovements[accountId] = []; }
      accountMovements[accountId].push({
        rowIndex: i + 1,
        debit: parseFloat(data[i][6] || '0'),
        credit: parseFloat(data[i][7] || '0')
      });
    }
    
    for (var accountId in accountMovements) {
      var balance = 0;
      var movements = accountMovements[accountId];
      movements.sort(function(a, b) { return a.rowIndex - b.rowIndex; });
      for (var j = 0; j < movements.length; j++) {
        balance += movements[j].debit - movements[j].credit;
        accSheet.getRange(movements[j].rowIndex, 9).setValue(balance.toFixed(2));
      }
    }
    console.log("✅ تم إعادة حساب الأرصدة لـ " + Object.keys(accountMovements).length + " حساب");
  } catch (e) {
    console.error("❌ recalculateAllBalancesForJournal error:", e);
    throw new Error("فشل إعادة حساب الأرصدة: " + e.message);
  }
}

// ========== 💾 حفظ قيد يومية ==========
function saveJournalEntry(formData) {
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
    if (!formData.date || formData.date.toString().trim() === '') { throw new Error("تاريخ القيد مطلوب"); }
    
    var fy = getActiveFiscalYearForJournal();
    var year = fy ? fy.year_code : null;
    if (!year) throw new Error("لا توجد سنة مالية نشطة");
    
    if (fy && fy.date_from && fy.date_to) {
      var journalDate = new Date(formData.date);
      var from = new Date(fy.date_from);
      var to = new Date(fy.date_to);
      if (journalDate < from || journalDate > to) {
        throw new Error("تاريخ القيد (" + formData.date + ") يجب أن يكون بين " + fy.date_from + " و " + fy.date_to);
      }
    }
    
    if (!formData.lines || formData.lines.length === 0) { throw new Error("يجب إضافة بند واحد على الأقل"); }
    
    var totalDebit = 0, totalCredit = 0, validLinesCount = 0;
    for (var i = 0; i < formData.lines.length; i++) {
      var line = formData.lines[i];
      var debit = parseFloat(line.debit) || 0;
      var credit = parseFloat(line.credit) || 0;
      if (debit > 0 || credit > 0) {
        totalDebit += debit;
        totalCredit += credit;
        validLinesCount++;
      }
    }
    
    if (validLinesCount === 0) { throw new Error("يجب إضافة بند واحد على الأقل بقيمة"); }
    if (Math.abs(totalDebit - totalCredit) >= 0.01) {
      throw new Error("القيد غير متوازن\nمجموع المدين: " + totalDebit.toFixed(2) + "\nمجموع الدائن: " + totalCredit.toFixed(2) + "\nالفرق: " + Math.abs(totalDebit - totalCredit).toFixed(2));
    }

    var accMovId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Account_Movements", year) : null;
    if (!accMovId) throw new Error("جدول حركات الحسابات غير موجود");

    var now = typeof getNowTimestamp === 'function' ? getNowTimestamp() : generateTimestamp();
    var journalNo = formData.journal_no || "JNL-" + (typeof generateID === 'function' ? generateID().toString().slice(-8) : Date.now().toString().slice(-8));

    var accSheet = SpreadsheetApp.openById(accMovId).getSheets()[0];
    
    if (formData.id) {
      var existingData = accSheet.getDataRange().getDisplayValues();
      for (var j = existingData.length - 1; j >= 1; j--) {
        var refType = (existingData[j][4] || '').toString().trim();
        var refId = (existingData[j][5] || '').toString().trim();
        if (refId === formData.id && refType === JOURNAL_REF_TYPE) { accSheet.deleteRow(j + 1); }
      }
    }

    for (var k = 0; k < formData.lines.length; k++) {
      var line = formData.lines[k];
      var debit = parseFloat(line.debit) || 0;
      var credit = parseFloat(line.credit) || 0;
      if (debit > 0 || credit > 0) {
        accSheet.appendRow([
          typeof generateID === 'function' ? generateID() : generateUniqueId(),
          line.account_id, year, formData.date, JOURNAL_REF_TYPE, journalNo,
          debit.toString(), credit.toString(), "0", now
        ]);
      }
    }

    recalculateAllBalancesForJournal(year, accMovId);

    // ✅ تم إصلاح السطر هنا - إضافة مفتاح "data" قبل الكائن
    return { 
      success: true, 
      message: formData.id ? "تم تحديث قيد اليومية بنجاح" : "تم حفظ قيد اليومية بنجاح",data:
       { journal_no: journalNo } 
    };
  } catch (e) {
    console.error("❌ saveJournalEntry error:", e);
    return { success: false, message: "خطأ: " + e.toString() };
  }
}

// ========== 🗑️ حذف قيد يومية ==========
function deleteJournalEntry(journalNo) {
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
    var fy = getActiveFiscalYearForJournal();
    var year = fy ? fy.year_code : null;
    if (!year) throw new Error("لا توجد سنة مالية نشطة");
    
    var accMovId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Account_Movements", year) : null;
    if (!accMovId) throw new Error("جدول حركات الحسابات غير موجود");

    var accSheet = SpreadsheetApp.openById(accMovId).getSheets()[0];
    var existingData = accSheet.getDataRange().getDisplayValues();
    var found = false;
    
    for (var i = existingData.length - 1; i >= 1; i--) {
      var refType = (existingData[i][4] || '').toString().trim();
      var refId = (existingData[i][5] || '').toString().trim();
      if (refId === journalNo && refType === JOURNAL_REF_TYPE) {
        accSheet.deleteRow(i + 1);
        found = true;
      }
    }

    if (!found) { return { success: false, message: "لم يتم العثور على قيد اليومية" }; }

    recalculateAllBalancesForJournal(year, accMovId);
    return { success: true, message: "تم حذف قيد اليومية وإعادة حساب الأرصدة" };
  } catch (e) { console.error("❌ deleteJournalEntry error:", e); return { success: false, message: "خطأ: " + e.toString() }; }
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
    console.log('ZEIOS ERP - GeneralJournal data');
    console.log('Keys:', allKeys.length);
    return { success: true, count: allKeys.length, keys: allKeys };
  } catch (e) { console.error('Error:', e); return { success: false, error: e.toString() }; }
}

function getLibraryVersion() { return LIBRARY_VERSION; }

function testJournalEntries() {
  console.log("🔍 اختبار جلب قيود اليومية...");
  var journals = getJournalEntries();
  console.log("📊 عدد قيود اليومية: " + journals.length);
  if (journals.length > 0) { console.log("📋 أول 3 قيود:", journals.slice(0, 3)); }
  return journals;
}
/**
 * الحصول على قيد يومية للتعديل المباشر
 * ✅ تستخدم دوال core.gs مباشرة - بدون دوال مساعدة تبدأ بـ _
 * ✅ نمط موحد مع باقي الوحدات (مشتريات، مبيعات، إلخ)
 */
function getJournalEntryForDirectEdit(entryId, fiscalYear) {
  try {
    if (!entryId) { return { success: false, message: '❌ معرف القيد مطلوب' }; }
    
    // السنة المالية
    var year = typeof getFiscalYearCode === 'function' ? getFiscalYearCode(fiscalYear) : null;
    if (!year && typeof getFiscalYearInfo === 'function') {
      var fy = getFiscalYearInfo(fiscalYear);
      year = fy && fy.year_code ? fy.year_code : null;
    }
    if (!year) { year = new Date().getFullYear().toString(); }
    
    // جدول القيود
    var tableId = typeof getYearlyTableId === 'function' ? getYearlyTableId("General_Journal", year) : null;
    if (!tableId) { return { success: false, message: '❌ جدول القيود غير موجود' }; }
    
    var ss = SpreadsheetApp.openById(tableId);
    var sheet = ss.getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    
    var entry = null;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] && String(data[i][0]).trim() === String(entryId).trim()) {
        entry = {
          id: data[i][0],
          entry_no: data[i][1] || '',
          fiscal_year: data[i][2] || year,
          entry_date: data[i][3] || '',
          source: data[i][4] || '',
          reference: data[i][5] || '',
          notes: data[i][6] || '',
          total_debit: parseFloat(data[i][7]) || 0,
          total_credit: parseFloat(data[i][8]) || 0,
          status: data[i][9] || 'مسود',
          created_at: data[i][10] || '',
          created_by: data[i][11] || ''
        };
        
        // جلب اسم المستخدم الذي أنشأ القيد
        if (entry.created_by && typeof getUserNameById === 'function') {
          entry.created_by_name = getUserNameById(entry.created_by);
        }
        
        break;
      }
    }
    
    if (!entry) { return { success: false, message: '❌ لم يتم العثور على القيد' }; }
    
    // بنود القيد (الأسطر)
    entry.lines = [];
    var detailsId = typeof getYearlyTableId === 'function' ? getYearlyTableId("General_Journal_Details", year) : null;
    
    if (detailsId) {
      var dSheet = SpreadsheetApp.openById(detailsId).getSheets()[0];
      var dData = dSheet.getDataRange().getDisplayValues();
      
      // جلب الحسابات مرة واحدة
      var accounts = [];
      if (typeof getAllAccountsForStatement === 'function') {
        accounts = getAllAccountsForStatement(year);
      }
      var accountsMap = {};
      for (var idx = 0; idx < accounts.length; idx++) {
        accountsMap[accounts[idx].id] = accounts[idx];
      }
      
      for (var j = 1; j < dData.length; j++) {
        if (dData[j][1] && String(dData[j][1]).trim() === String(entryId).trim()) {
          var accountId = dData[j][2] || '';
          var accountInfo = accountsMap[accountId] || {};
          
          var line = {
            id: dData[j][0] || '',
            account_id: accountId,
            account_name: accountInfo.account_name || '',
            account_no: accountInfo.account_no || '',
            debit: parseFloat(dData[j][3]) || 0,
            credit: parseFloat(dData[j][4]) || 0,
            notes: dData[j][5] || '',
            cost_center: dData[j][6] || ''
          };
          
          entry.lines.push(line);
        }
      }
    }
    
    // التحقق من توازن القيد
    entry.is_balanced = Math.abs(entry.total_debit - entry.total_credit) < 0.01;
    entry.difference = entry.total_debit - entry.total_credit;
    
    return { success: true,  entry, message: 'تم جلب بيانات القيد بنجاح' };
    
  } catch (e) {
    console.error('❌ getJournalEntryForDirectEdit error:', e);
    return { success: false, message: 'خطأ: ' + e.toString() };
  }
}


/**
 * GeneralJournal_client.gs – ZEIOS ERP SYSTEM (SHEET VERSION)
 * دوال بنفس أسماء المكتبة عشان الكود يشتغل من غير تعديل
 * 
 * ⚠️ قبل التشغيل: أضف المكتبة من Extensions → Libraries
 */

// ========== 🔗 ربط المكتبة ==========
var ZEIOS = ZEIOS; // غيّر للاسم اللي أنت سميته


// ========== 🔄 ثوابت ==========
var JOURNAL_REF_TYPE = ZEIOS.JOURNAL_REF_TYPE;

// ========== 📦 دوال السنة المالية ==========
function getActiveFiscalYearForJournal() { try { return ZEIOS.getActiveFiscalYearForJournal(); } catch (e) { return {year_code:null,is_active:false,date_from:'',date_to:'',folder_id:''}; } }
function getFiscalYearCodeForJournal() { try { return ZEIOS.getFiscalYearCodeForJournal(); } catch (e) { return null; } }

// ========== 📦 دوال الحسابات ==========
function getAllAccountsForJournal() { try { return ZEIOS.getAllAccountsForJournal(); } catch (e) { return []; } }

// ========== 📋 قائمة القيود ==========
function getJournalEntries() { try { return ZEIOS.getJournalEntries(); } catch (e) { return []; } }
function getJournalEntryById(journalNo) { try { return ZEIOS.getJournalEntryById(journalNo); } catch (e) { return null; } }

// ========== 💾 حفظ/حذف ==========
function saveJournalEntry(formData) { try { return ZEIOS.saveJournalEntry(formData); } catch (e) { return {success:false,message:'❌ '+e.toString()}; } }
function deleteJournalEntry(journalNo) { try { return ZEIOS.deleteJournalEntry(journalNo); } catch (e) { return {success:false,message:'❌ '+e.toString()}; } }

// ========== 🔧 مساعدة ==========
function generateTimestamp() { try { return ZEIOS.generateTimestamp(); } catch (e) { return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss'); } }
function generateUniqueId() { try { return ZEIOS.generateUniqueId(); } catch (e) { return Utilities.getUuid().replace(/-/g, ''); } }
function showStoredDataInLog() { try { return ZEIOS.showStoredDataInLog(); } catch (e) { return {success:false,error:e.toString()}; } }
function getLibraryVersion() { try { return ZEIOS.getLibraryVersion(); } catch (e) { return 'غير متصل'; } }
function testJournalEntries() { try { return ZEIOS.testJournalEntries(); } catch (e) { return []; } }

// ========== 🎨 دوال الواجهة (في الشيت فقط - مش في المكتبة) ==========
function isSpreadsheetContext() {
  try { SpreadsheetApp.getUi(); return true; }
  catch (e) { return false; }
}

function openJournalPage() {
  try {
    var pageName = 'journal';
    var title = '📒 قيود اليومية العامة - ZEIOS ERP';
    if (isSpreadsheetContext()) {
      var html = HtmlService.createHtmlOutputFromFile(pageName)
        .setTitle(title).setWidth(1400).setHeight(900)
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      SpreadsheetApp.getUi().showModalDialog(html, title);
      return { success: true, mode: "spreadsheet" };
    }
    var baseUrl = ScriptApp.getService() ? ScriptApp.getService().getUrl() : null;
    if (baseUrl) return { success: true, mode: "webapp", url: baseUrl + "?page=" + pageName };
    return { success: false, message: "لا يمكن تحديد بيئة التشغيل" };
  } catch (e) { console.error("❌ openJournalPage error:", e); return { success: false, message: e.toString() }; }
}

function openJournalForm(journalNo) {
  var id = journalNo || null;
  try {
    var pageName = 'journal';
    var title = id ? '✏️ تعديل قيد يومية - ZEIOS ERP' : '➕ إضافة قيد يومية جديد - ZEIOS ERP';
    if (isSpreadsheetContext()) {
      var html = HtmlService.createHtmlOutputFromFile(pageName)
        .setTitle(title).setWidth(1000).setHeight(750)
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      SpreadsheetApp.getUi().showModalDialog(html, title);
      return { success: true, mode: "spreadsheet" };
    }
    var baseUrl = ScriptApp.getService() ? ScriptApp.getService().getUrl() : null;
    if (baseUrl) {
      var params = id ? '?page=journal&edit=' + encodeURIComponent(id) : '?page=journal&new=1';
      return { success: true, mode: "webapp", url: baseUrl + params };
    }
    return { success: false, message: "لا يمكن تحديد بيئة التشغيل" };
  } catch (e) { console.error("❌ openJournalForm error:", e); return { success: false, message: e.toString() }; }
}
/**
 * ✅ دالة واجهة لاستدعاء جلب قيد يومية للتعديل المباشر
 * ⚠️ يجب أن تكون في مشروع الجدول (ليس في المكتبة)
 * ⚠️ مطلوبة من الـ HTML عبر google.script.run
 */
function getJournalEntryForDirectEdit(entryId, fiscalYear) {
  try {
    // ✅ التحقق من المدخلات
    if (!entryId) {
      return { success: false, message: '❌ معرف القيد مطلوب' };
    }
    
    // ✅ استدعاء الدالة من المكتبة إذا كانت متاحة
    if (typeof ZEIOS !== 'undefined' && typeof ZEIOS.getJournalEntryForDirectEdit === 'function') {
      return ZEIOS.getJournalEntryForDirectEdit(entryId, fiscalYear);
    }
    
    // ✅ Fallback: استدعاء الدالة المحلية إذا كانت موجودة في ملف آخر
    if (typeof getJournalEntryForDirectEdit === 'function' && 
        getJournalEntryForDirectEdit !== arguments.callee) {
      return getJournalEntryForDirectEdit(entryId, fiscalYear);
    }
    
    return { success: false, message: 'دالة جلب القيد غير متاحة' };
    
  } catch (e) {
    console.error('❌ getJournalEntryForDirectEdit (client) error:', e);
    return {
      success: false,
      message: 'خطأ: ' + e.toString(),
      error: e.toString()
    };
  }
}
