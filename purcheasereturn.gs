/**
 * PurchasesReturn.gs – ZEIOS ERP SYSTEM (LIBRARY VERSION)
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


// ========== 🔄 أنواع مراجع مرتجع المشتريات ==========
var PURCHASE_RETURN_REF_TYPES = {
  PURCHASE_RETURN: 'PURCHASE_RETURN',
  PURCHASE_RETURN_INVENTORY: 'PURCHASE_RETURN_INVENTORY',
  PURCHASE_RETURN_TAX: 'PURCHASE_RETURN_TAX',
  PURCHASE_RETURN_DISCOUNT: 'PURCHASE_RETURN_DISCOUNT',
  PURCHASE_RETURN_EXPENSE: 'PURCHASE_RETURN_EXPENSE',
  PURCHASE_RETURN_RECEIPT: 'PURCHASE_RETURN_RECEIPT'
};

// ========== 📦 دوال جلب البيانات ==========
function getSuppliersForReturns() {
  try { return typeof getSuppliers === 'function' ? getSuppliers() : []; }
  catch (e) { console.error("❌ getSuppliersForReturns:", e); return []; }
}

function getWarehousesForReturns() {
  try { return typeof getWarehouses === 'function' ? getWarehouses() : []; }
  catch (e) { console.error("❌ getWarehousesForReturns:", e); return []; }
}

function getItemsForReturns() {
  try { return typeof getItems === 'function' ? getItems() : []; }
  catch (e) { console.error("❌ getItemsForReturns:", e); return []; }
}

function getColorsForReturns() {
  try { return typeof getColors === 'function' ? getColors() : []; }
  catch (e) { console.error("❌ getColorsForReturns:", e); return []; }
}

function getSafesForReturns() {
  try { return typeof getSafes === 'function' ? getSafes() : []; }
  catch (e) { console.error("❌ getSafesForReturns:", e); return []; }
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

function getColorCodeById(colorId) {
  try {
    if (!colorId) return '';
    var colors = typeof getColors === 'function' ? getColors() : [];
    for (var i = 0; i < colors.length; i++) {
      if (String(colors[i].id) === String(colorId)) return colors[i].color_code || '';
    }
    return '';
  } catch (e) { return ''; }
}

function getColorNameById(colorId) {
  try {
    if (!colorId) return '';
    var colors = typeof getColors === 'function' ? getColors() : [];
    for (var i = 0; i < colors.length; i++) {
      if (String(colors[i].id) === String(colorId)) return colors[i].color_name || '';
    }
    return '';
  } catch (e) { return ''; }
}

function getColorIdByCode(colorCode) {
  try {
    if (!colorCode) return '';
    var colors = typeof getColors === 'function' ? getColors() : [];
    for (var i = 0; i < colors.length; i++) {
      if (String(colors[i].color_code) === String(colorCode)) return colors[i].id || '';
    }
    return '';
  } catch (e) { return ''; }
}

function getWarehouseCodeById(warehouseId) {
  try {
    if (!warehouseId) return '';
    var warehouses = typeof getWarehouses === 'function' ? getWarehouses() : [];
    for (var i = 0; i < warehouses.length; i++) {
      if (String(warehouses[i].id) === String(warehouseId)) return warehouses[i].warehouse_code || '';
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

function getSupplierNameById(supplierId) {
  try {
    if (!supplierId) return '';
    var suppliers = typeof getSuppliers === 'function' ? getSuppliers() : [];
    for (var i = 0; i < suppliers.length; i++) {
      if (String(suppliers[i].id) === String(supplierId)) return suppliers[i].account_name || '';
    }
    return '';
  } catch (e) { return ''; }
}

function getSupplierPhoneById(supplierId) {
  try {
    if (!supplierId) return '';
    var suppliers = typeof getSuppliers === 'function' ? getSuppliers() : [];
    for (var i = 0; i < suppliers.length; i++) {
      if (String(suppliers[i].id) === String(supplierId)) return suppliers[i].phone || '';
    }
    return '';
  } catch (e) { return ''; }
}

// ========== 💰 ضريبة الشركة ==========
function getCompanyTaxPercentage() {
  try {
    if (typeof getTaxPercentage === 'function') return getTaxPercentage(true);
    if (typeof loadJSON !== 'function') return 0;
    var settings = loadJSON('COMPANY_SETTINGS', null);
    if (!settings) return 0;
    var taxPercent = settings.tax_percentage;
    if (typeof taxPercent === 'number') return taxPercent;
    if (typeof taxPercent === 'string') return parseFloat(taxPercent.replace('%', '').trim()) || 0;
    return 0;
  } catch (e) { console.error("❌ getCompanyTaxPercentage error:", e); return 0; }
}

// ========== 📅 السنة المالية ==========
function getActiveFiscalYearForReturns() {
  try {
    if (typeof getActiveFiscalYear === 'function') return getActiveFiscalYear();
    var year = typeof getSys === 'function' ? getSys("ACTIVE_FISCAL_YEAR") : null;
    if (year) return { year_code: year, is_active: true, date_from: '', date_to: '', folder_id: '' };
    return { year_code: null, is_active: false, date_from: '', date_to: '', folder_id: '' };
  } catch (e) { console.error("❌ getActiveFiscalYearForReturns error:", e); return { year_code: null, is_active: false, date_from: '', date_to: '', folder_id: '' }; }
}

function getFiscalYearCodeForReturns() {
  var fy = getActiveFiscalYearForReturns();
  return fy && fy.year_code ? fy.year_code : (typeof getSys === 'function' ? getSys("ACTIVE_FISCAL_YEAR") : null);
}

// ========== 📦 دوال المخزون لمرتجع المشتريات ==========
function applyPurchaseReturnInventoryEffectsForReturns(formData, returnId, year) {
  try {
    console.log(`🔍 [applyPurchaseReturnInventoryEffectsForReturns] بدء معالجة المخزون للمرتجع: ${returnId}`);
    year = year || getFiscalYearCodeForReturns();
    if (!year) { console.error("❌ لا توجد سنة مالية"); return false; }
    
    var warehouseId = formData.store_id;
    console.log(`🏭 warehouse_id: "${warehouseId}"`);
    if (!warehouseId) { console.error("❌ warehouse_id غير محدد"); return false; }
    
    var success = true;
    var processedCount = 0;
    
    if (formData.lines) {
      for (var i = 0; i < formData.lines.length; i++) {
        var line = formData.lines[i];
        var itemId = line.item_id || line.itemId || line.id;
        var colorId = line.color_id || '';
        var quantity = parseFloat(line.qty || line.quantity || 0);
        var costPrice = parseFloat(line.price || 0);
        
        console.log(`📦 معالجة البند: itemId="${itemId}", qty=${quantity}, colorId="${colorId}"`);
        if (!itemId) { console.warn("⚠️ تخطي: item_id غير محدد"); continue; }
        if (quantity <= 0) { console.warn("⚠️ تخطي: كمية غير صالحة"); continue; }
        
        if (typeof addStockMovement === 'function') {
          var result = addStockMovement({
            itemId: itemId, warehouseId: warehouseId, colorId: colorId, quantity: quantity,
            type: 'out', refType: PURCHASE_RETURN_REF_TYPES.PURCHASE_RETURN_INVENTORY,
            refId: returnId, costPrice: costPrice, year: year,
            notes: 'مرتجع مشتريات - رقم: ' + returnId
          });
          console.log(`✅ نتيجة addStockMovement: ${result ? 'نجاح ✓' : 'فشل ✗'}`);
          if (result) processedCount++; else success = false;
        } else {
          console.error("❌ دالة addStockMovement غير موجودة في core.gs");
          success = false;
        }
      }
    }
    console.log(`📊 انتهى: ${processedCount}/${(formData.lines || []).length} بنود تمت معالجتها`);
    return success;
  } catch (e) {
    console.error("❌ خطأ في applyPurchaseReturnInventoryEffectsForReturns:", e);
    return false;
  }
}

function reversePurchaseReturnInventoryEffectsForReturns(returnId, year) {
  try {
    year = year || getFiscalYearCodeForReturns();
    if (!year) return false;
    if (typeof deleteStockMovements === 'function') {
      return deleteStockMovements(PURCHASE_RETURN_REF_TYPES.PURCHASE_RETURN_INVENTORY, returnId, year);
    }
    return true;
  } catch (e) { console.error("❌ reversePurchaseReturnInventoryEffectsForReturns error:", e); return false; }
}

// ========== 📋 جلب الأصناف مع الرصيد ==========
function getItemsForReturnDropdown(warehouseId) {
  try {
    console.log(`🔍 [getItemsForReturnDropdown] المستودع: ${warehouseId}`);
    if (!warehouseId) return [];
    var year = getFiscalYearCodeForReturns();
    if (!year) return [];
    
    var items = getItems();
    var colors = getColors();
    if (!items || items.length === 0) return [];
    
    var colorMap = {};
    if (colors) {
      for (var i = 0; i < colors.length; i++) {
        colorMap[colors[i].id] = { code: colors[i].color_code, name: colors[i].color_name };
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
      
      var noColorBalance = typeof getCurrentStockBalance === 'function' ? getCurrentStockBalance(itemId, warehouseId, '', year) : 0;
      if (noColorBalance > 0) {
        result.push({
          id: itemId, color_id: '',
          display_text: itemCode + ' - ' + itemName + ' (بدون لون) - السعر: ' + costPrice + ' - الرصيد: ' + noColorBalance + ' ' + unitCode,
          stock: noColorBalance, price: costPrice, unit: unitCode,
          item_code: itemCode, item_name: itemName, color_name: 'بدون لون'
        });
      }
      
      if (colors) {
        for (var k = 0; k < colors.length; k++) {
          var color = colors[k];
          var colorId = color.id;
          var balance = typeof getCurrentStockBalance === 'function' ? getCurrentStockBalance(itemId, warehouseId, colorId, year) : 0;
          if (balance > 0) {
            var colorInfo = colorMap[colorId];
            result.push({
              id: itemId, color_id: colorId,
              display_text: itemCode + ' - ' + itemName + ' (' + (colorInfo ? colorInfo.name : colorId) + ') - السعر: ' + costPrice + ' - الرصيد: ' + balance + ' ' + unitCode,
              stock: balance, price: costPrice, unit: unitCode,
              item_code: itemCode, item_name: itemName, color_name: colorInfo ? colorInfo.name : colorId
            });
          }
        }
      }
    }
    console.log(`✅ تم جلب ${result.length} صنف/لون للمرتجع`);
    return result;
  } catch (e) { console.error("❌ getItemsForReturnDropdown error:", e); return []; }
}

function searchItemsInReturnWarehouse(warehouseId, searchTerm) {
  try {
    if (!warehouseId || !searchTerm || searchTerm.length < 2) return [];
    var year = getFiscalYearCodeForReturns();
    if (!year) return [];
    
    var items = getItems();
    var colors = getColors();
    if (!items) return [];
    
    var colorMap = {};
    if (colors) {
      for (var i = 0; i < colors.length; i++) {
        colorMap[colors[i].id] = { code: colors[i].color_code, name: colors[i].color_name };
      }
    }
    
    var term = searchTerm.toLowerCase();
    var filtered = [];
    for (var j = 0; j < items.length; j++) {
      var item = items[j];
      if ((item.item_code && item.item_code.toLowerCase().indexOf(term) !== -1) ||
          (item.item_name && item.item_name.toLowerCase().indexOf(term) !== -1)) {
        filtered.push(item);
      }
    }
    if (filtered.length === 0) return [];
    
    var result = [];
    for (var k = 0; k < filtered.length; k++) {
      var item = filtered[k];
      var itemId = item.id;
      var itemCode = item.item_code || '';
      var itemName = item.item_name || '';
      var costPrice = parseFloat(item.cost_price) || 0;
      
      var noColorBalance = typeof getCurrentStockBalance === 'function' ? getCurrentStockBalance(itemId, warehouseId, '', year) : 0;
      if (noColorBalance > 0) {
        result.push({
          id: itemId, color_id: '',
          display_text: itemCode + ' - ' + itemName + ' (بدون لون) - الرصيد: ' + noColorBalance,
          stock: noColorBalance, price: costPrice
        });
      }
      if (colors) {
        for (var l = 0; l < colors.length; l++) {
          var color = colors[l];
          var colorId = color.id;
          var balance = typeof getCurrentStockBalance === 'function' ? getCurrentStockBalance(itemId, warehouseId, colorId, year) : 0;
          if (balance > 0) {
            var colorInfo = colorMap[colorId];
            result.push({
              id: itemId, color_id: colorId,
              display_text: itemCode + ' - ' + itemName + ' (' + (colorInfo ? colorInfo.name : colorId) + ') - الرصيد: ' + balance,
              stock: balance, price: costPrice
            });
          }
        }
      }
    }
    return result.slice(0, 50);
  } catch (e) { console.error("❌ searchItemsInReturnWarehouse error:", e); return []; }
}

// ========== 📋 قائمة المرتجعات ==========
function getPurchasesReturnList() {
  try {
    var year = getFiscalYearCodeForReturns();
    if (!year) return [];
    var returnsId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Purchase_Returns", year) : null;
    if (!returnsId) return [];
    
    var retSheet = SpreadsheetApp.openById(returnsId).getSheets()[0];
    var retData = retSheet.getDataRange().getDisplayValues();
    
    var suppliers = {};
    var suppliersList = getSuppliersForReturns();
    for (var i = 0; i < suppliersList.length; i++) { suppliers[suppliersList[i].id] = suppliersList[i].account_name; }
    
    var warehouses = {};
    var warehousesList = getWarehousesForReturns();
    for (var j = 0; j < warehousesList.length; j++) { warehouses[warehousesList[j].id] = warehousesList[j].warehouse_name; }
    
    var returns = [];
    for (var k = 1; k < retData.length; k++) {
      returns.push({
        id: retData[k][0], return_no: retData[k][1], return_date: retData[k][3],
        partner_id: retData[k][5], warehouse_id: retData[k][4],
        sub_total: retData[k][7], tax: retData[k][8], exp: retData[k][9] || '0',
        discount: retData[k][10] || '0', net_total: retData[k][11],
        supplier_name: suppliers[retData[k][5]] || 'غير معروف',
        warehouse_name: warehouses[retData[k][4]] || 'غير معروف'
      });
    }
    return returns;
  } catch (e) { console.error("❌ getPurchasesReturnList error:", e); return []; }
}

// ========== 🔍 جلب مرتجع بالتفصيل ==========
function getPurchaseReturnById(id) {
  try {
    var year = getFiscalYearCodeForReturns();
    if (!year) return null;
    var returnsId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Purchase_Returns", year) : null;
    var detailsId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Purchase_Return_Details", year) : null;
    var receiptsId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Receipts", year) : null;
    if (!returnsId || !detailsId) return null;
    
    var retSheet = SpreadsheetApp.openById(returnsId).getSheets()[0];
    var retData = retSheet.getDataRange().getDisplayValues();
    var returnObj = null;
    
    for (var i = 1; i < retData.length; i++) {
      if (String(retData[i][0]) === String(id)) {
        returnObj = {
          id: retData[i][0], return_no: retData[i][1], return_date: retData[i][3],
          warehouse_id: retData[i][4], partner_id: retData[i][5],
          partner_name: getSupplierNameById(retData[i][5]),
          partner_phone: getSupplierPhoneById(retData[i][5]),
          notes: retData[i][6] || '',
          sub_total: parseFloat(retData[i][7]) || 0, tax: parseFloat(retData[i][8]) || 0,
          exp: parseFloat(retData[i][9]) || 0, discount: parseFloat(retData[i][10]) || 0,
          net_total: parseFloat(retData[i][11]) || 0, status: retData[i][12] || 'مكتمل'
        };
        break;
      }
    }
    if (!returnObj) return null;
    
    var detailsSheet = SpreadsheetApp.openById(detailsId).getSheets()[0];
    var detailsData = detailsSheet.getDataRange().getDisplayValues();
    var lines = [];
    for (var j = 1; j < detailsData.length; j++) {
      if (String(detailsData[j][1]) === String(id)) {
        var colorId = detailsData[j][3] || '';
        lines.push({
          item_id: detailsData[j][2], item_code: getItemCodeById(detailsData[j][2]),
          item_name: getItemNameById(detailsData[j][2]), color_id: colorId,
          color_name: getColorNameById(colorId), qty: parseFloat(detailsData[j][4]) || 0,
          price: parseFloat(detailsData[j][5]) || 0, total: parseFloat(detailsData[j][6]) || 0,
          notes: detailsData[j][7] || ''
        });
      }
    }
    returnObj.lines = lines;
    
    returnObj.receipts = [];
    if (receiptsId) {
      var receiptsSheet = SpreadsheetApp.openById(receiptsId).getSheets()[0];
      var receiptsData = receiptsSheet.getDataRange().getDisplayValues();
      for (var k = 1; k < receiptsData.length; k++) {
        var rowRefType = (receiptsData[k][3] || '').toString().trim();
        var rowRefId = (receiptsData[k][4] || '').toString().trim();
        if (rowRefType === PURCHASE_RETURN_REF_TYPES.PURCHASE_RETURN_RECEIPT && rowRefId === String(id)) {
          var safes = getSafesForReturns();
          var safeName = '';
          for (var l = 0; l < safes.length; l++) {
            if (String(safes[l].id) === String(receiptsData[k][7])) { safeName = safes[l].account_name; break; }
          }
          returnObj.receipts.push({
            id: receiptsData[k][0], date: receiptsData[k][2],
            amount: parseFloat(receiptsData[k][5]) || 0, safe_id: receiptsData[k][7],
            safe_name: safeName, notes: receiptsData[k][8] || ''
          });
        }
      }
    }
    return returnObj;
  } catch (e) { console.error("❌ getPurchaseReturnById error:", e); return null; }
}

// ========== 🗑️ مسح الحركات المحاسبية ==========
function clearPurchaseReturnAccountMovementsForReturns(sheetId, returnId) {
  if (!sheetId) return;
  try {
    var sheet = SpreadsheetApp.openById(sheetId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    var validTypes = [
      PURCHASE_RETURN_REF_TYPES.PURCHASE_RETURN, PURCHASE_RETURN_REF_TYPES.PURCHASE_RETURN_INVENTORY,
      PURCHASE_RETURN_REF_TYPES.PURCHASE_RETURN_TAX, PURCHASE_RETURN_REF_TYPES.PURCHASE_RETURN_DISCOUNT,
      PURCHASE_RETURN_REF_TYPES.PURCHASE_RETURN_EXPENSE, PURCHASE_RETURN_REF_TYPES.PURCHASE_RETURN_RECEIPT
    ];
    for (var i = data.length - 1; i >= 1; i--) {
      var rowRefType = (data[i][4] || '').toString().trim();
      var rowRefId = (data[i][5] || '').toString().trim();
      if (validTypes.indexOf(rowRefType) !== -1 && rowRefId === String(returnId)) {
        sheet.deleteRow(i + 1);
      }
    }
  } catch (e) { console.warn("⚠️ clearPurchaseReturnAccountMovementsForReturns error:", e); }
}

// ========== 💰 حساب رصيد الحساب ==========
function calculateAccountBalanceForReturns(sheet, accId, year) {
  try {
    var data = sheet.getDataRange().getDisplayValues();
    var balance = 0;
    for (var i = 1; i < data.length; i++) {
      if ((data[i][1] || '').toString().trim() === String(accId).trim() &&
          (data[i][2] || '').toString().trim() === String(year).trim()) {
        balance += parseFloat(data[i][6] || '0') - parseFloat(data[i][7] || '0');
      }
    }
    return balance;
  } catch (e) { return 0; }
}

// ========== 📝 تسجيل القيود المحاسبية ==========
function recordPurchaseReturnAccountingEntriesForReturns(formData, returnId, year, now, accMovId, subTotal, taxAmount, discount, expAmount, netTotal) {
  try {
    var accSheet = SpreadsheetApp.openById(accMovId).getSheets()[0];
    var genId = function() { return typeof generateID === 'function' ? generateID() : generateUniqueId(); };
    
    var getBal = function(accId) {
      if (typeof getAccountLastBalance === 'function') { return getAccountLastBalance(accSheet, accId) || 0; }
      return calculateAccountBalanceForReturns(accSheet, accId, year);
    };
    
    if (netTotal > 0) {
      var accId = formData.partner_id;
      var bal = getBal(accId);
      accSheet.appendRow([genId(), accId, year, formData.return_date, PURCHASE_RETURN_REF_TYPES.PURCHASE_RETURN, returnId, netTotal.toString(), "0", (bal + netTotal).toString(), now]);
    }
    if (subTotal > 0) {
      var accId = typeof ACCOUNTS !== 'undefined' ? ACCOUNTS.FINISHED_GOODS : '100008';
      var bal = getBal(accId);
      accSheet.appendRow([genId(), accId, year, formData.return_date, PURCHASE_RETURN_REF_TYPES.PURCHASE_RETURN_INVENTORY, returnId, "0", subTotal.toString(), (bal - subTotal).toString(), now]);
    }
    if (taxAmount > 0) {
      var accId = typeof ACCOUNTS !== 'undefined' ? ACCOUNTS.VAT_PAYABLE : '100015';
      var bal = getBal(accId);
      accSheet.appendRow([genId(), accId, year, formData.return_date, PURCHASE_RETURN_REF_TYPES.PURCHASE_RETURN_TAX, returnId, "0", taxAmount.toString(), (bal - taxAmount).toString(), now]);
    }
    if (expAmount > 0) {
      var accId = typeof ACCOUNTS !== 'undefined' ? ACCOUNTS.SHIPPING_EXPENSE_OP : '100026';
      var bal = getBal(accId);
      accSheet.appendRow([genId(), accId, year, formData.return_date, PURCHASE_RETURN_REF_TYPES.PURCHASE_RETURN_EXPENSE, returnId, "0", expAmount.toString(), (bal - expAmount).toString(), now]);
    }
    if (discount > 0) {
      var accId = typeof ACCOUNTS !== 'undefined' ? ACCOUNTS.DISCOUNT_EARNED : '100021';
      var bal = getBal(accId);
      accSheet.appendRow([genId(), accId, year, formData.return_date, PURCHASE_RETURN_REF_TYPES.PURCHASE_RETURN_DISCOUNT, returnId, discount.toString(), "0", (bal + discount).toString(), now]);
    }
    return true;
  } catch (e) { console.warn("⚠️ recordPurchaseReturnAccountingEntriesForReturns error:", e); return false; }
}

// ========== 💾 تسجيل قيود الإيصالات ==========
function recordReceiptAccountingEntriesForReturns(paymentId, paymentDate, year, now, accMovId, data) {
  try {
    var accSheet = SpreadsheetApp.openById(accMovId).getSheets()[0];
    var genId = function() { return typeof generateID === 'function' ? generateID() : generateUniqueId(); };
    var getBal = function(accId) {
      if (typeof getAccountLastBalance === 'function') { return getAccountLastBalance(accSheet, accId) || 0; }
      return calculateAccountBalanceForReturns(accSheet, accId, year);
    };
    var amount = data.amount;
    var safeBal = getBal(data.safeId);
    accSheet.appendRow([genId(), data.safeId, year, paymentDate, data.refType, data.refId, amount.toString(), "0", (safeBal + amount).toString(), now]);
    var supBal = getBal(data.supplierId);
    accSheet.appendRow([genId(), data.supplierId, year, paymentDate, data.refType, data.refId, "0", amount.toString(), (supBal - amount).toString(), now]);
    return true;
  } catch (e) { console.warn("⚠️ recordReceiptAccountingEntriesForReturns error:", e); return false; }
}

// ========== 💳 معالجة إيصالات المرتجع ==========
function handleReturnReceiptsForReturns(formData, returnId, year, now, receiptsId, accMovId) {
  try {
    console.log(`💰 [handleReturnReceiptsForReturns] معالجة الإيصالات للمرتجع: ${returnId}`);
    console.log(`📊 عدد الدفعات المرسلة: ${formData.payments ? formData.payments.length : 0}`);
    
    if (typeof deleteInvoicePayments === 'function') {
      deleteInvoicePayments(returnId, PURCHASE_RETURN_REF_TYPES.PURCHASE_RETURN_RECEIPT, year);
      console.log("🗑️ تم حذف الإيصالات القديمة");
    }
    
    if (!formData.payments || formData.payments.length === 0) {
      console.log("⚠️ لا توجد دفعات لإضافتها");
      return { success: true, message: "لا توجد دفعات", count: 0 };
    }
    
    var receiptsSheet = SpreadsheetApp.openById(receiptsId).getSheets()[0];
    var addedCount = 0;
    
    for (var i = 0; i < formData.payments.length; i++) {
      var payment = formData.payments[i];
      var amount = parseFloat(payment.amount);
      console.log(`📝 دفعة ${i + 1}: amount=${amount}, safe_id=${payment.safe_id}`);
      if (!amount || amount <= 0 || !payment.safe_id) {
        console.warn(`⚠️ تخطي دفعة ${i + 1}: بيانات غير صالحة`);
        continue;
      }
      var paymentDate = payment.date || formData.return_date;
      var paymentId = typeof generateID === 'function' ? generateID() : generateUniqueId();
      receiptsSheet.appendRow([paymentId, year, paymentDate, PURCHASE_RETURN_REF_TYPES.PURCHASE_RETURN_RECEIPT, returnId, amount.toString(), formData.partner_id, payment.safe_id, payment.notes || '', now]);
      addedCount++;
      console.log(`✅ تمت إضافة الإيصال ${paymentId}`);
      if (accMovId) {
        recordReceiptAccountingEntriesForReturns(paymentId, paymentDate, year, now, accMovId, {
          amount: amount, supplierId: formData.partner_id, safeId: payment.safe_id,
          refType: PURCHASE_RETURN_REF_TYPES.PURCHASE_RETURN_RECEIPT, refId: returnId
        });
      }
    }
    console.log(`📊 انتهى: تمت إضافة ${addedCount} إيصال`);
    return { success: true, message: "تمت معالجة " + addedCount + " إيصال", data: { count: addedCount } };
  } catch (e) {
    console.error("❌ handleReturnReceiptsForReturns error:", e);
    return { success: false, message: e.toString(), data: { count: 0 } };
  }
}

// ========== 💾 حفظ مرتجع المشتريات ==========
// ========== 💾 حفظ مرتجع المشتريات (مُصحح) ==========
function savePurchaseReturn(formData, fiscalYear) {
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
    // ... [التحقق من البيانات الأساسية] ...
    
    // ✅ الإصلاح 1: استخدم الدالة العامة من core.gs
    var year = typeof getFiscalYearCode === 'function' ? getFiscalYearCode(fiscalYear) : null;
    if (!year) throw new Error("لا توجد سنة مالية محددة");
    
    var returnId = typeof generateID === 'function' ? generateID() : Utilities.getUuid().replace(/-/g, '');
    var now = typeof getNowTimestamp === 'function' ? getNowTimestamp() : Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
    
    // ✅ حساب الإجماليات
    var subTotal = 0;
    for (var i = 0; i < formData.lines.length; i++) {
      var line = formData.lines[i];
      var qty = parseFloat(line.qty || 0);
      var price = parseFloat(line.unit_price || line.price || 0);
      subTotal += qty * price;
    }
    
    // ✅ حفظ رأس المرتجع
    var returnsId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Purchase_Returns", year) : null;
    if (!returnsId) throw new Error("جدول المرتجعات غير موجود");
    
    var returnRow = [
      returnId,
      formData.return_no || "PR-" + year + "-" + Math.floor(Math.random() * 10000).toString().padStart(4, '0'),
      year,
      formData.return_date,
      formData.warehouse_id,      // ✅ تأكد من ترتيب الأعمدة في الجدول
      formData.supplier_id,       // ✅ تأكد من ترتيب الأعمدة في الجدول
      formData.notes || '',
      subTotal.toString(),
      now
    ];
    
    var returnsSheet = SpreadsheetApp.openById(returnsId).getSheets()[0];
    returnsSheet.appendRow(returnRow);
    
    // ✅ حفظ تفاصيل المرتجع
    var returnDetailsId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Purchase_Return_Details", year) : null;
    if (!returnDetailsId) throw new Error("جدول تفاصيل المرتجعات غير موجود");
    
    var detailsSheet = SpreadsheetApp.openById(returnDetailsId).getSheets()[0];
    
    for (var li = 0; li < formData.lines.length; li++) {
      var line = formData.lines[li];
      
      // ✅ الإصلاح 2: استخراج color_id بدقة مع سجلات تصحيح
      var colorId = '';
      if (line.color_id !== undefined && line.color_id !== null && String(line.color_id).trim() !== '') {
        colorId = String(line.color_id).trim();
      } else if (line.colorId !== undefined && line.colorId !== null && String(line.colorId).trim() !== '') {
        colorId = String(line.colorId).trim();
      }
      
      // 📝 سجل تصحيح للتتبع
      console.log(`🎨 Debug - بند ${li+1}: item_id="${line.item_id}", color_id="${colorId}", qty="${line.qty}"`);
      
      var detailRow = [
        typeof generateID === 'function' ? generateID() : Utilities.getUuid().replace(/-/g, ''),
        returnId,
        line.item_id || '',
        colorId,                               // ✅ color_id الصحيح
        (parseFloat(line.qty || 0) || 0).toString(),
        (parseFloat(line.unit_price || line.price || 0) || 0).toString(),
        ((parseFloat(line.qty || 0) || 0) * (parseFloat(line.unit_price || line.price || 0) || 0)).toString(),
        line.notes || '',
        now
      ];
      
      detailsSheet.appendRow(detailRow);
      
      // ✅ تحديث المخزون مع تمرير color_id بشكل صحيح
      if (typeof addStockMovement === 'function') {
        var stockResult = addStockMovement({
          itemId: line.item_id,
          warehouseId: formData.warehouse_id,
          colorId: colorId,                    // ✅ تأكد من قيمة colorId
          quantity: parseFloat(line.qty || 0),
          type: 'out',
          refType: 'PURCHASE_RETURN_INVENTORY',
          refId: returnId,
          costPrice: parseFloat(line.unit_price || line.price || 0),
          year: year,
          notes: 'مرتجع مشتريات: ' + returnId
        });
        console.log(`✅ addStockMovement result: ${stockResult ? 'نجاح' : 'فشل'}`);
      }
    }
    
    // ✅ إعادة حساب الأرصدة النهائية
    if (typeof recalcItemBalance === 'function') {
      for (var li = 0; li < formData.lines.length; li++) {
        var line = formData.lines[li];
        var colorId = line.color_id || line.colorId || '';
        recalcItemBalance(line.item_id, formData.warehouse_id, colorId, year);
      }
    }
    
    return {
      success: true,
      message: "تم حفظ مرتجع المشتريات بنجاح",
      return_id: returnId,
      return_no: formData.return_no
    };
    
  } catch (e) {
    console.error("❌ savePurchaseReturn error:", e);
    return { success: false, message: e.toString() };
  }
}
// ========== 🗑️ حذف مرتجع المشتريات ==========
function deletePurchaseReturn(id) {
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
    var year = getFiscalYearCodeForReturns();
    if (!year) throw new Error("لا توجد سنة مالية نشطة");
    
    if (typeof getInvoicePayments === 'function') {
      var receipts = getInvoicePayments(id, PURCHASE_RETURN_REF_TYPES.PURCHASE_RETURN_RECEIPT, year);
      if (receipts && receipts.length > 0) {
        return {
          success: false,
          has_payments: true,
          payment_count: receipts.length,
          message: "⚠️ لا يمكن الحذف لوجود " + receipts.length + " إيصال مسجل. استخدم الحذف الشامل."
        };
      }
    }
    
    var returnsId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Purchase_Returns", year) : null;
    if (!returnsId) throw new Error("جدول المرتجعات غير موجود");
    
    var retSheet = SpreadsheetApp.openById(returnsId).getSheets()[0];
    var retData = retSheet.getDataRange().getDisplayValues();
    for (var i = 1; i < retData.length; i++) {
      if (String(retData[i][0]) === String(id)) {
        retSheet.deleteRow(i + 1);
        break;
      }
    }
    
    if (typeof getYearlyTableId === 'function' && typeof clearRelatedRecords === 'function') {
      clearRelatedRecords(getYearlyTableId("Purchase_Return_Details", year), 1, id);
    }
    
    reversePurchaseReturnInventoryEffectsForReturns(id, year);
    if (typeof getYearlyTableId === 'function') {
      clearPurchaseReturnAccountMovementsForReturns(getYearlyTableId("Account_Movements", year), id);
    }
    
    return { success: true, message: "تم حذف مرتجع المشتريات بنجاح" };
  } catch (e) {
    console.error("❌ deletePurchaseReturn error:", e);
    return { success: false, message: "خطأ: " + e.toString() };
  }
}

function deletePurchaseReturnWithPayments(id) {
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
    var year = getFiscalYearCodeForReturns();
    if (!year) throw new Error("لا توجد سنة مالية نشطة");
    if (typeof deleteInvoicePayments === 'function') {
      deleteInvoicePayments(id, PURCHASE_RETURN_REF_TYPES.PURCHASE_RETURN_RECEIPT, year);
    }
    return deletePurchaseReturn(id);
  } catch (e) {
    console.error("❌ deletePurchaseReturnWithPayments error:", e);
    return { success: false, message: "خطأ: " + e.toString() };
  }
}

// ========== 🔍 دوال مساعدة للواجهات ==========
function getSupplierBalanceForReturnForm(supplierId) {
  if (typeof getSupplierBalance === 'function') { return getSupplierBalance(supplierId); }
  return { balance: "0.00", display_balance: "0.00" };
}

// ========== 🧮 دوال حسابية ==========
function calculateReturnTax(subTotal) {
  var taxPercent = getCompanyTaxPercentage();
  return (parseFloat(subTotal) || 0) * (taxPercent / 100);
}

function calculateReturnNetTotal(subTotal, tax, discount, exp) {
  var st = parseFloat(subTotal) || 0;
  var tx = parseFloat(tax) || 0;
  var ds = parseFloat(discount) || 0;
  var ex = parseFloat(exp) || 0;
  return (st + tx + ex - ds).toFixed(2);
}

// ========== 🔧 دوال تشخيصية ==========
function diagnosePurchaseReturnInventory() {
  console.log("\n" + "🔍".repeat(40));
  console.log("📦 تشخيص تكامل مرتجع المشتريات مع المخزون");
  console.log("🔍".repeat(40) + "\n");
  
  var year = getFiscalYearCodeForReturns();
  console.log(`📅 السنة المالية: ${year}\n`);
  
  var returnsId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Purchase_Returns", year) : null;
  var stockMovId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Stock_Movements", year) : null;
  var balanceId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Inventory_Balance", year) : null;
  
  console.log("📋 حالة الجداول:");
  console.log(`   • Purchase_Returns: ${returnsId ? '✓' : '✗'}`);
  console.log(`   • Stock_Movements: ${stockMovId ? '✓' : '✗'}`);
  console.log(`   • Inventory_Balance: ${balanceId ? '✓' : '✗'}\n`);
  
  console.log("🔧 فحص دوال core.gs:");
  console.log(`   • addStockMovement: ${typeof addStockMovement === 'function' ? '✓ موجودة' : '✗ غير موجودة'}`);
  console.log(`   • getCurrentStockBalance: ${typeof getCurrentStockBalance === 'function' ? '✓ موجودة' : '✗ غير موجودة'}\n`);
  
  if (stockMovId && balanceId) {
    console.log("🧪 اختبار إضافة حركة مرتجع (خروج مخزون)...");
    try {
      var testResult = typeof addStockMovement === 'function' ? addStockMovement({
        itemId: "2b446b2c0c7b4368897d4f9cebf957ed",
        warehouseId: "WH02", colorId: "1", quantity: 1, type: "out",
        refType: PURCHASE_RETURN_REF_TYPES.PURCHASE_RETURN_INVENTORY,
        refId: "test-return-" + Date.now(), costPrice: 80, year: year,
        notes: "حركة اختبار مرتجع"
      }) : false;
      console.log(`   نتيجة الاختبار: ${testResult ? '✅ نجاح' : '❌ فشل'}\n`);
    } catch (e) {
      console.log(`   ❌ خطأ في الاختبار: ${e.toString()}\n`);
    }
  }
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
    console.log('ZEIOS ERP - PurchasesReturn data');
    console.log('Keys:', allKeys.length);
    return { success: true, count: allKeys.length, keys: allKeys };
  } catch (e) { console.error('Error:', e); return { success: false, error: e.toString() }; }
}

function getLibraryVersion() { return LIBRARY_VERSION; }
/**
 * الحصول على مرتجع مشتريات للتعديل المباشر
 * ✅ نسخة موحدة مع باقي الوحدات
 */
function getPurchaseReturnForDirectEdit(returnId, fiscalYear) {
  try {
    if (!returnId) { return { success: false, message: '❌ معرف المرتجع مطلوب' }; }
    
    var year = typeof getFiscalYearCode === 'function' ? getFiscalYearCode(fiscalYear) : null;
    if (!year && typeof getFiscalYearInfo === 'function') {
      var fy = getFiscalYearInfo(fiscalYear);
      year = fy && fy.year_code ? fy.year_code : null;
    }
    if (!year) { year = new Date().getFullYear().toString(); }
    
    var tableId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Purchase_Returns", year) : null;
    if (!tableId) { return { success: false, message: '❌ جدول المرتجعات غير موجود' }; }
    
    var ss = SpreadsheetApp.openById(tableId);
    var sheet = ss.getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    
    var ret = null;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] && String(data[i][0]).trim() === String(returnId).trim()) {
        ret = {
          id: data[i][0], return_no: data[i][1] || '', fiscal_year: data[i][2] || year,
          return_date: data[i][3] || '', warehouse_id: data[i][4] || '',
          supplier_id: data[i][5] || '', notes: data[i][6] || '',
          sub_total: parseFloat(data[i][7]) || 0, tax: parseFloat(data[i][8]) || 0,
          exp: parseFloat(data[i][9]) || 0, discount: parseFloat(data[i][10]) || 0,
          net_total: parseFloat(data[i][11]) || 0, status: data[i][12] || 'مكتمل',
          created_at: data[i][13] || ''
        };
        
        if (ret.supplier_id && typeof getAccountInfo === 'function') {
          var account = getAccountInfo(ret.supplier_id);
          if (account) {
            ret.supplier_name = account.account_name || account.contact_name || '';
            ret.supplier_phone = account.phone || '';
          }
        }
        if (typeof getWarehouseNameById === 'function') {
          ret.warehouse_name = getWarehouseNameById(ret.warehouse_id);
        }
        break;
      }
    }
    if (!ret) { return { success: false, message: '❌ لم يتم العثور على المرتجع' }; }
    
    // البنود
    ret.lines = [];
    var detailsId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Purchase_Return_Details", year) : null;
    if (detailsId) {
      var dSheet = SpreadsheetApp.openById(detailsId).getSheets()[0];
      var dData = dSheet.getDataRange().getDisplayValues();
      var items = typeof getItems === 'function' ? getItems() : [];
      var itemsMap = {};
      for (var idx = 0; idx < items.length; idx++) { itemsMap[items[idx].id] = items[idx]; }
      
      for (var j = 1; j < dData.length; j++) {
        if (dData[j][1] && String(dData[j][1]).trim() === String(returnId).trim()) {
          var itemId = dData[j][2] || '';
          var itemInfo = itemsMap[itemId] || {};
          ret.lines.push({
            id: dData[j][0] || '', item_id: itemId,
            item_name: itemInfo.item_name || '', item_code: itemInfo.item_code || '',
            color_id: dData[j][3] || '', qty: parseFloat(dData[j][4]) || 0,
            price: parseFloat(dData[j][5]) || 0, total: parseFloat(dData[j][6]) || 0,
            notes: dData[j][7] || ''
          });
        }
      }
    }
    
    // الدفعات (الاسترداد)
    ret.receipts = [];
    if (typeof getInvoiceReceipts === 'function') {
      ret.receipts = getInvoiceReceipts(returnId, 'PURCHASE_RETURN', year);
    }
    
    return { success: true, data: ret, message: 'تم جلب بيانات المرتجع بنجاح' };
    
  } catch (e) {
    console.error('❌ getPurchaseReturnForDirectEdit error:', e);
    return { success: false, message: 'خطأ: ' + e.toString() };
  }
}


/**
 * PurchasesReturn_client.gs – ZEIOS ERP SYSTEM (SHEET VERSION)
 * دوال بنفس أسماء المكتبة عشان الكود يشتغل من غير تعديل
 * 
 * ⚠️ قبل التشغيل: أضف المكتبة من Extensions → Libraries
 */

// ========== 🔗 ربط المكتبة ==========
var ZEIOS = ZEIOS; // غيّر للاسم اللي أنت سميته


// ========== 🔄 ثوابت ==========
var PURCHASE_RETURN_REF_TYPES = ZEIOS.PURCHASE_RETURN_REF_TYPES;

// ========== 📦 دوال البيانات الأساسية ==========
function getSuppliersForReturns() { try { return ZEIOS.getSuppliersForReturns(); } catch (e) { return []; } }
function getWarehousesForReturns() { try { return ZEIOS.getWarehousesForReturns(); } catch (e) { return []; } }
function getItemsForReturns() { try { return ZEIOS.getItemsForReturns(); } catch (e) { return []; } }
function getColorsForReturns() { try { return ZEIOS.getColorsForReturns(); } catch (e) { return []; } }
function getSafesForReturns() { try { return ZEIOS.getSafesForReturns(); } catch (e) { return []; } }

// ========== 🔍 دوال البحث ==========
function getItemCodeById(itemId) { try { return ZEIOS.getItemCodeById(itemId); } catch (e) { return ''; } }
function getItemNameById(itemId) { try { return ZEIOS.getItemNameById(itemId); } catch (e) { return ''; } }
function getColorCodeById(colorId) { try { return ZEIOS.getColorCodeById(colorId); } catch (e) { return ''; } }
function getColorNameById(colorId) { try { return ZEIOS.getColorNameById(colorId); } catch (e) { return ''; } }
function getColorIdByCode(colorCode) { try { return ZEIOS.getColorIdByCode(colorCode); } catch (e) { return ''; } }
function getWarehouseCodeById(warehouseId) { try { return ZEIOS.getWarehouseCodeById(warehouseId); } catch (e) { return ''; } }
function getWarehouseNameById(warehouseId) { try { return ZEIOS.getWarehouseNameById(warehouseId); } catch (e) { return 'غير معروف'; } }
function getSupplierNameById(supplierId) { try { return ZEIOS.getSupplierNameById(supplierId); } catch (e) { return ''; } }
function getSupplierPhoneById(supplierId) { try { return ZEIOS.getSupplierPhoneById(supplierId); } catch (e) { return ''; } }

// ========== 💰 الضريبة ==========
function getCompanyTaxPercentage() { try { return ZEIOS.getCompanyTaxPercentage(); } catch (e) { return 0; } }

// ========== 📅 السنة المالية ==========
function getActiveFiscalYearForReturns() { try { return ZEIOS.getActiveFiscalYearForReturns(); } catch (e) { return {year_code:null,is_active:false,date_from:'',date_to:'',folder_id:''}; } }
function getFiscalYearCodeForReturns() { try { return ZEIOS.getFiscalYearCodeForReturns(); } catch (e) { return null; } }

// ========== 📦 المخزون ==========
function applyPurchaseReturnInventoryEffectsForReturns(formData, returnId, year) { try { return ZEIOS.applyPurchaseReturnInventoryEffectsForReturns(formData, returnId, year); } catch (e) { return false; } }
function reversePurchaseReturnInventoryEffectsForReturns(returnId, year) { try { return ZEIOS.reversePurchaseReturnInventoryEffectsForReturns(returnId, year); } catch (e) { return false; } }

// ========== 📋 القوائم ==========
function getItemsForReturnDropdown(warehouseId) { try { return ZEIOS.getItemsForReturnDropdown(warehouseId); } catch (e) { return []; } }
function searchItemsInReturnWarehouse(warehouseId, searchTerm) { try { return ZEIOS.searchItemsInReturnWarehouse(warehouseId, searchTerm); } catch (e) { return []; } }
function getPurchasesReturnList() { try { return ZEIOS.getPurchasesReturnList(); } catch (e) { return []; } }
function getPurchaseReturnById(id) { try { return ZEIOS.getPurchaseReturnById(id); } catch (e) { return null; } }

// ========== 💾 حفظ/حذف ==========
function savePurchaseReturn(formData) { try { return ZEIOS.savePurchaseReturn(formData); } catch (e) { return {success:false,message:'❌ '+e.toString()}; } }
function deletePurchaseReturn(id) { try { return ZEIOS.deletePurchaseReturn(id); } catch (e) { return {success:false,message:'❌ '+e.toString()}; } }
function deletePurchaseReturnWithPayments(id) { try { return ZEIOS.deletePurchaseReturnWithPayments(id); } catch (e) { return {success:false,message:'❌ '+e.toString()}; } }

// ========== 🔍 مساعدة للواجهات ==========
function getSupplierBalanceForReturnForm(supplierId) { try { return ZEIOS.getSupplierBalanceForReturnForm(supplierId); } catch (e) { return {balance:"0.00",display_balance:"0.00"}; } }

// ========== 🧮 حسابات ==========
function calculateReturnTax(subTotal) { try { return ZEIOS.calculateReturnTax(subTotal); } catch (e) { return 0; } }
function calculateReturnNetTotal(subTotal, tax, discount, exp) { try { return ZEIOS.calculateReturnNetTotal(subTotal, tax, discount, exp); } catch (e) { return '0.00'; } }

// ========== 🔧 تشخيص ==========
function diagnosePurchaseReturnInventory() { try { return ZEIOS.diagnosePurchaseReturnInventory(); } catch (e) { return {success:false,message:e.toString()}; } }

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

function openPurchasesReturnPage() {
  try {
    var pageName = 'purchases_return';
    var title = '↩️ مرتجع المشتريات - ZEIOS ERP';
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
  } catch (e) { console.error("❌ openPurchasesReturnPage error:", e); return { success: false, message: e.toString() }; }
}

function openPurchaseReturnForm(returnId) {
  var id = returnId || null;
  try {
    var pageName = 'purchases_return';
    var title = id ? '✏️ تعديل مرتجع مشتريات - ZEIOS ERP' : '➕ إضافة مرتجع مشتريات جديد - ZEIOS ERP';
    if (isSpreadsheetContext()) {
      var html = HtmlService.createHtmlOutputFromFile(pageName)
        .setTitle(title).setWidth(1200).setHeight(800)
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      SpreadsheetApp.getUi().showModalDialog(html, title);
      return { success: true, mode: "spreadsheet" };
    }
    var baseUrl = ScriptApp.getService() ? ScriptApp.getService().getUrl() : null;
    if (baseUrl) {
      var params = id ? '?page=purchases_return&edit=' + encodeURIComponent(id) : '?page=purchases_return&new=1';
      return { success: true, mode: "webapp", url: baseUrl + params };
    }
    return { success: false, message: "لا يمكن تحديد بيئة التشغيل" };
  } catch (e) { console.error("❌ openPurchaseReturnForm error:", e); return { success: false, message: e.toString() }; }
}
/**
 * ✅ دالة واجهة لاستدعاء جلب مرتجع مشتريات للتعديل المباشر
 * ⚠️ يجب أن تكون في مشروع الجدول (ليس في المكتبة)
 * ⚠️ مطلوبة من الـ HTML عبر google.script.run
 */
function getPurchaseReturnForDirectEdit(returnId, fiscalYear) {
  try {
    // ✅ التحقق من المدخلات
    if (!returnId) {
      return { success: false, message: '❌ معرف المرتجع مطلوب' };
    }
    
    // ✅ استدعاء الدالة من المكتبة إذا كانت متاحة
    if (typeof ZEIOS !== 'undefined' && typeof ZEIOS.getPurchaseReturnForDirectEdit === 'function') {
      return ZEIOS.getPurchaseReturnForDirectEdit(returnId, fiscalYear);
    }
    
    // ✅ Fallback: استدعاء الدالة المحلية إذا كانت موجودة في ملف آخر
    if (typeof getPurchaseReturnForDirectEdit === 'function' && 
        getPurchaseReturnForDirectEdit !== arguments.callee) {
      return getPurchaseReturnForDirectEdit(returnId, fiscalYear);
    }
    
    return { success: false, message: 'دالة جلب المرتجع غير متاحة' };
    
  } catch (e) {
    console.error('❌ getPurchaseReturnForDirectEdit (client) error:', e);
    return {
      success: false,
      message: 'خطأ: ' + e.toString(),
      error: e.toString()
    };
  }
}
