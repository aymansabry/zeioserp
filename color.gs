/**
 * Colors_Library.gs – ZEIOS ERP SYSTEM (LIBRARY VERSION)
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

// ========== 📦 ثوابت الألوان (محدثة لتطابق الجدول الفعلي) ==========
var COLOR_TABLE = "Colors";
var COLOR_HEADERS = ["id", "color_code", "color_name", "created_at"];
var COLOR_COL = { ID: 0, CODE: 1, NAME: 2, CREATED_AT: 3 };
var PROTECTED_COLORS = ["RED", "BLUE", "GREEN", "YELLOW", "BLACK", "WHITE", "BROWN", "GRAY", "ORANGE", "PURPLE"];

// ========== 📦 دوال جلب الألوان ==========
function getColorsListForColors() {
  try {
    var tableId = typeof getMasterTableId === 'function' ? getMasterTableId(COLOR_TABLE) : null;
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
      if (safe[COLOR_COL.CODE] !== '') {
        result.push({ 
          id: safe[COLOR_COL.ID],                      // ✅ id من العمود 0
          color_code: safe[COLOR_COL.CODE],            // ✅ code من العمود 1
          color_name: safe[COLOR_COL.NAME],            // ✅ name من العمود 2
          created_at: safe[COLOR_COL.CREATED_AT]       // ✅ created_at من العمود 3
        });
      }
    }
    return result;
  } catch (e) { console.error("❌ getColorsListForColors error:", e); return []; }
}

function getColorByCodeForColors(code) {
  try {
    if (!code) return null;
    var items = getColorsListForColors();
    var upperCode = String(code).trim().toUpperCase();
    for (var i = 0; i < items.length; i++) {
      if (String(items[i].color_code).trim().toUpperCase() === upperCode) return items[i];
    }
    return null;
  } catch (e) { console.error("❌ getColorByCodeForColors error:", e); return null; }
}

function getColorByIdForColors(code) { return getColorByCodeForColors(code); }

function searchColorsForColors(query, filters) {
  try {
    var results = getColorsListForColors();
    if (query && query.trim() !== '') {
      var q = query.toLowerCase();
      var filtered = [];
      for (var i = 0; i < results.length; i++) {
        var color = results[i];
        if (color.color_code.toLowerCase().indexOf(q) !== -1 || color.color_name.toLowerCase().indexOf(q) !== -1) {
          filtered.push(color);
        }
      }
      results = filtered;
    }
    if (filters && filters.colorCode) {
      var fc = filters.colorCode.toLowerCase();
      var filtered2 = [];
      for (var j = 0; j < results.length; j++) {
        if (results[j].color_code.toLowerCase().indexOf(fc) !== -1) filtered2.push(results[j]);
      }
      results = filtered2;
    }
    if (filters && filters.colorName) {
      var fn = filters.colorName.toLowerCase();
      var filtered3 = [];
      for (var k = 0; k < results.length; k++) {
        if (results[k].color_name.toLowerCase().indexOf(fn) !== -1) filtered3.push(results[k]);
      }
      results = filtered3;
    }
    // ✅ تم الإصلاح: إضافة مفتاح "data:" قبل النتائج
    return { success: true,  results, count: results.length };
  } catch (e) { console.error("❌ searchColorsForColors error:", e); return { success: false, message: e.toString(), data: [] }; }
}

// ========== 🔄 توليد كود اللون ==========
function generateColorCodeForColors(colorName) {
  try {
    var initials = '';
    if (colorName && colorName.trim() !== '') {
      var words = colorName.trim().split(' ');
      for (var i = 0; i < Math.min(3, words.length); i++) {
        var ch = words[i].charAt(0);
        if (ch.match(/[A-Za-z]/)) initials += ch.toUpperCase();
      }
    }
    var prefix = initials || 'COL';
    var existing = [];
    var colors = getColorsListForColors();
    for (var i = 0; i < colors.length; i++) {
      var c = colors[i];
      if (c.color_code.indexOf(prefix) === 0) {
        var numStr = c.color_code.replace(prefix, '').replace(/[^0-9]/g, '');
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
    console.error("❌ generateColorCodeForColors error:", e);
    return 'COL-' + Math.floor(Math.random() * 100).toString().padStart(2, '0');
  }
}

// ========== 💾 حفظ الألوان (مُصحح) ==========
function saveColorForColors(formData) {
  try {
    var tableId = typeof getMasterTableId === 'function' ? getMasterTableId(COLOR_TABLE) : null;
    if (!tableId) throw new Error("لم يتم العثور على جدول الألوان.");
    
    var sheet = SpreadsheetApp.openById(tableId).getSheets()[0];
    var now = typeof getNowTimestamp === 'function' ? getNowTimestamp() : getNowTimestampForColors();
    
    var colorCode = '';
    if (formData.color_code && formData.color_code.toString().trim() !== '') {
      colorCode = formData.color_code.toString().trim().toUpperCase();
    } else {
      colorCode = generateColorCodeForColors(formData.color_name);
    }
    
    var colorName = (formData.color_name || '').toString().trim();
    
    if (!colorCode) colorCode = generateColorCodeForColors(colorName);
    if (!colorName) throw new Error("⚠️ اسم اللون مطلوب");
    if (!/^[A-Z0-9\-_]+$/.test(colorCode)) throw new Error("⚠️ كود اللون يجب أن يحتوي على أحرف كبيرة وأرقام وشرطات فقط");
    
    // ✅ توليد معرف فريد للعمود الأول (id)
    var newId = typeof generateID === 'function' ? generateID() : generateUniqueIdForColors();
    
    // ✅ الصف الجديد يطابق الهيكل الفعلي: [id, color_code, color_name, created_at]
    var newRow = [newId, colorCode, colorName, now];

    if (formData.original_code && formData.original_code.toString().trim() !== '') {
      var originalCode = formData.original_code.toString().trim().toUpperCase();
      var data = sheet.getDataRange().getDisplayValues();
      var rowIndex = -1;
      var originalId = '';
      
      // ✅ البحث باستخدام العمود الصحيح (العمود 1 = color_code)
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][COLOR_COL.CODE]).trim().toUpperCase() === originalCode) { 
          rowIndex = i + 1; 
          originalId = data[i][COLOR_COL.ID]; // ✅ حفظ الـ id الأصلي
          break; 
        }
      }
      
      if (rowIndex === -1) throw new Error("لم يتم العثور على اللون للتحديث.");
      
      // ✅ عند تغيير الكود: نتحقق من عدم التكرار (مع استبعاد السجل الحالي)
      if (colorCode !== originalCode && originalCode !== '') {
        var isProtected = false;
        for (var p = 0; p < PROTECTED_COLORS.length; p++) {
          if (PROTECTED_COLORS[p] === colorCode) { isProtected = true; break; }
        }
        var wasProtected = false;
        for (var q = 0; q < PROTECTED_COLORS.length; q++) {
          if (PROTECTED_COLORS[q] === originalCode) { wasProtected = true; break; }
        }
        if (isProtected && !wasProtected) throw new Error("⚠️ لا يمكن استخدام الكود \"" + colorCode + "\" لأنه محمي في النظام");
        
        var exists = false;
        for (var j = 1; j < data.length; j++) {
          var currentCode = String(data[j][COLOR_COL.CODE]).trim().toUpperCase();
          var currentId = String(data[j][COLOR_COL.ID]).trim();
          
          // ✅ استبعاد السجل الحالي من الفحص
          if (currentCode === colorCode && currentId !== originalId) { 
            exists = true; 
            break; 
          }
        }
        if (exists) throw new Error("⚠️ كود اللون هذا مستخدم مسبقاً");
      }
      
      // ✅ نحتفظ بالـ id الأصلي عند التحديث
      newRow[COLOR_COL.ID] = originalId;
      sheet.getRange(rowIndex, 1, 1, newRow.length).setValues([newRow]);
      
    } else {
      // ✅ عند الإضافة: نتحقق من عدم تكرار الكود
      var data2 = sheet.getDataRange().getDisplayValues();
      var exists2 = false;
      for (var k = 1; k < data2.length; k++) {
        if (String(data2[k][COLOR_COL.CODE]).trim().toUpperCase() === colorCode) { 
          exists2 = true; 
          break; 
        }
      }
      if (exists2) throw new Error("⚠️ كود اللون هذا مستخدم مسبقاً");
      sheet.appendRow(newRow);
    }
    
    // ✅ تم الإصلاح: إضافة مفتاح "data:" قبل الكائن
    return { 
      success: true, 
      message: "تم حفظ اللون بنجاح.", data:
       { id: newRow[COLOR_COL.ID], color_code: colorCode, color_name: colorName } 
    };
    
  } catch (e) {
    console.error("❌ saveColorForColors error:", e);
    return { success: false, message: e.toString() };
  }
}

// ========== 🗑️ حذف الألوان ==========
function deleteColorForColors(code) {
  try {
    if (!code) throw new Error("كود اللون مطلوب للحذف.");
    var tableId = typeof getMasterTableId === 'function' ? getMasterTableId(COLOR_TABLE) : null;
    if (!tableId) throw new Error("لم يتم العثور على الجدول.");
    
    var sheet = SpreadsheetApp.openById(tableId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    var searchCode = String(code).trim().toUpperCase();
    
    // ✅ البحث باستخدام العمود الصحيح (العمود 1 = color_code)
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][COLOR_COL.CODE]).trim().toUpperCase() === searchCode) {
        var isProtected = false;
        for (var p = 0; p < PROTECTED_COLORS.length; p++) {
          if (PROTECTED_COLORS[p] === searchCode) { isProtected = true; break; }
        }
        if (isProtected) throw new Error("⚠️ لا يمكن حذف اللون \"" + searchCode + "\" لأنه مطلوب في النظام. يمكنك تعديله فقط.");
        sheet.deleteRow(i + 1);
        return { success: true, message: "تم حذف اللون بنجاح." };
      }
    }
    return { success: false, message: "لم يتم العثور على اللون." };
  } catch (e) {
    console.error("❌ deleteColorForColors error:", e);
    return { success: false, message: e.toString() };
  }
}

// ========== ✅ التحقق من البيانات ==========
function validateColorDataForColors(formData) {
  var errors = [];
  if (!formData.color_code || formData.color_code.trim() === '') errors.push("⚠️ كود اللون مطلوب");
  if (!formData.color_name || formData.color_name.trim() === '') errors.push("⚠️ اسم اللون مطلوب");
  
  if (formData.color_code) {
    var code = formData.color_code.trim().toUpperCase();
    if (!/^[A-Z0-9\-_]+$/.test(code)) errors.push("⚠️ كود اللون يجب أن يحتوي على أحرف كبيرة وأرقام وشرطات فقط");
  }
  
  if (formData.color_code) {
    var colors = getColorsListForColors();
    var checkCode = formData.color_code.trim().toUpperCase();
    var origCode = formData.original_code ? formData.original_code.toString().trim().toUpperCase() : null;
    for (var i = 0; i < colors.length; i++) {
      if (colors[i].color_code === checkCode && colors[i].color_code !== origCode) {
        errors.push("⚠️ كود اللون هذا مستخدم مسبقاً");
        break;
      }
    }
  }
  return { valid: errors.length === 0, errors: errors };
}

// ========== 🔍 دوال مساعدة ==========
function getSuggestedColorCodeForColors(colorName) {
  var name = colorName || '';
  return generateColorCodeForColors(name);
}

function getColorsForSelectForColors() {
  try {
    var result = [];
    var colors = getColorsListForColors();
    for (var i = 0; i < colors.length; i++) {
      var c = colors[i];
      result.push({ 
        value: c.color_code, 
        label: c.color_code + ' - ' + c.color_name, 
        name: c.color_name,
        id: c.id
      });
    }
    return result;
  } catch (e) { console.error("❌ getColorsForSelectForColors error:", e); return []; }
}

function getColorDisplayInfoForColors(colorCode) {
  try {
    var color = getColorByCodeForColors(colorCode);
    if (!color) return null;
    var isProtected = false;
    for (var p = 0; p < PROTECTED_COLORS.length; p++) {
      if (PROTECTED_COLORS[p] === color.color_code.toUpperCase()) { isProtected = true; break; }
    }
    return { 
      code: color.color_code, 
      name: color.color_name, 
      display: color.color_code + ' - ' + color.color_name, 
      isProtected: isProtected,
      id: color.id
    };
  } catch (e) { console.error("❌ getColorDisplayInfoForColors error:", e); return null; }
}

// ========== 📤 تصدير الألوان ==========
function exportColorsToCSVForColors() {
  try {
    var colors = getColorsListForColors();
    if (colors.length === 0) return { success: false, message: "لا توجد ألوان للتصدير" };
    
    var headers = ["id", "color_code", "color_name", "created_at"];
    var csv = headers.join(",") + "\n";
    
    for (var i = 0; i < colors.length; i++) {
      var color = colors[i];
      var row = [
        color.id || '', 
        color.color_code, 
        '"' + (color.color_name || '').replace(/"/g, '""') + '"', 
        color.created_at
      ];
      csv += row.join(",") + "\n";
    }
    
    var filename = "Colors_" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd") + ".csv";
    return { success: true, message: "تم تجهيز الملف للتصدير", csv: csv, filename: filename };
  } catch (e) { console.error("❌ exportColorsToCSVForColors error:", e); return { success: false, message: e.toString() }; }
}

// ========== 📥 استيراد الألوان ==========
function importColorsFromCSVForColors(csvData, skipExisting) {
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
    
    var tableId = typeof getMasterTableId === 'function' ? getMasterTableId(COLOR_TABLE) : null;
    if (!tableId) throw new Error("لم يتم العثور على جدول الألوان.");
    
    var sheet = SpreadsheetApp.openById(tableId).getSheets()[0];
    
    var existingCodes = {};
    var colors = getColorsListForColors();
    for (var k = 0; k < colors.length; k++) existingCodes[colors[k].color_code.toUpperCase()] = true;
    
    var now = typeof getNowTimestamp === 'function' ? getNowTimestamp() : getNowTimestampForColors();
    
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
        
        var isProtected = false;
        for (var p = 0; p < PROTECTED_COLORS.length; p++) {
          if (PROTECTED_COLORS[p] === code) { isProtected = true; break; }
        }
        if (isProtected && existingCodes[code]) { results.skipped++; continue; }
        
        if (skip && existingCodes[code]) { results.skipped++; continue; }
        
        // ✅ نولد id جديد ونحفظ جميع الأعمدة الأربعة
        var newId = typeof generateID === 'function' ? generateID() : generateUniqueIdForColors();
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
    console.error("❌ importColorsFromCSVForColors error:", e);
    return { success: false, message: e.toString() };
  }
}

// ========== 🔧 دوال مساعدة ==========
function getNowTimestampForColors() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
}

function generateUniqueIdForColors() {
  return Utilities.getUuid().replace(/-/g, '');
}

function showStoredDataInLogForColors() {
  try {
    var props = typeof getDocProperties === 'function' ? getDocProperties() : PropertiesService.getDocumentProperties();
    var allKeys = props.getKeys();
    console.log('ZEIOS ERP - Colors data');
    console.log('Keys:', allKeys.length);
    return { success: true, count: allKeys.length, keys: allKeys };
  } catch (e) { console.error('Error:', e); return { success: false, error: e.toString() }; }
}

function getLibraryVersionForColors() { return LIBRARY_VERSION; }


/**
 * Colors_Client.gs – ZEIOS ERP Colors (SHEET VERSION)
 * دوال بنفس أسماء المكتبة عشان الكود يشتغل من غير تعديل
 * 
 * ⚠️ قبل التشغيل: أضف المكتبة من Extensions → Libraries
 */

// ========== 🔗 ربط المكتبة ==========
var ZEIOS = ZEIOS; // غيّر للاسم اللي أنت سميته

// ========== 📦 دوال الألوان ==========
function getColorsList() { try { return ZEIOS.getColorsListForColors(); } catch (e) { return []; } }
function getColorByCode(code) { try { return ZEIOS.getColorByCodeForColors(code); } catch (e) { return null; } }
function getColorById(code) { try { return ZEIOS.getColorByIdForColors(code); } catch (e) { return null; } }
function searchColors(query, filters) { try { return ZEIOS.searchColorsForColors(query, filters); } catch (e) { return {success:false,message:e.toString(),data:[]}; } }
function generateColorCode(colorName) { try { return ZEIOS.generateColorCodeForColors(colorName); } catch (e) { return 'COL-01'; } }
function saveColor(formData) { try { return ZEIOS.saveColorForColors(formData); } catch (e) { return {success:false,message:e.toString()}; } }
function deleteColor(code) { try { return ZEIOS.deleteColorForColors(code); } catch (e) { return {success:false,message:e.toString()}; } }
function validateColorData(formData) { try { return ZEIOS.validateColorDataForColors(formData); } catch (e) { return {valid:false,errors:[e.toString()]}; } }
function getSuggestedColorCode(colorName) { try { return ZEIOS.getSuggestedColorCodeForColors(colorName); } catch (e) { return ''; } }
function getColorsForSelect() { try { return ZEIOS.getColorsForSelectForColors(); } catch (e) { return []; } }
function getColorDisplayInfo(colorCode) { try { return ZEIOS.getColorDisplayInfoForColors(colorCode); } catch (e) { return null; } }
function exportColorsToCSV() { try { return ZEIOS.exportColorsToCSVForColors(); } catch (e) { return {success:false,message:e.toString()}; } }
function importColorsFromCSV(csvData, skipExisting) { try { return ZEIOS.importColorsFromCSVForColors(csvData, skipExisting); } catch (e) { return {success:false,message:e.toString()}; } }

// ========== 🔧 مساعدة ==========
function getNowTimestampForColors() { try { return ZEIOS.getNowTimestampForColors(); } catch (e) { return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss'); } }
function generateUniqueIdForColors() { try { return ZEIOS.generateUniqueIdForColors(); } catch (e) { return Utilities.getUuid().replace(/-/g, ''); } }
function showStoredDataInLogForColors() { try { return ZEIOS.showStoredDataInLogForColors(); } catch (e) { return {success:false,error:e.toString()}; } }
function getLibraryVersionForColors() { try { return ZEIOS.getLibraryVersionForColors(); } catch (e) { return 'غير متصل'; } }
