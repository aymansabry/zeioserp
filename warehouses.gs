/**
 * Warehouses.gs – ZEIOS ERP SYSTEM (LIBRARY VERSION)
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


// ========== 📦 ثوابت المستودعات ==========
var WAREHOUSE_TABLE = "Warehouses";
var WAREHOUSE_HEADERS = ["id", "store_code", "store_name", "created_at"];
var WAREHOUSE_COL = { ID: 0, CODE: 1, NAME: 2, CREATED_AT: 3 };

// ========== 📦 دوال جلب المستودعات ==========
function getWarehousesList() {
  try {
    var tableId = typeof getMasterTableId === 'function' ? getMasterTableId(WAREHOUSE_TABLE) : null;
    if (!tableId) return [];
    var sheet = SpreadsheetApp.openById(tableId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    if (data.length <= 1) return [];
    var result = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var safe = [];
      for (var j = 0; j < row.length; j++) {
        safe.push((row[j] || '').toString().trim());
      }
      if (safe[1] !== '') {
        result.push({ id: safe[0], store_code: safe[1], store_name: safe[2], created_at: safe[3] });
      }
    }
    return result;
  } catch (e) { console.error("❌ getWarehousesList error:", e); return []; }
}

function getWarehouseById(id) {
  try {
    if (!id) return null;
    var items = getWarehousesList();
    for (var i = 0; i < items.length; i++) {
      if (String(items[i].id).trim() === String(id).trim()) return items[i];
    }
    return null;
  } catch (e) { console.error("❌ getWarehouseById error:", e); return null; }
}

function getWarehouseByCode(code) {
  try {
    if (!code) return null;
    var items = getWarehousesList();
    for (var i = 0; i < items.length; i++) {
      if (String(items[i].store_code).trim() === String(code).trim()) return items[i];
    }
    return null;
  } catch (e) { console.error("❌ getWarehouseByCode error:", e); return null; }
}

function searchWarehouses(query, filters) {
  try {
    var results = getWarehousesList();
    if (query && query.trim() !== '') {
      var q = query.toLowerCase();
      var filtered = [];
      for (var i = 0; i < results.length; i++) {
        var wh = results[i];
        if (wh.store_code.toLowerCase().indexOf(q) !== -1 || wh.store_name.toLowerCase().indexOf(q) !== -1) {
          filtered.push(wh);
        }
      }
      results = filtered;
    }
    return { success: true, data: results, count: results.length };
  } catch (e) { console.error("❌ searchWarehouses error:", e); return { success: false, message: e.toString(), data: [] }; }
}

// ========== 🔄 توليد كود المستودع ==========
function generateWarehouseCode(warehouseName) {
  try {
    var initials = '';
    if (warehouseName && warehouseName.trim() !== '') {
      var words = warehouseName.trim().split(' ');
      for (var i = 0; i < Math.min(3, words.length); i++) {
        var ch = words[i].charAt(0);
        if (ch.match(/[A-Za-z]/)) initials += ch.toUpperCase();
      }
    }
    var prefix = initials || 'WH';
    var existing = [];
    var whs = getWarehousesList();
    for (var i = 0; i < whs.length; i++) {
      var w = whs[i];
      if (w.store_code.indexOf(prefix) === 0) {
        var numStr = w.store_code.replace(prefix, '').replace(/[^0-9]/g, '');
        var num = parseInt(numStr);
        existing.push(isNaN(num) ? 0 : num);
      }
    }
    var maxNum = 0;
    for (var j = 0; j < existing.length; j++) {
      if (existing[j] > maxNum) maxNum = existing[j];
    }
    var nextNum = (maxNum + 1).toString().padStart(2, '0');
    return prefix + '-' + nextNum;
  } catch (e) {
    console.error("❌ generateWarehouseCode error:", e);
    return 'WH-' + Math.floor(Math.random() * 100).toString().padStart(2, '0');
  }
}

// ========== 💾 حفظ المستودعات ==========
function saveWarehouse(formData) {
  try {
    var tableId = typeof getMasterTableId === 'function' ? getMasterTableId(WAREHOUSE_TABLE) : null;
    if (!tableId) throw new Error("لم يتم العثور على جدول المستودعات.");
    
    var sheet = SpreadsheetApp.openById(tableId).getSheets()[0];
    var now = typeof getNowTimestamp === 'function' ? getNowTimestamp() : generateTimestamp();
    
    var storeCode = '';
    if (formData.store_code && formData.store_code.toString().trim() !== '') {
      storeCode = formData.store_code.toString().trim().toUpperCase();
    } else {
      storeCode = generateWarehouseCode(formData.store_name);
    }
    
    var storeName = (formData.store_name || '').toString().trim();
    
    if (!storeName) throw new Error("⚠️ اسم المستودع مطلوب");
    if (!/^[A-Z0-9\-_]+$/.test(storeCode)) throw new Error("⚠️ كود المستودع يجب أن يحتوي على أحرف كبيرة وأرقام وشرطات فقط");
    
    var id = formData.id || (typeof generateID === 'function' ? generateID() : generateUniqueId());
    var newRow = [id, storeCode, storeName, now];

    if (formData.id && formData.id.toString().trim() !== '') {
      var originalCode = '';
      if (formData.original_code) originalCode = formData.original_code.toString().trim().toUpperCase();
      var data = sheet.getDataRange().getDisplayValues();
      var rowIndex = -1;
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][0]).trim() === String(formData.id).trim()) { rowIndex = i + 1; break; }
      }
      if (rowIndex === -1) throw new Error("لم يتم العثور على المستودع للتحديث.");
      
      if (storeCode !== originalCode) {
        var exists = false;
        for (var j = 1; j < data.length; j++) {
          if (String(data[j][1]).trim().toUpperCase() === storeCode && String(data[j][0]).trim() !== String(formData.id).trim()) {
            exists = true; break;
          }
        }
        if (exists) throw new Error("⚠️ كود المستودع هذا مستخدم مسبقاً");
      }
      sheet.getRange(rowIndex, 1, 1, newRow.length).setValues([newRow]);
    } else {
      var data2 = sheet.getDataRange().getDisplayValues();
      var exists2 = false;
      for (var k = 1; k < data2.length; k++) {
        if (String(data2[k][1]).trim().toUpperCase() === storeCode) { exists2 = true; break; }
      }
      if (exists2) throw new Error("⚠️ كود المستودع هذا مستخدم مسبقاً");
      sheet.appendRow(newRow);
    }
    return { success: true, message: "تم حفظ المستودع بنجاح.", data: { id: id, store_code: storeCode, store_name: storeName } };
  } catch (e) {
    console.error("❌ saveWarehouse error:", e);
    return { success: false, message: e.toString() };
  }
}

// ========== 🗑️ حذف المستودعات ==========
function deleteWarehouse(id) {
  try {
    if (!id) throw new Error("معرف المستودع مطلوب للحذف.");
    var tableId = typeof getMasterTableId === 'function' ? getMasterTableId(WAREHOUSE_TABLE) : null;
    if (!tableId) throw new Error("لم يتم العثور على الجدول.");
    var sheet = SpreadsheetApp.openById(tableId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    var searchCode = String(id).trim();
    for (var i = data.length - 1; i >= 1; i--) {
      if (String(data[i][0]).trim() === searchCode) {
        sheet.deleteRow(i + 1);
        return { success: true, message: "تم حذف المستودع بنجاح." };
      }
    }
    return { success: false, message: "لم يتم العثور على المستودع." };
  } catch (e) {
    console.error("❌ deleteWarehouse error:", e);
    return { success: false, message: e.toString() };
  }
}

// ========== ✅ التحقق من البيانات ==========
function validateWarehouseData(formData) {
  var errors = [];
  if (!formData.store_code || formData.store_code.trim() === '') errors.push("⚠️ كود المستودع مطلوب");
  if (!formData.store_name || formData.store_name.trim() === '') errors.push("⚠️ اسم المستودع مطلوب");
  if (formData.store_code) {
    var code = formData.store_code.trim().toUpperCase();
    if (!/^[A-Z0-9\-_]+$/.test(code)) errors.push("⚠️ كود المستودع يجب أن يحتوي على أحرف كبيرة وأرقام وشرطات فقط");
  }
  if (formData.store_code) {
    var whs = getWarehousesList();
    var checkCode = formData.store_code.trim().toUpperCase();
    var checkId = formData.id ? formData.id.toString().trim() : null;
    for (var i = 0; i < whs.length; i++) {
      if (whs[i].store_code === checkCode && whs[i].id !== checkId) {
        errors.push("⚠️ كود المستودع هذا مستخدم مسبقاً");
        break;
      }
    }
  }
  return { valid: errors.length === 0, errors: errors };
}

// ========== 🔍 دوال مساعدة ==========
function getSuggestedWarehouseCode(warehouseName) {
  var name = warehouseName || '';
  return generateWarehouseCode(name);
}

function getWarehousesForSelect() {
  try {
    var result = [];
    var whs = getWarehousesList();
    for (var i = 0; i < whs.length; i++) {
      var w = whs[i];
      result.push({ value: w.id, code: w.store_code, label: w.store_code + ' - ' + w.store_name, name: w.store_name });
    }
    return result;
  } catch (e) { console.error("❌ getWarehousesForSelect error:", e); return []; }
}

// ========== 📤 تصدير المستودعات ==========
function exportWarehousesToCSV() {
  try {
    var warehouses = getWarehousesList();
    if (warehouses.length === 0) return { success: false, message: "لا توجد مستودعات للتصدير" };
    var headers = ["id", "store_code", "store_name", "created_at"];
    var csv = headers.join(",") + "\n";
    for (var i = 0; i < warehouses.length; i++) {
      var wh = warehouses[i];
      var row = [wh.id, wh.store_code, '"' + (wh.store_name || '').replace(/"/g, '""') + '"', wh.created_at];
      csv += row.join(",") + "\n";
    }
    var filename = "Warehouses_" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd") + ".csv";
    return { success: true, message: "تم تجهيز الملف للتصدير", csv: csv, filename: filename };
  } catch (e) { console.error("❌ exportWarehousesToCSV error:", e); return { success: false, message: e.toString() }; }
}

// ========== 📥 استيراد المستودعات ==========
function importWarehousesFromCSV(csvData, skipExisting) {
  var skip = (skipExisting === undefined) ? true : skipExisting;
  try {
    if (!csvData) throw new Error("بيانات CSV مطلوبة");
    var lines = csvData.trim().split('\n');
    var cleaned = [];
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i].trim();
      if (l !== '') cleaned.push(l);
    }
    if (cleaned.length < 2) throw new Error("ملف CSV فارغ أو غير صالح");
    var dataLines = [];
    for (var j = 1; j < cleaned.length; j++) dataLines.push(cleaned[j]);
    
    var results = { success: 0, skipped: 0, failed: 0, errors: [] };
    var tableId = typeof getMasterTableId === 'function' ? getMasterTableId(WAREHOUSE_TABLE) : null;
    if (!tableId) throw new Error("لم يتم العثور على جدول المستودعات.");
    var sheet = SpreadsheetApp.openById(tableId).getSheets()[0];
    
    var existingCodes = {};
    var whs = getWarehousesList();
    for (var k = 0; k < whs.length; k++) existingCodes[whs[k].store_code] = true;
    
    var now = typeof getNowTimestamp === 'function' ? getNowTimestamp() : generateTimestamp();
    
    for (var m = 0; m < dataLines.length; m++) {
      try {
        var fields = dataLines[m].split(',');
        var cleanedFields = [];
        for (var n = 0; n < fields.length; n++) {
          cleanedFields.push(fields[n].trim().replace(/^"|"$/g, ''));
        }
        if (cleanedFields.length < 2) continue;
        var code = cleanedFields[0].toUpperCase();
        var name = cleanedFields[1];
        if (!code || !name) continue;
        if (skip && existingCodes[code]) { results.skipped++; continue; }
        var newId = typeof generateID === 'function' ? generateID() : generateUniqueId();
        sheet.appendRow([newId, code, name, now]);
        existingCodes[code] = true;
        results.success++;
      } catch (e) {
        results.failed++;
        results.errors.push("السطر " + (m + 2) + ": " + e.message);
      }
    }
    return { success: true, message: "تم الاستيراد: " + results.success + " ناجح، " + results.skipped + " مُتخطى، " + results.failed + " فاشل", results: results };
  } catch (e) {
    console.error("❌ importWarehousesFromCSV error:", e);
    return { success: false, message: e.toString() };
  }
}

// ========== 🔧 دوال مساعدة (بدون بادئة _) ==========
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
    console.log('ZEIOS ERP - Warehouses data');
    console.log('Keys:', allKeys.length);
    return { success: true, count: allKeys.length, keys: allKeys };
  } catch (e) { console.error('Error:', e); return { success: false, error: e.toString() }; }
}

function getLibraryVersion() { return LIBRARY_VERSION; }

/**
 * Warehouses_client.gs – ZEIOS ERP SYSTEM (SHEET VERSION)
 * دوال بنفس أسماء المكتبة عشان الكود يشتغل من غير تعديل
 * 
 * ⚠️ قبل التشغيل: أضف المكتبة من Extensions → Libraries
 */

// ========== 🔗 ربط المكتبة ==========
var ZEIOS = ZEIOS; // غيّر للاسم اللي أنت سميته


// ========== 📦 ثوابت ==========
var WAREHOUSE_TABLE = ZEIOS.WAREHOUSE_TABLE;
var WAREHOUSE_HEADERS = ZEIOS.WAREHOUSE_HEADERS;
var WAREHOUSE_COL = ZEIOS.WAREHOUSE_COL;

// ========== 📦 دوال المستودعات ==========
function getWarehousesList() { try { return ZEIOS.getWarehousesList(); } catch (e) { return []; } }
function getWarehouseById(id) { try { return ZEIOS.getWarehouseById(id); } catch (e) { return null; } }
function getWarehouseByCode(code) { try { return ZEIOS.getWarehouseByCode(code); } catch (e) { return null; } }
function searchWarehouses(query, filters) { try { return ZEIOS.searchWarehouses(query, filters); } catch (e) { return {success:false,message:e.toString(),data:[]}; } }

// ========== 🔄 توليد الكود ==========
function generateWarehouseCode(warehouseName) { try { return ZEIOS.generateWarehouseCode(warehouseName); } catch (e) { return 'WH-' + Math.floor(Math.random() * 100).toString().padStart(2, '0'); } }

// ========== 💾 حفظ/حذف ==========
function saveWarehouse(formData) { try { return ZEIOS.saveWarehouse(formData); } catch (e) { return {success:false,message:'❌ '+e.toString()}; } }
function deleteWarehouse(id) { try { return ZEIOS.deleteWarehouse(id); } catch (e) { return {success:false,message:'❌ '+e.toString()}; } }

// ========== ✅ التحقق ==========
function validateWarehouseData(formData) { try { return ZEIOS.validateWarehouseData(formData); } catch (e) { return {valid:false,errors:[e.toString()]}; } }

// ========== 🔍 مساعدة ==========
function getSuggestedWarehouseCode(warehouseName) { try { return ZEIOS.getSuggestedWarehouseCode(warehouseName); } catch (e) { return ''; } }
function getWarehousesForSelect() { try { return ZEIOS.getWarehousesForSelect(); } catch (e) { return []; } }

// ========== 📤 تصدير/استيراد ==========
function exportWarehousesToCSV() { try { return ZEIOS.exportWarehousesToCSV(); } catch (e) { return {success:false,message:'❌ '+e.toString()}; } }
function importWarehousesFromCSV(csvData, skipExisting) { try { return ZEIOS.importWarehousesFromCSV(csvData, skipExisting); } catch (e) { return {success:false,message:'❌ '+e.toString()}; } }

// ========== 🔧 مساعدة ==========
function generateTimestamp() { try { return ZEIOS.generateTimestamp(); } catch (e) { return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss'); } }
function generateUniqueId() { try { return ZEIOS.generateUniqueId(); } catch (e) { return Utilities.getUuid().replace(/-/g, ''); } }
function showStoredDataInLog() { try { return ZEIOS.showStoredDataInLog(); } catch (e) { return {success:false,error:e.toString()}; } }
function getLibraryVersion() { try { return ZEIOS.getLibraryVersion(); } catch (e) { return 'غير متصل'; } }

// ========== 🎨 دوال الواجهة (في الشيت فقط - مش في المكتبة) ==========
function isSpreadsheetContext() {
  try { SpreadsheetApp.getUi(); return true; }
  catch (e) { return false; }
}

function openWarehousesPage() {
  try {
    var pageName = 'warehouses';
    var title = '🏢 إدارة المستودعات - ZEIOS ERP';
    if (isSpreadsheetContext()) {
      var html = HtmlService.createHtmlOutputFromFile(pageName)
        .setTitle(title).setWidth(900).setHeight(650)
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      SpreadsheetApp.getUi().showModalDialog(html, title);
      return { success: true, mode: "spreadsheet" };
    }
    var baseUrl = ScriptApp.getService() ? ScriptApp.getService().getUrl() : null;
    if (baseUrl) return { success: true, mode: "webapp", url: baseUrl + "?page=" + pageName };
    return { success: false, message: "لا يمكن تحديد بيئة التشغيل" };
  } catch (e) { console.error("❌ openWarehousesPage error:", e); return { success: false, message: e.toString() }; }
}

function openWarehouseForm(warehouseId) {
  var id = warehouseId || null;
  try {
    var pageName = 'warehouses';
    var title = id ? '✏️ تعديل مستودع - ZEIOS ERP' : '➕ إضافة مستودع جديد - ZEIOS ERP';
    if (isSpreadsheetContext()) {
      var html = HtmlService.createHtmlOutputFromFile(pageName)
        .setTitle(title).setWidth(600).setHeight(450)
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      SpreadsheetApp.getUi().showModalDialog(html, title);
      return { success: true, mode: "spreadsheet" };
    }
    var baseUrl = ScriptApp.getService() ? ScriptApp.getService().getUrl() : null;
    if (baseUrl) {
      var params = id ? '?page=warehouses&edit=' + encodeURIComponent(id) : '?page=warehouses&new=1';
      return { success: true, mode: "webapp", url: baseUrl + params };
    }
    return { success: false, message: "لا يمكن تحديد بيئة التشغيل" };
  } catch (e) { console.error("❌ openWarehouseForm error:", e); return { success: false, message: e.toString() }; }
}
