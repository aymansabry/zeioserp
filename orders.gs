/**
 * Orders.gs – ZEIOS ERP SYSTEM (LIBRARY VERSION)
 * الإصدار: 3.3.1
 * وحدة إدارة طلبيات العملاء - متوافقة مع core.gs
 * 
 * 📞 الدعم: zeioszeios0@gmail.com | WhatsApp: 00201205951462
 */

// ========== ثوابت النظام ==========
var ORDER_REF_TYPES = {
  ORDER: 'ORDER',
  ORDER_PAYMENT: 'ORDER_PAYMENT',
  INVOICE_FROM_ORDER: 'INVOICE_FROM_ORDER'
};

var ORDER_STATUS = {
  NEW: 'جديد',
  PROCESSING: 'قيد التجهيز',
  PARTIAL: 'جزئي',
  COMPLETED: 'مكتمل',
  CANCELLED: 'ملغي'
};

// ========== دوال السنة المالية الموحدة (تستخدم core.gs) ==========

/**
 * الحصول على معلومات السنة المالية
 */
function getOrdersFiscalYearInfo(fiscalYear) {
  // استخدام الدالة الموحدة من core.gs
  if (typeof getFiscalYearInfo === 'function') {
    return getFiscalYearInfo(fiscalYear);
  }
  
  // Fallback
  try {
    var year = null;
    if (fiscalYear && String(fiscalYear).trim() !== '') {
      year = String(fiscalYear).trim();
      return { year_code: year, is_active: true, date_from: '', date_to: '', folder_id: '' };
    }
    if (typeof getCurrentUserFiscalYear === 'function') {
      year = getCurrentUserFiscalYear();
      if (year) {
        return { year_code: year, is_active: true, date_from: '', date_to: '', folder_id: '' };
      }
    }
    if (typeof getActiveFiscalYear === 'function') {
      return getActiveFiscalYear();
    }
    year = new Date().getFullYear().toString();
    return { year_code: year, is_active: true, date_from: '', date_to: '', folder_id: '' };
  } catch (e) {
    console.error("❌ خطأ في getOrdersFiscalYearInfo:", e);
    return { year_code: null, is_active: false, date_from: '', date_to: '', folder_id: '' };
  }
}

/**
 * الحصول على كود السنة فقط
 */
function getOrdersFiscalYearCode(fiscalYear) {
  var fy = getOrdersFiscalYearInfo(fiscalYear);
  return fy && fy.year_code ? fy.year_code : null;
}

/**
 * الحصول على معرف الجدول السنوي
 */
function getOrdersYearlyTableId(tableName, fiscalYear) {
  var year = getOrdersFiscalYearCode(fiscalYear);
  if (!year) return null;
  return typeof getYearlyTableId === 'function' ? getYearlyTableId(tableName, year) : null;
}

/**
 * الحصول على معرف الجدول الرئيسي
 */
function getOrdersMasterTableId(tableName) {
  return typeof getMasterTableId === 'function' ? getMasterTableId(tableName) : null;
}

// ========== دوال مساعدة داخلية ==========

function generateOrdersId() {
  return typeof generateID === 'function' ? generateID() : Utilities.getUuid().replace(/-/g, '');
}

function getOrdersNowTimestamp() {
  return typeof getNowTimestamp === 'function' ? getNowTimestamp() : Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
}

function getOrdersTodayDate() {
  return typeof getTodayDate === 'function' ? getTodayDate() : Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
}

function clearOrdersRelatedRecords(sheetId, refColIndex, refId) {
  if (typeof clearRelatedRecords === 'function') {
    clearRelatedRecords(sheetId, refColIndex, refId);
  } else if (sheetId) {
    try {
      var sheet = SpreadsheetApp.openById(sheetId).getSheets()[0];
      var data = sheet.getDataRange().getDisplayValues();
      for (var i = data.length - 1; i >= 1; i--) {
        if (String(data[i][refColIndex]) === String(refId)) {
          sheet.deleteRow(i + 1);
        }
      }
    } catch(e) {}
  }
}

// ========== دوال جلب البيانات للطلبيات ==========

function getAllPartiesForOrders() {
  try {
    if (typeof getAllParties === 'function') {
      var parties = getAllParties();
      return parties.map(function(p) {
        return {
          id: p.id,
          account_no: p.account_no,
          account_name: p.account_name,
          contact_name: p.contact_name || p.account_name,
          phone: p.phone || '',
          party_type: p.bs_group === 'BS-A' ? 'customer' : (p.bs_group === 'BS-L' ? 'supplier' : 'other')
        };
      });
    }
    return [];
  } catch (e) {
    console.error('خطأ في getAllPartiesForOrders:', e);
    return [];
  }
}

function getSafesForOrders() {
  try { return typeof getSafes === 'function' ? getSafes() : []; }
  catch (e) { return []; }
}

function getWarehousesForOrders() {
  try { return typeof getWarehouses === 'function' ? getWarehouses() : []; }
  catch (e) { return []; }
}

function getColorsForOrders() {
  try { return typeof getColors === 'function' ? getColors() : []; }
  catch (e) { return []; }
}

function getItemsForOrders() {
  try { return typeof getItems === 'function' ? getItems() : []; }
  catch (e) { return []; }
}

function getPartyBalanceForOrderForm(partyId, fiscalYear) {
  try {
    var year = getOrdersFiscalYearCode(fiscalYear);
    if (typeof getPartnerBalanceWithYear === 'function' && year) {
      return getPartnerBalanceWithYear(partyId, year);
    }
    if (typeof getPartnerBalance === 'function') {
      return getPartnerBalance(partyId, year);
    }
    return { balance: "0.00", display_balance: "0.00" };
  } catch (e) {
    return { balance: "0.00", display_balance: "0.00" };
  }
}

function getPartyNameById(partyId) {
  try {
    if (!partyId) return '';
    if (typeof getPartnerNameById === 'function') return getPartnerNameById(partyId);
    var parties = getAllPartiesForOrders();
    for (var i = 0; i < parties.length; i++) {
      if (String(parties[i].id) === String(partyId)) return parties[i].account_name || parties[i].contact_name || '';
    }
    return '';
  } catch (e) { return ''; }
}

function getPartyPhoneById(partyId) {
  try {
    var parties = getAllPartiesForOrders();
    for (var i = 0; i < parties.length; i++) {
      if (String(parties[i].id) === String(partyId)) return parties[i].phone || '';
    }
    return '';
  } catch (e) { return ''; }
}

function getWarehouseNameById(warehouseId) {
  try {
    if (!warehouseId) return 'غير معروف';
    if (typeof getWarehouseNameById === 'function') {
      return getWarehouseNameById(warehouseId);
    }
    var warehouses = getWarehousesForOrders();
    for (var i = 0; i < warehouses.length; i++) {
      if (String(warehouses[i].id) === String(warehouseId)) return warehouses[i].warehouse_name;
    }
    return 'غير معروف';
  } catch (e) { return 'غير معروف'; }
}

function getItemCodeById(itemId) {
  try {
    if (!itemId) return '';
    var items = getItemsForOrders();
    for (var i = 0; i < items.length; i++) {
      if (String(items[i].id) === String(itemId)) return items[i].item_code;
    }
    return '';
  } catch (e) { return ''; }
}

function getItemNameById(itemId) {
  try {
    if (!itemId) return '';
    var items = getItemsForOrders();
    for (var i = 0; i < items.length; i++) {
      if (String(items[i].id) === String(itemId)) return items[i].item_name;
    }
    return '';
  } catch (e) { return ''; }
}

function getColorCodeById(colorId) {
  try {
    if (!colorId) return '';
    var colors = getColorsForOrders();
    for (var i = 0; i < colors.length; i++) {
      if (String(colors[i].id) === String(colorId)) return colors[i].color_code;
    }
    return '';
  } catch (e) { return ''; }
}

function getColorNameById(colorId) {
  try {
    if (!colorId) return '';
    var colors = getColorsForOrders();
    for (var i = 0; i < colors.length; i++) {
      if (String(colors[i].id) === String(colorId)) return colors[i].color_name;
    }
    return '';
  } catch (e) { return ''; }
}

function getItemCostPriceForOrder(itemId) {
  try {
    if (typeof getItemCostPrice === 'function') return getItemCostPrice(itemId);
    if (!itemId) return 0;
    var items = getItemsForOrders();
    for (var i = 0; i < items.length; i++) {
      if (String(items[i].id) === String(itemId)) return parseFloat(items[i].cost_price) || 0;
    }
    return 0;
  } catch (e) { return 0; }
}

function getTaxPercentageForOrder(asNumber) {
  try {
    if (typeof getTaxPercentage === 'function') return getTaxPercentage(asNumber);
    return 0;
  } catch (e) { return 0; }
}

function getOrderDetailsSummary(orderId, fiscalYear) {
  try {
    var year = getOrdersFiscalYearCode(fiscalYear);
    if (!year) return { total_qty: 0, total_ready_qty: 0, completion_percentage: 0 };
    
    var detailsId = getOrdersYearlyTableId("Order_Details", year);
    if (!detailsId) return { total_qty: 0, total_ready_qty: 0, completion_percentage: 0 };
    
    var sheet = SpreadsheetApp.openById(detailsId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    var totalQty = 0, totalReady = 0;
    
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][1]) === String(orderId)) {
        totalQty += parseFloat(data[i][5]) || 0;
        totalReady += parseFloat(data[i][6]) || 0;
      }
    }
    
    var percentage = totalQty > 0 ? Math.round((totalReady / totalQty) * 100) : 0;
    return { total_qty: totalQty, total_ready_qty: totalReady, completion_percentage: percentage };
  } catch (e) {
    return { total_qty: 0, total_ready_qty: 0, completion_percentage: 0 };
  }
}

// ========== دوال الحصول على قوائم الطلبيات ==========

function getCustomerOrdersList(fiscalYear) {
  try {
    var year = getOrdersFiscalYearCode(fiscalYear);
    if (!year) return [];
    
    var ordersId = getOrdersYearlyTableId("Customer_Orders", year);
    if (!ordersId) return [];
    
    var sheet = SpreadsheetApp.openById(ordersId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    var orders = [];
    
    for (var i = 1; i < data.length; i++) {
      var orderId = data[i][0];
      var summary = getOrderDetailsSummary(orderId, year);
      
      orders.push({
        id: orderId,
        order_no: data[i][1],
        fiscal_year: data[i][2],
        order_date: data[i][3],
        customer_id: data[i][4],
        customer_name: getPartyNameById(data[i][4]),
        customer_phone: data[i][5] || '',
        warehouse_id: data[i][6],
        warehouse_name: getWarehouseNameById(data[i][6]),
        delivery_date: data[i][7],
        status: data[i][8] || ORDER_STATUS.NEW,
        notes: data[i][9] || '',
        sub_total: parseFloat(data[i][10]) || 0,
        tax: parseFloat(data[i][11]) || 0,
        exp: parseFloat(data[i][12]) || 0,
        discount: parseFloat(data[i][13]) || 0,
        net_total: parseFloat(data[i][14]) || 0,
        total_qty: summary.total_qty,
        total_ready_qty: summary.total_ready_qty,
        completion_percentage: summary.completion_percentage
      });
    }
    return orders;
  } catch (e) {
    console.error('خطأ في getCustomerOrdersList:', e);
    return [];
  }
}

function getCustomerOrderById(id, fiscalYear) {
  try {
    var year = getOrdersFiscalYearCode(fiscalYear);
    if (!year) return null;
    
    var ordersId = getOrdersYearlyTableId("Customer_Orders", year);
    var detailsId = getOrdersYearlyTableId("Order_Details", year);
    var receiptsId = getOrdersYearlyTableId("Receipts", year);
    
    if (!ordersId || !detailsId) return null;
    
    var ordersSheet = SpreadsheetApp.openById(ordersId).getSheets()[0];
    var ordersData = ordersSheet.getDataRange().getDisplayValues();
    var order = null;
    
    for (var i = 1; i < ordersData.length; i++) {
      if (String(ordersData[i][0]) === String(id) && String(ordersData[i][2]) === String(year)) {
        order = {
          id: ordersData[i][0],
          order_no: ordersData[i][1],
          fiscal_year: ordersData[i][2],
          order_date: ordersData[i][3],
          customer_id: ordersData[i][4],
          customer_name: getPartyNameById(ordersData[i][4]),
          customer_phone: ordersData[i][5] || '',
          warehouse_id: ordersData[i][6],
          warehouse_name: getWarehouseNameById(ordersData[i][6]),
          delivery_date: ordersData[i][7],
          status: ordersData[i][8] || ORDER_STATUS.NEW,
          notes: ordersData[i][9] || '',
          sub_total: parseFloat(ordersData[i][10]) || 0,
          tax: parseFloat(ordersData[i][11]) || 0,
          exp: parseFloat(ordersData[i][12]) || 0,
          discount: parseFloat(ordersData[i][13]) || 0,
          net_total: parseFloat(ordersData[i][14]) || 0,
          created_at: ordersData[i][15]
        };
        break;
      }
    }
    
    if (!order) return null;
    
    var detailsSheet = SpreadsheetApp.openById(detailsId).getSheets()[0];
    var detailsData = detailsSheet.getDataRange().getDisplayValues();
    var lines = [];
    
    for (var j = 1; j < detailsData.length; j++) {
      if (String(detailsData[j][1]) === String(id)) {
        var itemId = detailsData[j][2] || '';
        var colorId = detailsData[j][3] || '';
        lines.push({
          id: detailsData[j][0],
          item_id: itemId,
          item_code: itemId ? getItemCodeById(itemId) : '(صنف جديد)',
          item_name: itemId ? getItemNameById(itemId) : 'طلب خاص',
          color_id: colorId,
          color_code: colorId ? getColorCodeById(colorId) : '',
          color_name: colorId ? getColorNameById(colorId) : 'بدون لون',
          unit_price: parseFloat(detailsData[j][4]) || 0,
          qty: parseFloat(detailsData[j][5]) || 0,
          ready_qty: parseFloat(detailsData[j][6]) || 0,
          preparation_date: detailsData[j][7] || '',
          delivery_date: detailsData[j][8] || '',
          supplier: detailsData[j][9] || '',
          customer_image_id: detailsData[j][10] || '',
          customer_image_url: detailsData[j][10] ? 'https://drive.google.com/uc?export=view&id=' + detailsData[j][10] : '',
          notes: detailsData[j][11] || '',
          created_at: detailsData[j][12],
          remaining_qty: (parseFloat(detailsData[j][5]) || 0) - (parseFloat(detailsData[j][6]) || 0)
        });
      }
    }
    
    order.lines = lines;
    order.receipts = [];
    
    if (receiptsId) {
      var receiptsSheet = SpreadsheetApp.openById(receiptsId).getSheets()[0];
      var receiptsData = receiptsSheet.getDataRange().getDisplayValues();
      for (var k = 1; k < receiptsData.length; k++) {
        if (receiptsData[k][3] === 'ORDER' && String(receiptsData[k][4]) === String(id) && String(receiptsData[k][1]) === String(year)) {
          var safes = getSafesForOrders();
          var safeName = '';
          for (var sf = 0; sf < safes.length; sf++) {
            if (String(safes[sf].id) === String(receiptsData[k][7])) {
              safeName = safes[sf].account_name;
              break;
            }
          }
          order.receipts.push({
            id: receiptsData[k][0],
            date: receiptsData[k][2],
            amount: parseFloat(receiptsData[k][5]) || 0,
            account_id: receiptsData[k][6],
            safe_id: receiptsData[k][7],
            safe_name: safeName,
            notes: receiptsData[k][8] || ''
          });
        }
      }
    }
    
    var totalQty = 0, totalReady = 0;
    for (var k = 0; k < lines.length; k++) {
      totalQty += lines[k].qty;
      totalReady += lines[k].ready_qty;
    }
    
    order.total_qty = totalQty;
    order.total_ready_qty = totalReady;
    order.completion_percentage = totalQty > 0 ? Math.round((totalReady / totalQty) * 100) : 0;
    
    return order;
  } catch (e) {
    console.error('خطأ في getCustomerOrderById:', e);
    return null;
  }
}

// ========== دوال الحسابات ==========

function calculateOrderSubTotal(lines) {
  var total = 0;
  if (!lines || !lines.length) return 0;
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    var price = parseFloat(line.unit_price || line.price || 0);
    var qty = parseFloat(line.qty || 0);
    total += price * qty;
  }
  return parseFloat(total.toFixed(2));
}

function calculateOrderTax(subTotal, taxPercent) {
  if (!taxPercent) taxPercent = getTaxPercentageForOrder(true);
  return parseFloat((subTotal * taxPercent / 100).toFixed(2));
}

function calculateOrderNetTotal(subTotal, tax, exp, discount) {
  var st = parseFloat(subTotal) || 0;
  var tx = parseFloat(tax) || 0;
  var ex = parseFloat(exp) || 0;
  var ds = parseFloat(discount) || 0;
  return parseFloat((st + tx + ex - ds).toFixed(2));
}

// ========== دوال إنشاء القيود المحاسبية للدفعات ==========

function recordOrderPaymentAccounting(payment, orderId, partyId, year, now) {
  try {
    var accMovId = getOrdersYearlyTableId("Account_Movements", year);
    if (!accMovId) return false;
    
    var accSheet = SpreadsheetApp.openById(accMovId).getSheets()[0];
    var amount = parseFloat(payment.amount) || 0;
    var safeId = payment.safe_id;
    var paymentDate = payment.date || getOrdersTodayDate();
    
    if (amount <= 0 || !safeId) return false;
    
    var getLastBalance = function(accountId) {
      var data = accSheet.getDataRange().getDisplayValues();
      var lastBalance = 0;
      for (var i = data.length - 1; i >= 1; i--) {
        if (String(data[i][1]) === String(accountId) && String(data[i][2]) === String(year)) {
          lastBalance = parseFloat(data[i][8]) || 0;
          break;
        }
      }
      return lastBalance;
    };
    
    var safeBalance = getLastBalance(safeId);
    var partyBalance = getLastBalance(partyId);
    
    accSheet.appendRow([generateOrdersId(), safeId, year, paymentDate, 'ORDER_PAYMENT', orderId, amount.toString(), "0", (safeBalance + amount).toString(), now]);
    accSheet.appendRow([generateOrdersId(), partyId, year, paymentDate, 'ORDER_PAYMENT', orderId, "0", amount.toString(), (partyBalance - amount).toString(), now]);
    
    return true;
  } catch (e) {
    console.error('خطأ في تسجيل قيد الدفعة:', e);
    return false;
  }
}

// ========== دالة إضافة ملاحظة تسليم ==========

function appendDeliveryNoteToOrderDetail(orderId, itemId, colorId, deliveredQty, invoiceId, invoiceDate, fiscalYear) {
  try {
    var year = getOrdersFiscalYearCode(fiscalYear);
    if (!year) return false;
    
    var detailsId = getOrdersYearlyTableId("Order_Details", year);
    if (!detailsId) return false;
    
    var sheet = SpreadsheetApp.openById(detailsId).getSheets()[0];
    var data = sheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      var rowOrderId = String(data[i][1] || '');
      var rowItemId = String(data[i][2] || '');
      var rowColorId = String(data[i][3] || '');
      
      if (rowOrderId === String(orderId) && rowItemId === String(itemId) && rowColorId === String(colorId || '')) {
        var currentNotes = data[i][11] || '';
        var remainingQty = (parseFloat(data[i][5]) || 0) - (parseFloat(data[i][6]) || 0);
        var newNote = '\n✅ تم تسليم ' + deliveredQty + ' بتاريخ ' + invoiceDate + ' (فاتورة: ' + (invoiceId ? invoiceId.substr(-6) : '') + ') | الباقي: ' + remainingQty;
        var updatedNotes = currentNotes ? currentNotes + newNote : newNote;
        sheet.getRange(i + 1, 12).setValue(updatedNotes);
        return true;
      }
    }
    return false;
  } catch (e) {
    console.error('خطأ في إضافة ملاحظة التسليم:', e);
    return false;
  }
}

// ========== الدالة الرئيسية لحفظ الطلبية ==========

function saveCustomerOrder(formData, fiscalYear) {
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
    if (!formData.order_date || String(formData.order_date).trim() === '') throw new Error("تاريخ الطلبية مطلوب");
    
    var partyId = formData.customer_id ? String(formData.customer_id).trim() : '';
    var warehouseId = formData.warehouse_id ? String(formData.warehouse_id).trim() : '';
    
    if (!partyId) throw new Error("الطرف (عميل/مورد) مطلوب");
    if (!warehouseId) throw new Error("المستودع مطلوب");
    if (!formData.lines || formData.lines.length === 0) throw new Error("يجب إضافة صنف واحد على الأقل");
    
    var fy = getOrdersFiscalYearInfo(fiscalYear);
    var year = fy ? fy.year_code : null;
    if (!year) throw new Error("لا توجد سنة مالية محددة");
    
    if (fy && fy.date_from && fy.date_to) {
      var orderDate = new Date(formData.order_date);
      var from = new Date(fy.date_from);
      var to = new Date(fy.date_to);
      if (orderDate < from || orderDate > to) throw new Error("تاريخ الطلبية يجب أن يكون بين " + fy.date_from + " و " + fy.date_to);
    }
    
    var ordersId = getOrdersYearlyTableId("Customer_Orders", year);
    var detailsId = getOrdersYearlyTableId("Order_Details", year);
    var receiptsId = getOrdersYearlyTableId("Receipts", year);
    
    if (!ordersId || !detailsId) throw new Error("جداول الطلبيات غير موجودة");
    
    var now = getOrdersNowTimestamp();
    var subTotal = calculateOrderSubTotal(formData.lines);
    var taxPercent = getTaxPercentageForOrder(true);
    var taxAmount = parseFloat(formData.tax) > 0 ? parseFloat(formData.tax) : calculateOrderTax(subTotal, taxPercent);
    var expAmount = parseFloat(formData.exp) || 0;
    var discount = parseFloat(formData.discount) || 0;
    var netTotal = calculateOrderNetTotal(subTotal, taxAmount, expAmount, discount);
    
    var orderStatus = formData.status || ORDER_STATUS.NEW;
    if (formData.status === ORDER_STATUS.NEW || !formData.status) {
      var hasReady = false, hasUnready = false;
      for (var li = 0; li < formData.lines.length; li++) {
        var line = formData.lines[li];
        var readyQty = parseFloat(line.ready_qty || 0);
        var qty = parseFloat(line.qty || 0);
        if (readyQty > 0) hasReady = true;
        if (readyQty < qty) hasUnready = true;
      }
      if (hasReady && hasUnready) orderStatus = ORDER_STATUS.PARTIAL;
      else if (hasReady && !hasUnready) orderStatus = ORDER_STATUS.COMPLETED;
      else orderStatus = ORDER_STATUS.NEW;
    }
    
    var orderNo = formData.order_no || "ORD-" + year + "-" + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    var orderId = formData.id || generateOrdersId();
    
    var orderRow = [orderId, orderNo, year, formData.order_date, partyId, formData.customer_phone || '', warehouseId, formData.delivery_date || '', orderStatus, formData.notes || '', subTotal.toString(), taxAmount.toString(), expAmount.toString(), discount.toString(), netTotal.toString(), now];
    
    var ordersSheet = SpreadsheetApp.openById(ordersId).getSheets()[0];
    
    if (formData.id) {
      var ordersData = ordersSheet.getDataRange().getDisplayValues();
      var found = false;
      for (var i = 1; i < ordersData.length; i++) {
        if (String(ordersData[i][0]) === String(orderId) && String(ordersData[i][2]) === String(year)) {
          ordersSheet.getRange(i + 1, 1, 1, orderRow.length).setValues([orderRow]);
          found = true;
          break;
        }
      }
      if (!found) throw new Error("لم يتم العثور على الطلبية للتحديث");
      
      clearOrdersRelatedRecords(detailsId, 1, orderId);
      
      if (receiptsId) {
        var receiptsSheet = SpreadsheetApp.openById(receiptsId).getSheets()[0];
        var receiptsData = receiptsSheet.getDataRange().getDisplayValues();
        for (var r = receiptsData.length - 1; r >= 1; r--) {
          if (receiptsData[r][3] === 'ORDER' && String(receiptsData[r][4]) === String(orderId) && String(receiptsData[r][1]) === String(year)) {
            receiptsSheet.deleteRow(r + 1);
          }
        }
      }
    } else {
      ordersSheet.appendRow(orderRow);
    }
    
    var detailsSheet = SpreadsheetApp.openById(detailsId).getSheets()[0];
    for (var li = 0; li < formData.lines.length; li++) {
      var line = formData.lines[li];
      var customerImageId = line.customer_image_id || '';
      if (line.customer_image && line.customer_image.indexOf('id=') > -1) {
        var matches = line.customer_image.match(/[-\w]{25,}/);
        if (matches) customerImageId = matches[0];
      }
      
      var lineRow = [
        generateOrdersId(),
        orderId,
        line.item_id || '',
        line.color_id || '',
        (parseFloat(line.unit_price || line.price || 0) || 0).toString(),
        (parseFloat(line.qty || 0) || 0).toString(),
        (parseFloat(line.ready_qty || 0) || 0).toString(),
        line.preparation_date || '',
        line.delivery_date || formData.delivery_date || '',
        line.supplier || '',
        customerImageId,
        line.notes || '',
        now
      ];
      detailsSheet.appendRow(lineRow);
    }
    
    if (formData.payments && formData.payments.length > 0 && receiptsId) {
      var receiptsSheet = SpreadsheetApp.openById(receiptsId).getSheets()[0];
      for (var pi = 0; pi < formData.payments.length; pi++) {
        var payment = formData.payments[pi];
        var amount = parseFloat(payment.amount) || 0;
        var safeId = payment.safe_id;
        var paymentDate = payment.date || formData.order_date;
        if (amount > 0 && safeId) {
          var receiptId = generateOrdersId();
          receiptsSheet.appendRow([receiptId, year, paymentDate, 'ORDER', orderId, amount.toString(), partyId, safeId, payment.notes || '', now]);
          recordOrderPaymentAccounting(payment, orderId, partyId, year, now);
        }
      }
    }
    
    return {
      success: true,
      message: formData.id ? "تم تحديث الطلبية بنجاح" : "تم حفظ الطلبية بنجاح",
      order_id: orderId,
      order_no: orderNo,
      status: orderStatus,
      sub_total: subTotal,
      net_total: netTotal,
      fiscal_year: year
    };
  } catch (e) {
    console.error('خطأ في saveCustomerOrder:', e);
    return { success: false, message: e.toString().includes("Error") ? "خطأ: " + e.toString() : e.toString() };
  }
}

// ========== دوال التحديث ==========

function updateOrderItemReadyQty(orderId, itemId, colorId, newReadyQty, fiscalYear) {
  try {
    var year = getOrdersFiscalYearCode(fiscalYear);
    if (!year) throw new Error("لا توجد سنة مالية محددة");
    
    var detailsId = getOrdersYearlyTableId("Order_Details", year);
    if (!detailsId) throw new Error("جدول تفاصيل الطلبيات غير موجود");
    
    var sheet = SpreadsheetApp.openById(detailsId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    var updated = false;
    
    for (var i = 1; i < data.length; i++) {
      var rowOrderId = String(data[i][1] || '');
      var rowItemId = String(data[i][2] || '');
      var rowColorId = String(data[i][3] || '');
      
      if (rowOrderId === String(orderId) && rowItemId === String(itemId) && rowColorId === String(colorId || '')) {
        var totalQty = parseFloat(data[i][5]) || 0;
        if (newReadyQty > totalQty) throw new Error("الكمية الجاهزة لا يمكن أن تتجاوز الكمية المطلوبة");
        sheet.getRange(i + 1, 7).setValue(newReadyQty.toString());
        updated = true;
        break;
      }
    }
    
    if (!updated) throw new Error("لم يتم العثور على البند المطلوب");
    
    updateOrderStatus(orderId, year);
    return { success: true, message: "تم تحديث الكمية الجاهزة بنجاح" };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

function updateOrderStatus(orderId, fiscalYear) {
  try {
    var year = getOrdersFiscalYearCode(fiscalYear);
    if (!year) return false;
    
    var ordersId = getOrdersYearlyTableId("Customer_Orders", year);
    var detailsId = getOrdersYearlyTableId("Order_Details", year);
    if (!ordersId || !detailsId) return false;
    
    var detailsSheet = SpreadsheetApp.openById(detailsId).getSheets()[0];
    var detailsData = detailsSheet.getDataRange().getDisplayValues();
    var hasReady = false, hasUnready = false;
    
    for (var i = 1; i < detailsData.length; i++) {
      if (String(detailsData[i][1]) === String(orderId)) {
        var qty = parseFloat(detailsData[i][5]) || 0;
        var readyQty = parseFloat(detailsData[i][6]) || 0;
        if (readyQty > 0) hasReady = true;
        if (readyQty < qty) hasUnready = true;
      }
    }
    
    var newStatus;
    if (!hasReady) newStatus = ORDER_STATUS.NEW;
    else if (hasReady && hasUnready) newStatus = ORDER_STATUS.PARTIAL;
    else if (hasReady && !hasUnready) newStatus = ORDER_STATUS.COMPLETED;
    else newStatus = ORDER_STATUS.NEW;
    
    var ordersSheet = SpreadsheetApp.openById(ordersId).getSheets()[0];
    var ordersData = ordersSheet.getDataRange().getDisplayValues();
    
    for (var j = 1; j < ordersData.length; j++) {
      if (String(ordersData[j][0]) === String(orderId) && String(ordersData[j][2]) === String(year)) {
        ordersSheet.getRange(j + 1, 9).setValue(newStatus);
        break;
      }
    }
    
    return true;
  } catch (e) {
    console.error('خطأ في updateOrderStatus:', e);
    return false;
  }
}

// ========== دوال التحويل إلى فاتورة ==========

function getReadyItemsForInvoice(orderId, fiscalYear) {
  try {
    var order = getCustomerOrderById(orderId, fiscalYear);
    if (!order) return { success: false, message: "الطلبية غير موجودة", items: [] };
    
    var readyItems = [];
    var totalAmount = 0;
    
    for (var i = 0; i < order.lines.length; i++) {
      var line = order.lines[i];
      var readyQty = parseFloat(line.ready_qty) || 0;
      
      if (readyQty > 0) {
        var total = (parseFloat(line.unit_price) || 0) * readyQty;
        totalAmount += total;
        
        readyItems.push({
          order_line_id: line.id,
          item_id: line.item_id,
          item_code: line.item_code,
          item_name: line.item_name,
          color_id: line.color_id,
          color_name: line.color_name,
          qty: readyQty,
          price: parseFloat(line.unit_price) || 0,
          total: total,
          notes: line.notes,
          is_new_item: !line.item_id,
          supplier: line.supplier,
          customer_image_id: line.customer_image_id
        });
      }
    }
    
    return {
      success: true,
      order_no: order.order_no,
      customer_id: order.customer_id,
      customer_name: order.customer_name,
      warehouse_id: order.warehouse_id,
      warehouse_name: order.warehouse_name,
      items: readyItems,
      total_amount: totalAmount
    };
  } catch (e) {
    console.error('خطأ في getReadyItemsForInvoice:', e);
    return { success: false, message: e.toString(), items: [] };
  }
}

function createInvoiceFromOrder(orderId, items, fiscalYear) {
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
    var year = getOrdersFiscalYearCode(fiscalYear);
    if (!year) throw new Error("لا توجد سنة مالية محددة");
    
    var order = getCustomerOrderById(orderId, year);
    if (!order) throw new Error("الطلبية غير موجودة");
    if (!items || items.length === 0) throw new Error("لا توجد أصناف محددة للتسليم");
    
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var line = null;
      for (var l = 0; l < order.lines.length; l++) {
        if (order.lines[l].item_id === item.item_id && order.lines[l].color_id === item.color_id) {
          line = order.lines[l];
          break;
        }
      }
      if (!line) throw new Error("الصنف غير موجود في الطلبية");
      if (item.qty > line.ready_qty) throw new Error("الكمية المطلوبة للتسليم أكبر من الكمية الجاهزة");
    }
    
    var invoiceData = {
      invoice_date: getOrdersTodayDate(),
      partner_id: order.customer_id,
      warehouse_id: order.warehouse_id,
      notes: "من طلبية رقم: " + order.order_no,
      lines: items.map(function(item) {
        return {
          item_id: item.item_id,
          color_id: item.color_id || '',
          qty: parseFloat(item.qty) || 0,
          price: parseFloat(item.price) || 0,
          total: (parseFloat(item.price) || 0) * (parseFloat(item.qty) || 0),
          notes: item.notes || '',
          cost_price: getItemCostPriceForOrder(item.item_id)
        };
      }),
      payments: []
    };
    
    var subTotal = 0;
    for (var j = 0; j < invoiceData.lines.length; j++) {
      subTotal += invoiceData.lines[j].total;
    }
    invoiceData.sub_total = subTotal;
    invoiceData.tax_amount = calculateOrderTax(subTotal, getTaxPercentageForOrder(true));
    invoiceData.discount = 0;
    invoiceData.exp = 0;
    invoiceData.net_total = subTotal + invoiceData.tax_amount;
    
    var invoiceId = '', invoiceNo = '';
    if (typeof saveSale === 'function') {
      var result = saveSale(invoiceData, year);
      if (result && result.success) {
        invoiceId = result.invoice_id || result.data?.invoice_id;
        invoiceNo = result.invoice_no || result.data?.invoice_no;
      } else {
        return { success: false, message: result?.message || "فشل إنشاء الفاتورة" };
      }
    } else {
      return { success: false, message: "دالة saveSale غير موجودة" };
    }
    
    var detailsId = getOrdersYearlyTableId("Order_Details", year);
    if (!detailsId) throw new Error("جدول تفاصيل الطلبيات غير موجود");
    
    var detailsSheet = SpreadsheetApp.openById(detailsId).getSheets()[0];
    var detailsData = detailsSheet.getDataRange().getValues();
    
    for (var j = 0; j < items.length; j++) {
      var item = items[j];
      for (var i = 1; i < detailsData.length; i++) {
        var rowOrderId = String(detailsData[i][1] || '');
        var rowItemId = String(detailsData[i][2] || '');
        var rowColorId = String(detailsData[i][3] || '');
        
        if (rowOrderId === String(orderId) && rowItemId === String(item.item_id) && rowColorId === String(item.color_id || '')) {
          var currentQty = parseFloat(detailsData[i][5]) || 0;
          var currentReadyQty = parseFloat(detailsData[i][6]) || 0;
          var deliveredQty = parseFloat(item.qty) || 0;
          
          var newQty = currentQty - deliveredQty;
          var newReadyQty = currentReadyQty - deliveredQty;
          
          detailsSheet.getRange(i + 1, 6).setValue(newQty);
          detailsSheet.getRange(i + 1, 7).setValue(newReadyQty);
          
          appendDeliveryNoteToOrderDetail(orderId, item.item_id, item.color_id || '', deliveredQty, invoiceId, invoiceData.invoice_date, year);
          break;
        }
      }
    }
    
    updateOrderStatus(orderId, year);
    
    return {
      success: true,
      message: "تم إنشاء الفاتورة بنجاح وتحديث الطلبية",
      invoice_id: invoiceId,
      invoice_no: invoiceNo
    };
  } catch (e) {
    console.error('خطأ في createInvoiceFromOrder:', e);
    return { success: false, message: e.toString() };
  }
}

// ========== دوال الحذف ==========

function deleteCustomerOrder(id, fiscalYear) {
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
    var year = getOrdersFiscalYearCode(fiscalYear);
    if (!year) throw new Error("لا توجد سنة مالية محددة");
    
    var ordersId = getOrdersYearlyTableId("Customer_Orders", year);
    var detailsId = getOrdersYearlyTableId("Order_Details", year);
    var receiptsId = getOrdersYearlyTableId("Receipts", year);
    
    if (!ordersId) throw new Error("جدول الطلبيات غير موجود");
    
    if (receiptsId) {
      var receiptsSheet = SpreadsheetApp.openById(receiptsId).getSheets()[0];
      var receiptsData = receiptsSheet.getDataRange().getDisplayValues();
      var hasReceipts = false, receiptCount = 0;
      
      for (var i = 1; i < receiptsData.length; i++) {
        if (receiptsData[i][3] === 'ORDER' && String(receiptsData[i][4]) === String(id) && String(receiptsData[i][1]) === String(year)) {
          hasReceipts = true;
          receiptCount++;
        }
      }
      
      if (hasReceipts) {
        return {
          success: false,
          has_payments: true,
          payment_count: receiptCount,
          message: "⚠️ لا يمكن الحذف لوجود دفعات مسجلة"
        };
      }
    }
    
    var ordersSheet = SpreadsheetApp.openById(ordersId).getSheets()[0];
    var ordersData = ordersSheet.getDataRange().getDisplayValues();
    
    for (var i = 1; i < ordersData.length; i++) {
      if (String(ordersData[i][0]) === String(id) && String(ordersData[i][2]) === String(year)) {
        ordersSheet.deleteRow(i + 1);
        break;
      }
    }
    
    if (detailsId) {
      clearOrdersRelatedRecords(detailsId, 1, id);
    }
    
    return { success: true, message: "تم حذف الطلبية بنجاح" };
  } catch (e) {
    return { success: false, message: "خطأ: " + e.toString() };
  }
}

function deleteCustomerOrderWithPayments(id, fiscalYear) {
  try {
    var year = getOrdersFiscalYearCode(fiscalYear);
    if (!year) throw new Error("لا توجد سنة مالية محددة");
    
    var receiptsId = getOrdersYearlyTableId("Receipts", year);
    
    if (receiptsId) {
      var receiptsSheet = SpreadsheetApp.openById(receiptsId).getSheets()[0];
      var receiptsData = receiptsSheet.getDataRange().getDisplayValues();
      
      for (var i = receiptsData.length - 1; i >= 1; i--) {
        if (receiptsData[i][3] === 'ORDER' && String(receiptsData[i][4]) === String(id) && String(receiptsData[i][1]) === String(year)) {
          receiptsSheet.deleteRow(i + 1);
        }
      }
    }
    
    return deleteCustomerOrder(id, year);
  } catch (e) {
    return { success: false, message: "خطأ: " + e.toString() };
  }
}

// ========== دوال إحصائية ==========

function getOrdersStatistics(fiscalYear) {
  try {
    var orders = getCustomerOrdersList(fiscalYear);
    var stats = {
      total: orders.length,
      new: 0,
      processing: 0,
      partial: 0,
      completed: 0,
      cancelled: 0,
      total_value: 0,
      average_completion: 0
    };
    
    var totalCompletion = 0;
    
    for (var i = 0; i < orders.length; i++) {
      var order = orders[i];
      switch (order.status) {
        case ORDER_STATUS.NEW: stats.new++; break;
        case ORDER_STATUS.PROCESSING: stats.processing++; break;
        case ORDER_STATUS.PARTIAL: stats.partial++; break;
        case ORDER_STATUS.COMPLETED: stats.completed++; break;
        case ORDER_STATUS.CANCELLED: stats.cancelled++; break;
      }
      stats.total_value += order.net_total || 0;
      totalCompletion += order.completion_percentage || 0;
    }
    
    stats.average_completion = orders.length > 0 ? Math.round(totalCompletion / orders.length) : 0;
    
    return stats;
  } catch (e) {
    return { total: 0, new: 0, processing: 0, partial: 0, completed: 0, cancelled: 0, total_value: 0, average_completion: 0 };
  }
}

// ========== دوال التصدير لواجهة المستخدم ==========

function getOrderFormData(fiscalYear) {
  var year = getOrdersFiscalYearCode(fiscalYear);
  
  return {
    parties: getAllPartiesForOrders(),
    customers: getAllPartiesForOrders(),
    items: getItemsForOrders(),
    colors: getColorsForOrders(),
    warehouses: getWarehousesForOrders(),
    safes: getSafesForOrders(),
    status_options: [
      { value: ORDER_STATUS.NEW, label: 'جديد' },
      { value: ORDER_STATUS.PROCESSING, label: 'قيد التجهيز' },
      { value: ORDER_STATUS.PARTIAL, label: 'جزئي' },
      { value: ORDER_STATUS.COMPLETED, label: 'مكتمل' },
      { value: ORDER_STATUS.CANCELLED, label: 'ملغي' }
    ],
    tax_percentage: getTaxPercentageForOrder(true),
    fiscal_year: year
  };
}

function validateOrderLines(lines) {
  var errors = [];
  if (!lines || lines.length === 0) {
    errors.push("يجب إضافة صنف واحد على الأقل");
    return { valid: false, errors: errors };
  }
  
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    var lineNum = i + 1;
    
    if (!line.qty || parseFloat(line.qty) <= 0) {
      errors.push("البند " + lineNum + ": الكمية المطلوبة يجب أن تكون أكبر من صفر");
    }
    
    var price = parseFloat(line.unit_price || line.price || 0);
    if (price <= 0) {
      errors.push("البند " + lineNum + ": السعر يجب أن يكون أكبر من صفر");
    }
    
    var readyQty = parseFloat(line.ready_qty || 0);
    var qty = parseFloat(line.qty || 0);
    if (readyQty > qty) {
      errors.push("البند " + lineNum + ": الكمية الجاهزة لا يمكن أن تتجاوز الكمية المطلوبة");
    }
  }
  
  return { valid: errors.length === 0, errors: errors };
}

// ========== دوال إضافية ==========

function getOrdersLibraryVersion() {
  return '3.3.1';
}
/**
 * الحصول على طلبية للتعديل المباشر
 */
function getOrderForDirectEdit(orderId, fiscalYear) {
  try {
    if (!orderId) { return { success: false, message: '❌ معرف الطلبية مطلوب' }; }
    
    var year = typeof getFiscalYearCode === 'function' ? getFiscalYearCode(fiscalYear) : null;
    if (!year && typeof getFiscalYearInfo === 'function') {
      var fy = getFiscalYearInfo(fiscalYear);
      year = fy && fy.year_code ? fy.year_code : null;
    }
    if (!year) { year = new Date().getFullYear().toString(); }
    
    var tableId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Orders", year) : null;
    if (!tableId) { return { success: false, message: '❌ جدول الطلبيات غير موجود' }; }
    
    var ss = SpreadsheetApp.openById(tableId);
    var sheet = ss.getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    
    var order = null;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] && String(data[i][0]).trim() === String(orderId).trim()) {
        order = {
          id: data[i][0], order_no: data[i][1] || '', fiscal_year: data[i][2] || year,
          order_date: data[i][3] || '', customer_id: data[i][4] || '',
          warehouse_id: data[i][5] || '', notes: data[i][6] || '',
          sub_total: parseFloat(data[i][7]) || 0, tax: parseFloat(data[i][8]) || 0,
          discount: parseFloat(data[i][9]) || 0, net_total: parseFloat(data[i][10]) || 0,
          status: data[i][11] || 'جديد', created_at: data[i][12] || ''
        };
        
        // اسم العميل
        if (order.customer_id && typeof getAccountInfo === 'function') {
          var account = getAccountInfo(order.customer_id);
          if (account) {
            order.customer_name = account.account_name || account.contact_name || '';
            order.customer_phone = account.phone || '';
          }
        }
        // اسم المستودع
        if (typeof getWarehouseNameById === 'function') {
          order.warehouse_name = getWarehouseNameById(order.warehouse_id);
        }
        // حالة الطلبية
        order.status_label = getOrderStatusLabel(order.status);
        break;
      }
    }
    if (!order) { return { success: false, message: '❌ لم يتم العثور على الطلبية' }; }
    
    // البنود
    order.lines = [];
    var detailsId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Order_Details", year) : null;
    if (detailsId) {
      var dSheet = SpreadsheetApp.openById(detailsId).getSheets()[0];
      var dData = dSheet.getDataRange().getDisplayValues();
      var items = typeof getItems === 'function' ? getItems() : [];
      var itemsMap = {};
      for (var idx = 0; idx < items.length; idx++) { itemsMap[items[idx].id] = items[idx]; }
      
      for (var j = 1; j < dData.length; j++) {
        if (dData[j][1] && String(dData[j][1]).trim() === String(orderId).trim()) {
          var itemId = dData[j][2] || '';
          var itemInfo = itemsMap[itemId] || {};
          order.lines.push({
            id: dData[j][0] || '', item_id: itemId,
            item_name: itemInfo.item_name || '', item_code: itemInfo.item_code || '',
            color_id: dData[j][3] || '', qty: parseFloat(dData[j][4]) || 0,
            price: parseFloat(dData[j][5]) || 0, total: parseFloat(dData[j][6]) || 0,
            notes: dData[j][7] || ''
          });
        }
      }
    }
    
    return { success: true, data: order, message: 'تم جلب بيانات الطلبية بنجاح' };
    
  } catch (e) {
    console.error('❌ getOrderForDirectEdit error:', e);
    return { success: false, message: 'خطأ: ' + e.toString() };
  }
}

// دالة مساعدة لعرض حالة الطلبية
function getOrderStatusLabel(status) {
  var labels = {
    'new': '🆕 جديد', 'confirmed': '✅ مؤكد',
    'processing': '🔄 جاري التنفيذ', 'shipped': '🚚 تم الشحن',
    'delivered': '📦 تم التسليم', 'cancelled': '❌ ملغى'
  };
  return labels[status] || status;
}


/**
 * Orders_client.gs – ZEIOS ERP SYSTEM (CLIENT VERSION)
 * الإصدار: 3.3.1
 * الطبقة الوسيطة لاستدعاء دوال المكتبة
 * 
 * ⚠️ يجب إضافة المكتبة من Extensions → Libraries
 * ⚠️ اسم المكتبة في الإعدادات: ZEIOS
 * 
 * 📞 الدعم: zeioszeios0@gmail.com | WhatsApp: 00201205951462
 */

// ========== ربط المكتبة ==========
var ZEIOS_LIB = null;

function initLibrary() {
  if (ZEIOS_LIB) return true;
  if (typeof ZEIOS !== 'undefined') {
    ZEIOS_LIB = ZEIOS;
    console.log("✅ تم تحميل المكتبة بنجاح");
    return true;
  }
  console.error("❌ المكتبة غير متوفرة. تأكد من إضافتها من Extensions → Libraries");
  return false;
}

function getLib() {
  if (!ZEIOS_LIB) initLibrary();
  return ZEIOS_LIB;
}

// ========== ثوابت النظام ==========
var ORDER_REF_TYPES = {
  ORDER: 'ORDER',
  ORDER_PAYMENT: 'ORDER_PAYMENT',
  INVOICE_FROM_ORDER: 'INVOICE_FROM_ORDER'
};

var ORDER_STATUS = {
  NEW: 'جديد',
  PROCESSING: 'قيد التجهيز',
  PARTIAL: 'جزئي',
  COMPLETED: 'مكتمل',
  CANCELLED: 'ملغي'
};

// ========== دوال السنة المالية ==========
function getActiveFiscalYearForOrders() {
  var lib = getLib();
  if (lib && lib.getOrdersFiscalYearInfo) {
    return lib.getOrdersFiscalYearInfo();
  }
  return { year_code: null, is_active: false, date_from: '', date_to: '', folder_id: '' };
}

function getFiscalYearCodeForOrders() {
  var lib = getLib();
  if (lib && lib.getOrdersFiscalYearCode) {
    return lib.getOrdersFiscalYearCode();
  }
  return null;
}

// ========== دوال مساعدة ==========
function generateOrderIdForOrders() {
  var lib = getLib();
  if (lib && lib.generateOrdersId) {
    return lib.generateOrdersId();
  }
  return Utilities.getUuid().replace(/-/g, '');
}

function getOrderNowTimestampForOrders() {
  var lib = getLib();
  if (lib && lib.getOrdersNowTimestamp) {
    return lib.getOrdersNowTimestamp();
  }
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
}

function getOrderTodayDateForOrders() {
  var lib = getLib();
  if (lib && lib.getOrdersTodayDate) {
    return lib.getOrdersTodayDate();
  }
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
}

// ========== دوال البيانات الأساسية ==========
function getAllPartiesForOrders() {
  var lib = getLib();
  if (lib && lib.getAllPartiesForOrders) {
    return lib.getAllPartiesForOrders();
  }
  return [];
}

function getSafesForOrders() {
  var lib = getLib();
  if (lib && lib.getSafesForOrders) {
    return lib.getSafesForOrders();
  }
  return [];
}

function getWarehousesForOrders() {
  var lib = getLib();
  if (lib && lib.getWarehousesForOrders) {
    return lib.getWarehousesForOrders();
  }
  return [];
}

function getColorsForOrders() {
  var lib = getLib();
  if (lib && lib.getColorsForOrders) {
    return lib.getColorsForOrders();
  }
  return [];
}

function getItemsForOrders() {
  var lib = getLib();
  if (lib && lib.getItemsForOrders) {
    return lib.getItemsForOrders();
  }
  return [];
}

// ========== دوال البحث ==========
function getPartyBalanceForOrderForm(partyId, fiscalYear) {
  var lib = getLib();
  if (lib && lib.getPartyBalanceForOrderForm) {
    return lib.getPartyBalanceForOrderForm(partyId, fiscalYear);
  }
  return { balance: "0.00", display_balance: "0.00" };
}

function getPartyNameById(partyId) {
  var lib = getLib();
  if (lib && lib.getPartyNameById) {
    return lib.getPartyNameById(partyId);
  }
  return '';
}

function getPartyPhoneById(partyId) {
  var lib = getLib();
  if (lib && lib.getPartyPhoneById) {
    return lib.getPartyPhoneById(partyId);
  }
  return '';
}

function getWarehouseNameById(warehouseId) {
  var lib = getLib();
  if (lib && lib.getWarehouseNameById) {
    return lib.getWarehouseNameById(warehouseId);
  }
  return 'غير معروف';
}

function getItemCodeById(itemId) {
  var lib = getLib();
  if (lib && lib.getItemCodeById) {
    return lib.getItemCodeById(itemId);
  }
  return '';
}

function getItemNameById(itemId) {
  var lib = getLib();
  if (lib && lib.getItemNameById) {
    return lib.getItemNameById(itemId);
  }
  return '';
}

function getColorCodeById(colorId) {
  var lib = getLib();
  if (lib && lib.getColorCodeById) {
    return lib.getColorCodeById(colorId);
  }
  return '';
}

function getColorNameById(colorId) {
  var lib = getLib();
  if (lib && lib.getColorNameById) {
    return lib.getColorNameById(colorId);
  }
  return '';
}

function getItemCostPrice(itemId) {
  var lib = getLib();
  if (lib && lib.getItemCostPriceForOrder) {
    return lib.getItemCostPriceForOrder(itemId);
  }
  return 0;
}

function getTaxPercentage(asNumber) {
  var lib = getLib();
  if (lib && lib.getTaxPercentageForOrder) {
    return lib.getTaxPercentageForOrder(asNumber);
  }
  return 0;
}

// ========== ملخص الطلبية ==========
function getOrderDetailsSummaryForOrders(orderId, fiscalYear) {
  var lib = getLib();
  if (lib && lib.getOrderDetailsSummary) {
    return lib.getOrderDetailsSummary(orderId, fiscalYear);
  }
  return { total_qty: 0, total_ready_qty: 0, completion_percentage: 0 };
}

// ========== قوائم الطلبيات ==========
function getCustomerOrdersList(fiscalYear) {
  var lib = getLib();
  if (lib && lib.getCustomerOrdersList) {
    return lib.getCustomerOrdersList(fiscalYear);
  }
  return [];
}

function getCustomerOrderById(id, fiscalYear) {
  var lib = getLib();
  if (lib && lib.getCustomerOrderById) {
    return lib.getCustomerOrderById(id, fiscalYear);
  }
  return null;
}

// ========== حسابات ==========
function calculateOrderSubTotal(lines) {
  var lib = getLib();
  if (lib && lib.calculateOrderSubTotal) {
    return lib.calculateOrderSubTotal(lines);
  }
  return 0;
}

function calculateOrderTax(subTotal, taxPercent) {
  var lib = getLib();
  if (lib && lib.calculateOrderTax) {
    return lib.calculateOrderTax(subTotal, taxPercent);
  }
  return 0;
}

function calculateOrderNetTotal(subTotal, tax, exp, discount) {
  var lib = getLib();
  if (lib && lib.calculateOrderNetTotal) {
    return lib.calculateOrderNetTotal(subTotal, tax, exp, discount);
  }
  return '0.00';
}

// ========== حفظ/تحديث/حذف ==========
function saveCustomerOrder(formData, fiscalYear) {
  var lib = getLib();
  if (lib && lib.saveCustomerOrder) {
    return lib.saveCustomerOrder(formData, fiscalYear);
  }
  return { success: false, message: '❌ المكتبة غير متوفرة' };
}

function updateOrderItemReadyQtyForOrders(orderId, itemId, colorId, newReadyQty, fiscalYear) {
  var lib = getLib();
  if (lib && lib.updateOrderItemReadyQty) {
    return lib.updateOrderItemReadyQty(orderId, itemId, colorId, newReadyQty, fiscalYear);
  }
  return { success: false, message: '❌ المكتبة غير متوفرة' };
}

function updateOrderStatusForOrders(orderId, fiscalYear) {
  var lib = getLib();
  if (lib && lib.updateOrderStatus) {
    return lib.updateOrderStatus(orderId, fiscalYear);
  }
  return false;
}

function deleteCustomerOrder(id, fiscalYear) {
  var lib = getLib();
  if (lib && lib.deleteCustomerOrder) {
    return lib.deleteCustomerOrder(id, fiscalYear);
  }
  return { success: false, message: '❌ المكتبة غير متوفرة' };
}

function deleteCustomerOrderWithPayments(id, fiscalYear) {
  var lib = getLib();
  if (lib && lib.deleteCustomerOrderWithPayments) {
    return lib.deleteCustomerOrderWithPayments(id, fiscalYear);
  }
  return { success: false, message: '❌ المكتبة غير متوفرة' };
}

// ========== فواتير من الطلبيات ==========
function getReadyItemsForInvoiceForOrders(orderId, fiscalYear) {
  var lib = getLib();
  if (lib && lib.getReadyItemsForInvoice) {
    return lib.getReadyItemsForInvoice(orderId, fiscalYear);
  }
  return { success: false, message: '❌ الدالة غير متوفرة في المكتبة', items: [] };
}

function createInvoiceFromOrderForOrders(orderId, items, fiscalYear) {
  var lib = getLib();
  if (lib && lib.createInvoiceFromOrder) {
    return lib.createInvoiceFromOrder(orderId, items, fiscalYear);
  }
  return { success: false, message: '❌ المكتبة غير متوفرة' };
}

// ========== إحصائيات ==========
function getOrdersStatisticsForOrders(fiscalYear) {
  var lib = getLib();
  if (lib && lib.getOrdersStatistics) {
    return lib.getOrdersStatistics(fiscalYear);
  }
  return { total: 0, new: 0, processing: 0, partial: 0, completed: 0, cancelled: 0, total_value: 0, average_completion: 0 };
}

function getOrderFormDataForOrders(fiscalYear) {
  var lib = getLib();
  if (lib && lib.getOrderFormData) {
    return lib.getOrderFormData(fiscalYear);
  }
  return { parties: [], customers: [], items: [], colors: [], warehouses: [], safes: [], status_options: [], tax_percentage: 0, fiscal_year: null };
}

function validateOrderLinesForOrders(lines) {
  var lib = getLib();
  if (lib && lib.validateOrderLines) {
    return lib.validateOrderLines(lines);
  }
  return { valid: false, errors: ['❌ المكتبة غير متوفرة'] };
}

// ========== دوال مساعدة ==========
function generateTimestamp() {
  return getOrderNowTimestampForOrders();
}

function generateUniqueId() {
  return generateOrderIdForOrders();
}

function showStoredDataInLog() {
  try {
    var props = PropertiesService.getDocumentProperties();
    var allKeys = props.getKeys();
    console.log('ZEIOS ERP - Orders data');
    console.log('Keys:', allKeys.length);
    return { success: true, count: allKeys.length, keys: allKeys };
  } catch (e) {
    console.error('Error:', e);
    return { success: false, error: e.toString() };
  }
}

function getLibraryVersion() {
  var lib = getLib();
  if (lib && lib.getOrdersLibraryVersion) {
    return lib.getOrdersLibraryVersion();
  }
  return 'غير متصل';
}

// ========== دوال الواجهة (في الشيت فقط) ==========
function isSpreadsheetContext() {
  try {
    SpreadsheetApp.getUi();
    return true;
  } catch (e) {
    return false;
  }
}

function openOrdersPage() {
  try {
    var pageName = 'orders';
    var title = '📦 إدارة الطلبيات - ZEIOS ERP';
    
    if (isSpreadsheetContext()) {
      var html = HtmlService.createHtmlOutputFromFile(pageName)
        .setTitle(title)
        .setWidth(1400)
        .setHeight(900)
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      SpreadsheetApp.getUi().showModalDialog(html, title);
      return { success: true, mode: "spreadsheet" };
    }
    
    var baseUrl = ScriptApp.getService() ? ScriptApp.getService().getUrl() : null;
    if (baseUrl) {
      return { success: true, mode: "webapp", url: baseUrl + "?page=" + pageName };
    }
    
    return { success: false, message: "لا يمكن تحديد بيئة التشغيل" };
  } catch (e) {
    console.error("❌ openOrdersPage error:", e);
    return { success: false, message: e.toString() };
  }
}

function openOrderForm(orderId) {
  var id = orderId || null;
  try {
    var pageName = 'orders';
    var title = id ? '✏️ تعديل طلبية - ZEIOS ERP' : '➕ إضافة طلبية جديدة - ZEIOS ERP';
    
    if (isSpreadsheetContext()) {
      var html = HtmlService.createHtmlOutputFromFile(pageName)
        .setTitle(title)
        .setWidth(1200)
        .setHeight(800)
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      SpreadsheetApp.getUi().showModalDialog(html, title);
      return { success: true, mode: "spreadsheet" };
    }
    
    var baseUrl = ScriptApp.getService() ? ScriptApp.getService().getUrl() : null;
    if (baseUrl) {
      var params = id ? '?page=orders&edit=' + encodeURIComponent(id) : '?page=orders&new=1';
      return { success: true, mode: "webapp", url: baseUrl + params };
    }
    
    return { success: false, message: "لا يمكن تحديد بيئة التشغيل" };
  } catch (e) {
    console.error("❌ openOrderForm error:", e);
    return { success: false, message: e.toString() };
  }
}

// ========== دوال إضافية للتوافق ==========
function getCurrentUserFiscalYear() {
  var lib = getLib();
  if (lib && lib.getOrdersFiscalYearCode) {
    return lib.getOrdersFiscalYearCode();
  }
  return null;
}
/**
 * ✅ دالة واجهة لاستدعاء جلب طلبية للتعديل المباشر
 * ⚠️ يجب أن تكون في مشروع الجدول (ليس في المكتبة)
 * ⚠️ مطلوبة من الـ HTML عبر google.script.run
 */
function getOrderForDirectEdit(orderId, fiscalYear) {
  try {
    // ✅ التحقق من المدخلات
    if (!orderId) {
      return { success: false, message: '❌ معرف الطلبية مطلوب' };
    }
    
    // ✅ استدعاء الدالة من المكتبة إذا كانت متاحة
    if (typeof ZEIOS !== 'undefined' && typeof ZEIOS.getOrderForDirectEdit === 'function') {
      return ZEIOS.getOrderForDirectEdit(orderId, fiscalYear);
    }
    
    // ✅ Fallback: استدعاء الدالة المحلية إذا كانت موجودة في ملف آخر
    if (typeof getOrderForDirectEdit === 'function' && 
        getOrderForDirectEdit !== arguments.callee) {
      return getOrderForDirectEdit(orderId, fiscalYear);
    }
    
    return { success: false, message: 'دالة جلب الطلبية غير متاحة' };
    
  } catch (e) {
    console.error('❌ getOrderForDirectEdit (client) error:', e);
    return {
      success: false,
      message: 'خطأ: ' + e.toString(),
      error: e.toString()
    };
  }
}
