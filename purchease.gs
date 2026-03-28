/**
 * Purchases.gs – ZEIOS ERP SYSTEM (LIBRARY VERSION)
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


// ========== 🔄 أنواع مراجع المشتريات ==========
var PURCHASE_REF_TYPES = {
  PURCHASE: 'PURCHASE',
  PURCHASE_INVENTORY: 'PURCHASE_INVENTORY',
  PURCHASE_TAX: 'PURCHASE_TAX',
  PURCHASE_DISCOUNT: 'PURCHASE_DISCOUNT',
  SHIPPING_EXPENSE_PURCHASE: 'SHIPPING_EXPENSE_PURCHASE',
  PAYMENT: 'PAYMENT'
};

// ========== 📦 دوال جلب البيانات الأساسية ==========
function getPartnersForPurchases() {
  try {
    if (typeof getAllParties === 'function') { return getAllParties(); }
    var customers = typeof getCustomers === 'function' ? getCustomers() : [];
    var suppliers = typeof getSuppliers === 'function' ? getSuppliers() : [];
    return customers.concat(suppliers);
  } catch (e) { console.error("❌ getPartnersForPurchases error:", e); return []; }
}

function getWarehousesForPurchases() {
  try { return typeof getWarehouses === 'function' ? getWarehouses() : []; }
  catch (e) { console.error("❌ getWarehousesForPurchases error:", e); return []; }
}

function getItemsForPurchases() {
  try { return typeof getItems === 'function' ? getItems() : []; }
  catch (e) { console.error("❌ getItemsForPurchases error:", e); return []; }
}

function getColorsForPurchases() {
  try { return typeof getColors === 'function' ? getColors() : []; }
  catch (e) { console.error("❌ getColorsForPurchases error:", e); return []; }
}

function getSafesForPurchases() {
  try { return typeof getSafes === 'function' ? getSafes() : []; }
  catch (e) { console.error("❌ getSafesForPurchases error:", e); return []; }
}

// ========== 🔍 دوال البحث بالمعرف ==========
function getItemCodeById(itemId) {
  try {
    if (!itemId) return '';
    var items = typeof getItems === 'function' ? getItems() : [];
    for (var i = 0; i < items.length; i++) {
      if (String(items[i].id) === String(itemId)) return items[i].item_code || '';
    }
    return '';
  } catch (e) { console.error("❌ getItemCodeById error:", e); return ''; }
}

function getItemNameById(itemId) {
  try {
    if (!itemId) return '';
    var items = typeof getItems === 'function' ? getItems() : [];
    for (var i = 0; i < items.length; i++) {
      if (String(items[i].id) === String(itemId)) return items[i].item_name || '';
    }
    return '';
  } catch (e) { console.error("❌ getItemNameById error:", e); return ''; }
}

function getItemImageById(itemId) {
  try {
    if (!itemId) return '';
    var items = typeof getItems === 'function' ? getItems() : [];
    for (var i = 0; i < items.length; i++) {
      if (String(items[i].id) === String(itemId)) {
        var imageId = items[i].item_image_id || '';
        if (imageId) { return 'https://drive.google.com/uc?export=view&id=' + imageId; }
      }
    }
    return '';
  } catch (e) { console.error("❌ getItemImageById error:", e); return ''; }
}

function getColorCodeById(colorId) {
  try {
    if (!colorId) return '';
    var colors = typeof getColors === 'function' ? getColors() : [];
    for (var i = 0; i < colors.length; i++) {
      if (String(colors[i].id) === String(colorId)) { return colors[i].color_code || ''; }
    }
    return '';
  } catch (e) { console.error("❌ getColorCodeById error:", e); return ''; }
}

function getColorNameById(colorId) {
  try {
    if (!colorId) return '';
    var colors = typeof getColors === 'function' ? getColors() : [];
    for (var i = 0; i < colors.length; i++) {
      if (String(colors[i].id) === String(colorId)) { return colors[i].color_name || ''; }
    }
    return '';
  } catch (e) { console.error("❌ getColorNameById error:", e); return ''; }
}

function getColorIdByCode(colorCode) {
  try {
    if (!colorCode) return '';
    var colors = typeof getColors === 'function' ? getColors() : [];
    for (var i = 0; i < colors.length; i++) {
      if (String(colors[i].color_code) === String(colorCode)) { return colors[i].id || ''; }
    }
    return '';
  } catch (e) { console.error("❌ getColorIdByCode error:", e); return ''; }
}

function getColorNameByCode(colorCode) {
  try {
    if (!colorCode) return '';
    var colors = typeof getColors === 'function' ? getColors() : [];
    for (var i = 0; i < colors.length; i++) {
      if (String(colors[i].color_code) === String(colorCode)) { return colors[i].color_name || colorCode; }
    }
    return colorCode || '';
  } catch (e) { console.error("❌ getColorNameByCode error:", e); return colorCode || ''; }
}

function getWarehouseCodeById(warehouseId) {
  try {
    if (!warehouseId) return '';
    var warehouses = typeof getWarehouses === 'function' ? getWarehouses() : [];
    for (var i = 0; i < warehouses.length; i++) {
      if (String(warehouses[i].id) === String(warehouseId)) { return warehouses[i].warehouse_code || warehouseId; }
    }
    return warehouseId;
  } catch (e) { console.error("❌ getWarehouseCodeById error:", e); return warehouseId || ''; }
}

function getWarehouseNameById(warehouseId) {
  try {
    if (!warehouseId) return 'غير معروف';
    var warehouses = typeof getWarehouses === 'function' ? getWarehouses() : [];
    for (var i = 0; i < warehouses.length; i++) {
      if (String(warehouses[i].id) === String(warehouseId)) { return warehouses[i].warehouse_name || 'غير معروف'; }
    }
    return 'غير معروف';
  } catch (e) { console.error("❌ getWarehouseNameById error:", e); return 'غير معروف'; }
}

function getPartnerNameById(partnerId) {
  try {
    if (!partnerId) return '';
    if (typeof getAccountInfo === 'function') {
      var acc = getAccountInfo(partnerId);
      if (acc) return acc.account_name || acc.contact_name || '';
    }
    var parties = getPartnersForPurchases();
    for (var i = 0; i < parties.length; i++) {
      if (String(parties[i].id) === String(partnerId)) { return parties[i].account_name || parties[i].contact_name || ''; }
    }
    return '';
  } catch (e) { console.error("❌ getPartnerNameById error:", e); return ''; }
}

function getPartnerAccountNoById(partnerId) {
  try {
    if (!partnerId) return '';
    if (typeof getAccountInfo === 'function') {
      var acc = getAccountInfo(partnerId);
      if (acc) return acc.account_no || '';
    }
    return '';
  } catch (e) { console.error("❌ getPartnerAccountNoById error:", e); return ''; }
}

function getPartnerTypeById(partnerId) {
  try {
    if (!partnerId) return '';
    if (typeof getAccountInfo === 'function') {
      var acc = getAccountInfo(partnerId);
      if (acc) {
        if (acc.bs_group === 'BS-A') return 'customer';
        if (acc.bs_group === 'BS-L') return 'supplier';
      }
    }
    var parties = getPartnersForPurchases();
    for (var i = 0; i < parties.length; i++) {
      if (String(parties[i].id) === String(partnerId)) { return parties[i].bs_group === 'BS-A' ? 'customer' : 'supplier'; }
    }
    return '';
  } catch (e) { console.error("❌ getPartnerTypeById error:", e); return ''; }
}

// ========== 💰 دوال الضريبة والحسابات ==========
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

function calculatePurchaseTax(subTotal) {
  var taxPercent = getCompanyTaxPercentage();
  return (parseFloat(subTotal) || 0) * (taxPercent / 100);
}

function calculatePurchaseNetTotal(subTotal, tax, discount, exp) {
  var st = parseFloat(subTotal) || 0;
  var tx = parseFloat(tax) || 0;
  var ds = parseFloat(discount) || 0;
  var ex = parseFloat(exp) || 0;
  return (st + tx + ex - ds).toFixed(2);
}

// ========== 📅 دوال السنة المالية ==========
function getActiveFiscalYearForPurchases() {
  try {
    if (typeof getActiveFiscalYear === 'function') return getActiveFiscalYear();
    var year = typeof getSys === 'function' ? getSys("ACTIVE_FISCAL_YEAR") : null;
    if (year) return { year_code: year, is_active: true, date_from: '', date_to: '', folder_id: '' };
    return { year_code: null, is_active: false, date_from: '', date_to: '', folder_id: '' };
  } catch (e) { console.error("❌ getActiveFiscalYearForPurchases error:", e); return { year_code: null, is_active: false, date_from: '', date_to: '', folder_id: '' }; }
}

function getFiscalYearCodeForPurchases() {
  var fy = getActiveFiscalYearForPurchases();
  return fy && fy.year_code ? fy.year_code : (typeof getSys === 'function' ? getSys("ACTIVE_FISCAL_YEAR") : null);
}

// ========== 📦 دوال المخزون للمشتريات ==========
function addPurchaseStockMovementForPurchases(purchaseId, items, warehouseId, year) {
  try {
    year = year || getFiscalYearCodeForPurchases();
    if (!year || !warehouseId) return false;
    var success = true;
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var itemId = item.item_id || item.itemId || item.id;
      var colorId = item.color_id || item.colorId || '';
      var quantity = parseFloat(item.qty || item.quantity || 0);
      var costPrice = parseFloat(item.cost_price || item.price || 0);
      if (!itemId || quantity <= 0) continue;
      var result = typeof addStockMovement === 'function' ? addStockMovement({
        itemId: itemId, warehouseId: warehouseId, colorId: colorId, quantity: quantity,
        type: 'in', refType: PURCHASE_REF_TYPES.PURCHASE_INVENTORY,
        refId: purchaseId, costPrice: costPrice, year: year,
        notes: 'فاتورة شراء: ' + purchaseId
      }) : false;
      if (!result) success = false;
    }
    return success;
  } catch (e) { console.error("❌ addPurchaseStockMovementForPurchases error:", e); return false; }
}

function reversePurchaseStockMovementForPurchases(purchaseId, year) {
  try {
    year = year || getFiscalYearCodeForPurchases();
    if (!year) return false;
    if (typeof deleteStockMovements === 'function') {
      return deleteStockMovements(PURCHASE_REF_TYPES.PURCHASE_INVENTORY, purchaseId, year);
    }
    return true;
  } catch (e) { console.error("❌ reversePurchaseStockMovementForPurchases error:", e); return false; }
}

// ========== 📋 جلب قائمة المشتريات ==========
function getPurchasesList() {
  try {
    var year = getFiscalYearCodeForPurchases();
    if (!year) return [];
    var invoicesId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Purchase_Invoices", year) : null;
    if (!invoicesId) return [];
    var invSheet = SpreadsheetApp.openById(invoicesId).getSheets()[0];
    var invData = invSheet.getDataRange().getDisplayValues();
    var purchases = [];
    for (var i = 1; i < invData.length; i++) {
      purchases.push({
        id: invData[i][0], invoice_no: invData[i][1], invoice_date: invData[i][3],
        warehouse_id: invData[i][4], warehouse_name: getWarehouseNameById(invData[i][4]),
        partner_id: invData[i][5], partner_name: getPartnerNameById(invData[i][5]),
        partner_type: getPartnerTypeById(invData[i][5]),
        sub_total: invData[i][7], tax: invData[i][8], exp: invData[i][9] || '0',
        discount: invData[i][10] || '0', net_total: invData[i][11],
        status: invData[i][12] || 'مكتمل'
      });
    }
    return purchases;
  } catch (e) { console.error("❌ getPurchasesList error:", e); return []; }
}

// ========== 🔍 جلب فاتورة بالتفصيل ==========
function getPurchaseById(id) {
  try {
    var year = getFiscalYearCodeForPurchases();
    if (!year) return null;
    var invoicesId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Purchase_Invoices", year) : null;
    var detailsId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Purchase_Invoice_Details", year) : null;
    var paymentsId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Payments", year) : null;
    if (!invoicesId || !detailsId) return null;
    
    var invSheet = SpreadsheetApp.openById(invoicesId).getSheets()[0];
    var invData = invSheet.getDataRange().getDisplayValues();
    var invoice = null;
    
    for (var i = 1; i < invData.length; i++) {
      if (String(invData[i][0]) === String(id)) {
        invoice = {
          id: invData[i][0], invoice_no: invData[i][1], fiscal_year: invData[i][2],
          invoice_date: invData[i][3], warehouse_id: invData[i][4],
          warehouse_name: getWarehouseNameById(invData[i][4]),
          partner_id: invData[i][5], partner_name: getPartnerNameById(invData[i][5]),
          partner_account_no: getPartnerAccountNoById(invData[i][5]),
          partner_type: getPartnerTypeById(invData[i][5]),
          notes: invData[i][6] || '',
          sub_total: parseFloat(invData[i][7]) || 0, tax: parseFloat(invData[i][8]) || 0,
          exp: parseFloat(invData[i][9]) || 0, discount: parseFloat(invData[i][10]) || 0,
          net_total: parseFloat(invData[i][11]) || 0,
          status: invData[i][12] || 'مكتمل', created_at: invData[i][13]
        };
        break;
      }
    }
    if (!invoice) return null;
    
    // جلب التفاصيل
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
          item_image: getItemImageById(detailsData[j][2]),
          color_id: colorId, color_code: getColorCodeById(colorId),
          color_name: getColorNameById(colorId),
          qty: parseFloat(detailsData[j][4]) || 0,
          price: parseFloat(detailsData[j][5]) || 0,
          total: parseFloat(detailsData[j][6]) || 0,
          notes: detailsData[j][7] || ''
        });
      }
    }
    invoice.lines = lines;
    
    // جلب الدفعات
    invoice.payments = [];
    if (paymentsId) {
      var paymentsSheet = SpreadsheetApp.openById(paymentsId).getSheets()[0];
      var paymentsData = paymentsSheet.getDataRange().getDisplayValues();
      for (var k = 1; k < paymentsData.length; k++) {
        if (paymentsData[k][3] === PURCHASE_REF_TYPES.PAYMENT && paymentsData[k][4] === String(id)) {
          var safes = getSafesForPurchases();
          var safeName = '';
          for (var sf = 0; sf < safes.length; sf++) {
            if (String(safes[sf].id) === String(paymentsData[k][7])) {
              safeName = safes[sf].account_name; break;
            }
          }
          invoice.payments.push({
            id: paymentsData[k][0], date: paymentsData[k][2],
            amount: parseFloat(paymentsData[k][5]) || 0,
            account_id: paymentsData[k][6], safe_id: paymentsData[k][7],
            safe_name: safeName, notes: paymentsData[k][8] || ''
          });
        }
      }
    }
    return invoice;
  } catch (e) { console.error("❌ getPurchaseById error:", e); return null; }
}

// ========== 💾 حفظ فاتورة شراء ==========
function savePurchase(formData) {
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
    if (!formData.invoice_date || String(formData.invoice_date).trim() === '') {
      throw new Error("تاريخ الفاتورة مطلوب");
    }
    var partnerId = formData.partner_id ? String(formData.partner_id).trim() : (formData.supplier_id ? String(formData.supplier_id).trim() : '');
    var warehouseId = formData.warehouse_id ? String(formData.warehouse_id).trim() : '';
    if (!partnerId) { throw new Error("الشريك (عميل/مورد) مطلوب"); }
    if (!warehouseId) throw new Error("المستودع مطلوب");
    
    var fy = getActiveFiscalYearForPurchases();
    var year = fy ? fy.year_code : null;
    if (!year) throw new Error("لا توجد سنة مالية نشطة");
    
    if (fy && fy.date_from && fy.date_to) {
      var invDate = new Date(formData.invoice_date);
      var from = new Date(fy.date_from);
      var to = new Date(fy.date_to);
      if (invDate < from || invDate > to) {
        throw new Error("تاريخ الفاتورة يجب أن يكون بين " + fy.date_from + " و " + fy.date_to);
      }
    }
    
    var invoicesId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Purchase_Invoices", year) : null;
    var detailsId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Purchase_Invoice_Details", year) : null;
    var stockMovId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Stock_Movements", year) : null;
    var accMovId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Account_Movements", year) : null;
    var paymentsId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Payments", year) : null;
    if (!invoicesId || !detailsId) throw new Error("جداول المشتريات غير موجودة");
    
    var now = typeof getNowTimestamp === 'function' ? getNowTimestamp() : generateTimestamp();
    var subTotal = parseFloat(formData.sub_total) || 0;
    var taxAmount = parseFloat(formData.tax_amount) || 0;
    var discount = parseFloat(formData.discount) || 0;
    var expAmount = parseFloat(formData.exp) || 0;
    var netTotal = parseFloat(formData.net_total) || 0;
    var invoiceNo = formData.invoice_no || "PUR-" + (typeof generateID === 'function' ? generateID().toString().slice(-8).toUpperCase() : Date.now().toString().slice(-8));
    var invoiceId = formData.id || (typeof generateID === 'function' ? generateID() : Date.now().toString());
    
    var invoiceRow = [
      invoiceId, invoiceNo, year, formData.invoice_date, warehouseId,
      partnerId, formData.notes || "", subTotal.toString(), taxAmount.toString(),
      expAmount.toString(), discount.toString(), netTotal.toString(), "مكتمل", now
    ];
    
    var invSheet = SpreadsheetApp.openById(invoicesId).getSheets()[0];
    if (formData.id) {
      var invData = invSheet.getDataRange().getDisplayValues();
      var found = false;
      for (var i = 1; i < invData.length; i++) {
        if (String(invData[i][0]) === String(invoiceId)) {
          invSheet.getRange(i + 1, 1, 1, invoiceRow.length).setValues([invoiceRow]);
          found = true; break;
        }
      }
      if (!found) throw new Error("لم يتم العثور على الفاتورة للتحديث");
      if (stockMovId) reversePurchaseStockMovementForPurchases(invoiceId, year);
      if (typeof clearRelatedRecords === 'function') clearRelatedRecords(detailsId, 1, invoiceId);
      if (accMovId) clearAccountMovementsForPurchases(accMovId, invoiceId, year);
    } else {
      invSheet.appendRow(invoiceRow);
    }
    
    // حفظ التفاصيل
    var detailsSheet = SpreadsheetApp.openById(detailsId).getSheets()[0];
    if (formData.lines) {
      for (var li = 0; li < formData.lines.length; li++) {
        var line = formData.lines[li];
        var colorId = line.color_id || '';
        detailsSheet.appendRow([
          typeof generateID === 'function' ? generateID() : Date.now().toString(),
          invoiceId, line.item_id, colorId,
          (line.qty || 0).toString(), (line.price || line.cost_price || 0).toString(),
          (line.total || 0).toString(), line.notes || "", now
        ]);
      }
    }
    
    updateItemPricesForPurchases(formData.lines);
    if (stockMovId) { addPurchaseStockMovementForPurchases(invoiceId, formData.lines, warehouseId, year); }
    if (accMovId) { recordPurchaseAccountingEntriesForPurchases(formData, invoiceId, year, now, accMovId, partnerId, warehouseId); }
    if (paymentsId) { handlePurchasePaymentsForPurchases(formData, invoiceId, year, now, paymentsId, accMovId); }
    
    // ✅ تم إصلاح السطر هنا - إضافة مفتاح "data:" قبل الكائن
    return { 
      success: true, 
      message: formData.id ? "تم تحديث الفاتورة بنجاح" : "تم حفظ الفاتورة بنجاح", 
      data: { invoice_id: invoiceId, invoice_no: invoiceNo } 
    };
    
  } catch (e) {
    console.error("❌ savePurchase error:", e);
    return { success: false, message: "خطأ: " + e.toString() };
  }
}

// ========== 🔄 تحديث أسعار الأصناف ==========
function updateItemPricesForPurchases(lines) {
  try {
    var itemsId = typeof getMasterTableId === 'function' ? getMasterTableId("Items") : null;
    if (!itemsId) return;
    var sheet = SpreadsheetApp.openById(itemsId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    if (lines) {
      for (var li = 0; li < lines.length; li++) {
        var line = lines[li];
        var price = parseFloat(line.price || line.cost_price || 0);
        if (price <= 0) continue;
        for (var i = 1; i < data.length; i++) {
          if (String(data[i][0]) === String(line.item_id)) {
            sheet.getRange(i + 1, 9).setValue(price);
            sheet.getRange(i + 1, 11).setValue(price);
            break;
          }
        }
      }
    }
  } catch (e) { console.error("❌ updateItemPricesForPurchases error:", e); }
}

// ========== 🗑️ مسح الحركات المحاسبية ==========
function clearAccountMovementsForPurchases(sheetId, invoiceId, year) {
  if (!sheetId) return;
  try {
    var sheet = SpreadsheetApp.openById(sheetId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    var validTypes = [
      PURCHASE_REF_TYPES.PURCHASE, PURCHASE_REF_TYPES.PURCHASE_INVENTORY,
      PURCHASE_REF_TYPES.PURCHASE_TAX, PURCHASE_REF_TYPES.PURCHASE_DISCOUNT,
      PURCHASE_REF_TYPES.SHIPPING_EXPENSE_PURCHASE, PURCHASE_REF_TYPES.PAYMENT
    ];
    for (var i = data.length - 1; i >= 1; i--) {
      var rowRefType = (data[i][4] || '').toString().trim();
      var rowRefId = (data[i][5] || '').toString().trim();
      var rowYear = (data[i][2] || '').toString().trim();
      var isValid = false;
      for (var v = 0; v < validTypes.length; v++) {
        if (validTypes[v] === rowRefType) { isValid = true; break; }
      }
      if (isValid && rowRefId === String(invoiceId) && rowYear === String(year)) {
        sheet.deleteRow(i + 1);
      }
    }
  } catch (e) { console.error("❌ clearAccountMovementsForPurchases error:", e); }
}

// ========== 💰 حساب رصيد الحساب ==========
function getAccountBalanceForPurchases(sheet, accountId, year) {
  try {
    var data = sheet.getDataRange().getDisplayValues();
    var balance = 0;
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][1]) === String(accountId) && String(data[i][2]) === String(year)) {
        var debit = parseFloat(data[i][6] || '0');
        var credit = parseFloat(data[i][7] || '0');
        balance += debit - credit;
      }
    }
    return balance;
  } catch (e) { console.error("❌ getAccountBalanceForPurchases error:", e); return 0; }
}

// ========== 📝 تسجيل القيود المحاسبية للمشتريات ==========
function recordPurchaseAccountingEntriesForPurchases(formData, invoiceId, year, now, accMovId, partnerId, warehouseId) {
  try {
    var accSheet = SpreadsheetApp.openById(accMovId).getSheets()[0];
    var subTotal = parseFloat(formData.sub_total) || 0;
    var taxAmount = parseFloat(formData.tax_amount) || 0;
    var discount = parseFloat(formData.discount) || 0;
    var expAmount = parseFloat(formData.exp) || 0;
    var netTotal = parseFloat(formData.net_total) || 0;
    
    var genId = function() { return typeof generateID === 'function' ? generateID() : Date.now().toString(); };
    
    var addMovement = function(accountId, amount, refType, refId, date, isDebit) {
      if (!accountId || !amount || amount === 0) return;
      var normalSide = typeof getAccountNormalSide === 'function' ? getAccountNormalSide(accountId) : { normal_side: 'unknown' };
      var balance = getAccountBalanceForPurchases(accSheet, accountId, year);
      var debit = "0", credit = "0", newBalance = balance;
      if (isDebit) {
        debit = amount.toString();
        if (normalSide.normal_side === 'debit') { newBalance = balance + amount; }
        else { newBalance = balance - amount; }
      } else {
        credit = amount.toString();
        if (normalSide.normal_side === 'credit') { newBalance = balance + amount; }
        else { newBalance = balance - amount; }
      }
      accSheet.appendRow([genId(), accountId, year, date, refType, refId, debit, credit, newBalance.toString(), now]);
    };
    
    if (subTotal > 0) {
      var inventoryAccountId = typeof ACCOUNTS !== 'undefined' ? ACCOUNTS.INVENTORY : '1300';
      addMovement(inventoryAccountId, subTotal, PURCHASE_REF_TYPES.PURCHASE_INVENTORY, invoiceId, formData.invoice_date, true);
    }
    if (taxAmount > 0) {
      var vatAccountId = typeof ACCOUNTS !== 'undefined' ? ACCOUNTS.VAT_PAYABLE : '220001';
      addMovement(vatAccountId, taxAmount, PURCHASE_REF_TYPES.PURCHASE_TAX, invoiceId, formData.invoice_date, true);
    }
    if (expAmount > 0) {
      var expAccountId = typeof ACCOUNTS !== 'undefined' ? ACCOUNTS.SHIPPING_EXPENSE_OP : '600001';
      addMovement(expAccountId, expAmount, PURCHASE_REF_TYPES.SHIPPING_EXPENSE_PURCHASE, invoiceId, formData.invoice_date, true);
    }
    if (netTotal > 0 && partnerId) {
      addMovement(partnerId, netTotal, PURCHASE_REF_TYPES.PURCHASE, invoiceId, formData.invoice_date, false);
    }
    if (discount > 0) {
      var discountAccountId = typeof ACCOUNTS !== 'undefined' ? ACCOUNTS.DISCOUNT_EARNED : '410001';
      addMovement(discountAccountId, discount, PURCHASE_REF_TYPES.PURCHASE_DISCOUNT, invoiceId, formData.invoice_date, false);
    }
  } catch (e) { console.error("❌ recordPurchaseAccountingEntriesForPurchases error:", e); }
}

// ========== 💳 معالجة الدفعات ==========
function handlePurchasePaymentsForPurchases(formData, invoiceId, year, now, paymentsId, accMovId) {
  try {
    if (!formData.payments || formData.payments.length === 0) {
      return { success: true, message: "لا توجد دفعات", count: 0 };
    }
    var partnerId = formData.partner_id ? String(formData.partner_id).trim() : (formData.supplier_id ? String(formData.supplier_id).trim() : '');
    if (!partnerId) throw new Error("لا يمكن معالجة الدفعات: الشريك غير محدد");
    
    deleteExistingPaymentsForPurchases(invoiceId, year, paymentsId, accMovId);
    
    var paymentsSheet = SpreadsheetApp.openById(paymentsId).getSheets()[0];
    var addedCount = 0;
    
    for (var i = 0; i < formData.payments.length; i++) {
      var payment = formData.payments[i];
      try {
        var amount = parseFloat(payment.amount);
        var safeId = payment.safe_id ? String(payment.safe_id).trim() : '';
        var paymentDate = payment.date || formData.invoice_date;
        if (!amount || amount <= 0 || !safeId) continue;
        
        var paymentId = typeof generateID === 'function' ? generateID() : Date.now().toString() + i;
        var paymentRow = [
          paymentId, year, paymentDate, PURCHASE_REF_TYPES.PAYMENT, invoiceId,
          amount.toString(), partnerId, safeId, payment.notes || '', now
        ];
        paymentsSheet.appendRow(paymentRow);
        
        if (accMovId) {
          var accountingSuccess = savePaymentAccountingEntriesForPurchases({
            paymentId: paymentId, paymentDate: paymentDate, year: year, now: now,
            accMovId: accMovId, amount: amount, partnerId: partnerId,
            safeId: safeId, invoiceId: invoiceId
          });
          if (accountingSuccess) addedCount++;
        } else {
          addedCount++;
        }
      } catch (paymentError) { console.error("❌ Payment error:", paymentError); }
    }
    
    // ✅ تم إصلاح السطر هنا - إضافة مفتاح "data:" قبل الكائن
    return { 
      success: true, 
      message: "تمت معالجة " + addedCount + " دفعة", 
      data: { count: addedCount } 
    };
    
  } catch (e) {
    console.error("❌ handlePurchasePaymentsForPurchases error:", e);
    // ✅ تم إصلاح السطر هنا أيضاً
    return { 
      success: false, 
      message: e.toString(), 
      data: { count: 0 } 
    };
  }
}

// ========== 🗑️ حذف الدفعات الموجودة ==========
function deleteExistingPaymentsForPurchases(invoiceId, year, paymentsId, accMovId) {
  try {
    if (typeof deleteInvoicePayments === 'function') {
      deleteInvoicePayments(invoiceId, PURCHASE_REF_TYPES.PAYMENT, year);
    }
    if (accMovId) {
      var sheet = SpreadsheetApp.openById(accMovId).getSheets()[0];
      var data = sheet.getDataRange().getDisplayValues();
      for (var i = data.length - 1; i >= 1; i--) {
        if (data[i][4] === PURCHASE_REF_TYPES.PAYMENT &&
            data[i][5] === String(invoiceId) &&
            data[i][2] === String(year)) {
          sheet.deleteRow(i + 1);
        }
      }
    }
  } catch (e) { console.error("❌ deleteExistingPaymentsForPurchases error:", e); }
}

// ========== 💾 تسجيل قيود الدفعات محاسبياً ==========
function savePaymentAccountingEntriesForPurchases(params) {
  try {
    var paymentId = params.paymentId;
    var paymentDate = params.paymentDate;
    var year = params.year;
    var now = params.now;
    var accMovId = params.accMovId;
    var amount = params.amount;
    var partnerId = params.partnerId;
    var safeId = params.safeId;
    var invoiceId = params.invoiceId;
    
    if (!partnerId || !safeId || !amount || amount <= 0) {
      throw new Error("بيانات غير صالحة لتسجيل القيود");
    }
    
    var accSheet = SpreadsheetApp.openById(accMovId).getSheets()[0];
    var genId = function() { return typeof generateID === 'function' ? generateID() : Date.now().toString(); };
    
    var addMovement = function(accountId, amount, isDebit) {
      var normalSide = typeof getAccountNormalSide === 'function' ? getAccountNormalSide(accountId) : { normal_side: 'unknown' };
      var balance = getAccountBalanceForPurchases(accSheet, accountId, year);
      var debit = "0", credit = "0", newBalance = balance;
      if (isDebit) {
        debit = amount.toString();
        if (normalSide.normal_side === 'debit') { newBalance = balance + amount; }
        else { newBalance = balance - amount; }
      } else {
        credit = amount.toString();
        if (normalSide.normal_side === 'credit') { newBalance = balance + amount; }
        else { newBalance = balance - amount; }
      }
      accSheet.appendRow([genId(), accountId, year, paymentDate, PURCHASE_REF_TYPES.PAYMENT, invoiceId, debit, credit, newBalance.toString(), now]);
    };
    
    addMovement(safeId, amount, false);
    addMovement(partnerId, amount, true);
    return true;
  } catch (e) {
    console.error("❌ savePaymentAccountingEntriesForPurchases error:", e);
    return false;
  }
}

// ========== 🗑️ حذف فاتورة شراء ==========
function deletePurchase(id) {
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
    var year = getFiscalYearCodeForPurchases();
    if (!year) throw new Error("لا توجد سنة مالية نشطة");
    
    if (typeof getInvoicePayments === 'function') {
      var payments = getInvoicePayments(id, PURCHASE_REF_TYPES.PAYMENT, year);
      if (payments && payments.length > 0) {
        return {
          success: false,
          has_payments: true,
          payment_count: payments.length,
          message: "⚠️ لا يمكن الحذف لوجود " + payments.length + " دفعة مسجلة. استخدم الحذف الشامل."
        };
      }
    }
    
    var invoicesId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Purchase_Invoices", year) : null;
    if (!invoicesId) throw new Error("جدول الفواتير غير موجود");
    
    var invSheet = SpreadsheetApp.openById(invoicesId).getSheets()[0];
    var invData = invSheet.getDataRange().getDisplayValues();
    for (var i = 1; i < invData.length; i++) {
      if (String(invData[i][0]) === String(id)) {
        invSheet.deleteRow(i + 1);
        break;
      }
    }
    
    if (typeof getYearlyTableId === 'function' && typeof clearRelatedRecords === 'function') {
      clearRelatedRecords(getYearlyTableId("Purchase_Invoice_Details", year), 1, id);
    }
    
    reversePurchaseStockMovementForPurchases(id, year);
    if (typeof getYearlyTableId === 'function') {
      clearAccountMovementsForPurchases(getYearlyTableId("Account_Movements", year), id, year);
    }
    
    return { success: true, message: "تم حذف الفاتورة بنجاح" };
  } catch (e) {
    console.error("❌ deletePurchase error:", e);
    return { success: false, message: "خطأ: " + e.toString() };
  }
}

function deletePurchaseWithPayments(id) {
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
    var year = getFiscalYearCodeForPurchases();
    if (!year) throw new Error("لا توجد سنة مالية نشطة");
    if (typeof deleteInvoicePayments === 'function') {
      deleteInvoicePayments(id, PURCHASE_REF_TYPES.PAYMENT, year);
    }
    return deletePurchase(id);
  } catch (e) {
    console.error("❌ deletePurchaseWithPayments error:", e);
    return { success: false, message: "خطأ: " + e.toString() };
  }
}

// ========== 🔍 دوال مساعدة للواجهات ==========
function getPartnerBalanceForForm(partnerId) {
  if (typeof getPartnerBalance === 'function') { return getPartnerBalance(partnerId); }
  return { balance: "0.00", display_balance: "0.00" };
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
    console.log('ZEIOS ERP - Purchases data');
    console.log('Keys:', allKeys.length);
    return { success: true, count: allKeys.length, keys: allKeys };
  } catch (e) { console.error('Error:', e); return { success: false, error: e.toString() }; }
}

function getLibraryVersion() { return LIBRARY_VERSION; }
/**
 * الحصول على فاتورة شراء للتعديل المباشر - نسخة المكتبة
 * @param {string} invoiceId - معرف الفاتورة
 * @param {string} fiscalYear - السنة المالية (اختياري)
 * @returns {Object} بيانات الفاتورة
 */
function getPurchaseForDirectEdit(invoiceId, fiscalYear) {
  try {
    console.log('📥 getPurchaseForDirectEdit called:', { invoiceId, fiscalYear });
    
    // التحقق من صحة المدخلات
    if (!invoiceId) {
      return { 
        success: false, 
        message: '❌ معرف الفاتورة مطلوب' 
      };
    }
    
    // استخدام دالة المكتبة لتحديد السنة المالية
    var year = fiscalYear;
    if (typeof ensureFiscalYear === 'function') {
      year = ensureFiscalYear(fiscalYear);
    } else if (typeof getFiscalYearCodeForPurchases === 'function') {
      year = getFiscalYearCodeForPurchases();
    } else if (typeof getFiscalYearCode === 'function') {
      year = getFiscalYearCode(fiscalYear);
    } else if (typeof getCurrentUserFiscalYear === 'function') {
      year = getCurrentUserFiscalYear();
    }
    
    if (!year) {
      return { 
        success: false, 
        message: '❌ السنة المالية غير محددة' 
      };
    }
    
    console.log('📅 Fiscal year:', year);
    
    // الحصول على معرف جدول الفواتير
    var tableId = null;
    if (typeof getYearlyTableId === 'function') {
      tableId = getYearlyTableId("Purchase_Invoices", year);
    }
    
    if (!tableId) {
      return { 
        success: false, 
        message: '❌ جدول الفواتير غير موجود للسنة: ' + year 
      };
    }
    
    // فتح جدول الفواتير
    var ss;
    try {
      ss = SpreadsheetApp.openById(tableId);
    } catch (e) {
      return { 
        success: false, 
        message: '❌ لا يمكن فتح جدول الفواتير: ' + e.toString() 
      };
    }
    
    var sheet = ss.getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    
    if (data.length <= 1) {
      return { 
        success: false, 
        message: '❌ لا توجد بيانات في جدول الفواتير' 
      };
    }
    
    // البحث عن الفاتورة
    var invoice = null;
    var rowIndex = -1;
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] && String(data[i][0]).trim() === String(invoiceId).trim()) {
        rowIndex = i + 1; // 1-based index للـ Range
        invoice = {
          id: data[i][0],
          invoice_no: data[i][1] || '',
          fiscal_year: data[i][2] || year,
          invoice_date: data[i][3] || '',
          warehouse_id: data[i][4] || '',
          supplier_id: data[i][5] || '',
          notes: data[i][6] || '',
          sub_total: parseFloat(data[i][7]) || 0,
          tax: parseFloat(data[i][8]) || 0,
          exp: parseFloat(data[i][9]) || 0,
          discount: parseFloat(data[i][10]) || 0,
          net_total: parseFloat(data[i][11]) || 0,
          status: data[i][12] || 'مكتمل',
          created_at: data[i][13] || '',
          row_index: rowIndex
        };
        
        // جلب اسم المورد
        if (invoice.supplier_id) {
          if (typeof getAccountInfo === 'function') {
            var account = getAccountInfo(invoice.supplier_id);
            if (account) {
              invoice.supplier_name = account.account_name || account.contact_name || '';
              invoice.supplier_phone = account.phone || '';
              invoice.supplier_account_no = account.account_no || '';
            }
          } else if (typeof getPartnerNameById === 'function') {
            invoice.supplier_name = getPartnerNameById(invoice.supplier_id);
          } else {
            invoice.supplier_name = invoice.supplier_id;
          }
        }
        
        // جلب اسم المستودع
        if (typeof getWarehouseNameById === 'function') {
          invoice.warehouse_name = getWarehouseNameById(invoice.warehouse_id);
        } else if (typeof getWarehouseName === 'function') {
          invoice.warehouse_name = getWarehouseName(invoice.warehouse_id);
        } else {
          invoice.warehouse_name = invoice.warehouse_id;
        }
        
        break;
      }
    }
    
    if (!invoice) {
      return { 
        success: false, 
        message: '❌ لم يتم العثور على الفاتورة: ' + invoiceId 
      };
    }
    
    // جلب تفاصيل الفاتورة (البنود)
    invoice.lines = [];
    var detailsId = null;
    
    if (typeof getYearlyTableId === 'function') {
      detailsId = getYearlyTableId("Purchase_Invoice_Details", year);
    }
    
    if (detailsId) {
      try {
        var dSheet = SpreadsheetApp.openById(detailsId).getSheets()[0];
        var dData = dSheet.getDataRange().getDisplayValues();
        
        // جلب الأصناف مرة واحدة للتحسين
        var items = [];
        if (typeof getItems === 'function') {
          items = getItems();
        } else if (typeof getItemsForPurchases === 'function') {
          items = getItemsForPurchases();
        }
        
        var itemsMap = {};
        for (var idx = 0; idx < items.length; idx++) {
          itemsMap[items[idx].id] = items[idx];
        }
        
        for (var j = 1; j < dData.length; j++) {
          if (dData[j][1] && String(dData[j][1]).trim() === String(invoiceId).trim()) {
            var itemId = dData[j][2] || '';
            var itemInfo = itemsMap[itemId] || {};
            
            var line = {
              id: dData[j][0] || '',
              item_id: itemId,
              item_name: itemInfo.item_name || '',
              item_code: itemInfo.item_code || '',
              item_image: itemInfo.item_image_url || '',
              color_id: dData[j][3] || '',
              qty: parseFloat(dData[j][4]) || 0,
              price: parseFloat(dData[j][5]) || 0,
              total: parseFloat(dData[j][6]) || 0,
              notes: dData[j][7] || ''
            };
            
            // جلب اسم اللون
            if (line.color_id) {
              if (typeof getColorNameById === 'function') {
                line.color_name = getColorNameById(line.color_id);
              } else if (typeof getColorName === 'function') {
                line.color_name = getColorName(line.color_id);
              } else {
                line.color_name = line.color_id;
              }
            }
            
            invoice.lines.push(line);
          }
        }
      } catch (e) {
        console.warn('⚠️ Error loading purchase details:', e);
      }
    }
    
    // جلب الدفعات
    invoice.payments = [];
    if (typeof getInvoicePayments === 'function') {
      try {
        invoice.payments = getInvoicePayments(invoiceId, 'PURCHASE', year);
      } catch (e) {
        console.warn('⚠️ Error loading payments:', e);
      }
    } else if (typeof getPurchasePayments === 'function') {
      try {
        invoice.payments = getPurchasePayments(invoiceId, year);
      } catch (e) {
        console.warn('⚠️ Error loading payments:', e);
      }
    }
    
    console.log('✅ Purchase found:', {
      id: invoice.id,
      invoice_no: invoice.invoice_no,
      lines_count: invoice.lines.length,
      payments_count: invoice.payments.length
    });
    
    return {
      success: true,
      data: invoice,
      message: 'تم جلب بيانات الفاتورة بنجاح'
    };
    
  } catch (e) {
    console.error('❌ Error in getPurchaseForDirectEdit:', e);
    return {
      success: false,
      message: 'خطأ: ' + e.toString(),
      error: e.toString()
    };
  }
}


/**
 * Purchases_client.gs – ZEIOS ERP SYSTEM (SHEET VERSION)
 * دوال بنفس أسماء المكتبة عشان الكود يشتغل من غير تعديل
 * 
 * ⚠️ قبل التشغيل: أضف المكتبة من Extensions → Libraries
 */

// ========== 🔗 ربط المكتبة ==========
var ZEIOS = ZEIOS; // غيّر للاسم اللي أنت سميته


// ========== 🔄 ثوابت ==========
var PURCHASE_REF_TYPES = ZEIOS.PURCHASE_REF_TYPES;

// ========== 📦 دوال البيانات الأساسية ==========
function getPartnersForPurchases() { try { return ZEIOS.getPartnersForPurchases(); } catch (e) { return []; } }
function getWarehousesForPurchases() { try { return ZEIOS.getWarehousesForPurchases(); } catch (e) { return []; } }
function getItemsForPurchases() { try { return ZEIOS.getItemsForPurchases(); } catch (e) { return []; } }
function getColorsForPurchases() { try { return ZEIOS.getColorsForPurchases(); } catch (e) { return []; } }
function getSafesForPurchases() { try { return ZEIOS.getSafesForPurchases(); } catch (e) { return []; } }

// ========== 🔍 دوال البحث ==========
function getItemCodeById(itemId) { try { return ZEIOS.getItemCodeById(itemId); } catch (e) { return ''; } }
function getItemNameById(itemId) { try { return ZEIOS.getItemNameById(itemId); } catch (e) { return ''; } }
function getItemImageById(itemId) { try { return ZEIOS.getItemImageById(itemId); } catch (e) { return ''; } }
function getColorCodeById(colorId) { try { return ZEIOS.getColorCodeById(colorId); } catch (e) { return ''; } }
function getColorNameById(colorId) { try { return ZEIOS.getColorNameById(colorId); } catch (e) { return ''; } }
function getColorIdByCode(colorCode) { try { return ZEIOS.getColorIdByCode(colorCode); } catch (e) { return ''; } }
function getColorNameByCode(colorCode) { try { return ZEIOS.getColorNameByCode(colorCode); } catch (e) { return colorCode||''; } }
function getWarehouseCodeById(warehouseId) { try { return ZEIOS.getWarehouseCodeById(warehouseId); } catch (e) { return warehouseId||''; } }
function getWarehouseNameById(warehouseId) { try { return ZEIOS.getWarehouseNameById(warehouseId); } catch (e) { return 'غير معروف'; } }
function getPartnerNameById(partnerId) { try { return ZEIOS.getPartnerNameById(partnerId); } catch (e) { return ''; } }
function getPartnerAccountNoById(partnerId) { try { return ZEIOS.getPartnerAccountNoById(partnerId); } catch (e) { return ''; } }
function getPartnerTypeById(partnerId) { try { return ZEIOS.getPartnerTypeById(partnerId); } catch (e) { return ''; } }

// ========== 💰 الضريبة والحسابات ==========
function getCompanyTaxPercentage() { try { return ZEIOS.getCompanyTaxPercentage(); } catch (e) { return 0; } }
function calculatePurchaseTax(subTotal) { try { return ZEIOS.calculatePurchaseTax(subTotal); } catch (e) { return 0; } }
function calculatePurchaseNetTotal(subTotal, tax, discount, exp) { try { return ZEIOS.calculatePurchaseNetTotal(subTotal, tax, discount, exp); } catch (e) { return '0.00'; } }

// ========== 📅 السنة المالية ==========
function getActiveFiscalYearForPurchases() { try { return ZEIOS.getActiveFiscalYearForPurchases(); } catch (e) { return {year_code:null,is_active:false,date_from:'',date_to:'',folder_id:''}; } }
function getFiscalYearCodeForPurchases() { try { return ZEIOS.getFiscalYearCodeForPurchases(); } catch (e) { return null; } }

// ========== 📦 المخزون ==========
function addPurchaseStockMovementForPurchases(purchaseId, items, warehouseId, year) { try { return ZEIOS.addPurchaseStockMovementForPurchases(purchaseId, items, warehouseId, year); } catch (e) { return false; } }
function reversePurchaseStockMovementForPurchases(purchaseId, year) { try { return ZEIOS.reversePurchaseStockMovementForPurchases(purchaseId, year); } catch (e) { return false; } }

// ========== 📋 قائمة المشتريات ==========
function getPurchasesList() { try { return ZEIOS.getPurchasesList(); } catch (e) { return []; } }
function getPurchaseById(id) { try { return ZEIOS.getPurchaseById(id); } catch (e) { return null; } }

// ========== 💾 حفظ/حذف ==========
function savePurchase(formData) { try { return ZEIOS.savePurchase(formData); } catch (e) { return {success:false,message:'❌ '+e.toString()}; } }
function deletePurchase(id) { try { return ZEIOS.deletePurchase(id); } catch (e) { return {success:false,message:'❌ '+e.toString()}; } }
function deletePurchaseWithPayments(id) { try { return ZEIOS.deletePurchaseWithPayments(id); } catch (e) { return {success:false,message:'❌ '+e.toString()}; } }

// ========== 🔍 مساعدة للواجهات ==========
function getPartnerBalanceForForm(partnerId) { try { return ZEIOS.getPartnerBalanceForForm(partnerId); } catch (e) { return {balance:"0.00",display_balance:"0.00"}; } }

// ========== 🔧 مساعدة ==========
function generateTimestamp() { try { return ZEIOS.generateTimestamp(); } catch (e) { return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss'); } }
function generateUniqueId() { try { return ZEIOS.generateUniqueId(); } catch (e) { return Utilities.getUuid().replace(/-/g, ''); } }
function showStoredDataInLog() { try { return ZEIOS.showStoredDataInLog(); } catch (e) { return {success:false,error:e.toString()}; } }
function getLibraryVersion() { try { return ZEIOS.getLibraryVersion(); } catch (e) { return 'غير متصل'; } }

// ========== 🎨 دوال الواجهة (في الشيت فقط - مش في المكتبة) ==========
function openPurchasesPage() {
  try {
    var pageName = 'purchases';
    var title = '🛒 إدارة المشتريات - ZEIOS ERP';
    if (typeof isSpreadsheetContext === 'function' ? isSpreadsheetContext() : true) {
      var html = HtmlService.createHtmlOutputFromFile(pageName)
        .setTitle(title).setWidth(1400).setHeight(900)
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      SpreadsheetApp.getUi().showModalDialog(html, title);
      return { success: true, mode: "spreadsheet" };
    }
    var baseUrl = ScriptApp.getService() ? ScriptApp.getService().getUrl() : null;
    if (baseUrl) return { success: true, mode: "webapp", url: baseUrl + "?page=" + pageName };
    return { success: false, message: "لا يمكن تحديد بيئة التشغيل" };
  } catch (e) { console.error("❌ openPurchasesPage error:", e); return { success: false, message: e.toString() }; }
}

function openPurchaseForm(purchaseId) {
  var id = purchaseId || null;
  try {
    var pageName = 'purchases';
    var title = id ? '✏️ تعديل فاتورة شراء - ZEIOS ERP' : '➕ إضافة فاتورة شراء جديدة - ZEIOS ERP';
    if (typeof isSpreadsheetContext === 'function' ? isSpreadsheetContext() : true) {
      var html = HtmlService.createHtmlOutputFromFile(pageName)
        .setTitle(title).setWidth(1200).setHeight(800)
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      SpreadsheetApp.getUi().showModalDialog(html, title);
      return { success: true, mode: "spreadsheet" };
    }
    var baseUrl = ScriptApp.getService() ? ScriptApp.getService().getUrl() : null;
    if (baseUrl) {
      var params = id ? '?page=purchases&edit=' + encodeURIComponent(id) : '?page=purchases&new=1';
      return { success: true, mode: "webapp", url: baseUrl + params };
    }
    return { success: false, message: "لا يمكن تحديد بيئة التشغيل" };
  } catch (e) { console.error("❌ openPurchaseForm error:", e); return { success: false, message: e.toString() }; }
}
/**
 * ✅ دالة واجهة لاستدعاء جلب فاتورة مشتريات للتعديل المباشر
 * ⚠️ يجب أن تكون في مشروع الجدول (ليس في المكتبة)
 * ⚠️ مطلوبة من الـ HTML عبر google.script.run
 */
function getPurchaseForDirectEdit(invoiceId, fiscalYear) {
  try {
    // ✅ التحقق من المدخلات
    if (!invoiceId) {
      return { success: false, message: '❌ معرف الفاتورة مطلوب' };
    }
    
    // ✅ استدعاء الدالة من المكتبة إذا كانت متاحة
    if (typeof ZEIOS !== 'undefined' && typeof ZEIOS.getPurchaseForDirectEdit === 'function') {
      return ZEIOS.getPurchaseForDirectEdit(invoiceId, fiscalYear);
    }
    
    // ✅ Fallback: استدعاء الدالة المحلية إذا كانت موجودة في core.gs
    if (typeof getPurchaseForDirectEdit === 'function' && 
        getPurchaseForDirectEdit !== arguments.callee) {
      return getPurchaseForDirectEdit(invoiceId, fiscalYear);
    }
    
    return { success: false, message: 'دالة جلب الفاتورة غير متاحة' };
    
  } catch (e) {
    console.error('❌ getPurchaseForDirectEdit (client) error:', e);
    return {
      success: false,
      message: 'خطأ: ' + e.toString(),
      error: e.toString()
    };
  }
}
