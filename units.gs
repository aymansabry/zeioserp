/**
 * Units_Library.gs – ZEIOS ERP SYSTEM (LIBRARY VERSION)
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

// ========== 📦 ثوابت الوحدات (محدثة لتطابق الجدول الفعلي) ==========
var UNIT_TABLE = "Item_Units";
var UNIT_HEADERS = ["id", "unit_code", "unit_name", "created_at"];
var UNIT_COL = { ID: 0, CODE: 1, NAME: 2, CREATED_AT: 3 };

// ========== 📦 دوال جلب الوحدات ==========
function getUnitsListForUnits() {
  try {
    var tableId = typeof getMasterTableId === 'function' ? getMasterTableId(UNIT_TABLE) : null;
    if (!tableId) return [];
    
    var sheet = SpreadsheetApp.openById(tableId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    
    if (data.length <= 1) return [];
    
    // ✅ خريطة الأعمدة الصحيحة حسب الهيكل الفعلي: [id, code, name, created_at]
    var result = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var safe = [];
      for (var j = 0; j < row.length; j++) {
        safe.push((row[j] || '').toString().trim());
      }
      if (safe[UNIT_COL.CODE] !== '') {
        result.push({ 
          id: safe[UNIT_COL.ID],                    // ✅ id من العمود 0
          unit_code: safe[UNIT_COL.CODE],           // ✅ code من العمود 1
          unit_name: safe[UNIT_COL.NAME],           // ✅ name من العمود 2
          created_at: safe[UNIT_COL.CREATED_AT]     // ✅ created_at من العمود 3
        });
      }
    }
    return result;
  } catch (e) { console.error("❌ getUnitsListForUnits error:", e); return []; }
}

function getUnitByCodeForUnits(code) {
  try {
    if (!code) return null;
    var items = getUnitsListForUnits();
    for (var i = 0; i < items.length; i++) {
      if (String(items[i].unit_code).trim() === String(code).trim()) return items[i];
    }
    return null;
  } catch (e) { console.error("❌ getUnitByCodeForUnits error:", e); return null; }
}

function getUnitByIdForUnits(code) { return getUnitByCodeForUnits(code); }

function searchUnitsForUnits(query, filters) {
  try {
    var results = getUnitsListForUnits();
    if (query && query.trim() !== '') {
      var q = query.toLowerCase();
      var filtered = [];
      for (var i = 0; i < results.length; i++) {
        var unit = results[i];
        if (unit.unit_code.toLowerCase().indexOf(q) !== -1 || unit.unit_name.toLowerCase().indexOf(q) !== -1) {
          filtered.push(unit);
        }
      }
      results = filtered;
    }
    return { success: true,  results, count: results.length };
  } catch (e) { console.error("❌ searchUnitsForUnits error:", e); return { success: false, message: e.toString(), data: [] }; }
}

// ========== 🔄 توليد كود الوحدة ==========
function generateUnitCodeForUnits(unitName) {
  try {
    var initials = '';
    if (unitName && unitName.trim() !== '') {
      var words = unitName.trim().split(' ');
      for (var i = 0; i < Math.min(3, words.length); i++) {
        var ch = words[i].charAt(0);
        if (ch.match(/[A-Za-z]/)) initials += ch.toUpperCase();
      }
    }
    var prefix = initials || 'UNIT';
    var existing = [];
    var units = getUnitsListForUnits();
    for (var i = 0; i < units.length; i++) {
      var u = units[i];
      if (u.unit_code.indexOf(prefix) === 0) {
        var numStr = u.unit_code.replace(prefix, '').replace(/[^0-9]/g, '');
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
    console.error("❌ generateUnitCodeForUnits error:", e);
    return 'UNIT-' + Math.floor(Math.random() * 100).toString().padStart(2, '0');
  }
}

// ========== 💾 حفظ الوحدات (مُصحح) ==========
// ========== 💾 حفظ الوحدات (مُصحح نهائياً) ==========
function saveUnitForUnits(formData) {
  try {
    var tableId = typeof getMasterTableId === 'function' ? getMasterTableId(UNIT_TABLE) : null;
    if (!tableId) throw new Error("لم يتم العثور على جدول وحدات القياس.");
    
    var sheet = SpreadsheetApp.openById(tableId).getSheets()[0];
    var now = typeof getNowTimestamp === 'function' ? getNowTimestamp() : getNowTimestampForUnits();
    
    var unitCode = '';
    if (formData.unit_code && formData.unit_code.toString().trim() !== '') {
      unitCode = formData.unit_code.toString().trim().toUpperCase();
    } else {
      unitCode = generateUnitCodeForUnits(formData.unit_name);
    }
    
    var unitName = (formData.unit_name || '').toString().trim();
    
    if (!unitName) throw new Error("⚠️ اسم الوحدة مطلوب");
    if (!/^[A-Z0-9\-_]+$/.test(unitCode)) throw new Error("⚠️ كود الوحدة يجب أن يحتوي على أحرف كبيرة وأرقام وشرطات فقط");
    
    // ✅ توليد معرف فريد للعمود الأول (id)
    var newId = typeof generateID === 'function' ? generateID() : generateUniqueIdForUnits();
    
    // ✅ الصف الجديد يطابق الهيكل الفعلي: [id, unit_code, unit_name, created_at]
    var newRow = [newId, unitCode, unitName, now];

    if (formData.id && formData.id.toString().trim() !== '') {
      // ✅ حالة التعديل
      var originalCode = formData.original_code ? formData.original_code.toString().trim().toUpperCase() : '';
      var data = sheet.getDataRange().getDisplayValues();
      var rowIndex = -1;
      var originalId = '';
      
      // ✅ البحث باستخدام العمود الصحيح (العمود 0 = id)
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][UNIT_COL.ID]).trim() === String(formData.id).trim()) { 
          rowIndex = i + 1; 
          originalId = data[i][UNIT_COL.ID]; // ✅ حفظ الـ id الأصلي
          break; 
        }
      }
      
      if (rowIndex === -1) throw new Error("لم يتم العثور على الوحدة للتحديث.");
      
      // ✅ عند تغيير الكود: نتحقق من عدم التكرار (مع استبعاد السجل الحالي)
      if (unitCode !== originalCode && originalCode !== '') {
        var exists = false;
        for (var j = 1; j < data.length; j++) {
          var currentCode = String(data[j][UNIT_COL.CODE]).trim().toUpperCase();
          var currentId = String(data[j][UNIT_COL.ID]).trim();
          
          // ✅ استبعاد السجل الحالي من الفحص
          if (currentCode === unitCode && currentId !== originalId) { 
            exists = true; 
            break; 
          }
        }
        if (exists) throw new Error("⚠️ كود الوحدة هذا مستخدم مسبقاً");
      }
      
      // ✅ نحتفظ بالـ id الأصلي عند التحديث
      newRow[UNIT_COL.ID] = originalId;
      sheet.getRange(rowIndex, 1, 1, newRow.length).setValues([newRow]);
      
    } else {
      // ✅ حالة الإضافة الجديدة: نتحقق من عدم تكرار الكود
      var data2 = sheet.getDataRange().getDisplayValues();
      var exists2 = false;
      for (var k = 1; k < data2.length; k++) {
        if (String(data2[k][UNIT_COL.CODE]).trim().toUpperCase() === unitCode) { 
          exists2 = true; 
          break; 
        }
      }
      if (exists2) throw new Error("⚠️ كود الوحدة هذا مستخدم مسبقاً");
      sheet.appendRow(newRow);
    }
    
    // ✅ تم الإصلاح: إزالة المسافة الزائدة قبل ':'
    return { 
      success: true, 
      message: "تم حفظ الوحدة بنجاح.", 
      data: { id: newRow[UNIT_COL.ID], unit_code: unitCode, unit_name: unitName } 
    };
    
  } catch (e) {
    console.error("❌ saveUnitForUnits error:", e);
    return { success: false, message: e.toString() };
  }
}
// ========== 🗑️ حذف الوحدات ==========
function deleteUnitForUnits(code) {
  try {
    if (!code) throw new Error("كود الوحدة مطلوب للحذف.");
    var tableId = typeof getMasterTableId === 'function' ? getMasterTableId(UNIT_TABLE) : null;
    if (!tableId) throw new Error("لم يتم العثور على الجدول.");
    
    var sheet = SpreadsheetApp.openById(tableId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    var searchCode = String(code).trim().toUpperCase();
    
    // ✅ البحث باستخدام العمود الصحيح (العمود 1 = unit_code)
    for (var i = data.length - 1; i >= 1; i--) {
      if (String(data[i][UNIT_COL.CODE]).trim().toUpperCase() === searchCode) {
        sheet.deleteRow(i + 1);
        return { success: true, message: "تم حذف الوحدة بنجاح." };
      }
    }
    return { success: false, message: "لم يتم العثور على الوحدة." };
  } catch (e) {
    console.error("❌ deleteUnitForUnits error:", e);
    return { success: false, message: e.toString() };
  }
}

// ========== ✅ التحقق من البيانات ==========
function validateUnitDataForUnits(formData) {
  var errors = [];
  if (!formData.unit_code || formData.unit_code.trim() === '') errors.push("⚠️ كود الوحدة مطلوب");
  if (!formData.unit_name || formData.unit_name.trim() === '') errors.push("⚠️ اسم الوحدة مطلوب");
  
  if (formData.unit_code) {
    var code = formData.unit_code.trim().toUpperCase();
    if (!/^[A-Z0-9\-_]+$/.test(code)) errors.push("⚠️ كود الوحدة يجب أن يحتوي على أحرف كبيرة وأرقام وشرطات فقط");
  }
  
  if (formData.unit_code) {
    var units = getUnitsListForUnits();
    var checkCode = formData.unit_code.trim().toUpperCase();
    var origCode = formData.original_code ? formData.original_code.toString().trim().toUpperCase() : null;
    for (var i = 0; i < units.length; i++) {
      if (units[i].unit_code === checkCode && units[i].unit_code !== origCode) {
        errors.push("⚠️ كود الوحدة هذا مستخدم مسبقاً");
        break;
      }
    }
  }
  return { valid: errors.length === 0, errors: errors };
}

// ========== 🔍 دوال مساعدة ==========
function getSuggestedUnitCodeForUnits(unitName) {
  var name = unitName || '';
  return generateUnitCodeForUnits(name);
}

function getUnitsForSelectForUnits() {
  try {
    var result = [];
    var units = getUnitsListForUnits();
    for (var i = 0; i < units.length; i++) {
      var u = units[i];
      result.push({ 
        value: u.unit_code, 
        label: u.unit_code + ' - ' + u.unit_name, 
        name: u.unit_name,
        id: u.id
      });
    }
    return result;
  } catch (e) { console.error("❌ getUnitsForSelectForUnits error:", e); return []; }
}

// ========== 📤 تصدير الوحدات ==========
function exportUnitsToCSVForUnits() {
  try {
    var units = getUnitsListForUnits();
    if (units.length === 0) return { success: false, message: "لا توجد وحدات للتصدير" };
    
    var headers = ["id", "unit_code", "unit_name", "created_at"];
    var csv = headers.join(",") + "\n";
    
    for (var i = 0; i < units.length; i++) {
      var unit = units[i];
      var row = [
        unit.id || '', 
        unit.unit_code, 
        '"' + (unit.unit_name || '').replace(/"/g, '""') + '"', 
        unit.created_at
      ];
      csv += row.join(",") + "\n";
    }
    
    var filename = "ItemUnits_" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd") + ".csv";
    return { success: true, message: "تم تجهيز الملف للتصدير", csv: csv, filename: filename };
  } catch (e) { console.error("❌ exportUnitsToCSVForUnits error:", e); return { success: false, message: e.toString() }; }
}

// ========== 📥 استيراد الوحدات ==========
function importUnitsFromCSVForUnits(csvData, skipExisting) {
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
    
    var tableId = typeof getMasterTableId === 'function' ? getMasterTableId(UNIT_TABLE) : null;
    if (!tableId) throw new Error("لم يتم العثور على جدول وحدات القياس.");
    
    var sheet = SpreadsheetApp.openById(tableId).getSheets()[0];
    
    var existingCodes = {};
    var units = getUnitsListForUnits();
    for (var k = 0; k < units.length; k++) existingCodes[units[k].unit_code] = true;
    
    var now = typeof getNowTimestamp === 'function' ? getNowTimestamp() : getNowTimestampForUnits();
    
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
        
        // ✅ نولد id جديد ونحفظ جميع الأعمدة الأربعة
        var newId = typeof generateID === 'function' ? generateID() : generateUniqueIdForUnits();
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
    console.error("❌ importUnitsFromCSVForUnits error:", e);
    return { success: false, message: e.toString() };
  }
}

// ========== 🔧 دوال مساعدة ==========
function getNowTimestampForUnits() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
}

function generateUniqueIdForUnits() {
  return Utilities.getUuid().replace(/-/g, '');
}

function showStoredDataInLogForUnits() {
  try {
    var props = typeof getDocProperties === 'function' ? getDocProperties() : PropertiesService.getDocumentProperties();
    var allKeys = props.getKeys();
    console.log('ZEIOS ERP - Units data');
    console.log('Keys:', allKeys.length);
    return { success: true, count: allKeys.length, keys: allKeys };
  } catch (e) { console.error('Error:', e); return { success: false, error: e.toString() }; }
}

function getLibraryVersionForUnits() { return LIBRARY_VERSION; }

/**
 * Units_Client.gs – ZEIOS ERP Units (SHEET VERSION)
 * دوال بنفس أسماء المكتبة عشان الكود يشتغل من غير تعديل
 * 
 * ⚠️ قبل التشغيل: أضف المكتبة من Extensions → Libraries
 */

// ========== 🔗 ربط المكتبة ==========
var ZEIOS = ZEIOS; // غيّر للاسم اللي أنت سميته
// ========== 📦 دوال الوحدات ==========
function getUnitsList() { try { return ZEIOS.getUnitsListForUnits(); } catch (e) { return []; } }
function getUnitByCode(code) { try { return ZEIOS.getUnitByCodeForUnits(code); } catch (e) { return null; } }
function getUnitById(code) { try { return ZEIOS.getUnitByIdForUnits(code); } catch (e) { return null; } }
function searchUnits(query, filters) { try { return ZEIOS.searchUnitsForUnits(query, filters); } catch (e) { return {success:false,message:e.toString(),data:[]}; } }
function generateUnitCode(unitName) { try { return ZEIOS.generateUnitCodeForUnits(unitName); } catch (e) { return 'UNIT-01'; } }
function saveUnit(formData) { try { return ZEIOS.saveUnitForUnits(formData); } catch (e) { return {success:false,message:e.toString()}; } }
function deleteUnit(code) { try { return ZEIOS.deleteUnitForUnits(code); } catch (e) { return {success:false,message:e.toString()}; } }
function validateUnitData(formData) { try { return ZEIOS.validateUnitDataForUnits(formData); } catch (e) { return {valid:false,errors:[e.toString()]}; } }
function getSuggestedUnitCode(unitName) { try { return ZEIOS.getSuggestedUnitCodeForUnits(unitName); } catch (e) { return ''; } }
function getUnitsForSelect() { try { return ZEIOS.getUnitsForSelectForUnits(); } catch (e) { return []; } }
function exportUnitsToCSV() { try { return ZEIOS.exportUnitsToCSVForUnits(); } catch (e) { return {success:false,message:e.toString()}; } }
function importUnitsFromCSV(csvData, skipExisting) { try { return ZEIOS.importUnitsFromCSVForUnits(csvData, skipExisting); } catch (e) { return {success:false,message:e.toString()}; } }

// ========== 🔧 مساعدة ==========
function getNowTimestampForUnits() { try { return ZEIOS.getNowTimestampForUnits(); } catch (e) { return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss'); } }
function generateUniqueIdForUnits() { try { return ZEIOS.generateUniqueIdForUnits(); } catch (e) { return Utilities.getUuid().replace(/-/g, ''); } }
function showStoredDataInLogForUnits() { try { return ZEIOS.showStoredDataInLogForUnits(); } catch (e) { return {success:false,error:e.toString()}; } }
function getLibraryVersionForUnits() { try { return ZEIOS.getLibraryVersionForUnits(); } catch (e) { return 'غير متصل'; } }
