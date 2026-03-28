/**
 * ItemTransfer.gs – ZEIOS ERP SYSTEM (LIBRARY VERSION)
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


// ========== 🔄 ثوابت النقل ==========
var TRANSFER_REF_TYPE = 'STOCK_TRANSFER';

// ========== 📦 دوال جلب البيانات ==========
function getWarehousesForTransfers() {
  try { return typeof getWarehouses === 'function' ? getWarehouses() : []; }
  catch (e) { console.error("❌ getWarehousesForTransfers:", e); return []; }
}

function getItemsForTransfers() {
  try { return typeof getItems === 'function' ? getItems() : []; }
  catch (e) { console.error("❌ getItemsForTransfers:", e); return []; }
}

function getColorsForTransfers() {
  try { return typeof getColors === 'function' ? getColors() : []; }
  catch (e) { console.error("❌ getColorsForTransfers:", e); return []; }
}

// ========== 🔍 دوال مساعدة ==========
function getItemCodeById(itemId) {
  try {
    if (!itemId) return '';
    var items = typeof getItems === 'function' ? getItems() : [];
    for (var i = 0; i < items.length; i++) {
      if (String(items[i].id) === String(itemId)) return items[i].item_code || '';
    }
    return '';
  } catch (e) { return ''; }
}

function getItemNameById(itemId) {
  try {
    if (!itemId) return '';
    var items = typeof getItems === 'function' ? getItems() : [];
    for (var i = 0; i < items.length; i++) {
      if (String(items[i].id) === String(itemId)) return items[i].item_name || '';
    }
    return '';
  } catch (e) { return ''; }
}

function getColorNameById(colorId) {
  if (!colorId) return '';
  try {
    var colors = typeof getColors === 'function' ? getColors() : [];
    for (var i = 0; i < colors.length; i++) {
      if (String(colors[i].id) === String(colorId)) return colors[i].color_name || '';
    }
    return '';
  } catch (e) { return ''; }
}

function getWarehouseNameById(warehouseId) {
  try {
    if (!warehouseId) return 'غير معروف';
    var warehouses = typeof getWarehouses === 'function' ? getWarehouses() : [];
    for (var i = 0; i < warehouses.length; i++) {
      if (String(warehouses[i].id) === String(warehouseId)) return warehouses[i].warehouse_name || 'غير معروف';
    }
    return 'غير معروف';
  } catch (e) { return 'غير معروف'; }
}

// ========== 📦 دوال السنة المالية ==========
function getActiveFiscalYearForTransfers() {
  try {
    if (typeof getActiveFiscalYear === 'function') return getActiveFiscalYear();
    var year = typeof getSys === 'function' ? getSys("ACTIVE_FISCAL_YEAR") : null;
    if (year) return { year_code: year, is_active: true, date_from: '', date_to: '', folder_id: '' };
    return { year_code: null, is_active: false, date_from: '', date_to: '', folder_id: '' };
  } catch (e) { console.error("❌ getActiveFiscalYearForTransfers error:", e); return { year_code: null, is_active: false, date_from: '', date_to: '', folder_id: '' }; }
}

function getFiscalYearCodeForTransfers() {
  var fy = getActiveFiscalYearForTransfers();
  return fy && fy.year_code ? fy.year_code : (typeof getSys === 'function' ? getSys("ACTIVE_FISCAL_YEAR") : null);
}

// ========== 📦 جلب الأصناف مع رصيد المستودع ==========
function getItemsWithStockBalance(warehouseId) {
  try {
    console.log(`🔍 [getItemsWithStockBalance] المستودع المصدر: ${warehouseId}`);
    var year = getFiscalYearCodeForTransfers();
    if (!year || !warehouseId) { console.warn("⚠️ سنة مالية أو مستودع غير محدد"); return []; }
    
    var items = getItems();
    var colors = getColors();
    if (!items || items.length === 0) return [];
    
    var colorsMap = {};
    if (colors) {
      for (var i = 0; i < colors.length; i++) {
        colorsMap[colors[i].id] = { name: colors[i].color_name, code: colors[i].color_code };
      }
    }
    
    var result = [];
    for (var j = 0; j < items.length; j++) {
      var item = items[j];
      var itemId = item.id;
      var itemCode = item.item_code || '';
      var itemName = item.item_name || '';
      var unitCode = item.unit_code || 'قطعة';
      var costPrice = parseFloat(item.cost_price) || 0;
      
      if (!itemId) continue;
      
      var noColorBalance = typeof getCurrentStockBalance === 'function' ? getCurrentStockBalance(itemId, warehouseId, '', year) : 0;
      if (noColorBalance > 0) {
        result.push({
          id: itemId, item_code: itemCode, item_name: itemName, cost_price: costPrice,
          balance: noColorBalance, color_id: '', color_name: 'بدون لون', unit_code: unitCode,
          display_text: itemCode + ' - ' + itemName + ' (بدون لون) - الرصيد المتاح: ' + noColorBalance + ' ' + unitCode
        });
      }
      
      if (colors) {
        for (var k = 0; k < colors.length; k++) {
          var color = colors[k];
          var colorId = color.id;
          var balance = typeof getCurrentStockBalance === 'function' ? getCurrentStockBalance(itemId, warehouseId, colorId, year) : 0;
          if (balance > 0) {
            var colorInfo = colorsMap[colorId];
            result.push({
              id: itemId, item_code: itemCode, item_name: itemName, cost_price: costPrice,
              balance: balance, color_id: colorId, color_name: colorInfo ? colorInfo.name : colorId, unit_code: unitCode,
              display_text: itemCode + ' - ' + itemName + ' (' + (colorInfo ? colorInfo.name : colorId) + ') - الرصيد المتاح: ' + balance + ' ' + unitCode
            });
          }
        }
      }
    }
    console.log(`✅ تم جلب ${result.length} صنف/لون متاح للنقل من المستودع ${warehouseId}`);
    return result;
  } catch (e) { console.error("❌ getItemsWithStockBalance error:", e); return []; }
}

// ========== 📋 قائمة عمليات النقل ==========
function getTransfersList() {
  try {
    var year = getFiscalYearCodeForTransfers();
    if (!year) return [];
    var stockMovId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Stock_Movements", year) : null;
    if (!stockMovId) return [];
    
    var sheet = SpreadsheetApp.openById(stockMovId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    var warehouses = {};
    var warehousesList = getWarehousesForTransfers();
    for (var i = 0; i < warehousesList.length; i++) { warehouses[warehousesList[i].id] = warehousesList[i].warehouse_name; }
    
    var transfers = {};
    for (var j = 1; j < data.length; j++) {
      var refType = (data[j][8] || '').toString().trim();
      var refId = (data[j][9] || '').toString().trim();
      if (refType === TRANSFER_REF_TYPE && refId) {
        if (!transfers[refId]) {
          transfers[refId] = {
            id: refId, transfer_no: refId, date: data[j][4],
            from_warehouse_id: '', to_warehouse_id: '',
            from_warehouse: '', to_warehouse: '',
            items_count: 0, total_qty: 0
          };
        }
        var warehouseId = (data[j][2] || '').toString().trim();
        var qtyIn = parseFloat(data[j][5]) || 0;
        var qtyOut = parseFloat(data[j][6]) || 0;
        if (qtyOut > 0) { transfers[refId].from_warehouse_id = warehouseId; transfers[refId].from_warehouse = warehouses[warehouseId] || 'غير معروف'; transfers[refId].total_qty += qtyOut; }
        if (qtyIn > 0) { transfers[refId].to_warehouse_id = warehouseId; transfers[refId].to_warehouse = warehouses[warehouseId] || 'غير معروف'; }
        transfers[refId].items_count++;
      }
    }
    var result = [];
    for (var key in transfers) { result.push(transfers[key]); }
    return result;
  } catch (e) { console.error("❌ getTransfersList error:", e); return []; }
}

// ========== 🔍 جلب نقل بالتفصيل ==========
function getTransferById(transferNo) {
  try {
    var year = getFiscalYearCodeForTransfers();
    if (!year) return null;
    var stockMovId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Stock_Movements", year) : null;
    if (!stockMovId) return null;
    
    var sheet = SpreadsheetApp.openById(stockMovId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    var transfer = null;
    var lines = [];
    var processedKeys = {};
    
    for (var i = 1; i < data.length; i++) {
      var refType = (data[i][8] || '').toString().trim();
      var refId = (data[i][9] || '').toString().trim();
      if (refType === TRANSFER_REF_TYPE && refId === transferNo) {
        if (!transfer) {
          transfer = {
            id: refId, transfer_no: refId, date: data[i][4],
            from_warehouse_id: '', to_warehouse_id: '', notes: ''
          };
        }
        var warehouseId = (data[i][2] || '').toString().trim();
        var itemId = (data[i][1] || '').toString().trim();
        var colorId = (data[i][7] || '').toString().trim();
        var qtyIn = parseFloat(data[i][5]) || 0;
        var qtyOut = parseFloat(data[i][6]) || 0;
        if (qtyOut > 0) transfer.from_warehouse_id = warehouseId;
        if (qtyIn > 0) transfer.to_warehouse_id = warehouseId;
        var lineKey = itemId + '_' + colorId;
        if (!processedKeys[lineKey]) {
          processedKeys[lineKey] = true;
          lines.push({
            item_id: itemId, item_code: getItemCodeById(itemId), item_name: getItemNameById(itemId),
            color_id: colorId, color_name: getColorNameById(colorId),
            qty: Math.max(qtyIn, qtyOut), cost_price: parseFloat(data[i][11]) || 0
          });
        }
      }
    }
    if (transfer) {
      transfer.lines = lines;
      transfer.from_warehouse = getWarehouseNameById(transfer.from_warehouse_id);
      transfer.to_warehouse = getWarehouseNameById(transfer.to_warehouse_id);
    }
    return transfer;
  } catch (e) { console.error("❌ getTransferById error:", e); return null; }
}

// ========== 📦 تطبيق تأثيرات النقل على المخزون ==========
function applyTransferInventoryEffectsForTransfers(formData, transferNo, year) {
  try {
    console.log(`🔍 [applyTransferInventoryEffectsForTransfers] بدء معالجة النقل: ${transferNo}`);
    year = year || getFiscalYearCodeForTransfers();
    if (!year) { console.error("❌ لا توجد سنة مالية"); return false; }
    
    var fromWarehouseId = formData.from_warehouse_id;
    var toWarehouseId = formData.to_warehouse_id;
    console.log(`🏭 من: "${fromWarehouseId}" → إلى: "${toWarehouseId}"`);
    if (!fromWarehouseId || !toWarehouseId) { console.error("❌ معرفات المستودعات غير محددة"); return false; }
    
    var success = true;
    var processedCount = 0;
    
    if (formData.lines) {
      for (var i = 0; i < formData.lines.length; i++) {
        var line = formData.lines[i];
        var itemId = line.item_id || line.itemId || line.id;
        var colorId = line.color_id || '';
        var qty = parseFloat(line.qty) || 0;
        var costPrice = parseFloat(line.cost_price) || 0;
        console.log(`📦 معالجة البند: itemId="${itemId}", qty=${qty}, colorId="${colorId}"`);
        if (!itemId || qty <= 0) { console.warn("⚠️ تخطي: بيانات غير صالحة"); continue; }
        if (typeof addStockMovement === 'function') {
          var outResult = addStockMovement({
            itemId: itemId, warehouseId: fromWarehouseId, colorId: colorId, quantity: qty,
            type: 'out', refType: TRANSFER_REF_TYPE, refId: transferNo,
            costPrice: costPrice, year: year, notes: 'نقل مخزون - من: ' + fromWarehouseId
          });
          var inResult = addStockMovement({
            itemId: itemId, warehouseId: toWarehouseId, colorId: colorId, quantity: qty,
            type: 'in', refType: TRANSFER_REF_TYPE, refId: transferNo,
            costPrice: costPrice, year: year, notes: 'نقل مخزون - إلى: ' + toWarehouseId
          });
          console.log(`✅ نتيجة النقل: خروج=${outResult?'✓':'✗'}، دخول=${inResult?'✓':'✗'}`);
          if (outResult && inResult) processedCount++; else success = false;
        } else {
          console.error("❌ دالة addStockMovement غير موجودة في core.gs");
          success = false;
        }
      }
    }
    console.log(`📊 انتهى: ${processedCount}/${(formData.lines || []).length} بنود تمت معالجتها`);
    return success;
  } catch (e) { console.error("❌ applyTransferInventoryEffectsForTransfers error:", e); return false; }
}

function reverseTransferInventoryEffectsForTransfers(transferNo, year) {
  try {
    year = year || getFiscalYearCodeForTransfers();
    if (!year) return false;
    if (typeof deleteStockMovements === 'function') {
      return deleteStockMovements(TRANSFER_REF_TYPE, transferNo, year);
    }
    return true;
  } catch (e) { console.error("❌ reverseTransferInventoryEffectsForTransfers error:", e); return false; }
}

// ========== 💾 حفظ نقل المخزون ==========
function saveTransfer(formData) {
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
    console.log("\n" + "=".repeat(60));
    console.log("💾 [saveTransfer] بدء حفظ نقل المخزون");
    console.log("=".repeat(60));
    
    if (!formData.date || formData.date.toString().trim() === '') { throw new Error("تاريخ النقل مطلوب"); }
    if (!formData.from_warehouse_id) throw new Error("المستودع المصدر مطلوب");
    if (!formData.to_warehouse_id) throw new Error("المستودع الهدف مطلوب");
    if (formData.from_warehouse_id === formData.to_warehouse_id) { throw new Error("لا يمكن النقل من وإلى نفس المستودع"); }
    if (!formData.lines || formData.lines.length === 0) throw new Error("يجب إضافة صنف واحد على الأقل");
    
    var fy = getActiveFiscalYearForTransfers();
    var year = fy ? fy.year_code : null;
    console.log(`📅 السنة المالية: ${year}`);
    if (!year) throw new Error("لا توجد سنة مالية نشطة");
    
    if (fy && fy.date_from && fy.date_to) {
      var transferDate = new Date(formData.date);
      var from = new Date(fy.date_from);
      var to = new Date(fy.date_to);
      if (transferDate < from || transferDate > to) {
        throw new Error("تاريخ النقل يجب أن يكون بين " + fy.date_from + " و " + fy.date_to);
      }
    }
    
    var stockMovId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Stock_Movements", year) : null;
    if (!stockMovId) throw new Error("جدول حركات المخزون غير موجود");
    
    var transferNo = formData.id || "TRF-" + (typeof generateID === 'function' ? generateID().toString().slice(-8).toUpperCase() : Date.now().toString().slice(-8));
    console.log(`📄 معرف النقل: ${transferNo}`);
    
    var fromWarehouseId = formData.from_warehouse_id;
    console.log("🔍 التحقق من الرصيد المتاح في المستودع المصدر...");
    if (formData.lines) {
      for (var i = 0; i < formData.lines.length; i++) {
        var line = formData.lines[i];
        var itemId = line.item_id || line.itemId || line.id;
        var colorId = line.color_id || '';
        var qty = parseFloat(line.qty) || 0;
        var availableStock = typeof getCurrentStockBalance === 'function' ? getCurrentStockBalance(itemId, fromWarehouseId, colorId, year) : 0;
        console.log(`   صنف ${itemId}: المطلوب=${qty}، المتاح=${availableStock}`);
        if (qty > availableStock) {
          var items = getItems();
          var itemCode = itemId;
          for (var j = 0; j < items.length; j++) { if (String(items[j].id) === String(itemId)) { itemCode = items[j].item_code || itemId; break; } }
          throw new Error("الرصيد غير كافٍ للصنف " + itemCode + ": المطلوب " + qty + "، المتاح " + availableStock);
        }
      }
    }
    console.log("✅ الرصيد كافٍ لجميع الأصناف");
    
    console.log("📦 تسجيل حركات المخزون (خروج من المصدر + دخول إلى الهدف)...");
    var stockResult = applyTransferInventoryEffectsForTransfers(formData, transferNo, year);
    console.log(`📦 نتيجة حركات المخزون: ${stockResult ? '✅ نجاح' : '❌ فشل'}`);
    
    console.log("=".repeat(60));
    console.log("✅ [saveTransfer] انتهى الحفظ بنجاح");
    console.log("=".repeat(60) + "\n");
    
    // ✅ تم إصلاح السطر هنا - إضافة مفتاح "data" قبل الكائن
    return { 
      success: true, 
      message: formData.id ? "تم تحديث نقل المخزون بنجاح" : "تم حفظ نقل المخزون بنجاح",
      data: { transfer_no: transferNo } 
    };
    
  } catch (e) {
    console.error("❌ saveTransfer error:", e);
    return { success: false, message: "خطأ: " + e.toString() };
  }
}

// ========== 🗑️ حذف نقل المخزون ==========
function deleteTransfer(transferNo) {
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
    var year = getFiscalYearCodeForTransfers();
    if (!year) throw new Error("لا توجد سنة مالية نشطة");
    console.log(`🔄 عكس تأثيرات المخزون للنقل ${transferNo}...`);
    reverseTransferInventoryEffectsForTransfers(transferNo, year);
    return { success: true, message: "تم حذف نقل المخزون بنجاح" };
  } catch (e) { console.error("❌ deleteTransfer error:", e); return { success: false, message: "خطأ: " + e.toString() }; }
}

// ========== 🔧 دوال تشخيصية ==========
function diagnoseTransferInventory() {
  console.log("\n" + "🔍".repeat(40));
  console.log("📦 تشخيص تكامل نقل المخزون");
  console.log("🔍".repeat(40) + "\n");
  var year = getFiscalYearCodeForTransfers();
  console.log(`📅 السنة المالية: ${year}\n`);
  console.log("🔧 فحص دوال core.gs:");
  console.log(`   • getCurrentStockBalance: ${typeof getCurrentStockBalance === 'function' ? '✓ موجودة' : '✗ غير موجودة'}`);
  console.log(`   • addStockMovement: ${typeof addStockMovement === 'function' ? '✓ موجودة' : '✗ غير موجودة'}`);
  console.log(`   • deleteStockMovements: ${typeof deleteStockMovements === 'function' ? '✓ موجودة' : '✗ غير موجودة'}\n`);
  console.log("📋 ملاحظة هامة:");
  console.log("   • getCurrentStockBalance(itemId, warehouseId, colorId, year)");
  console.log("   • جميع المعاملات يجب أن تكون أيدي (أرقام) وليس أكواد (نصوص)\n");
  console.log("🔍".repeat(40) + "\n");
  return { success: true };
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
    console.log('ZEIOS ERP - ItemTransfer data');
    console.log('Keys:', allKeys.length);
    return { success: true, count: allKeys.length, keys: allKeys };
  } catch (e) { console.error('Error:', e); return { success: false, error: e.toString() }; }
}

function getLibraryVersion() { return LIBRARY_VERSION; }


/**
 * ItemTransfer_client.gs – ZEIOS ERP SYSTEM (SHEET VERSION)
 * دوال بنفس أسماء المكتبة عشان الكود يشتغل من غير تعديل
 * 
 * ⚠️ قبل التشغيل: أضف المكتبة من Extensions → Libraries
 */

// ========== 🔗 ربط المكتبة ==========
var ZEIOS = ZEIOS; // غيّر للاسم اللي أنت سميته


// ========== 🔄 ثوابت ==========
var TRANSFER_REF_TYPE = ZEIOS.TRANSFER_REF_TYPE;

// ========== 📦 دوال البيانات الأساسية ==========
function getWarehousesForTransfers() { try { return ZEIOS.getWarehousesForTransfers(); } catch (e) { return []; } }
function getItemsForTransfers() { try { return ZEIOS.getItemsForTransfers(); } catch (e) { return []; } }
function getColorsForTransfers() { try { return ZEIOS.getColorsForTransfers(); } catch (e) { return []; } }

// ========== 🔍 دوال البحث ==========
function getItemCodeById(itemId) { try { return ZEIOS.getItemCodeById(itemId); } catch (e) { return ''; } }
function getItemNameById(itemId) { try { return ZEIOS.getItemNameById(itemId); } catch (e) { return ''; } }
function getColorNameById(colorId) { try { return ZEIOS.getColorNameById(colorId); } catch (e) { return ''; } }
function getWarehouseNameById(warehouseId) { try { return ZEIOS.getWarehouseNameById(warehouseId); } catch (e) { return 'غير معروف'; } }

// ========== 📅 السنة المالية ==========
function getActiveFiscalYearForTransfers() { try { return ZEIOS.getActiveFiscalYearForTransfers(); } catch (e) { return {year_code:null,is_active:false,date_from:'',date_to:'',folder_id:''}; } }
function getFiscalYearCodeForTransfers() { try { return ZEIOS.getFiscalYearCodeForTransfers(); } catch (e) { return null; } }

// ========== 📦 الأصناف مع الرصيد ==========
function getItemsWithStockBalance(warehouseId) { try { return ZEIOS.getItemsWithStockBalance(warehouseId); } catch (e) { return []; } }

// ========== 📋 قائمة النقل ==========
function getTransfersList() { try { return ZEIOS.getTransfersList(); } catch (e) { return []; } }
function getTransferById(transferNo) { try { return ZEIOS.getTransferById(transferNo); } catch (e) { return null; } }

// ========== 📦 المخزون ==========
function applyTransferInventoryEffectsForTransfers(formData, transferNo, year) { try { return ZEIOS.applyTransferInventoryEffectsForTransfers(formData, transferNo, year); } catch (e) { return false; } }
function reverseTransferInventoryEffectsForTransfers(transferNo, year) { try { return ZEIOS.reverseTransferInventoryEffectsForTransfers(transferNo, year); } catch (e) { return false; } }

// ========== 💾 حفظ/حذف ==========
function saveTransfer(formData) { try { return ZEIOS.saveTransfer(formData); } catch (e) { return {success:false,message:'❌ '+e.toString()}; } }
function deleteTransfer(transferNo) { try { return ZEIOS.deleteTransfer(transferNo); } catch (e) { return {success:false,message:'❌ '+e.toString()}; } }

// ========== 🔧 تشخيص ==========
function diagnoseTransferInventory() { try { return ZEIOS.diagnoseTransferInventory(); } catch (e) { return {success:false,message:e.toString()}; } }

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

function openItemTransferPage() {
  try {
    var pageName = 'item_transfer';
    var title = '🔄 نقل المخزون - ZEIOS ERP';
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
  } catch (e) { console.error("❌ openItemTransferPage error:", e); return { success: false, message: e.toString() }; }
}

function openTransferForm(transferNo) {
  var id = transferNo || null;
  try {
    var pageName = 'item_transfer';
    var title = id ? '✏️ تعديل نقل مخزون - ZEIOS ERP' : '➕ إضافة نقل مخزون جديد - ZEIOS ERP';
    if (isSpreadsheetContext()) {
      var html = HtmlService.createHtmlOutputFromFile(pageName)
        .setTitle(title).setWidth(1000).setHeight(700)
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      SpreadsheetApp.getUi().showModalDialog(html, title);
      return { success: true, mode: "spreadsheet" };
    }
    var baseUrl = ScriptApp.getService() ? ScriptApp.getService().getUrl() : null;
    if (baseUrl) {
      var params = id ? '?page=item_transfer&edit=' + encodeURIComponent(id) : '?page=item_transfer&new=1';
      return { success: true, mode: "webapp", url: baseUrl + params };
    }
    return { success: false, message: "لا يمكن تحديد بيئة التشغيل" };
  } catch (e) { console.error("❌ openTransferForm error:", e); return { success: false, message: e.toString() }; }
}
