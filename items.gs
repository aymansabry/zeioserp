/**
 * Items.gs – ZEIOS ERP SYSTEM (LIBRARY VERSION)
 * الإصدار: 3.3.0
 */

// ========== 🔐 ثوابت النظام ==========
var HASH_ALGORITHM = 'SHA_256';
var SCRIPT_TZ = Session.getScriptTimeZone();
var DATE_FORMAT = 'dd-MM-yyyy HH:mm:ss';
var LIBRARY_VERSION = '3.3.0';

// ========== 📦 ثوابت أعمدة جدول الأصناف ==========
var ITEM_COL = {
  ID: 0, CODE: 1, NAME: 2, IMAGE_ID: 3, DESCRIPTION: 4,
  CATEGORY_ID: 5, UNIT_ID: 6, SALE_PRICE: 7, COST_PRICE: 8,
  OPENING_BAL: 9, LAST_PURCHASE: 10, CREATED_AT: 11
};

// ========== 📦 دوال جلب البيانات الأساسية ==========
function getCategoriesForItemsForLibrary() {
  try {
    console.log("🔍 getCategoriesForItemsForLibrary - Starting");
    
    var id = typeof getMasterTableId === 'function' ? getMasterTableId("Item_Categories") : null;
    console.log("📊 Categories table ID:", id);
    
    if (!id) {
      console.log("❌ No categories table ID found");
      return [];
    }
    
    var sheet = SpreadsheetApp.openById(id).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    console.log("📊 Categories raw data rows:", data.length);
    
    if (data.length <= 1) {
      console.log("❌ No categories data found");
      return [];
    }
    
    // Print header row
    console.log("📊 Categories header:", data[0]);
    
    // Return as array of arrays: [id, code, name]
    var result = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var id_val = (row[0] || '').toString().trim();
      var code = (row[1] || '').toString().trim();
      var name = (row[2] || '').toString().trim();
      
      console.log(`📊 Category row ${i}: ID=${id_val}, Code=${code}, Name=${name}`);
      
      if (id_val && id_val !== '') {
        result.push([id_val, code, name]);
      }
    }
    
    console.log("✅ Categories loaded:", result.length);
    console.log("✅ First 3 categories:", JSON.stringify(result.slice(0, 3)));
    return result;
    
  } catch (e) { 
    console.error("❌ getCategoriesForItemsForLibrary error:", e); 
    return []; 
  }
}

function getUnitsForItemsForLibrary() {
  try {
    console.log("🔍 getUnitsForItemsForLibrary - Starting");
    
    var id = typeof getMasterTableId === 'function' ? getMasterTableId("Item_Units") : null;
    console.log("📊 Units table ID:", id);
    
    if (!id) {
      console.log("❌ No units table ID found");
      return [];
    }
    
    var sheet = SpreadsheetApp.openById(id).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    console.log("📊 Units raw data rows:", data.length);
    
    if (data.length <= 1) {
      console.log("❌ No units data found");
      return [];
    }
    
    // Print header row
    console.log("📊 Units header:", data[0]);
    
    // Return as array of arrays: [id, code, name]
    var result = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var id_val = (row[0] || '').toString().trim();
      var code = (row[1] || '').toString().trim();
      var name = (row[2] || '').toString().trim();
      
      console.log(`📊 Unit row ${i}: ID=${id_val}, Code=${code}, Name=${name}`);
      
      if (id_val && id_val !== '') {
        result.push([id_val, code, name]);
      }
    }
    
    console.log("✅ Units loaded:", result.length);
    console.log("✅ First 3 units:", JSON.stringify(result.slice(0, 3)));
    return result;
    
  } catch (e) { 
    console.error("❌ getUnitsForItemsForLibrary error:", e); 
    return []; 
  }
}

function getAllItems() {
  try {
    console.log("🔍 getAllItems - Starting");
    
    var id = typeof getMasterTableId === 'function' ? getMasterTableId("Items") : null;
    console.log("📊 Items table ID:", id);
    
    if (!id) {
      console.log("❌ No items table ID found");
      return [];
    }
    
    var sheet = SpreadsheetApp.openById(id).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    console.log("📊 Items raw data rows:", data.length);
    
    if (data.length <= 1) {
      console.log("❌ No items data found");
      return [];
    }
    
    // Print header row
    console.log("📊 Items header:", data[0]);
    
    // Get lookup data
    var categories = getCategoriesForItemsForLibrary();
    var units = getUnitsForItemsForLibrary();
    
    console.log("📊 Categories lookup count:", categories.length);
    console.log("📊 Units lookup count:", units.length);
    
    // Create maps for quick lookup
    var categoryMap = {};
    for (var i = 0; i < categories.length; i++) {
      categoryMap[categories[i][0]] = {
        code: categories[i][1],
        name: categories[i][2]
      };
    }
    
    var unitMap = {};
    for (var i = 0; i < units.length; i++) {
      unitMap[units[i][0]] = {
        code: units[i][1],
        name: units[i][2]
      };
    }
    
    console.log("📊 Category map keys:", Object.keys(categoryMap));
    console.log("📊 Unit map keys:", Object.keys(unitMap));
    
    var items = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var id_val = (row[0] || '').toString().trim();
      
      if (!id_val) continue;
      
      var categoryId = (row[5] || '').toString().trim();
      var unitId = (row[6] || '').toString().trim();
      
      console.log(`📊 Item ${i}: ID=${id_val}, CategoryID=${categoryId}, UnitID=${unitId}`);
      
      var categoryInfo = categoryMap[categoryId] || { code: '', name: '' };
      var unitInfo = unitMap[unitId] || { code: '', name: '' };
      
      var item = {
        id: id_val,
        item_code: (row[1] || '').toString().trim(),
        item_name: (row[2] || '').toString().trim(),
        image_file_id: (row[3] || '').toString().trim(),
        description: (row[4] || '').toString().trim(),
        category_id: categoryId,
        category_code: categoryInfo.code,
        category_name: categoryInfo.name,
        unit_id: unitId,
        unit_code: unitInfo.code,
        unit_name: unitInfo.name,
        sale_price: (row[7] || '0').toString().trim(),
        cost_price: (row[8] || '0').toString().trim(),
        opening_balance: (row[9] || '0').toString().trim(),
        last_purchase_price: (row[10] || '0').toString().trim(),
        created_at: (row[11] || '').toString().trim()
      };
      
      console.log(`📊 Item ${i} processed:`, JSON.stringify(item));
      items.push(item);
    }
    
    console.log("✅ Items loaded:", items.length);
    if (items.length > 0) {
      console.log("✅ First item:", JSON.stringify(items[0]));
    }
    return items;
    
  } catch (e) { 
    console.error("❌ getAllItems error:", e); 
    return []; 
  }
}

function getItemById(itemId) {
  try {
    var items = getAllItems();
    for (var i = 0; i < items.length; i++) {
      if (String(items[i].id) === String(itemId)) return items[i];
    }
    return null;
  } catch (e) { console.error("❌ getItemById error:", e); return null; }
}

function getItemByCode(itemCode) {
  try {
    var items = getAllItems();
    for (var i = 0; i < items.length; i++) {
      if (String(items[i].item_code) === String(itemCode)) return items[i];
    }
    return null;
  } catch (e) { console.error("❌ getItemByCode error:", e); return null; }
}

// ========== 🔄 توليد كود الصنف التلقائي ==========
function generateItemCode(categoryId) {
  try {
    var prefix = 'ITM';
    if (categoryId && categoryId.trim() !== '') {
      var categories = getCategoriesForItemsForLibrary();
      for (var i = 0; i < categories.length; i++) {
        if (categories[i][0] === categoryId) {
          var categoryCode = categories[i][1];
          prefix = categoryCode.length <= 3 ? categoryCode.toUpperCase() : categoryCode.substring(0, 3).toUpperCase();
          break;
        }
      }
    }
    var year = new Date().getFullYear().toString().slice(-2);
    var itemsId = typeof getMasterTableId === 'function' ? getMasterTableId("Items") : null;
    var lastSeq = 0;
    
    if (itemsId) {
      var sheet = SpreadsheetApp.openById(itemsId).getSheets()[0];
      var data = sheet.getDataRange().getDisplayValues();
      for (var i = 1; i < data.length; i++) {
        var code = (data[i][1] || '').toString().trim();
        if (code.indexOf(prefix + '-' + year + '-') === 0) {
          var parts = code.split('-');
          if (parts.length === 3) {
            var num = parseInt(parts[2]);
            if (!isNaN(num) && num > lastSeq) { lastSeq = num; }
          }
        }
      }
    }
    var seq = (lastSeq + 1).toString().padStart(4, '0');
    return prefix + '-' + year + '-' + seq;
  } catch (e) {
    console.error("❌ generateItemCode error:", e);
    return 'ITM-' + new Date().getFullYear().toString().slice(-2) + '-0001';
  }
}

// ========== 🏢 المستودع الافتراضي ==========
function getDefaultWarehouseId() {
  try {
    var whId = typeof getMasterTableId === 'function' ? getMasterTableId("Warehouses") : null;
    if (!whId) return null;
    var sheet = SpreadsheetApp.openById(whId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    if (data.length <= 1) {
      var now = typeof getNowTimestamp === 'function' ? getNowTimestamp() : getLibraryNowTimestamp();
      var newId = typeof generateID === 'function' ? generateID() : getLibraryGeneratedId();
      var defaultWh = [newId, "WH001", "المستودع الرئيسي", now];
      sheet.appendRow(defaultWh);
      return newId;
    }
    return (data[1][0] || '').toString().trim();
  } catch (e) { console.error("❌ getDefaultWarehouseId error:", e); return null; }
}

// ========== 💾 حفظ الأصناف ==========
function saveItem(formData) {
  try {
    console.log("🔍 saveItem - Starting with formData:", JSON.stringify(formData));
    
    var itemsId = typeof getMasterTableId === 'function' ? getMasterTableId("Items") : null;
    if (!itemsId) throw new Error("❌ جدول الأصناف غير موجود");
    
    var sheet = SpreadsheetApp.openById(itemsId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    var now = typeof getNowTimestamp === 'function' ? getNowTimestamp() : getLibraryNowTimestamp();
    var today = typeof getTodayDate === 'function' ? getTodayDate() : new Date().toISOString().split('T')[0];
    
    var itemName = (formData.item_name || '').trim();
    var categoryId = (formData.category_id || '').trim();
    var unitId = (formData.unit_id || '').trim();
    
    console.log("📊 Processing:", {itemName, categoryId, unitId});
    
    if (!itemName) throw new Error("❌ اسم الصنف مطلوب");
    if (!categoryId) throw new Error("❌ التصنيف مطلوب");
    if (!unitId) throw new Error("❌ الوحدة مطلوبة");
    
    var itemCode = formData.item_code || generateItemCode(categoryId);
    var existingItem = getItemByCode(itemCode);
    if (existingItem && (!formData.id || String(existingItem.id) !== String(formData.id))) {
      var randomSuffix = Math.floor(Math.random() * 100).toString().padStart(2, '0');
      itemCode = itemCode + randomSuffix;
    }
    
    var existingImageId = '';
    if (formData.id) {
      for (var i = 1; i < data.length; i++) {
        if (String((data[i][0] || '').toString().trim()) === String(formData.id)) {
          existingImageId = (data[i][3] || '').toString().trim();
          break;
        }
      }
    }
    
    var imageFileId = (formData.image_file_id || '').trim() || existingImageId;
    var salePrice = parseFloat(formData.sale_price) || 0;
    var costPrice = parseFloat(formData.cost_price) || 0;
    var openingBalance = parseFloat(formData.opening_balance) || 0;
    var lastPurchasePrice = parseFloat(formData.last_purchase_price) || 0;
    var description = (formData.description || '').trim();
    
    var id = formData.id || (typeof generateID === 'function' ? generateID() : getLibraryGeneratedId());
    var newRow = [id, itemCode, itemName, imageFileId, description, categoryId, unitId,
      salePrice.toString(), costPrice.toString(), openingBalance.toString(),
      lastPurchasePrice.toString(), now];
    
    console.log("📊 Saving row:", newRow);
    
    if (formData.id) {
      var found = false;
      for (var j = 1; j < data.length; j++) {
        if (String((data[j][0] || '').toString().trim()) === String(formData.id)) {
          sheet.getRange(j + 1, 1, 1, newRow.length).setValues([newRow]);
          found = true; break;
        }
      }
      if (!found) throw new Error("❌ الصنف غير موجود للتعديل");
    } else {
      sheet.appendRow(newRow);
    }
    
    var year = typeof getSys === 'function' ? getSys("ACTIVE_FISCAL_YEAR") : new Date().getFullYear().toString();
    var warehouseId = getDefaultWarehouseId();
    
    if (openingBalance > 0 && warehouseId && year) {
      var movementsId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Stock_Movements", year) : null;
      if (movementsId) {
        var movSheet = SpreadsheetApp.openById(movementsId).getSheets()[0];
        var movData = movSheet.getDataRange().getDisplayValues();
        var exists = false;
        if (formData.id) {
          for (var k = 1; k < movData.length; k++) {
            if (String(movData[k][1] || '') === String(id) && String(movData[k][8] || '') === 'OPENING_BALANCE') {
              exists = true; break;
            }
          }
        }
        if (!exists) {
          var movementRow = [typeof generateID === 'function' ? generateID() : getLibraryGeneratedId(),
            id, warehouseId, year, today, openingBalance.toString(), '0', '',
            'OPENING_BALANCE', id, openingBalance.toString(), costPrice.toString(), now, 'رصيد افتتاحي'];
          movSheet.appendRow(movementRow);
          if (typeof updateStockBalance === 'function') {
            updateStockBalance(id, warehouseId, '', openingBalance, year);
          }
        }
      }
    }
    
    console.log("✅ Item saved successfully");
    return { success: true, message: formData.id ? "✅ تم تحديث الصنف بنجاح" : "✅ تم إضافة الصنف بنجاح", item_code: itemCode, id: id };
  } catch (e) { 
    console.error("❌ saveItem error:", e); 
    return { success: false, message: e.toString() }; 
  }
}

// ========== 🗑️ حذف الأصناف ==========
function deleteItem(itemId) {
  try {
    var itemsId = typeof getMasterTableId === 'function' ? getMasterTableId("Items") : null;
    if (!itemsId) throw new Error("❌ جدول الأصناف غير موجود");
    var sheet = SpreadsheetApp.openById(itemsId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    for (var i = 1; i < data.length; i++) {
      if (String((data[i][0] || '').toString().trim()) === String(itemId)) {
        sheet.deleteRow(i + 1);
        return { success: true, message: "✅ تم حذف الصنف" };
      }
    }
    return { success: false, message: "❌ الصنف غير موجود" };
  } catch (e) { console.error("❌ deleteItem error:", e); return { success: false, message: e.toString() }; }
}

// ========== 🖼️ رفع الصور ==========
function uploadItemImage(base64Data, fileName, mimeType) {
  try {
    var folders = typeof loadJSON === 'function' ? loadJSON('FOLDERS', {}) : {};
    var imagesFolderId = folders.images;
    
    if (!imagesFolderId) {
      var file = DriveApp.getFileById(SpreadsheetApp.getActive().getId());
      var parentFolder = file.getParents().hasNext() ? file.getParents().next() : DriveApp.getRootFolder();
      var assetsFolder = parentFolder.getFoldersByName('Assets').hasNext() ? parentFolder.getFoldersByName('Assets').next() : parentFolder.createFolder('Assets');
      var imagesFolder = assetsFolder.getFoldersByName('Item_Images').hasNext() ? assetsFolder.getFoldersByName('Item_Images').next() : assetsFolder.createFolder('Item_Images');
      imagesFolderId = imagesFolder.getId();
      if (typeof saveJSON === 'function') {
        var currentFolders = loadJSON('FOLDERS', {});
        currentFolders.images = imagesFolderId;
        saveJSON('FOLDERS', currentFolders);
      }
    }
    
    var folder = DriveApp.getFolderById(imagesFolderId);
    var bytes = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(bytes, mimeType, fileName);
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return { success: true, fileId: file.getId(), fileUrl: 'https://drive.google.com/uc?export=view&id=' + file.getId() };
  } catch (e) { console.error("❌ uploadItemImage error:", e); return { success: false, message: "فشل رفع الصورة: " + e.toString() }; }
}

// ========== 🔍 البحث ==========
function searchItems(query) {
  try {
    var items = getAllItems();
    if (!query || query.trim() === '') return items.slice(0, 50);
    var searchTerm = query.toLowerCase().trim();
    return items.filter(function(item) {
      return item.item_code.toLowerCase().indexOf(searchTerm) !== -1 ||
             item.item_name.toLowerCase().indexOf(searchTerm) !== -1 ||
             item.category_name.toLowerCase().indexOf(searchTerm) !== -1;
    }).slice(0, 50);
  } catch (e) { console.error("❌ searchItems error:", e); return []; }
}

// ========== 📊 الأصناف مع الأرصدة ==========
function getItemsWithBalances(warehouseId, fiscalYear) {
  try {
    var year = fiscalYear || (typeof getSys === 'function' ? getSys("ACTIVE_FISCAL_YEAR") : new Date().getFullYear().toString());
    if (!year || !warehouseId) return [];
    var items = getAllItems();
    var balanceId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Inventory_Balance", year) : null;
    if (!balanceId) { return items.map(function(item) { item.current_balance = 0; return item; }); }
    var balanceSheet = SpreadsheetApp.openById(balanceId).getSheets()[0];
    var balanceData = balanceSheet.getDataRange().getDisplayValues();
    var balanceMap = {};
    for (var i = 1; i < balanceData.length; i++) {
      var itemId = (balanceData[i][1] || '').toString().trim();
      var whId = (balanceData[i][3] || '').toString().trim();
      var colorId = (balanceData[i][2] || '').toString().trim();
      var balance = parseFloat(balanceData[i][4] || '0');
      if (whId === warehouseId && itemId && !colorId) { balanceMap[itemId] = balance; }
    }
    return items.map(function(item) { item.current_balance = balanceMap[item.id] || 0; return item; });
  } catch (e) { console.error("❌ getItemsWithBalances error:", e); return []; }
}

// ========== ✅ التحقق من التكرار ==========
function checkDuplicateItemCode(itemCode, excludeId) {
  try {
    var items = getAllItems();
    for (var i = 0; i < items.length; i++) {
      if (items[i].item_code === itemCode && (!excludeId || String(items[i].id) !== String(excludeId))) { return true; }
    }
    return false;
  } catch (e) { console.error("❌ checkDuplicateItemCode error:", e); return false; }
}

// ========== 🔧 دوال مساعدة عامة ==========
function getLibraryGeneratedId() { 
  return Utilities.getUuid().replace(/-/g, ''); 
}

function getLibraryNowTimestamp() { 
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss'); 
}

function showStoredDataInLog() {
  try {
    var props = getDocProperties();
    var allKeys = props.getKeys();
    console.log('ZEIOS ERP - Items data');
    console.log('Keys:', allKeys.length);
    return { success: true, count: allKeys.length, keys: allKeys };
  } catch (e) { 
    console.error('Error:', e); 
    return { success: false, error: e.toString() }; 
  }
}

function getLibraryVersion() { 
  return LIBRARY_VERSION; 
}

/**
 * Items_client.gs – ZEIOS ERP SYSTEM (SHEET VERSION)
 */

// ========== 🔗 ربط المكتبة ==========
var ZEIOS = ZEIOS;

// ========== 📦 ثوابت الأعمدة ==========
var ITEM_COL;
try {
  ITEM_COL = ZEIOS.ITEM_COL || {
    ID: 0, CODE: 1, NAME: 2, IMAGE_ID: 3, DESCRIPTION: 4,
    CATEGORY_ID: 5, UNIT_ID: 6, SALE_PRICE: 7, COST_PRICE: 8,
    OPENING_BAL: 9, LAST_PURCHASE: 10, CREATED_AT: 11
  };
} catch (e) {
  ITEM_COL = {
    ID: 0, CODE: 1, NAME: 2, IMAGE_ID: 3, DESCRIPTION: 4,
    CATEGORY_ID: 5, UNIT_ID: 6, SALE_PRICE: 7, COST_PRICE: 8,
    OPENING_BAL: 9, LAST_PURCHASE: 10, CREATED_AT: 11
  };
}

// ========== 📦 دوال البيانات الأساسية ==========
function getCategoriesForItems() { 
  try { 
    console.log("🔍 getCategoriesForItems called");
    var result = typeof ZEIOS.getCategoriesForItemsForLibrary === 'function' 
      ? ZEIOS.getCategoriesForItemsForLibrary() 
      : [];
    console.log("📊 getCategoriesForItems result:", JSON.stringify(result));
    return result;
  } catch (e) { 
    console.error('❌ getCategoriesForItems error:', e);
    return []; 
  } 
}

function getUnitsForItems() { 
  try { 
    console.log("🔍 getUnitsForItems called");
    var result = typeof ZEIOS.getUnitsForItemsForLibrary === 'function' 
      ? ZEIOS.getUnitsForItemsForLibrary() 
      : [];
    console.log("📊 getUnitsForItems result:", JSON.stringify(result));
    return result;
  } catch (e) { 
    console.error('❌ getUnitsForItems error:', e);
    return []; 
  } 
}

function getAllItems() { 
  try { 
    console.log("🔍 getAllItems called");
    var result = ZEIOS.getAllItems();
    console.log("📊 getAllItems result count:", result.length);
    if (result.length > 0) {
      console.log("📊 First item:", JSON.stringify(result[0]));
    }
    return result; 
  } catch (e) { 
    console.error('❌ getAllItems error:', e);
    return []; 
  } 
}

function getItemById(itemId) { 
  try { 
    return ZEIOS.getItemById(itemId); 
  } catch (e) { 
    console.error('❌ getItemById error:', e);
    return null; 
  } 
}

function getItemByCode(itemCode) { 
  try { 
    return ZEIOS.getItemByCode(itemCode); 
  } catch (e) { 
    console.error('❌ getItemByCode error:', e);
    return null; 
  } 
}

// ========== 🔄 توليد الكود ==========
function generateItemCode(categoryId) { 
  try { 
    return ZEIOS.generateItemCode(categoryId); 
  } catch (e) { 
    console.error('❌ generateItemCode error:', e);
    return 'ITM-' + new Date().getFullYear().toString().slice(-2) + '-0001'; 
  } 
}

// ========== 🏢 المستودع ==========
function getDefaultWarehouseId() { 
  try { 
    return ZEIOS.getDefaultWarehouseId(); 
  } catch (e) { 
    console.error('❌ getDefaultWarehouseId error:', e);
    return null; 
  } 
}

// ========== 💾 حفظ/حذف ==========
function saveItem(formData) { 
  try { 
    console.log("🔍 saveItem called with:", JSON.stringify(formData));
    return ZEIOS.saveItem(formData); 
  } catch (e) { 
    console.error('❌ saveItem error:', e);
    return {success: false, message: '❌ ' + e.toString()}; 
  } 
}

function deleteItem(itemId) { 
  try { 
    return ZEIOS.deleteItem(itemId); 
  } catch (e) { 
    console.error('❌ deleteItem error:', e);
    return {success: false, message: '❌ ' + e.toString()}; 
  } 
}

// ========== 🖼️ الصور ==========
function uploadItemImage(base64Data, fileName, mimeType) { 
  try { 
    return ZEIOS.uploadItemImage(base64Data, fileName, mimeType); 
  } catch (e) { 
    console.error('❌ uploadItemImage error:', e);
    return {success: false, message: '❌ ' + e.toString()}; 
  } 
}

// ========== 🔍 البحث ==========
function searchItems(query) { 
  try { 
    return ZEIOS.searchItems(query); 
  } catch (e) { 
    console.error('❌ searchItems error:', e);
    return []; 
  } 
}

// ========== 📊 الأرصدة ==========
function getItemsWithBalances(warehouseId, fiscalYear) { 
  try { 
    return ZEIOS.getItemsWithBalances(warehouseId, fiscalYear); 
  } catch (e) { 
    console.error('❌ getItemsWithBalances error:', e);
    return []; 
  } 
}

// ========== ✅ التحقق ==========
function checkDuplicateItemCode(itemCode, excludeId) { 
  try { 
    return ZEIOS.checkDuplicateItemCode(itemCode, excludeId); 
  } catch (e) { 
    console.error('❌ checkDuplicateItemCode error:', e);
    return false; 
  } 
}

// ========== 🔧 دوال مساعدة ==========
function getLibraryGeneratedId() { 
  try { 
    return ZEIOS.getLibraryGeneratedId ? ZEIOS.getLibraryGeneratedId() : Utilities.getUuid().replace(/-/g, ''); 
  } catch (e) { 
    return Utilities.getUuid().replace(/-/g, ''); 
  } 
}

function getLibraryNowTimestamp() { 
  try { 
    return ZEIOS.getLibraryNowTimestamp ? ZEIOS.getLibraryNowTimestamp() : Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss'); 
  } catch (e) { 
    return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss'); 
  } 
}

function showStoredDataInLog() { 
  try { 
    return ZEIOS.showStoredDataInLog(); 
  } catch (e) { 
    return {success: false, error: e.toString()}; 
  } 
}

function getLibraryVersion() { 
  try { 
    return ZEIOS.getLibraryVersion(); 
  } catch (e) { 
    return 'غير متصل'; 
  } 
}

// ========== 🎨 دوال الواجهة للـ HTML ==========
function getCategoriesForSelect() {
  try {
    console.log("🔍 getCategoriesForSelect called");
    var categories = getCategoriesForItems();
    console.log("📊 Categories for select:", JSON.stringify(categories));
    return categories;
  } catch (e) {
    console.error('❌ getCategoriesForSelect error:', e);
    return [];
  }
}

function getUnitsForSelect() {
  try {
    console.log("🔍 getUnitsForSelect called");
    var units = getUnitsForItems();
    console.log("📊 Units for select:", JSON.stringify(units));
    return units;
  } catch (e) {
    console.error('❌ getUnitsForSelect error:', e);
    return [];
  }
}

function openItemForm(itemId) {
  try {
    var pageName = 'items';
    var title = itemId ? '✏️ تعديل صنف - ZEIOS' : '➕ إضافة صنف جديد - ZEIOS';
    
    var inSpreadsheet = false;
    try {
      SpreadsheetApp.getUi();
      inSpreadsheet = true;
    } catch (e) {
      inSpreadsheet = false;
    }
    
    if (inSpreadsheet) {
      var html = HtmlService.createHtmlOutputFromFile(pageName)
        .setTitle(title)
        .setWidth(1000)
        .setHeight(700)
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      
      if (itemId) {
        html = html.setContent(
          html.getContent().replace('</head>', 
            '<script>window.EDIT_ITEM_ID = "' + itemId + '";</script></head>')
        );
      }
      
      SpreadsheetApp.getUi().showModalDialog(html, title);
      return { success: true, mode: "spreadsheet" };
    }
    
    var baseUrl = ScriptApp.getService() ? ScriptApp.getService().getUrl() : null;
    if (baseUrl) {
      var params = itemId ? '?page=items&edit=' + itemId : '?page=items&new=1';
      return { success: true, mode: "webapp", url: baseUrl + params };
    }
    
    return { success: false, message: "لا يمكن تحديد بيئة التشغيل" };
    
  } catch (e) { 
    console.error("❌ openItemForm error:", e); 
    return { success: false, message: e.toString() }; 
  }
}

// ========== 🔍 دالة فحص اتصال المكتبة ==========
function checkItemsLibraryConnection() {
  try {
    if (typeof ZEIOS === 'undefined') {
      return { connected: false, message: '❌ المكتبة غير مربوطة. تأكد من إضافة المكتبة من Extensions > Libraries' };
    }
    var version = typeof ZEIOS.getLibraryVersion === 'function' ? ZEIOS.getLibraryVersion() : 'غير معروف';
    return { connected: true, message: '✅ المكتبة مربوطة بنجاح', version: version };
  } catch (e) {
    return { connected: false, message: '❌ خطأ في الاتصال بالمكتبة: ' + e.toString() };
  }
}

// ========== 🔧 دالة اختبار ==========
function testCategoriesAndUnits() {
  console.log('========== TESTING CATEGORIES & UNITS ==========');
  
  var categories = getCategoriesForItems();
  console.log('Categories count:', categories.length);
  console.log('Categories sample:', JSON.stringify(categories.slice(0, 3)));
  
  var units = getUnitsForItems();
  console.log('Units count:', units.length);
  console.log('Units sample:', JSON.stringify(units.slice(0, 3)));
  
  var items = getAllItems();
  console.log('Items count:', items.length);
  if (items.length > 0) {
    console.log('First item:', JSON.stringify(items[0]));
  }
  
  return {
    categoriesCount: categories.length,
    unitsCount: units.length,
    itemsCount: items.length,
    categories: categories,
    units: units,
    items: items.slice(0, 5)
  };
}
