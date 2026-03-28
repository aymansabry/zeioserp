/**
 * Sales.gs – ZEIOS ERP SYSTEM (LIBRARY VERSION)
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


// ========== 🔄 أنواع مراجع المبيعات ==========
var SALE_REF_TYPES = {
  SALE: 'SALE',
  SALE_INVENTORY: 'SALE_INVENTORY',
  SALE_TAX: 'SALE_TAX',
  SALE_DISCOUNT: 'SALE_DISCOUNT',
  SHIPPING_EXPENSE_SALE: 'SHIPPING_EXPENSE_SALE',
  RECEIPT: 'RECEIPT'
};

// ========== 📦 دوال جلب البيانات الأساسية ==========
function getPartnersForSales() {
  try {
    if (typeof getAllParties === 'function') { return getAllParties(); }
    var customers = typeof getCustomers === 'function' ? getCustomers() : [];
    var suppliers = typeof getSuppliers === 'function' ? getSuppliers() : [];
    return customers.concat(suppliers);
  } catch (e) { console.error("❌ getPartnersForSales error:", e); return []; }
}

function getWarehousesForSales() {
  try { return typeof getWarehouses === 'function' ? getWarehouses() : []; }
  catch (e) { console.error("❌ getWarehousesForSales error:", e); return []; }
}

function getItemsForSales() {
  try { return typeof getItems === 'function' ? getItems() : []; }
  catch (e) { console.error("❌ getItemsForSales error:", e); return []; }
}

function getColorsForSales() {
  try { return typeof getColors === 'function' ? getColors() : []; }
  catch (e) { console.error("❌ getColorsForSales error:", e); return []; }
}

function getSafesForSales() {
  try { return typeof getSafes === 'function' ? getSafes() : []; }
  catch (e) { console.error("❌ getSafesForSales error:", e); return []; }
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
      if (String(colors[i].id) === String(colorId) || String(colors[i].color_code) === String(colorId)) {
        return colors[i].color_code || '';
      }
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
    var parties = getPartnersForSales();
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
    var parties = getPartnersForSales();
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

function calculateSaleTax(subTotal) {
  var taxPercent = getCompanyTaxPercentage();
  return (parseFloat(subTotal) || 0) * (taxPercent / 100);
}

function calculateSaleNetTotal(subTotal, tax, discount, exp) {
  var st = parseFloat(subTotal) || 0;
  var tx = parseFloat(tax) || 0;
  var ds = parseFloat(discount) || 0;
  var ex = parseFloat(exp) || 0;
  return (st + tx + ex - ds).toFixed(2);
}

// ========== 📅 دوال السنة المالية ==========
function getActiveFiscalYearForSales() {
  try {
    if (typeof getActiveFiscalYear === 'function') return getActiveFiscalYear();
    var year = typeof getSys === 'function' ? getSys("ACTIVE_FISCAL_YEAR") : null;
    if (year) return { year_code: year, is_active: true, date_from: '', date_to: '', folder_id: '' };
    return { year_code: null, is_active: false, date_from: '', date_to: '', folder_id: '' };
  } catch (e) { console.error("❌ getActiveFiscalYearForSales error:", e); return { year_code: null, is_active: false, date_from: '', date_to: '', folder_id: '' }; }
}

function getFiscalYearCodeForSales() {
  var fy = getActiveFiscalYearForSales();
  return fy && fy.year_code ? fy.year_code : (typeof getSys === 'function' ? getSys("ACTIVE_FISCAL_YEAR") : null);
}

// ========== 📦 دوال المخزون للمبيعات ==========
function addSaleStockMovementForSales(saleId, items, warehouseId, year) {
  try {
    year = year || getFiscalYearCodeForSales();
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
        type: 'out', refType: SALE_REF_TYPES.SALE_INVENTORY,
        refId: saleId, costPrice: costPrice, year: year,
        notes: 'مبيعات - فاتورة: ' + saleId
      }) : false;
      if (!result) success = false;
    }
    return success;
  } catch (e) { console.error("❌ addSaleStockMovementForSales error:", e); return false; }
}

function reverseSaleStockMovementForSales(saleId, year) {
  try {
    year = year || getFiscalYearCodeForSales();
    if (!year) return false;
    if (typeof deleteStockMovements === 'function') {
      return deleteStockMovements(SALE_REF_TYPES.SALE_INVENTORY, saleId, year);
    }
    return true;
  } catch (e) { console.error("❌ reverseSaleStockMovementForSales error:", e); return false; }
}

// ========== 📋 جلب قائمة المبيعات ==========
function getSalesList() {
  try {
    var year = getFiscalYearCodeForSales();
    if (!year) return [];
    var invoicesId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Sales_Invoices", year) : null;
    if (!invoicesId) return [];
    var invSheet = SpreadsheetApp.openById(invoicesId).getSheets()[0];
    var invData = invSheet.getDataRange().getDisplayValues();
    var sales = [];
    for (var i = 1; i < invData.length; i++) {
      sales.push({
        id: invData[i][0], invoice_no: invData[i][1], invoice_date: invData[i][3],
        warehouse_id: invData[i][4], warehouse_name: getWarehouseNameById(invData[i][4]),
        partner_id: invData[i][5], partner_name: getPartnerNameById(invData[i][5]),
        partner_type: getPartnerTypeById(invData[i][5]),
        sub_total: invData[i][7], tax: invData[i][8], exp: invData[i][9] || '0',
        discount: invData[i][10] || '0', net_total: invData[i][11],
        status: invData[i][12] || 'مكتمل'
      });
    }
    return sales;
  } catch (e) { console.error("❌ getSalesList error:", e); return []; }
}

// ========== 🔍 جلب فاتورة مبيعات بالتفصيل ==========
function getSaleById(id) {
  try {
    var year = getFiscalYearCodeForSales();
    if (!year) return null;
    var invoicesId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Sales_Invoices", year) : null;
    var detailsId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Sales_Invoice_Details", year) : null;
    var receiptsId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Receipts", year) : null;
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
    
    var detailsSheet = SpreadsheetApp.openById(detailsId).getSheets()[0];
    var detailsData = detailsSheet.getDataRange().getDisplayValues();
    var lines = [];
    for (var j = 1; j < detailsData.length; j++) {
      if (String(detailsData[j][1]) === String(id)) {
        lines.push({
          id: detailsData[j][0], item_id: detailsData[j][2],
          item_code: getItemCodeById(detailsData[j][2]),
          item_name: getItemNameById(detailsData[j][2]),
          item_image: getItemImageById(detailsData[j][2]),
          color_id: detailsData[j][3] || '',
          color_code: getColorCodeById(detailsData[j][3]),
          color_name: getColorNameById(detailsData[j][3]),
          qty: parseFloat(detailsData[j][4]) || 0,
          price: parseFloat(detailsData[j][5]) || 0,
          total: parseFloat(detailsData[j][6]) || 0,
          notes: detailsData[j][7] || ''
        });
      }
    }
    invoice.lines = lines;
    
    invoice.receipts = [];
    if (receiptsId) {
      var receiptsSheet = SpreadsheetApp.openById(receiptsId).getSheets()[0];
      var receiptsData = receiptsSheet.getDataRange().getDisplayValues();
      for (var k = 1; k < receiptsData.length; k++) {
        if (receiptsData[k][3] === SALE_REF_TYPES.RECEIPT && receiptsData[k][4] === String(id)) {
          var safes = getSafesForSales();
          var safeName = '';
          for (var sf = 0; sf < safes.length; sf++) {
            if (String(safes[sf].id) === String(receiptsData[k][7])) {
              safeName = safes[sf].account_name; break;
            }
          }
          invoice.receipts.push({
            id: receiptsData[k][0], date: receiptsData[k][2],
            amount: parseFloat(receiptsData[k][5]) || 0,
            account_id: receiptsData[k][6], safe_id: receiptsData[k][7],
            safe_name: safeName, notes: receiptsData[k][8] || ''
          });
        }
      }
    }
    return invoice;
  } catch (e) { console.error("❌ getSaleById error:", e); return null; }
}

// ========== 🗑️ مسح الحركات المحاسبية للمبيعات ==========
function clearSaleAccountMovementsForSales(sheetId, invoiceId, year) {
  if (!sheetId) return;
  try {
    var sheet = SpreadsheetApp.openById(sheetId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    var validTypes = [
      SALE_REF_TYPES.SALE, SALE_REF_TYPES.SALE_INVENTORY,
      SALE_REF_TYPES.SALE_TAX, SALE_REF_TYPES.SALE_DISCOUNT,
      SALE_REF_TYPES.SHIPPING_EXPENSE_SALE, SALE_REF_TYPES.RECEIPT
    ];
    for (var i = data.length - 1; i >= 1; i--) {
      var rowRefType = (data[i][4] || '').toString().trim();
      var rowRefId = (data[i][5] || '').toString().trim();
      var rowYear = (data[i][2] || '').toString().trim();
      if (validTypes.indexOf(rowRefType) !== -1 && rowRefId === String(invoiceId) && rowYear === String(year)) {
        sheet.deleteRow(i + 1);
      }
    }
  } catch (e) { console.error("❌ clearSaleAccountMovementsForSales error:", e); }
}

// ========== 📝 تسجيل القيود المحاسبية للمبيعات ==========
function recordSaleAccountingEntriesForSales(formData, invoiceId, year, now, accMovId, partnerId, warehouseId) {
  try {
    var accSheet = SpreadsheetApp.openById(accMovId).getSheets()[0];
    var subTotal = parseFloat(formData.sub_total) || 0;
    var taxAmount = parseFloat(formData.tax_amount) || 0;
    var discount = parseFloat(formData.discount) || 0;
    var expAmount = parseFloat(formData.exp) || 0;
    var netTotal = parseFloat(formData.net_total) || 0;
    
    var genId = function() { return typeof generateID === 'function' ? generateID() : generateUniqueId(); };
    
    var addMovement = function(accountId, amount, refType, isDebit) {
      if (!accountId || !amount || amount === 0) return;
      var normalSide = typeof getAccountNormalSide === 'function' ? getAccountNormalSide(accountId) : { normal_side: 'unknown' };
      var balance = 0; // Simplified for library compatibility
      var debit = isDebit ? amount.toString() : "0";
      var credit = isDebit ? "0" : amount.toString();
      var newBalance = balance + (isDebit ? amount : -amount);
      accSheet.appendRow([genId(), accountId, year, formData.invoice_date, refType, invoiceId, debit, credit, newBalance.toString(), now]);
    };
    
    var customerNet = subTotal + taxAmount - discount + expAmount;
    if (customerNet > 0) {
      addMovement(partnerId, customerNet, SALE_REF_TYPES.SALE, true);
    }
    if (subTotal > 0) {
      addMovement(typeof ACCOUNTS !== 'undefined' ? ACCOUNTS.SALES_REVENUE : '4000', subTotal, SALE_REF_TYPES.SALE, false);
    }
    if (taxAmount > 0) {
      addMovement(typeof ACCOUNTS !== 'undefined' ? ACCOUNTS.VAT_PAYABLE : '220001', taxAmount, SALE_REF_TYPES.SALE, false);
    }
    if (discount > 0) {
      addMovement(typeof ACCOUNTS !== 'undefined' ? ACCOUNTS.DISCOUNT_ALLOWED : '510001', discount, SALE_REF_TYPES.SALE, true);
    }
    if (expAmount > 0) {
      addMovement(typeof ACCOUNTS !== 'undefined' ? ACCOUNTS.SHIPPING_EXPENSE_OP : '600001', expAmount, SALE_REF_TYPES.SALE, false);
    }
    
    var totalCost = 0;
    if (formData.lines) {
      for (var i = 0; i < formData.lines.length; i++) {
        var line = formData.lines[i];
        var costPrice = parseFloat(line.cost_price || (typeof getItemCostPrice === 'function' ? getItemCostPrice(line.item_id) : 0) || 0);
        var qty = parseFloat(line.qty || 0);
        totalCost += costPrice * qty;
      }
    }
    if (totalCost > 0) {
      addMovement(typeof ACCOUNTS !== 'undefined' ? ACCOUNTS.COST_OF_SALES : '5000', totalCost, SALE_REF_TYPES.SALE_INVENTORY, true);
      addMovement(typeof ACCOUNTS !== 'undefined' ? ACCOUNTS.INVENTORY : '1300', totalCost, SALE_REF_TYPES.SALE_INVENTORY, false);
    }
    
    if (formData.payments && formData.payments.length > 0) {
      var receiptsId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Receipts", year) : null;
      if (receiptsId) {
        var receiptsSheet = SpreadsheetApp.openById(receiptsId).getSheets()[0];
        for (var i = 0; i < formData.payments.length; i++) {
          var payment = formData.payments[i];
          var amount = parseFloat(payment.amount) || 0;
          var safeId = payment.safe_id;
          var paymentDate = payment.date || formData.invoice_date;
          if (amount > 0 && safeId) {
            var receiptId = genId();
            receiptsSheet.appendRow([receiptId, year, paymentDate, SALE_REF_TYPES.RECEIPT, invoiceId, amount.toString(), partnerId, safeId, payment.notes || '', now]);
            addMovement(safeId, amount, SALE_REF_TYPES.RECEIPT, true);
            addMovement(partnerId, amount, SALE_REF_TYPES.RECEIPT, false);
          }
        }
      }
    }
    return true;
  } catch (e) { console.error("❌ recordSaleAccountingEntriesForSales error:", e); return false; }
}

// ========== 💾 حفظ فاتورة مبيعات ==========
function saveSale(formData) {
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
    var partnerId = formData.partner_id ? String(formData.partner_id).trim() : (formData.customer_id ? String(formData.customer_id).trim() : '');
    var warehouseId = (formData.warehouse_id || formData.store_id) ? String(formData.warehouse_id || formData.store_id).trim() : '';
    if (!partnerId) { throw new Error("الشريك (عميل/مورد) مطلوب"); }
    if (!warehouseId) throw new Error("المستودع مطلوب");
    
    var fy = getActiveFiscalYearForSales();
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
    
    var invoicesId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Sales_Invoices", year) : null;
    var detailsId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Sales_Invoice_Details", year) : null;
    var stockMovId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Stock_Movements", year) : null;
    var accMovId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Account_Movements", year) : null;
    if (!invoicesId || !detailsId) throw new Error("جداول المبيعات غير موجودة");
    
    var now = typeof getNowTimestamp === 'function' ? getNowTimestamp() : generateTimestamp();
    var subTotal = parseFloat(formData.sub_total) || 0;
    var taxAmount = parseFloat(formData.tax_amount) || 0;
    var discount = parseFloat(formData.discount) || 0;
    var expAmount = parseFloat(formData.exp) || 0;
    var netTotal = parseFloat(formData.net_total) || 0;
    var invoiceNo = formData.invoice_no || "SAL-" + (typeof generateID === 'function' ? generateID().toString().slice(-8).toUpperCase() : Date.now().toString().slice(-8));
    var invoiceId = formData.id || (typeof generateID === 'function' ? generateID() : generateUniqueId());
    
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
      if (stockMovId) reverseSaleStockMovementForSales(invoiceId, year);
      if (typeof clearRelatedRecords === 'function') clearRelatedRecords(detailsId, 1, invoiceId);
      if (accMovId) clearSaleAccountMovementsForSales(accMovId, invoiceId, year);
    } else {
      invSheet.appendRow(invoiceRow);
    }
    
    var detailsSheet = SpreadsheetApp.openById(detailsId).getSheets()[0];
    if (formData.lines) {
      for (var li = 0; li < formData.lines.length; li++) {
        var line = formData.lines[li];
        detailsSheet.appendRow([
          typeof generateID === 'function' ? generateID() : generateUniqueId(),
          invoiceId, line.item_id, line.color_id || '',
          (line.qty || 0).toString(), (line.price || line.sale_price || 0).toString(),
          (line.total || 0).toString(), line.notes || "", now
        ]);
      }
    }
    
    if (stockMovId) { addSaleStockMovementForSales(invoiceId, formData.lines, warehouseId, year); }
    if (accMovId) { recordSaleAccountingEntriesForSales(formData, invoiceId, year, now, accMovId, partnerId, warehouseId); }
    
    // ✅ تم إصلاح السطر هنا - إضافة مفتاح "data:" قبل الكائن
    return { 
      success: true, 
      message: formData.id ? "تم تحديث الفاتورة بنجاح" : "تم حفظ الفاتورة بنجاح", 
      data: { invoice_id: invoiceId, invoice_no: invoiceNo } 
    };
    
  } catch (e) {
    console.error("❌ saveSale error:", e);
    return { success: false, message: "خطأ: " + e.toString() };
  }
}

// ========== 🗑️ حذف فاتورة مبيعات ==========
function deleteSale(id) {
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
    var year = getFiscalYearCodeForSales();
    if (!year) throw new Error("لا توجد سنة مالية نشطة");
    
    if (typeof getInvoicePayments === 'function') {
      var receipts = getInvoicePayments(id, SALE_REF_TYPES.RECEIPT, year);
      if (receipts && receipts.length > 0) {
        return {
          success: false,
          has_payments: true,
          payment_count: receipts.length,
          message: "⚠️ لا يمكن الحذف لوجود " + receipts.length + " مقبوض مسجل. استخدم الحذف الشامل."
        };
      }
    }
    
    var invoicesId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Sales_Invoices", year) : null;
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
      clearRelatedRecords(getYearlyTableId("Sales_Invoice_Details", year), 1, id);
    }
    
    reverseSaleStockMovementForSales(id, year);
    if (typeof getYearlyTableId === 'function') {
      clearSaleAccountMovementsForSales(getYearlyTableId("Account_Movements", year), id, year);
    }
    
    return { success: true, message: "تم حذف الفاتورة بنجاح" };
  } catch (e) {
    console.error("❌ deleteSale error:", e);
    return { success: false, message: "خطأ: " + e.toString() };
  }
}

function deleteSaleWithPayments(id) {
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
    var year = getFiscalYearCodeForSales();
    if (!year) throw new Error("لا توجد سنة مالية نشطة");
    if (typeof deleteInvoicePayments === 'function') {
      deleteInvoicePayments(id, SALE_REF_TYPES.RECEIPT, year);
    }
    return deleteSale(id);
  } catch (e) {
    console.error("❌ deleteSaleWithPayments error:", e);
    return { success: false, message: "خطأ: " + e.toString() };
  }
}

// ========== 🔍 دوال مساعدة للواجهات ==========
function getPartnerBalanceForForm(partnerId) {
  if (typeof getPartnerBalance === 'function') { return getPartnerBalance(partnerId); }
  return { balance: "0.00", display_balance: "0.00" };
}

function validateStockBeforeSale(warehouseId, lines) {
  try {
    var year = getFiscalYearCodeForSales();
    if (!year) return { valid: false, message: "لا توجد سنة مالية نشطة" };
    var errors = [];
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var itemId = line.item_id || line.itemId || line.id;
      var colorId = line.color_id || line.colorId || '';
      var requestedQty = parseFloat(line.qty) || 0;
      var availableStock = typeof getCurrentStockBalance === 'function' ? getCurrentStockBalance(itemId, warehouseId, colorId, year) : 0;
      if (requestedQty > availableStock) {
        errors.push("البند " + (i + 1) + ": الكمية المطلوبة (" + requestedQty + ") > الرصيد المتاح (" + availableStock + ")");
      }
    }
    if (errors.length > 0) { return { valid: false, message: errors.join('\n') }; }
    return { valid: true };
  } catch (e) { console.error("❌ validateStockBeforeSale error:", e); return { valid: false, message: "خطأ في التحقق من الرصيد: " + e.toString() }; }
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
    console.log('ZEIOS ERP - Sales data');
    console.log('Keys:', allKeys.length);
    return { success: true, count: allKeys.length, keys: allKeys };
  } catch (e) { console.error('Error:', e); return { success: false, error: e.toString() }; }
}

function getLibraryVersion() { return LIBRARY_VERSION; }
/**
 * الحصول على فاتورة مبيعات للتعديل المباشر
 * ✅ تستخدم دوال core.gs مباشرة - بدون دوال مساعدة تبدأ بـ _
 */
function getSaleForDirectEdit(invoiceId, fiscalYear) {
  try {
    if (!invoiceId) { return { success: false, message: '❌ معرف الفاتورة مطلوب' }; }
    
    // السنة المالية
    var year = typeof getFiscalYearCode === 'function' ? getFiscalYearCode(fiscalYear) : null;
    if (!year && typeof getFiscalYearInfo === 'function') {
      var fy = getFiscalYearInfo(fiscalYear);
      year = fy && fy.year_code ? fy.year_code : null;
    }
    if (!year) { year = new Date().getFullYear().toString(); }
    
    // جدول الفواتير
    var tableId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Sale_Invoices", year) : null;
    if (!tableId) { return { success: false, message: '❌ جدول الفواتير غير موجود' }; }
    
    var ss = SpreadsheetApp.openById(tableId);
    var sheet = ss.getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    
    var invoice = null;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] && String(data[i][0]).trim() === String(invoiceId).trim()) {
        invoice = {
          id: data[i][0], invoice_no: data[i][1] || '', fiscal_year: data[i][2] || year,
          invoice_date: data[i][3] || '', warehouse_id: data[i][4] || '',
          customer_id: data[i][5] || '', notes: data[i][6] || '',
          sub_total: parseFloat(data[i][7]) || 0, tax: parseFloat(data[i][8]) || 0,
          exp: parseFloat(data[i][9]) || 0, discount: parseFloat(data[i][10]) || 0,
          net_total: parseFloat(data[i][11]) || 0, status: data[i][12] || 'مكتمل',
          created_at: data[i][13] || ''
        };
        
        // اسم العميل
        if (invoice.customer_id && typeof getAccountInfo === 'function') {
          var account = getAccountInfo(invoice.customer_id);
          if (account) {
            invoice.customer_name = account.account_name || account.contact_name || '';
            invoice.customer_phone = account.phone || '';
          }
        }
        // اسم المستودع
        if (typeof getWarehouseNameById === 'function') {
          invoice.warehouse_name = getWarehouseNameById(invoice.warehouse_id);
        }
        break;
      }
    }
    if (!invoice) { return { success: false, message: '❌ لم يتم العثور على الفاتورة' }; }
    
    // البنود
    invoice.lines = [];
    var detailsId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Sale_Invoice_Details", year) : null;
    if (detailsId) {
      var dSheet = SpreadsheetApp.openById(detailsId).getSheets()[0];
      var dData = dSheet.getDataRange().getDisplayValues();
      var items = typeof getItems === 'function' ? getItems() : [];
      var itemsMap = {};
      for (var idx = 0; idx < items.length; idx++) { itemsMap[items[idx].id] = items[idx]; }
      
      for (var j = 1; j < dData.length; j++) {
        if (dData[j][1] && String(dData[j][1]).trim() === String(invoiceId).trim()) {
          var itemId = dData[j][2] || '';
          var itemInfo = itemsMap[itemId] || {};
          invoice.lines.push({
            id: dData[j][0] || '', item_id: itemId,
            item_name: itemInfo.item_name || '', item_code: itemInfo.item_code || '',
            color_id: dData[j][3] || '', qty: parseFloat(dData[j][4]) || 0,
            price: parseFloat(dData[j][5]) || 0, total: parseFloat(dData[j][6]) || 0,
            notes: dData[j][7] || ''
          });
        }
      }
    }
    
    // الدفعات (القبض)
    invoice.receipts = [];
    if (typeof getInvoiceReceipts === 'function') {
      invoice.receipts = getInvoiceReceipts(invoiceId, 'SALE', year);
    }
    
    return { success: true, data: invoice, message: 'تم جلب بيانات الفاتورة بنجاح' };
    
  } catch (e) {
    console.error('❌ getSaleForDirectEdit error:', e);
    return { success: false, message: 'خطأ: ' + e.toString() };
  }
}


/**
 * Sales_client.gs – ZEIOS ERP SYSTEM (SHEET VERSION)
 * دوال بنفس أسماء المكتبة عشان الكود يشتغل من غير تعديل
 * 
 * ⚠️ قبل التشغيل: أضف المكتبة من Extensions → Libraries
 */

// ========== 🔗 ربط المكتبة ==========
var ZEIOS = ZEIOS; // غيّر للاسم اللي أنت سميته


// ========== 🔄 ثوابت ==========
var SALE_REF_TYPES = ZEIOS.SALE_REF_TYPES;

// ========== 📦 دوال البيانات الأساسية ==========
function getPartnersForSales() { try { return ZEIOS.getPartnersForSales(); } catch (e) { return []; } }
function getWarehousesForSales() { try { return ZEIOS.getWarehousesForSales(); } catch (e) { return []; } }
function getItemsForSales() { try { return ZEIOS.getItemsForSales(); } catch (e) { return []; } }
function getColorsForSales() { try { return ZEIOS.getColorsForSales(); } catch (e) { return []; } }
function getSafesForSales() { try { return ZEIOS.getSafesForSales(); } catch (e) { return []; } }

// ========== 🔍 دوال البحث ==========
function getItemCodeById(itemId) { try { return ZEIOS.getItemCodeById(itemId); } catch (e) { return ''; } }
function getItemNameById(itemId) { try { return ZEIOS.getItemNameById(itemId); } catch (e) { return ''; } }
function getItemImageById(itemId) { try { return ZEIOS.getItemImageById(itemId); } catch (e) { return ''; } }
function getColorCodeById(colorId) { try { return ZEIOS.getColorCodeById(colorId); } catch (e) { return ''; } }
function getColorNameById(colorId) { try { return ZEIOS.getColorNameById(colorId); } catch (e) { return ''; } }
function getWarehouseCodeById(warehouseId) { try { return ZEIOS.getWarehouseCodeById(warehouseId); } catch (e) { return warehouseId||''; } }
function getWarehouseNameById(warehouseId) { try { return ZEIOS.getWarehouseNameById(warehouseId); } catch (e) { return 'غير معروف'; } }
function getPartnerNameById(partnerId) { try { return ZEIOS.getPartnerNameById(partnerId); } catch (e) { return ''; } }
function getPartnerAccountNoById(partnerId) { try { return ZEIOS.getPartnerAccountNoById(partnerId); } catch (e) { return ''; } }
function getPartnerTypeById(partnerId) { try { return ZEIOS.getPartnerTypeById(partnerId); } catch (e) { return ''; } }

// ========== 💰 الضريبة والحسابات ==========
function getCompanyTaxPercentage() { try { return ZEIOS.getCompanyTaxPercentage(); } catch (e) { return 0; } }
function calculateSaleTax(subTotal) { try { return ZEIOS.calculateSaleTax(subTotal); } catch (e) { return 0; } }
function calculateSaleNetTotal(subTotal, tax, discount, exp) { try { return ZEIOS.calculateSaleNetTotal(subTotal, tax, discount, exp); } catch (e) { return '0.00'; } }

// ========== 📅 السنة المالية ==========
function getActiveFiscalYearForSales() { try { return ZEIOS.getActiveFiscalYearForSales(); } catch (e) { return {year_code:null,is_active:false,date_from:'',date_to:'',folder_id:''}; } }
function getFiscalYearCodeForSales() { try { return ZEIOS.getFiscalYearCodeForSales(); } catch (e) { return null; } }

// ========== 📦 المخزون ==========
function addSaleStockMovementForSales(saleId, items, warehouseId, year) { try { return ZEIOS.addSaleStockMovementForSales(saleId, items, warehouseId, year); } catch (e) { return false; } }
function reverseSaleStockMovementForSales(saleId, year) { try { return ZEIOS.reverseSaleStockMovementForSales(saleId, year); } catch (e) { return false; } }

// ========== 📋 قائمة المبيعات ==========
function getSalesList() { try { return ZEIOS.getSalesList(); } catch (e) { return []; } }
function getSaleById(id) { try { return ZEIOS.getSaleById(id); } catch (e) { return null; } }

// ========== 💾 حفظ/حذف ==========
function saveSale(formData) { try { return ZEIOS.saveSale(formData); } catch (e) { return {success:false,message:'❌ '+e.toString()}; } }
function deleteSale(id) { try { return ZEIOS.deleteSale(id); } catch (e) { return {success:false,message:'❌ '+e.toString()}; } }
function deleteSaleWithPayments(id) { try { return ZEIOS.deleteSaleWithPayments(id); } catch (e) { return {success:false,message:'❌ '+e.toString()}; } }

// ========== 🔍 مساعدة للواجهات ==========
function getPartnerBalanceForForm(partnerId) { try { return ZEIOS.getPartnerBalanceForForm(partnerId); } catch (e) { return {balance:"0.00",display_balance:"0.00"}; } }
function validateStockBeforeSale(warehouseId, lines) { try { return ZEIOS.validateStockBeforeSale(warehouseId, lines); } catch (e) { return {valid:false,message:e.toString()}; } }

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

function openSalesPage() {
  try {
    var pageName = 'sales';
    var title = '💰 إدارة المبيعات - ZEIOS ERP';
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
  } catch (e) { console.error("❌ openSalesPage error:", e); return { success: false, message: e.toString() }; }
}

function openSaleForm(saleId) {
  var id = saleId || null;
  try {
    var pageName = 'sales';
    var title = id ? '✏️ تعديل فاتورة مبيعات - ZEIOS ERP' : '➕ إضافة فاتورة مبيعات جديدة - ZEIOS ERP';
    if (isSpreadsheetContext()) {
      var html = HtmlService.createHtmlOutputFromFile(pageName)
        .setTitle(title).setWidth(1200).setHeight(800)
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      SpreadsheetApp.getUi().showModalDialog(html, title);
      return { success: true, mode: "spreadsheet" };
    }
    var baseUrl = ScriptApp.getService() ? ScriptApp.getService().getUrl() : null;
    if (baseUrl) {
      var params = id ? '?page=sales&edit=' + encodeURIComponent(id) : '?page=sales&new=1';
      return { success: true, mode: "webapp", url: baseUrl + params };
    }
    return { success: false, message: "لا يمكن تحديد بيئة التشغيل" };
  } catch (e) { console.error("❌ openSaleForm error:", e); return { success: false, message: e.toString() }; }
}
/**
 * ✅ دالة واجهة لاستدعاء جلب فاتورة مبيعات للتعديل المباشر
 * ⚠️ يجب أن تكون في مشروع الجدول (ليس في المكتبة)
 * ⚠️ مطلوبة من الـ HTML عبر google.script.run
 */
function getSaleForDirectEdit(invoiceId, fiscalYear) {
  try {
    // ✅ التحقق من المدخلات
    if (!invoiceId) {
      return { success: false, message: '❌ معرف الفاتورة مطلوب' };
    }
    
    // ✅ استدعاء الدالة من المكتبة إذا كانت متاحة
    if (typeof ZEIOS !== 'undefined' && typeof ZEIOS.getSaleForDirectEdit === 'function') {
      return ZEIOS.getSaleForDirectEdit(invoiceId, fiscalYear);
    }
    
    // ✅ Fallback: استدعاء الدالة المحلية إذا كانت موجودة في ملف آخر
    if (typeof getSaleForDirectEdit === 'function' && 
        getSaleForDirectEdit !== arguments.callee) {
      return getSaleForDirectEdit(invoiceId, fiscalYear);
    }
    
    return { success: false, message: 'دالة جلب الفاتورة غير متاحة' };
    
  } catch (e) {
    console.error('❌ getSaleForDirectEdit (client) error:', e);
    return {
      success: false,
      message: 'خطأ: ' + e.toString(),
      error: e.toString()
    };
  }
}
