/**
 * SalesReturn.gs – ZEIOS ERP SYSTEM (LIBRARY VERSION)
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


// ========== 🔄 أنواع مراجع مرتجع المبيعات ==========
var SALES_RETURN_REF_TYPES = {
  SALES_RETURN: 'SALES_RETURN',
  SALES_RETURN_INVENTORY: 'SALES_RETURN_INVENTORY',
  SALES_RETURN_TAX: 'SALES_RETURN_TAX',
  SALES_RETURN_DISCOUNT: 'SALES_RETURN_DISCOUNT',
  SHIPPING_EXPENSE_SALES_RETURN: 'SHIPPING_EXPENSE_SALES_RETURN',
  RETURN_PAYMENT: 'RETURN_PAYMENT',
  SALES_RETURN_COGS: 'SALES_RETURN_COGS'
};

// ========== 📦 دوال جلب البيانات ==========
function getCustomersForSalesReturns() {
  try { return typeof getCustomers === 'function' ? getCustomers() : []; }
  catch (e) { console.error("❌ getCustomersForSalesReturns:", e); return []; }
}

function getWarehousesForSalesReturns() {
  try { return typeof getWarehouses === 'function' ? getWarehouses() : []; }
  catch (e) { console.error("❌ getWarehousesForSalesReturns:", e); return []; }
}

function getItemsForSalesReturns() {
  try { return typeof getItems === 'function' ? getItems() : []; }
  catch (e) { console.error("❌ getItemsForSalesReturns:", e); return []; }
}

function getColorsForSalesReturns() {
  try { return typeof getColors === 'function' ? getColors() : []; }
  catch (e) { console.error("❌ getColorsForSalesReturns:", e); return []; }
}

function getSafesForSalesReturns() {
  try { return typeof getSafes === 'function' ? getSafes() : []; }
  catch (e) { console.error("❌ getSafesForSalesReturns:", e); return []; }
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

function getCustomerNameById(customerId) {
  try {
    if (!customerId) return '';
    var customers = typeof getCustomers === 'function' ? getCustomers() : [];
    for (var i = 0; i < customers.length; i++) {
      if (String(customers[i].id) === String(customerId)) return customers[i].account_name || '';
    }
    return '';
  } catch (e) { return ''; }
}

function getCustomerPhoneById(customerId) {
  try {
    if (!customerId) return '';
    var customers = typeof getCustomers === 'function' ? getCustomers() : [];
    for (var i = 0; i < customers.length; i++) {
      if (String(customers[i].id) === String(customerId)) return customers[i].phone || '';
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
function getActiveFiscalYearForSalesReturns() {
  try {
    if (typeof getActiveFiscalYear === 'function') return getActiveFiscalYear();
    var year = typeof getSys === 'function' ? getSys("ACTIVE_FISCAL_YEAR") : null;
    if (year) return { year_code: year, is_active: true, date_from: '', date_to: '', folder_id: '' };
    return { year_code: null, is_active: false, date_from: '', date_to: '', folder_id: '' };
  } catch (e) { console.error("❌ getActiveFiscalYearForSalesReturns error:", e); return { year_code: null, is_active: false, date_from: '', date_to: '', folder_id: '' }; }
}

function getFiscalYearCodeForSalesReturns() {
  var fy = getActiveFiscalYearForSalesReturns();
  return fy && fy.year_code ? fy.year_code : (typeof getSys === 'function' ? getSys("ACTIVE_FISCAL_YEAR") : null);
}

// ========== 📦 دوال المخزون لمرتجع المبيعات ==========
function applySalesReturnInventoryEffectsForReturns(formData, returnId, year) {
  try {
    console.log(`🔍 [applySalesReturnInventoryEffectsForReturns] بدء معالجة المخزون للمرتجع: ${returnId}`);
    year = year || getFiscalYearCodeForSalesReturns();
    if (!year) { console.error("❌ لا توجد سنة مالية"); return false; }
    
    var warehouseId = formData.warehouse_id;
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
        var costPrice = parseFloat(typeof getItemCostPrice === 'function' ? getItemCostPrice(itemId) : 0) || 0;
        
        console.log(`📦 معالجة البند: itemId="${itemId}", qty=${quantity}, colorId="${colorId}"`);
        if (!itemId) { console.warn("⚠️ تخطي: item_id غير محدد"); continue; }
        if (quantity <= 0) { console.warn("⚠️ تخطي: كمية غير صالحة"); continue; }
        
        if (typeof addStockMovement === 'function') {
          var result = addStockMovement({
            itemId: itemId, warehouseId: warehouseId, colorId: colorId, quantity: quantity,
            type: 'in', refType: SALES_RETURN_REF_TYPES.SALES_RETURN_INVENTORY,
            refId: returnId, costPrice: costPrice, year: year,
            notes: 'مرتجع مبيعات - رقم: ' + returnId
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
    console.error("❌ applySalesReturnInventoryEffectsForReturns error:", e);
    return false;
  }
}

function reverseSalesReturnInventoryEffectsForReturns(returnId, year) {
  try {
    year = year || getFiscalYearCodeForSalesReturns();
    if (!year) return false;
    if (typeof deleteStockMovements === 'function') {
      return deleteStockMovements(SALES_RETURN_REF_TYPES.SALES_RETURN_INVENTORY, returnId, year);
    }
    return true;
  } catch (e) { console.error("❌ reverseSalesReturnInventoryEffectsForReturns error:", e); return false; }
}

// ========== 📋 جلب الأصناف مع الرصيد ==========
function getItemsForSalesReturnDropdown(warehouseId) {
  try {
    console.log(`🔍 [getItemsForSalesReturnDropdown] المستودع: ${warehouseId}`);
    if (!warehouseId) return [];
    var year = getFiscalYearCodeForSalesReturns();
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
      var salePrice = parseFloat(item.sale_price) || 0;
      
      var noColorBalance = typeof getCurrentStockBalance === 'function' ? getCurrentStockBalance(itemId, warehouseId, '', year) : 0;
      result.push({
        id: itemId, color_id: '',
        display_text: itemCode + ' - ' + itemName + ' (بدون لون) - السعر: ' + salePrice + ' - الرصيد الحالي: ' + noColorBalance + ' ' + unitCode,
        stock: noColorBalance, price: salePrice, unit: unitCode,
        item_code: itemCode, item_name: itemName, color_name: 'بدون لون',
        item_image_url: item.item_image_url || ''
      });
      
      if (colors) {
        for (var k = 0; k < colors.length; k++) {
          var color = colors[k];
          var colorId = color.id;
          var balance = typeof getCurrentStockBalance === 'function' ? getCurrentStockBalance(itemId, warehouseId, colorId, year) : 0;
          var colorInfo = colorMap[colorId];
          result.push({
            id: itemId, color_id: colorId,
            display_text: itemCode + ' - ' + itemName + ' (' + (colorInfo ? colorInfo.name : colorId) + ') - السعر: ' + salePrice + ' - الرصيد الحالي: ' + balance + ' ' + unitCode,
            stock: balance, price: salePrice, unit: unitCode,
            item_code: itemCode, item_name: itemName, color_name: colorInfo ? colorInfo.name : colorId,
            item_image_url: item.item_image_url || ''
          });
        }
      }
    }
    console.log(`✅ تم جلب ${result.length} صنف/لون (كل الأصناف - بدون شرط الرصيد)`);
    return result;
  } catch (e) { console.error("❌ getItemsForSalesReturnDropdown error:", e); return []; }
}

function searchItemsInSalesReturnWarehouse(warehouseId, searchTerm) {
  try {
    if (!warehouseId || !searchTerm || searchTerm.length < 2) return [];
    var year = getFiscalYearCodeForSalesReturns();
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
      var salePrice = parseFloat(item.sale_price) || 0;
      
      var noColorBalance = typeof getCurrentStockBalance === 'function' ? getCurrentStockBalance(itemId, warehouseId, '', year) : 0;
      result.push({
        id: itemId, color_id: '',
        display_text: itemCode + ' - ' + itemName + ' (بدون لون) - الرصيد: ' + noColorBalance,
        stock: noColorBalance, price: salePrice
      });
      if (colors) {
        for (var l = 0; l < colors.length; l++) {
          var color = colors[l];
          var colorId = color.id;
          var balance = typeof getCurrentStockBalance === 'function' ? getCurrentStockBalance(itemId, warehouseId, colorId, year) : 0;
          var colorInfo = colorMap[colorId];
          result.push({
            id: itemId, color_id: colorId,
            display_text: itemCode + ' - ' + itemName + ' (' + (colorInfo ? colorInfo.name : colorId) + ') - الرصيد: ' + balance,
            stock: balance, price: salePrice
          });
        }
      }
    }
    return result.slice(0, 50);
  } catch (e) { console.error("❌ searchItemsInSalesReturnWarehouse error:", e); return []; }
}

// ========== 📋 قائمة مرتجعات المبيعات ==========
function getSalesReturnsList() {
  try {
    var year = getFiscalYearCodeForSalesReturns();
    if (!year) return [];
    var returnsId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Sales_Returns", year) : null;
    if (!returnsId) return [];
    
    var retSheet = SpreadsheetApp.openById(returnsId).getSheets()[0];
    var retData = retSheet.getDataRange().getDisplayValues();
    
    var customers = {};
    var customersList = getCustomersForSalesReturns();
    for (var i = 0; i < customersList.length; i++) { customers[customersList[i].id] = customersList[i].account_name; }
    
    var warehouses = {};
    var warehousesList = getWarehousesForSalesReturns();
    for (var j = 0; j < warehousesList.length; j++) { warehouses[warehousesList[j].id] = warehousesList[j].warehouse_name; }
    
    var returns = [];
    for (var k = 1; k < retData.length; k++) {
      returns.push({
        id: retData[k][0], return_no: retData[k][1], return_date: retData[k][3],
        partner_id: retData[k][5], warehouse_id: retData[k][4],
        sub_total: retData[k][7], tax: retData[k][8], exp: retData[k][9] || '0',
        discount: retData[k][10] || '0', net_total: retData[k][11],
        customer_name: customers[retData[k][5]] || 'غير معروف',
        warehouse_name: warehouses[retData[k][4]] || 'غير معروف'
      });
    }
    return returns;
  } catch (e) { console.error("❌ getSalesReturnsList error:", e); return []; }
}

// ========== 🔍 جلب مرتجع مبيعات بالتفصيل ==========
function getSalesReturnById(id) {
  try {
    console.log(`🔍 [getSalesReturnById] جلب المرتجع: ${id}`);
    var year = getFiscalYearCodeForSalesReturns();
    if (!year) { console.error("❌ لا توجد سنة مالية نشطة"); return null; }
    
    var returnsId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Sales_Returns", year) : null;
    var detailsId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Sales_Return_Details", year) : null;
    var paymentsId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Payments", year) : null;
    if (!returnsId || !detailsId) { console.error("❌ جداول المرتجعات غير موجودة"); return null; }
    
    var retSheet = SpreadsheetApp.openById(returnsId).getSheets()[0];
    var retData = retSheet.getDataRange().getDisplayValues();
    var returnObj = null;
    
    for (var i = 1; i < retData.length; i++) {
      if (String(retData[i][0]) === String(id)) {
        returnObj = {
          id: retData[i][0], return_no: retData[i][1], fiscal_year: retData[i][2],
          return_date: retData[i][3], warehouse_id: retData[i][4], partner_id: retData[i][5],
          partner_name: getCustomerNameById(retData[i][5]),
          partner_phone: getCustomerPhoneById(retData[i][5]),
          notes: retData[i][6] || '',
          sub_total: parseFloat(retData[i][7]) || 0, tax: parseFloat(retData[i][8]) || 0,
          exp: parseFloat(retData[i][9]) || 0, discount: parseFloat(retData[i][10]) || 0,
          net_total: parseFloat(retData[i][11]) || 0, status: retData[i][12] || 'مكتمل',
          created_at: retData[i][13]
        };
        console.log("✅ تم العثور على المرتجع:", returnObj.return_no);
        break;
      }
    }
    if (!returnObj) { console.warn(`⚠️ لم يتم العثور على المرتجع: ${id}`); return null; }
    
    var detailsSheet = SpreadsheetApp.openById(detailsId).getSheets()[0];
    var detailsData = detailsSheet.getDataRange().getDisplayValues();
    var lines = [];
    for (var j = 1; j < detailsData.length; j++) {
      if (String(detailsData[j][1]) === String(id)) {
        var colorId = detailsData[j][3] || '';
        lines.push({
          id: detailsData[j][0], item_id: detailsData[j][2],
          item_code: getItemCodeById(detailsData[j][2]),
          item_name: getItemNameById(detailsData[j][2]),
          color_id: colorId, color_name: getColorNameById(colorId),
          qty: parseFloat(detailsData[j][4]) || 0,
          price: parseFloat(detailsData[j][5]) || 0,
          total: parseFloat(detailsData[j][6]) || 0,
          notes: detailsData[j][7] || ''
        });
      }
    }
    returnObj.lines = lines;
    console.log(`📦 تم جلب ${lines.length} بند`);
    
    returnObj.payments = [];
    if (paymentsId) {
      var paymentsSheet = SpreadsheetApp.openById(paymentsId).getSheets()[0];
      var paymentsData = paymentsSheet.getDataRange().getDisplayValues();
      for (var k = 1; k < paymentsData.length; k++) {
        var rowRefType = (paymentsData[k][3] || '').toString().trim();
        var rowRefId = (paymentsData[k][4] || '').toString().trim();
        if ((rowRefType === SALES_RETURN_REF_TYPES.RETURN_PAYMENT || rowRefType === SALES_RETURN_REF_TYPES.SALES_RETURN) && rowRefId === String(id)) {
          var safeId = paymentsData[k][7] || '';
          console.log(`✅ دفعة مطابقة! safe_id="${safeId}"`);
          var safes = getSafesForSalesReturns();
          var safeName = '';
          for (var l = 0; l < safes.length; l++) {
            if (String(safes[l].id) === String(safeId)) { safeName = safes[l].account_name; break; }
          }
          returnObj.payments.push({
            id: paymentsData[k][0], fiscal_year: paymentsData[k][1], date: paymentsData[k][2],
            ref_type: paymentsData[k][3], ref_id: paymentsData[k][4],
            amount: parseFloat(paymentsData[k][5]) || 0, account_id: paymentsData[k][6],
            safe_id: safeId, safe_name: safeName, notes: paymentsData[k][8] || '',
            created_at: paymentsData[k][9]
          });
        }
      }
    }
    console.log(`✅ تم جلب ${returnObj.payments.length} دفعة`);
    return returnObj;
  } catch (e) { console.error("❌ getSalesReturnById error:", e); return null; }
}

// ========== 🗑️ مسح الحركات المحاسبية ==========
function clearSalesReturnAccountMovementsForReturns(sheetId, returnId) {
  if (!sheetId) return;
  try {
    var sheet = SpreadsheetApp.openById(sheetId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    var validTypes = [
      SALES_RETURN_REF_TYPES.SALES_RETURN, SALES_RETURN_REF_TYPES.SALES_RETURN_INVENTORY,
      SALES_RETURN_REF_TYPES.SALES_RETURN_TAX, SALES_RETURN_REF_TYPES.SALES_RETURN_DISCOUNT,
      SALES_RETURN_REF_TYPES.SHIPPING_EXPENSE_SALES_RETURN, SALES_RETURN_REF_TYPES.RETURN_PAYMENT,
      SALES_RETURN_REF_TYPES.SALES_RETURN_COGS
    ];
    for (var i = data.length - 1; i >= 1; i--) {
      var rowRefType = (data[i][4] || '').toString().trim();
      var rowRefId = (data[i][5] || '').toString().trim();
      if (validTypes.indexOf(rowRefType) !== -1 && rowRefId === String(returnId)) {
        sheet.deleteRow(i + 1);
      }
    }
  } catch (e) { console.warn("⚠️ clearSalesReturnAccountMovementsForReturns error:", e); }
}

// ========== 💰 حساب رصيد الحساب ==========
function calculateAccountBalanceForSalesReturns(sheet, accId, year) {
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
function recordSalesReturnAccountingEntriesForReturns(formData, returnId, year, now, accMovId, subTotal, taxAmount, discount, expAmount, netTotal) {
  try {
    var accSheet = SpreadsheetApp.openById(accMovId).getSheets()[0];
    var genId = function() { return typeof generateID === 'function' ? generateID() : generateUniqueId(); };
    
    var getBal = function(accId) {
      if (typeof getAccountLastBalance === 'function') { return getAccountLastBalance(accSheet, accId) || 0; }
      return calculateAccountBalanceForSalesReturns(accSheet, accId, year);
    };
    
    if (netTotal > 0) {
      var accId = formData.partner_id;
      var bal = getBal(accId);
      accSheet.appendRow([genId(), accId, year, formData.return_date, SALES_RETURN_REF_TYPES.SALES_RETURN, returnId, "0", netTotal.toString(), (bal - netTotal).toString(), now]);
    }
    if (subTotal > 0) {
      var accId = typeof ACCOUNTS !== 'undefined' ? ACCOUNTS.SALES_REVENUE : '100020';
      var bal = getBal(accId);
      accSheet.appendRow([genId(), accId, year, formData.return_date, SALES_RETURN_REF_TYPES.SALES_RETURN, returnId, subTotal.toString(), "0", (bal - subTotal).toString(), now]);
    }
    if (taxAmount > 0) {
      var accId = typeof ACCOUNTS !== 'undefined' ? ACCOUNTS.VAT_PAYABLE : '100015';
      var bal = getBal(accId);
      accSheet.appendRow([genId(), accId, year, formData.return_date, SALES_RETURN_REF_TYPES.SALES_RETURN_TAX, returnId, taxAmount.toString(), "0", (bal + taxAmount).toString(), now]);
    }
    if (expAmount > 0) {
      var accId = typeof ACCOUNTS !== 'undefined' ? ACCOUNTS.SHIPPING_EXPENSE_OP : '100026';
      var bal = getBal(accId);
      accSheet.appendRow([genId(), accId, year, formData.return_date, SALES_RETURN_REF_TYPES.SHIPPING_EXPENSE_SALES_RETURN, returnId, expAmount.toString(), "0", (bal - expAmount).toString(), now]);
    }
    if (discount > 0) {
      var accId = typeof ACCOUNTS !== 'undefined' ? ACCOUNTS.DISCOUNT_ALLOWED : '100024';
      var bal = getBal(accId);
      accSheet.appendRow([genId(), accId, year, formData.return_date, SALES_RETURN_REF_TYPES.SALES_RETURN_DISCOUNT, returnId, "0", discount.toString(), (bal - discount).toString(), now]);
    }
    
    var totalCost = 0;
    if (formData.lines) {
      for (var i = 0; i < formData.lines.length; i++) {
        var line = formData.lines[i];
        var costPrice = parseFloat(typeof getItemCostPrice === 'function' ? getItemCostPrice(line.item_id) : 0) || 0;
        var qty = parseFloat(line.qty) || 0;
        totalCost += costPrice * qty;
      }
    }
    if (totalCost > 0) {
      var accId = typeof ACCOUNTS !== 'undefined' ? ACCOUNTS.FINISHED_GOODS : '100008';
      var bal = getBal(accId);
      accSheet.appendRow([genId(), accId, year, formData.return_date, SALES_RETURN_REF_TYPES.SALES_RETURN_INVENTORY, returnId, totalCost.toString(), "0", (bal + totalCost).toString(), now]);
    }
    if (totalCost > 0) {
      var accId = typeof ACCOUNTS !== 'undefined' ? ACCOUNTS.COST_OF_SALES : '100023';
      var bal = getBal(accId);
      accSheet.appendRow([genId(), accId, year, formData.return_date, SALES_RETURN_REF_TYPES.SALES_RETURN_COGS, returnId, "0", totalCost.toString(), (bal - totalCost).toString(), now]);
    }
    return true;
  } catch (e) { console.warn("⚠️ recordSalesReturnAccountingEntriesForReturns error:", e); return false; }
}

// ========== 💾 تسجيل قيود الدفعات ==========
function recordPaymentAccountingEntriesForReturns(paymentId, paymentDate, year, now, accMovId, data) {
  try {
    var accSheet = SpreadsheetApp.openById(accMovId).getSheets()[0];
    var genId = function() { return typeof generateID === 'function' ? generateID() : generateUniqueId(); };
    var getBal = function(accId) {
      if (typeof getAccountLastBalance === 'function') { return getAccountLastBalance(accSheet, accId) || 0; }
      return calculateAccountBalanceForSalesReturns(accSheet, accId, year);
    };
    var amount = data.amount;
    var safeBal = getBal(data.safeId);
    accSheet.appendRow([genId(), data.safeId, year, paymentDate, data.refType, data.refId, "0", amount.toString(), (safeBal - amount).toString(), now]);
    var custBal = getBal(data.customerId);
    accSheet.appendRow([genId(), data.customerId, year, paymentDate, data.refType, data.refId, amount.toString(), "0", (custBal + amount).toString(), now]);
    return true;
  } catch (e) { console.warn("⚠️ recordPaymentAccountingEntriesForReturns error:", e); return false; }
}

// ========== 💳 معالجة دفعات المرتجع ==========
function handleReturnPaymentsForReturns(formData, returnId, year, now, paymentsId, accMovId) {
  try {
    console.log(`💰 [handleReturnPaymentsForReturns] معالجة الدفعات للمرتجع: ${returnId}`);
    console.log(`📊 عدد الدفعات المرسلة: ${formData.payments ? formData.payments.length : 0}`);
    
    if (typeof deleteInvoicePayments === 'function') {
      deleteInvoicePayments(returnId, SALES_RETURN_REF_TYPES.SALES_RETURN, year);
      console.log("🗑️ تم حذف الدفعات القديمة");
    }
    
    if (!formData.payments || formData.payments.length === 0) {
      console.log("⚠️ لا توجد دفعات جديدة لإضافتها");
      return { success: true, message: "لا توجد دفعات", count: 0 };
    }
    
    var paymentsSheet = SpreadsheetApp.openById(paymentsId).getSheets()[0];
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
      paymentsSheet.appendRow([paymentId, year, paymentDate, SALES_RETURN_REF_TYPES.RETURN_PAYMENT, returnId, amount.toString(), formData.partner_id, payment.safe_id, payment.notes || '', now]);
      addedCount++;
      console.log(`✅ تمت إضافة الدفعة ${paymentId}`);
      if (accMovId) {
        recordPaymentAccountingEntriesForReturns(paymentId, paymentDate, year, now, accMovId, {
          amount: amount, customerId: formData.partner_id, safeId: payment.safe_id,
          refType: SALES_RETURN_REF_TYPES.RETURN_PAYMENT, refId: returnId
        });
      }
    }
    console.log(`📊 انتهى: تمت إضافة ${addedCount} دفعة`);
    return { success: true, message: "تمت معالجة " + addedCount + " دفعة", data: { count: addedCount } };
  } catch (e) {
    console.error("❌ handleReturnPaymentsForReturns error:", e);
    return { success: false, message: e.toString(), data: { count: 0 } };
  }
}

// ========== 💾 حفظ مرتجع المبيعات ==========
function saveSalesReturn(formData) {
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
    console.log("💾 [saveSalesReturn] بدء حفظ مرتجع المبيعات");
    console.log("=".repeat(60));
    
    if (!formData.return_date || formData.return_date.toString().trim() === '') {
      throw new Error("تاريخ المرتجع مطلوب");
    }
    if (!formData.warehouse_id) throw new Error("المستودع مطلوب");
    if (!formData.partner_id) throw new Error("العميل مطلوب");
    if (!formData.lines || formData.lines.length === 0) throw new Error("يجب إضافة صنف واحد على الأقل");
    
    var fy = getActiveFiscalYearForSalesReturns();
    var year = fy ? fy.year_code : null;
    console.log(`📅 السنة المالية: ${year}`);
    if (!year) throw new Error("لا توجد سنة مالية نشطة");
    
    if (fy && fy.date_from && fy.date_to) {
      var retDate = new Date(formData.return_date);
      var from = new Date(fy.date_from);
      var to = new Date(fy.date_to);
      if (retDate < from || retDate > to) {
        throw new Error("تاريخ المرتجع يجب أن يكون بين " + fy.date_from + " و " + fy.date_to);
      }
    }
    
    var companyTaxPercent = getCompanyTaxPercentage();
    console.log(`🧮 نسبة الضريبة من الإعدادات: ${companyTaxPercent}%`);
    
    var returnsId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Sales_Returns", year) : null;
    var detailsId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Sales_Return_Details", year) : null;
    var stockMovId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Stock_Movements", year) : null;
    var accMovId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Account_Movements", year) : null;
    var paymentsId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Payments", year) : null;
    var balanceId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Inventory_Balance", year) : null;
    
    console.log(`📋 جدول المرتجعات: ${returnsId ? '✓' : '✗'}`);
    console.log(`📋 جدول التفاصيل: ${detailsId ? '✓' : '✗'}`);
    console.log(`📋 جدول الحركات: ${stockMovId ? '✓' : '✗'}`);
    console.log(`📋 جدول الأرصدة: ${balanceId ? '✓' : '✗'}`);
    
    if (!returnsId || !detailsId) throw new Error("جداول مرتجعات المبيعات غير موجودة");
    
    var now = typeof getNowTimestamp === 'function' ? getNowTimestamp() : generateTimestamp();
    
    var subTotal = 0;
    if (formData.lines) {
      for (var i = 0; i < formData.lines.length; i++) {
        var line = formData.lines[i];
        subTotal += (parseFloat(line.qty) || 0) * (parseFloat(line.price) || 0);
      }
    }
    
    var taxAmount = subTotal * (companyTaxPercent / 100);
    var discount = parseFloat(formData.discount) || 0;
    var expAmount = parseFloat(formData.exp) || 0;
    var netTotal = subTotal + taxAmount + expAmount - discount;
    
    console.log(`📊 الحسابات: subTotal=${subTotal}, tax=${taxAmount}, discount=${discount}, net=${netTotal}`);
    
    var returnNo = formData.return_no || "SRE-" + (typeof generateID === 'function' ? generateID().toString().slice(-8).toUpperCase() : Date.now().toString().slice(-8));
    var returnId = formData.id || (typeof generateID === 'function' ? generateID() : generateUniqueId());
    
    console.log(`📄 معرف المرتجع: ${returnId}`);
    
    var returnRow = [
      returnId, returnNo, year, formData.return_date, formData.warehouse_id,
      formData.partner_id, formData.notes || "", subTotal.toString(), 
      taxAmount.toString(), expAmount.toString(), discount.toString(), 
      netTotal.toString(), "مكتمل", now
    ];
    
    var retSheet = SpreadsheetApp.openById(returnsId).getSheets()[0];
    
    if (formData.id) {
      console.log("🔄 تحديث مرتجع موجود...");
      var retData = retSheet.getDataRange().getDisplayValues();
      var found = false;
      for (var i = 1; i < retData.length; i++) {
        if (String(retData[i][0]) === String(returnId)) {
          retSheet.getRange(i + 1, 1, 1, returnRow.length).setValues([returnRow]);
          found = true; break;
        }
      }
      if (!found) throw new Error("لم يتم العثور على المرتجع للتحديث");
      if (stockMovId) {
        console.log("⚠️ عكس تأثيرات المخزون القديمة...");
        reverseSalesReturnInventoryEffectsForReturns(returnId, year);
      }
      if (typeof clearRelatedRecords === 'function') {
        clearRelatedRecords(detailsId, 1, returnId);
      }
      if (accMovId) clearSalesReturnAccountMovementsForReturns(accMovId, returnId);
    } else {
      console.log("➕ إنشاء مرتجع جديد...");
      retSheet.appendRow(returnRow);
    }
    
    console.log("📝 حفظ تفاصيل المرتجع...");
    var detailsSheet = SpreadsheetApp.openById(detailsId).getSheets()[0];
    if (formData.lines) {
      for (var li = 0; li < formData.lines.length; li++) {
        var line = formData.lines[li];
        detailsSheet.appendRow([
          typeof generateID === 'function' ? generateID() : generateUniqueId(),
          returnId, line.item_id, line.color_id || '',
          (line.qty || 0).toString(), (line.price || 0).toString(),
          ((line.qty || 0) * (line.price || 0)).toString(), line.notes || "", now
        ]);
      }
    }
    
    console.log("📦 تسجيل حركات المخزون (إدخال - IN)...");
    if (stockMovId && balanceId) {
      var stockResult = applySalesReturnInventoryEffectsForReturns(formData, returnId, year);
      console.log(`📦 نتيجة حركات المخزون: ${stockResult ? '✅ نجاح' : '❌ فشل'}`);
    } else {
      console.error("❌ جداول المخزون غير موجودة");
    }
    
    console.log("📊 تسجيل القيود المحاسبية...");
    if (accMovId) {
      recordSalesReturnAccountingEntriesForReturns(formData, returnId, year, now, accMovId, subTotal, taxAmount, discount, expAmount, netTotal);
    }
    
    console.log("💰 معالجة الدفعات...");
    if (paymentsId) {
      handleReturnPaymentsForReturns(formData, returnId, year, now, paymentsId, accMovId);
    }
    
    console.log("=".repeat(60));
    console.log("✅ [saveSalesReturn] انتهى الحفظ بنجاح");
    console.log("=".repeat(60) + "\n");
    
    // ✅ تم إصلاح السطر هنا - إضافة مفتاح "data" قبل الكائن
    return { 
      success: true, 
      message: formData.id ? "تم تحديث مرتجع المبيعات بنجاح" : "تم حفظ مرتجع المبيعات بنجاح",
      data: { return_id: returnId, return_no: returnNo } 
    };
    
  } catch (e) {
    console.error("❌ saveSalesReturn error:", e);
    return { success: false, message: "خطأ: " + e.toString() };
  }
}

// ========== 🗑️ حذف مرتجع المبيعات ==========
function deleteSalesReturn(id) {
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
    var year = getFiscalYearCodeForSalesReturns();
    if (!year) throw new Error("لا توجد سنة مالية نشطة");
    
    if (typeof getInvoicePayments === 'function') {
      var payments = getInvoicePayments(id, SALES_RETURN_REF_TYPES.SALES_RETURN, year);
      if (payments && payments.length > 0) {
        return {
          success: false,
          has_payments: true,
          payment_count: payments.length,
          message: "⚠️ لا يمكن الحذف لوجود " + payments.length + " دفعة مسجلة. استخدم الحذف الشامل."
        };
      }
    }
    
    var returnsId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Sales_Returns", year) : null;
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
      clearRelatedRecords(getYearlyTableId("Sales_Return_Details", year), 1, id);
    }
    
    reverseSalesReturnInventoryEffectsForReturns(id, year);
    if (typeof getYearlyTableId === 'function') {
      clearSalesReturnAccountMovementsForReturns(getYearlyTableId("Account_Movements", year), id);
    }
    
    return { success: true, message: "تم حذف مرتجع المبيعات بنجاح" };
  } catch (e) {
    console.error("❌ deleteSalesReturn error:", e);
    return { success: false, message: "خطأ: " + e.toString() };
  }
}

function deleteSalesReturnWithPayments(id) {
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
    var year = getFiscalYearCodeForSalesReturns();
    if (!year) throw new Error("لا توجد سنة مالية نشطة");
    if (typeof deleteInvoicePayments === 'function') {
      deleteInvoicePayments(id, SALES_RETURN_REF_TYPES.SALES_RETURN, year);
    }
    return deleteSalesReturn(id);
  } catch (e) {
    console.error("❌ deleteSalesReturnWithPayments error:", e);
    return { success: false, message: "خطأ: " + e.toString() };
  }
}

// ========== 🔍 دوال مساعدة للواجهات ==========
function getCustomerBalanceForSalesReturnForm(customerId) {
  if (typeof getCustomerBalance === 'function') { return getCustomerBalance(customerId); }
  return { balance: "0.00", display_balance: "0.00" };
}

// ========== 🧮 دوال حسابية ==========
function calculateSalesReturnTax(subTotal) {
  var taxPercent = getCompanyTaxPercentage();
  return (parseFloat(subTotal) || 0) * (taxPercent / 100);
}

function calculateSalesReturnNetTotal(subTotal, tax, discount, exp) {
  var st = parseFloat(subTotal) || 0;
  var tx = parseFloat(tax) || 0;
  var ds = parseFloat(discount) || 0;
  var ex = parseFloat(exp) || 0;
  return (st + tx + ex - ds).toFixed(2);
}

// ========== 🔗 دوال Alias للتوافق ==========
function getItemsForCurrentWarehouse(warehouseId) { return getItemsForSalesReturnDropdown(warehouseId); }
function getAvailableItemsForReturn(warehouseId) { return getItemsForSalesReturnDropdown(warehouseId); }
function getItemsForSalesReturnsAll(warehouseId) { return getItemsForSalesReturnDropdown(warehouseId); }

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
    console.log('ZEIOS ERP - SalesReturn data');
    console.log('Keys:', allKeys.length);
    return { success: true, count: allKeys.length, keys: allKeys };
  } catch (e) { console.error('Error:', e); return { success: false, error: e.toString() }; }
}

function getLibraryVersion() { return LIBRARY_VERSION; }
/**
 * الحصول على مرتجع مبيعات للتعديل المباشر
 */
function getSalesReturnForDirectEdit(returnId, fiscalYear) {
  try {
    if (!returnId) { return { success: false, message: '❌ معرف المرتجع مطلوب' }; }
    
    var year = typeof getFiscalYearCode === 'function' ? getFiscalYearCode(fiscalYear) : null;
    if (!year && typeof getFiscalYearInfo === 'function') {
      var fy = getFiscalYearInfo(fiscalYear);
      year = fy && fy.year_code ? fy.year_code : null;
    }
    if (!year) { year = new Date().getFullYear().toString(); }
    
    var tableId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Sales_Returns", year) : null;
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
          customer_id: data[i][5] || '', notes: data[i][6] || '',
          sub_total: parseFloat(data[i][7]) || 0, tax: parseFloat(data[i][8]) || 0,
          exp: parseFloat(data[i][9]) || 0, discount: parseFloat(data[i][10]) || 0,
          net_total: parseFloat(data[i][11]) || 0, status: data[i][12] || 'مكتمل',
          created_at: data[i][13] || ''
        };
        
        if (ret.customer_id && typeof getAccountInfo === 'function') {
          var account = getAccountInfo(ret.customer_id);
          if (account) {
            ret.customer_name = account.account_name || account.contact_name || '';
            ret.customer_phone = account.phone || '';
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
    var detailsId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Sales_Return_Details", year) : null;
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
    ret.payments = [];
    if (typeof getInvoicePayments === 'function') {
      ret.payments = getInvoicePayments(returnId, 'SALES_RETURN', year);
    }
    
    return { success: true, data: ret, message: 'تم جلب بيانات المرتجع بنجاح' };
    
  } catch (e) {
    console.error('❌ getSalesReturnForDirectEdit error:', e);
    return { success: false, message: 'خطأ: ' + e.toString() };
  }
}


/**
 * SalesReturn_client.gs – ZEIOS ERP SYSTEM (SHEET VERSION)
 * دوال بنفس أسماء المكتبة عشان الكود يشتغل من غير تعديل
 * 
 * ⚠️ قبل التشغيل: أضف المكتبة من Extensions → Libraries
 */

// ========== 🔗 ربط المكتبة ==========
var ZEIOS = ZEIOS; // غيّر للاسم اللي أنت سميته


// ========== 🔄 ثوابت ==========
var SALES_RETURN_REF_TYPES = ZEIOS.SALES_RETURN_REF_TYPES;

// ========== 📦 دوال البيانات الأساسية ==========
function getCustomersForSalesReturns() { try { return ZEIOS.getCustomersForSalesReturns(); } catch (e) { return []; } }
function getWarehousesForSalesReturns() { try { return ZEIOS.getWarehousesForSalesReturns(); } catch (e) { return []; } }
function getItemsForSalesReturns() { try { return ZEIOS.getItemsForSalesReturns(); } catch (e) { return []; } }
function getColorsForSalesReturns() { try { return ZEIOS.getColorsForSalesReturns(); } catch (e) { return []; } }
function getSafesForSalesReturns() { try { return ZEIOS.getSafesForSalesReturns(); } catch (e) { return []; } }

// ========== 🔍 دوال البحث ==========
function getItemCodeById(itemId) { try { return ZEIOS.getItemCodeById(itemId); } catch (e) { return ''; } }
function getItemNameById(itemId) { try { return ZEIOS.getItemNameById(itemId); } catch (e) { return ''; } }
function getColorCodeById(colorId) { try { return ZEIOS.getColorCodeById(colorId); } catch (e) { return ''; } }
function getColorNameById(colorId) { try { return ZEIOS.getColorNameById(colorId); } catch (e) { return ''; } }
function getWarehouseCodeById(warehouseId) { try { return ZEIOS.getWarehouseCodeById(warehouseId); } catch (e) { return ''; } }
function getWarehouseNameById(warehouseId) { try { return ZEIOS.getWarehouseNameById(warehouseId); } catch (e) { return 'غير معروف'; } }
function getCustomerNameById(customerId) { try { return ZEIOS.getCustomerNameById(customerId); } catch (e) { return ''; } }
function getCustomerPhoneById(customerId) { try { return ZEIOS.getCustomerPhoneById(customerId); } catch (e) { return ''; } }

// ========== 💰 الضريبة ==========
function getCompanyTaxPercentage() { try { return ZEIOS.getCompanyTaxPercentage(); } catch (e) { return 0; } }

// ========== 📅 السنة المالية ==========
function getActiveFiscalYearForSalesReturns() { try { return ZEIOS.getActiveFiscalYearForSalesReturns(); } catch (e) { return {year_code:null,is_active:false,date_from:'',date_to:'',folder_id:''}; } }
function getFiscalYearCodeForSalesReturns() { try { return ZEIOS.getFiscalYearCodeForSalesReturns(); } catch (e) { return null; } }

// ========== 📦 المخزون ==========
function applySalesReturnInventoryEffectsForReturns(formData, returnId, year) { try { return ZEIOS.applySalesReturnInventoryEffectsForReturns(formData, returnId, year); } catch (e) { return false; } }
function reverseSalesReturnInventoryEffectsForReturns(returnId, year) { try { return ZEIOS.reverseSalesReturnInventoryEffectsForReturns(returnId, year); } catch (e) { return false; } }

// ========== 📋 القوائم ==========
function getItemsForSalesReturnDropdown(warehouseId) { try { return ZEIOS.getItemsForSalesReturnDropdown(warehouseId); } catch (e) { return []; } }
function searchItemsInSalesReturnWarehouse(warehouseId, searchTerm) { try { return ZEIOS.searchItemsInSalesReturnWarehouse(warehouseId, searchTerm); } catch (e) { return []; } }
function getSalesReturnsList() { try { return ZEIOS.getSalesReturnsList(); } catch (e) { return []; } }
function getSalesReturnById(id) { try { return ZEIOS.getSalesReturnById(id); } catch (e) { return null; } }

// ========== 💾 حفظ/حذف ==========
function saveSalesReturn(formData) { try { return ZEIOS.saveSalesReturn(formData); } catch (e) { return {success:false,message:'❌ '+e.toString()}; } }
function deleteSalesReturn(id) { try { return ZEIOS.deleteSalesReturn(id); } catch (e) { return {success:false,message:'❌ '+e.toString()}; } }
function deleteSalesReturnWithPayments(id) { try { return ZEIOS.deleteSalesReturnWithPayments(id); } catch (e) { return {success:false,message:'❌ '+e.toString()}; } }

// ========== 🔍 مساعدة للواجهات ==========
function getCustomerBalanceForSalesReturnForm(customerId) { try { return ZEIOS.getCustomerBalanceForSalesReturnForm(customerId); } catch (e) { return {balance:"0.00",display_balance:"0.00"}; } }

// ========== 🧮 حسابات ==========
function calculateSalesReturnTax(subTotal) { try { return ZEIOS.calculateSalesReturnTax(subTotal); } catch (e) { return 0; } }
function calculateSalesReturnNetTotal(subTotal, tax, discount, exp) { try { return ZEIOS.calculateSalesReturnNetTotal(subTotal, tax, discount, exp); } catch (e) { return '0.00'; } }

// ========== 🔗 Alias ==========
function getItemsForCurrentWarehouse(warehouseId) { try { return ZEIOS.getItemsForCurrentWarehouse(warehouseId); } catch (e) { return []; } }
function getAvailableItemsForReturn(warehouseId) { try { return ZEIOS.getAvailableItemsForReturn(warehouseId); } catch (e) { return []; } }
function getItemsForSalesReturnsAll(warehouseId) { try { return ZEIOS.getItemsForSalesReturnsAll(warehouseId); } catch (e) { return []; } }

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

function openSalesReturnPage() {
  try {
    var pageName = 'sales_return';
    var title = '↩️ مرتجع المبيعات - ZEIOS ERP';
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
  } catch (e) { console.error("❌ openSalesReturnPage error:", e); return { success: false, message: e.toString() }; }
}

function openSalesReturnForm(returnId) {
  var id = returnId || null;
  try {
    var pageName = 'sales_return';
    var title = id ? '✏️ تعديل مرتجع مبيعات - ZEIOS ERP' : '➕ إضافة مرتجع مبيعات جديد - ZEIOS ERP';
    if (isSpreadsheetContext()) {
      var html = HtmlService.createHtmlOutputFromFile(pageName)
        .setTitle(title).setWidth(1200).setHeight(800)
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      SpreadsheetApp.getUi().showModalDialog(html, title);
      return { success: true, mode: "spreadsheet" };
    }
    var baseUrl = ScriptApp.getService() ? ScriptApp.getService().getUrl() : null;
    if (baseUrl) {
      var params = id ? '?page=sales_return&edit=' + encodeURIComponent(id) : '?page=sales_return&new=1';
      return { success: true, mode: "webapp", url: baseUrl + params };
    }
    return { success: false, message: "لا يمكن تحديد بيئة التشغيل" };
  } catch (e) { console.error("❌ openSalesReturnForm error:", e); return { success: false, message: e.toString() }; }
}
/**
 * ✅ دالة واجهة لاستدعاء جلب مرتجع مبيعات للتعديل المباشر
 * ⚠️ يجب أن تكون في مشروع الجدول (ليس في المكتبة)
 * ⚠️ مطلوبة من الـ HTML عبر google.script.run
 */
function getSalesReturnForDirectEdit(returnId, fiscalYear) {
  try {
    // ✅ التحقق من المدخلات
    if (!returnId) {
      return { success: false, message: '❌ معرف المرتجع مطلوب' };
    }
    
    // ✅ استدعاء الدالة من المكتبة إذا كانت متاحة
    if (typeof ZEIOS !== 'undefined' && typeof ZEIOS.getSalesReturnForDirectEdit === 'function') {
      return ZEIOS.getSalesReturnForDirectEdit(returnId, fiscalYear);
    }
    
    // ✅ Fallback: استدعاء الدالة المحلية إذا كانت موجودة في ملف آخر
    if (typeof getSalesReturnForDirectEdit === 'function' && 
        getSalesReturnForDirectEdit !== arguments.callee) {
      return getSalesReturnForDirectEdit(returnId, fiscalYear);
    }
    
    return { success: false, message: 'دالة جلب المرتجع غير متاحة' };
    
  } catch (e) {
    console.error('❌ getSalesReturnForDirectEdit (client) error:', e);
    return {
      success: false,
      message: 'خطأ: ' + e.toString(),
      error: e.toString()
    };
  }
}
