/**
 * Category_Library.gs – ZEIOS ERP SYSTEM (LIBRARY VERSION)
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

// ========== 📦 ثوابت التصنيفات (محدثة لتطابق الجدول الفعلي) ==========
var CATEGORY_TABLE = "Item_Categories";
var CATEGORY_HEADERS = ["id", "category_code", "category_name", "created_at"];
var CATEGORY_COL = { ID: 0, CODE: 1, NAME: 2, CREATED_AT: 3 };

// ========== 📦 دوال جلب التصنيفات ==========
function getCategoriesListForCategory() {
  try {
    var tableId = typeof getMasterTableId === 'function' ? getMasterTableId(CATEGORY_TABLE) : null;
    if (!tableId) return [];
    
    var sheet = SpreadsheetApp.openById(tableId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    
    if (data.length <= 1) return [];
    
    // ✅ خريطة الأعمدة الصحيحة حسب الهيكل الفعلي: [id, code, name, created_at]
    return data.slice(1).map(function(row) {
      var safe = row.map(function(cell) { return (cell || '').toString().trim(); });
      return { 
        id: safe[0],                    // ✅ id من العمود 0
        category_code: safe[1],         // ✅ code من العمود 1
        category_name: safe[2],         // ✅ name من العمود 2
        created_at: safe[3]             // ✅ created_at من العمود 3
      };
    }).filter(function(item) { return item.category_code !== ''; });
  } catch (e) { console.error("❌ getCategoriesListForCategory error:", e); return []; }
}

function getCategoryByCodeForCategory(code) {
  try {
    if (!code) return null;
    var items = getCategoriesListForCategory();
    for (var i = 0; i < items.length; i++) {
      if (String(items[i].category_code).trim() === String(code).trim()) return items[i];
    }
    return null;
  } catch (e) { console.error("❌ getCategoryByCodeForCategory error:", e); return null; }
}

function getCategoryByIdForCategory(code) { return getCategoryByCodeForCategory(code); }

function searchCategoriesForCategory(query, filters) {
  if (filters === undefined) filters = {};
  try {
    var results = getCategoriesListForCategory();
    if (query && query.trim() !== '') {
      var q = query.toLowerCase();
      results = results.filter(function(cat) {
        return cat.category_code.toLowerCase().indexOf(q) !== -1 || cat.category_name.toLowerCase().indexOf(q) !== -1;
      });
    }
    return { success: true, data: results, count: results.length };
  } catch (e) { console.error("❌ searchCategoriesForCategory error:", e); return { success: false, message: e.toString(), data: [] }; }
}

// ========== 🔄 توليد كود التصنيف ==========
function generateCategoryCodeForCategory(categoryName) {
  try {
    var initials = '';
    if (categoryName && categoryName.trim() !== '') {
      initials = categoryName.trim().split(' ').map(function(w) { return w.charAt(0); }).slice(0, 3).join('').toUpperCase().replace(/[^A-Z]/g, '');
    }
    var prefix = initials || 'CAT';
    var existing = getCategoriesListForCategory().filter(function(c) { return c.category_code.indexOf(prefix) === 0; })
      .map(function(c) { var n = parseInt(c.category_code.replace(prefix, '').replace(/[^0-9]/g, '')); return isNaN(n) ? 0 : n; });
    var nextNum = (existing.length > 0 ? Math.max.apply(null, [0].concat(existing)) + 1 : 1).toString().padStart(2, '0');
    return prefix + '-' + nextNum;
  } catch (e) {
    console.error("❌ generateCategoryCodeForCategory error:", e);
    return 'CAT-' + Math.floor(Math.random() * 100).toString().padStart(2, '0');
  }
}

// ========== 💾 حفظ التصنيفات (مُصحح) ==========
function saveCategoryForCategory(formData) {
  try {
    var tableId = typeof getMasterTableId === 'function' ? getMasterTableId(CATEGORY_TABLE) : null;
    if (!tableId) throw new Error("لم يتم العثور على جدول التصنيفات.");
    
    var sheet = SpreadsheetApp.openById(tableId).getSheets()[0];
    var now = typeof getNowTimestamp === 'function' ? getNowTimestamp() : getNowTimestampForCategory();
    
    var categoryCode = formData.category_code ? (formData.category_code || '').toString().trim().toUpperCase() : generateCategoryCodeForCategory(formData.category_name);
    var categoryName = (formData.category_name || '').toString().trim();
    
    if (!categoryCode) categoryCode = generateCategoryCodeForCategory(categoryName);
    if (!categoryName) throw new Error("⚠️ اسم التصنيف مطلوب");
    if (!/^[A-Z0-9\-_]+$/.test(categoryCode)) throw new Error("⚠️ كود التصنيف يجب أن يحتوي على أحرف كبيرة وأرقام وشرطات فقط");
    
    // ✅ توليد معرف فريد للعمود الأول (id)
    var newId = typeof generateID === 'function' ? generateID() : generateUniqueIdForCategory();
    
    // ✅ الصف الجديد يطابق الهيكل الفعلي: [id, category_code, category_name, created_at]
    var newRow = [newId, categoryCode, categoryName, now];
    
    if (formData.original_code) {
      var originalCode = formData.original_code.toString().trim().toUpperCase();
      var data = sheet.getDataRange().getDisplayValues();
      var rowIndex = -1;
      
      // ✅ البحث باستخدام العمود الصحيح (العمود 1 = category_code)
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][CATEGORY_COL.CODE]).trim().toUpperCase() === originalCode) { 
          rowIndex = i + 1; 
          break; 
        }
      }
      
      if (rowIndex === -1) throw new Error("لم يتم العثور على التصنيف للتحديث.");
      
      // ✅ عند التعديل: نحافظ على الـ id الأصلي
      if (categoryCode !== originalCode) {
        var exists = false;
        for (var j = 1; j < data.length; j++) {
          if (String(data[j][CATEGORY_COL.CODE]).trim().toUpperCase() === categoryCode) { 
            exists = true; 
            break; 
          }
        }
        if (exists) throw new Error("⚠️ كود التصنيف هذا مستخدم مسبقاً");
      }
      
      // ✅ نحتفظ بالـ id الأصلي عند التحديث
      newRow[0] = data[rowIndex - 1][CATEGORY_COL.ID];
      sheet.getRange(rowIndex, 1, 1, newRow.length).setValues([newRow]);
    } else {
      // ✅ عند الإضافة: نتحقق من عدم تكرار الكود
      var data2 = sheet.getDataRange().getDisplayValues();
      var exists2 = false;
      for (var k = 1; k < data2.length; k++) {
        if (String(data2[k][CATEGORY_COL.CODE]).trim().toUpperCase() === categoryCode) { 
          exists2 = true; 
          break; 
        }
      }
      if (exists2) throw new Error("⚠️ كود التصنيف هذا مستخدم مسبقاً");
      sheet.appendRow(newRow);
    }
    
    return { 
      success: true, 
      message: "تم حفظ التصنيف بنجاح.", 
      data: { id: newRow[0], category_code: categoryCode, category_name: categoryName } 
    };
  } catch (e) {
    console.error("❌ saveCategoryForCategory error:", e);
    return { success: false, message: e.toString() };
  }
}

// ========== 🗑️ حذف التصنيفات ==========
function deleteCategoryForCategory(code) {
  try {
    if (!code) throw new Error("كود التصنيف مطلوب للحذف.");
    var tableId = typeof getMasterTableId === 'function' ? getMasterTableId(CATEGORY_TABLE) : null;
    if (!tableId) throw new Error("لم يتم العثور على الجدول.");
    
    var sheet = SpreadsheetApp.openById(tableId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    var searchCode = String(code).trim().toUpperCase();
    
    // ✅ البحث باستخدام العمود الصحيح (العمود 1 = category_code)
    for (var i = data.length - 1; i >= 1; i--) {
      if (String(data[i][CATEGORY_COL.CODE]).trim().toUpperCase() === searchCode) {
        sheet.deleteRow(i + 1);
        return { success: true, message: "تم حذف التصنيف بنجاح." };
      }
    }
    return { success: false, message: "لم يتم العثور على التصنيف." };
  } catch (e) {
    console.error("❌ deleteCategoryForCategory error:", e);
    return { success: false, message: e.toString() };
  }
}

// ========== ✅ التحقق من البيانات ==========
function validateCategoryDataForCategory(formData) {
  var errors = [];
  if (!formData.category_code || formData.category_code.trim() === '') errors.push("⚠️ كود التصنيف مطلوب");
  if (!formData.category_name || formData.category_name.trim() === '') errors.push("⚠️ اسم التصنيف مطلوب");
  
  if (formData.category_code) {
    var code = formData.category_code.trim().toUpperCase();
    if (!/^[A-Z0-9\-_]+$/.test(code)) errors.push("⚠️ كود التصنيف يجب أن يحتوي على أحرف كبيرة وأرقام وشرطات فقط");
  }
  
  if (formData.category_code) {
    var cats = getCategoriesListForCategory();
    for (var i = 0; i < cats.length; i++) {
      if (cats[i].category_code === formData.category_code.trim().toUpperCase() && 
          cats[i].category_code !== (formData.original_code ? formData.original_code.toString().trim().toUpperCase() : null)) {
        errors.push("⚠️ كود التصنيف هذا مستخدم مسبقاً");
        break;
      }
    }
  }
  return { valid: errors.length === 0, errors: errors };
}

// ========== 🔍 دوال مساعدة ==========
function getSuggestedCategoryCodeForCategory(categoryName) {
  if (categoryName === undefined) categoryName = '';
  return generateCategoryCodeForCategory(categoryName);
}

function getCategoriesForSelectForCategory() {
  try {
    return getCategoriesListForCategory().map(function(cat) {
      return { 
        value: cat.category_code, 
        label: cat.category_code + ' - ' + cat.category_name, 
        name: cat.category_name,
        id: cat.id
      };
    });
  } catch (e) { console.error("❌ getCategoriesForSelectForCategory error:", e); return []; }
}

// ========== 📤 تصدير التصنيفات ==========
function exportCategoriesToCSVForCategory() {
  try {
    var categories = getCategoriesListForCategory();
    if (categories.length === 0) return { success: false, message: "لا توجد تصنيفات للتصدير" };
    
    var headers = ["id", "category_code", "category_name", "created_at"];
    var csv = headers.join(",") + "\n";
    
    for (var i = 0; i < categories.length; i++) {
      var cat = categories[i];
      var row = [
        cat.id || '', 
        cat.category_code, 
        '"' + (cat.category_name || '').replace(/"/g, '""') + '"', 
        cat.created_at
      ];
      csv += row.join(",") + "\n";
    }
    
    var filename = "ItemCategories_" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd") + ".csv";
    return { success: true, message: "تم تجهيز الملف للتصدير", csv: csv, filename: filename };
  } catch (e) { console.error("❌ exportCategoriesToCSVForCategory error:", e); return { success: false, message: e.toString() }; }
}

// ========== 📥 استيراد التصنيفات ==========
function importCategoriesFromCSVForCategory(csvData, skipExisting) {
  if (skipExisting === undefined) skipExisting = true;
  try {
    if (!csvData) throw new Error("بيانات CSV مطلوبة");
    
    var lines = csvData.trim().split('\n').map(function(l) { return l.trim(); }).filter(function(l) { return l; });
    if (lines.length < 2) throw new Error("ملف CSV فارغ أو غير صالح");
    
    var dataLines = lines.slice(1);
    var results = { success: 0, skipped: 0, failed: 0, errors: [] };
    
    var tableId = typeof getMasterTableId === 'function' ? getMasterTableId(CATEGORY_TABLE) : null;
    if (!tableId) throw new Error("لم يتم العثور على جدول التصنيفات.");
    
    var sheet = SpreadsheetApp.openById(tableId).getSheets()[0];
    var existingCodes = {};
    var cats = getCategoriesListForCategory();
    for (var i = 0; i < cats.length; i++) { existingCodes[cats[i].category_code] = true; }
    
    var now = typeof getNowTimestamp === 'function' ? getNowTimestamp() : getNowTimestampForCategory();
    
    for (var j = 0; j < dataLines.length; j++) {
      try {
        var fields = dataLines[j].split(',').map(function(f) { return f.trim().replace(/^"|"$/g, ''); });
        if (fields.length < 2) continue;
        
        var code = fields[0].toUpperCase();
        var name = fields[1];
        if (!code || !name) continue;
        
        if (skipExisting && existingCodes[code]) { results.skipped++; continue; }
        
        // ✅ نولد id جديد ونحفظ جميع الأعمدة الأربعة
        var newId = typeof generateID === 'function' ? generateID() : generateUniqueIdForCategory();
        sheet.appendRow([newId, code, name, now]);
        
        existingCodes[code] = true;
        results.success++;
      } catch (e) {
        results.failed++;
        results.errors.push("السطر " + (j + 2) + ": " + e.message);
      }
    }
    
    return { success: true, message: "تم الاستيراد: " + results.success + " ناجح، " + results.skipped + " مُتخطى، " + results.failed + " فاشل", results: results };
  } catch (e) {
    console.error("❌ importCategoriesFromCSVForCategory error:", e);
    return { success: false, message: e.toString() };
  }
}

// ========== 🔧 دوال مساعدة ==========
function getNowTimestampForCategory() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
}

function generateUniqueIdForCategory() {
  return Utilities.getUuid().replace(/-/g, '');
}

function showStoredDataInLogForCategory() {
  try {
    var props = typeof getDocProperties === 'function' ? getDocProperties() : PropertiesService.getDocumentProperties();
    var allKeys = props.getKeys();
    console.log('ZEIOS ERP - Category data');
    console.log('Keys:', allKeys.length);
    return { success: true, count: allKeys.length, keys: allKeys };
  } catch (e) { console.error('Error:', e); return { success: false, error: e.toString() }; }
}

function getLibraryVersionForCategory() { return LIBRARY_VERSION; }

/**
 * Category_Client.gs – ZEIOS ERP Categories (SHEET VERSION)
 * دوال بنفس أسماء المكتبة عشان الكود يشتغل من غير تعديل
 * 
 * ⚠️ قبل التشغيل: أضف المكتبة من Extensions → Libraries
 */

// ========== 🔗 ربط المكتبة ==========
var ZEIOS = ZEIOS; // غيّر للاسم اللي أنت سميته


// ========== 📦 دوال التصنيفات ==========
function getCategoriesList() { try { return ZEIOS.getCategoriesListForCategory(); } catch (e) { return []; } }
function getCategoryByCode(code) { try { return ZEIOS.getCategoryByCodeForCategory(code); } catch (e) { return null; } }
function getCategoryById(code) { try { return ZEIOS.getCategoryByIdForCategory(code); } catch (e) { return null; } }
function searchCategories(query, filters) { try { return ZEIOS.searchCategoriesForCategory(query, filters); } catch (e) { return {success:false,message:e.toString(),data:[]}; } }
function generateCategoryCode(categoryName) { try { return ZEIOS.generateCategoryCodeForCategory(categoryName); } catch (e) { return 'CAT-01'; } }
function saveCategory(formData) { try { return ZEIOS.saveCategoryForCategory(formData); } catch (e) { return {success:false,message:e.toString()}; } }
function deleteCategory(code) { try { return ZEIOS.deleteCategoryForCategory(code); } catch (e) { return {success:false,message:e.toString()}; } }
function validateCategoryData(formData) { try { return ZEIOS.validateCategoryDataForCategory(formData); } catch (e) { return {valid:false,errors:[e.toString()]}; } }
function getSuggestedCategoryCode(categoryName) { try { return ZEIOS.getSuggestedCategoryCodeForCategory(categoryName); } catch (e) { return ''; } }
function getCategoriesForSelect() { try { return ZEIOS.getCategoriesForSelectForCategory(); } catch (e) { return []; } }
function exportCategoriesToCSV() { try { return ZEIOS.exportCategoriesToCSVForCategory(); } catch (e) { return {success:false,message:e.toString()}; } }
function importCategoriesFromCSV(csvData, skipExisting) { try { return ZEIOS.importCategoriesFromCSVForCategory(csvData, skipExisting); } catch (e) { return {success:false,message:e.toString()}; } }

// ========== 🔧 مساعدة ==========
function getNowTimestampForCategory() { try { return ZEIOS.getNowTimestampForCategory(); } catch (e) { return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss'); } }
function generateUniqueIdForCategory() { try { return ZEIOS.generateUniqueIdForCategory(); } catch (e) { return Utilities.getUuid().replace(/-/g, ''); } }
function showStoredDataInLogForCategory() { try { return ZEIOS.showStoredDataInLogForCategory(); } catch (e) { return {success:false,error:e.toString()}; } }
function getLibraryVersionForCategory() { try { return ZEIOS.getLibraryVersionForCategory(); } catch (e) { return 'غير متصل'; } }
