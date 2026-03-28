/**
 * POS_Library.gs – ZEIOS ERP SYSTEM (LIBRARY VERSION)
 * الإصدار: 3.3.0
 * ⚠️ دوال Backend فقط - تتبع هيكل Purchases.gs
 * 📞 الدعم: zeioszeios0@gmail.com | WhatsApp: 00201205951462
 */

// ========== 🔐 ثوابت نظام POS ==========
var POS_REF_TYPES = {
  POS_SALE: 'POS_SALE',
  POS_SALE_INVENTORY: 'POS_SALE_INVENTORY',
  POS_SALE_TAX: 'POS_SALE_TAX',
  POS_SALE_SERVICE: 'POS_SALE_SERVICE',
  POS_PAYMENT: 'POS_PAYMENT',
  POS_SHIFT_OPEN: 'POS_SHIFT_OPEN',
  POS_SHIFT_CLOSE: 'POS_SHIFT_CLOSE'
};

// ========== 📦 دوال جلب البيانات الأساسية ==========
function getCashiersForPOS() {
  try {
    var links = loadJSON('TABLE_LINKS', {});
    var cashiersId = links.pos && links.pos.cashiers ? links.pos.cashiers.id : null;
    
    if (!cashiersId) {
      cashiersId = getMasterTableId("POS_Cashiers");
    }
    
    if (!cashiersId) return [];
    
    var sheet = SpreadsheetApp.openById(cashiersId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    var cashiers = [];
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][5] === 'TRUE' || data[i][5] === 'true' || data[i][5] === 'نشط') {
        cashiers.push({
          id: data[i][0],
          cashier_name: data[i][1],
          cashier_code: data[i][2],
          account_id: data[i][3],
          default_safe_id: data[i][4]
        });
      }
    }
    return cashiers;
  } catch (e) {
    console.error("❌ getCashiersForPOS error:", e);
    return [];
  }
}

function getPOSItems(warehouseId) {
  try {
    return typeof getItemsWithStock === 'function' ? getItemsWithStock(warehouseId) : [];
  } catch (e) {
    console.error("❌ getPOSItems error:", e);
    return [];
  }
}

function searchPOSItems(searchTerm, warehouseId, categoryId) {
  try {
    var items = getPOSItems(warehouseId);
    var results = [];
    
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var match = false;
      
      if (searchTerm) {
        var term = searchTerm.toLowerCase();
        if ((item.item_name || '').toLowerCase().indexOf(term) >= 0) match = true;
        else if ((item.item_code || '').toLowerCase().indexOf(term) >= 0) match = true;
        else if ((item.barcode || '').toLowerCase().indexOf(term) >= 0) match = true;
      }
      
      if (categoryId && item.category_id !== categoryId) match = false;
      
      if (match || (!searchTerm && !categoryId)) {
        results.push(item);
      }
    }
    
    return results;
  } catch (e) {
    console.error("❌ searchPOSItems error:", e);
    return [];
  }
}

// ========== 🔄 إدارة الشيفتات ==========
function openPOSShift(cashierId, cashierName, openingBalance) {
  try {
    var year = typeof getFiscalYearCode === 'function' ? getFiscalYearCode() : new Date().getFullYear().toString();
    var shiftsId = getYearlyTableId("POS_Shifts", year);
    
    if (!shiftsId) throw new Error("جدول الشيفتات غير موجود للسنة: " + year);
    
    // التحقق من عدم وجود شيفت مفتوح
    var existingShift = getOpenShiftForCashier(cashierId, year);
    if (existingShift) {
      return { success: false, message: '⚠️ يوجد شيفت مفتوح بالفعل لهذا الكاشير' };
    }
    
    var sheet = SpreadsheetApp.openById(shiftsId).getSheets()[0];
    var shiftId = typeof generateID === 'function' ? generateID() : Date.now().toString();
    var now = typeof getNowTimestamp === 'function' ? getNowTimestamp() : generateTimestamp();
    
    sheet.appendRow([
      shiftId,
      cashierId,
      cashierName,
      now,  // shift_start
      '',   // shift_end
      openingBalance || 0,
      0,    // cash_sales
      0,    // credit_sales
      0,    // service_charges
      0,    // closing_balance
      'open',
      '',
      year
    ]);
    
    // تسجيل حركة محاسبية لفتح الشيفت
    recordPOSShiftAccounting(shiftId, cashierId, openingBalance, 'open', year, now);
    
    return {
      success: true,
      message: '✅ تم فتح الشيفت بنجاح',
      data: { shift_id: shiftId, cashier_name: cashierName, opening_balance: openingBalance }
    };
  } catch (e) {
    console.error("❌ openPOSShift error:", e);
    return { success: false, message: e.toString() };
  }
}

function closePOSShift(shiftId, closingBalance, serviceChargePercent) {
  try {
    var year = typeof getFiscalYearCode === 'function' ? getFiscalYearCode() : new Date().getFullYear().toString();
    var shiftsId = getYearlyTableId("POS_Shifts", year);
    
    if (!shiftsId) throw new Error("جدول الشيفتات غير موجود");
    
    var sheet = SpreadsheetApp.openById(shiftsId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    var shiftRow = -1;
    var shiftData = null;
    
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(shiftId)) {
        shiftRow = i + 1;
        shiftData = {
          id: data[i][0],
          cashier_id: data[i][1],
          cashier_name: data[i][2],
          shift_start: data[i][3],
          cash_sales: parseFloat(data[i][6]) || 0,
          credit_sales: parseFloat(data[i][7]) || 0,
          opening_balance: parseFloat(data[i][5]) || 0,
          row: shiftRow
        };
        break;
      }
    }
    
    if (!shiftData) throw new Error("الشيفت غير موجود");
    
    var now = typeof getNowTimestamp === 'function' ? getNowTimestamp() : generateTimestamp();
    
    // حساب مصاريف الخدمة
    var totalSales = shiftData.cash_sales + shiftData.credit_sales;
    var serviceChargeAmount = totalSales * (serviceChargePercent / 100);
    
    // تحديث الشيفت
    sheet.getRange(shiftRow, 5).setValue(now);  // shift_end
    sheet.getRange(shiftRow, 9).setValue(serviceChargeAmount);
    sheet.getRange(shiftRow, 10).setValue(closingBalance || 0);
    sheet.getRange(shiftRow, 11).setValue('closed');
    
    // إنشاء فاتورة تجميعية
    var summaryInvoice = createPOSSummaryInvoice(shiftData, serviceChargeAmount, year, now);
    sheet.getRange(shiftRow, 12).setValue(summaryInvoice.invoice_id);
    
    // تسجيل حركة محاسبية لإغلاق الشيفت
    recordPOSShiftAccounting(shiftId, shiftData.cashier_id, closingBalance, 'close', year, now);
    
    return {
      success: true,
      message: '✅ تم إغلاق الشيفت بنجاح',
      data: {
        cash_sales: shiftData.cash_sales,
        credit_sales: shiftData.credit_sales,
        service_charges: serviceChargeAmount,
        total_sales: totalSales,
        invoice_id: summaryInvoice.invoice_id,
        invoice_no: summaryInvoice.invoice_no
      }
    };
  } catch (e) {
    console.error("❌ closePOSShift error:", e);
    return { success: false, message: e.toString() };
  }
}

function getOpenShiftForCashier(cashierId, year) {
  try {
    year = year || getFiscalYearCode();
    if (!year) return null;
    
    var shiftsId = getYearlyTableId("POS_Shifts", year);
    if (!shiftsId) return null;
    
    var sheet = SpreadsheetApp.openById(shiftsId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][1]) === String(cashierId) && 
          (data[i][11] === 'open' || data[i][11] === 'مفتوح')) {
        return {
          id: data[i][0],
          cashier_id: data[i][1],
          cashier_name: data[i][2],
          shift_start: data[i][3],
          cash_sales: parseFloat(data[i][6]) || 0,
          credit_sales: parseFloat(data[i][7]) || 0,
          opening_balance: parseFloat(data[i][5]) || 0
        };
      }
    }
    return null;
  } catch (e) {
    console.error("❌ getOpenShiftForCashier error:", e);
    return null;
  }
}

// ========== 💾 حفظ فاتورة POS ==========
function savePOSSale(formData, shiftId) {
  try {
    // ✅ التحقق من الترخيص أولاً
    if (typeof validateLicenseFromServer === 'function') {
      var licenseCheck = validateLicenseFromServer();
      if (!licenseCheck || licenseCheck.valid !== true) {
        return { 
          success: false, 
          message: licenseCheck?.message || 'ترخيصك منتهي رجاء التجديد',
          license_expired: true
        };
      }
    }
    
    var year = typeof getFiscalYearCode === 'function' ? getFiscalYearCode() : new Date().getFullYear().toString();
    
    // التحقق من الشيفت
    if (shiftId) {
      var shift = getOpenShiftForCashier(formData.cashier_id, year);
      if (!shift || shift.id !== shiftId) {
        return { success: false, message: '⚠️ الشيفت غير مفتوح أو منتهي' };
      }
    }
    
    // الحصول على معرفات الجداول
    var invoicesId = getYearlyTableId("POS_Invoices", year);
    var detailsId = getYearlyTableId("POS_Invoice_Details", year);
    
    if (!invoicesId || !detailsId) throw new Error("جداول POS غير موجودة");
    
    var now = typeof getNowTimestamp === 'function' ? getNowTimestamp() : generateTimestamp();
    var invoiceId = typeof generateID === 'function' ? generateID() : Date.now().toString();
    var invoiceNo = "POS-" + year + "-" + String(Date.now()).slice(-8);
    
    // حساب المبالغ
    var subTotal = parseFloat(formData.sub_total) || 0;
    var taxAmount = parseFloat(formData.tax_amount) || 0;
    var serviceCharge = parseFloat(formData.service_charge) || 0;
    var discount = parseFloat(formData.discount) || 0;
    var netTotal = parseFloat(formData.net_total) || 0;
    
    // حفظ الفاتورة
    var invSheet = SpreadsheetApp.openById(invoicesId).getSheets()[0];
    invSheet.appendRow([
      invoiceId,
      invoiceNo,
      year,
      formData.invoice_date || new Date().toISOString().split('T')[0],
      shiftId || '',
      formData.cashier_id || '',
      formData.customer_id || 'CASH_CUSTOMER',
      formData.warehouse_id || '',
      subTotal,
      taxAmount,
      serviceCharge,
      discount,
      netTotal,
      formData.payment_type || 'cash',
      'مكتمل',
      false,  // printed
      now
    ]);
    
    // حفظ البنود
    var detSheet = SpreadsheetApp.openById(detailsId).getSheets()[0];
    if (formData.lines) {
      for (var i = 0; i < formData.lines.length; i++) {
        var line = formData.lines[i];
        detSheet.appendRow([
          typeof generateID === 'function' ? generateID() : Date.now().toString(),
          invoiceId,
          line.item_id,
          line.color_id || '',
          line.qty || 0,
          line.price || 0,
          (line.qty || 0) * (line.price || 0),
          line.barcode || '',
          line.notes || '',
          now
        ]);
      }
    }
    
    // تحديث المخزون
    if (formData.warehouse_id && formData.lines) {
      for (var i = 0; i < formData.lines.length; i++) {
        var line = formData.lines[i];
        if (typeof addStockMovement === 'function') {
          addStockMovement({
            itemId: line.item_id,
            warehouseId: formData.warehouse_id,
            colorId: line.color_id,
            quantity: line.qty,
            type: 'out',
            refType: POS_REF_TYPES.POS_SALE_INVENTORY,
            refId: invoiceId,
            costPrice: line.price,
            year: year,
            notes: 'فاتورة POS: ' + invoiceNo
          });
        }
      }
    }
    
    // تحديث إحصائيات الشيفت
    if (shiftId) {
      updateShiftSales(shiftId, netTotal, formData.payment_type, year);
    }
    
    // تسجيل القيود المحاسبية
    var accMovId = getYearlyTableId("Account_Movements", year);
    if (accMovId) {
      recordPOSSaleAccountingEntries(formData, invoiceId, year, now, accMovId);
    }
    
    // توليد الإيصال
    var receipt = generatePOSReceipt(invoiceId, invoiceNo, formData, year);
    
    return {
      success: true,
      message: '✅ تم حفظ الفاتورة بنجاح',
      data: { invoice_id: invoiceId, invoice_no: invoiceNo },
      receipt: receipt
    };
  } catch (e) {
    console.error("❌ savePOSSale error:", e);
    return { success: false, message: e.toString() };
  }
}

// ========== 📊 تحديث إحصائيات الشيفت ==========
function updateShiftSales(shiftId, amount, paymentType, year) {
  try {
    var shiftsId = getYearlyTableId("POS_Shifts", year);
    if (!shiftsId || !shiftId) return;
    
    var sheet = SpreadsheetApp.openById(shiftsId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(shiftId)) {
        var row = i + 1;
        var currentCash = parseFloat(data[i][6]) || 0;
        var currentCredit = parseFloat(data[i][7]) || 0;
        
        if (paymentType === 'cash' || paymentType === 'نقدي') {
          sheet.getRange(row, 7).setValue(currentCash + amount);
        } else {
          sheet.getRange(row, 8).setValue(currentCredit + amount);
        }
        break;
      }
    }
  } catch (e) {
    console.error("❌ updateShiftSales error:", e);
  }
}

// ========== 📦 إنشاء فاتورة التجميع ==========
function createPOSSummaryInvoice(shiftData, serviceChargeAmount, year, now) {
  try {
    var invoicesId = getYearlyTableId("Sales_Invoices", year);
    if (!invoicesId) throw new Error("جدول فواتير المبيعات غير موجود");
    
    var sheet = SpreadsheetApp.openById(invoicesId).getSheets()[0];
    var invoiceId = typeof generateID === 'function' ? generateID() : Date.now().toString();
    var invoiceNo = "POS-SUM-" + year + "-" + String(Date.now()).slice(-8);
    
    var totalSales = shiftData.cash_sales + shiftData.credit_sales;
    var taxPercent = typeof getCompanyTaxPercentage === 'function' ? getCompanyTaxPercentage() : 15;
    var taxAmount = totalSales * (taxPercent / 100);
    var netTotal = totalSales + taxAmount + serviceChargeAmount;
    
    sheet.appendRow([
      invoiceId,
      invoiceNo,
      year,
      new Date().toISOString().split('T')[0],
      '',  // warehouse_id
      shiftData.cashier_id,  // customer_id
      'فاتورة تجميعية - شيفت ' + shiftData.id,
      totalSales,
      taxAmount,
      serviceChargeAmount,
      0,  // discount
      netTotal,
      'مكتمل',
      now
    ]);
    
    return {
      invoice_id: invoiceId,
      invoice_no: invoiceNo
    };
  } catch (e) {
    console.error("❌ createPOSSummaryInvoice error:", e);
    return { invoice_id: '', invoice_no: '' };
  }
}

// ========== 🧾 توليد إيصال POS ==========
function generatePOSReceipt(invoiceId, invoiceNo, formData, year) {
  try {
    var companySettings = typeof loadJSON === 'function' ? loadJSON('COMPANY_SETTINGS', {}) : {};
    var printerWidth = typeof getThermalPrinterWidth === 'function' ? getThermalPrinterWidth() : '80';
    
    return {
      invoice_id: invoiceId,
      invoice_no: invoiceNo,
      date: formData.invoice_date || new Date().toISOString().split('T')[0],
      cashier: formData.cashier_name || 'كاشير',
      items: formData.lines || [],
      sub_total: formData.sub_total || 0,
      tax: formData.tax_amount || 0,
      service_charge: formData.service_charge || 0,
      discount: formData.discount || 0,
      net_total: formData.net_total || 0,
      payment_type: formData.payment_type || 'cash',
      company_name: companySettings.name || 'ZEIOS ERP',
      company_phone: companySettings.phone || '',
      company_address: companySettings.address || '',
      thermal_print: true,
      printer_width: printerWidth
    };
  } catch (e) {
    console.error("❌ generatePOSReceipt error:", e);
    return null;
  }
}

// ========== 📝 تسجيل القيود المحاسبية لـ POS ==========
function recordPOSSaleAccountingEntries(formData, invoiceId, year, now, accMovId) {
  try {
    var accSheet = SpreadsheetApp.openById(accMovId).getSheets()[0];
    var subTotal = parseFloat(formData.sub_total) || 0;
    var taxAmount = parseFloat(formData.tax_amount) || 0;
    var serviceCharge = parseFloat(formData.service_charge) || 0;
    var discount = parseFloat(formData.discount) || 0;
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
    
    // قيد الأصناف (مدين للمخزون)
    if (subTotal > 0) {
      var inventoryAccountId = typeof ACCOUNTS !== 'undefined' ? ACCOUNTS.INVENTORY : '1300';
      addMovement(inventoryAccountId, subTotal, POS_REF_TYPES.POS_SALE_INVENTORY, invoiceId, formData.invoice_date, true);
    }
    
    // قيد الضريبة (دائن)
    if (taxAmount > 0) {
      var vatAccountId = typeof ACCOUNTS !== 'undefined' ? ACCOUNTS.VAT_PAYABLE : '220001';
      addMovement(vatAccountId, taxAmount, POS_REF_TYPES.POS_SALE_TAX, invoiceId, formData.invoice_date, false);
    }
    
    // قيد مصاريف الخدمة (دائن - إيرادات أخرى)
    if (serviceCharge > 0) {
      var serviceAccountId = '410003';  // ثابت: حساب مصاريف الخدمة
      addMovement(serviceAccountId, serviceCharge, POS_REF_TYPES.POS_SALE_SERVICE, invoiceId, formData.invoice_date, false);
    }
    
    // قيد الخصم (مدين)
    if (discount > 0) {
      var discountAccountId = typeof ACCOUNTS !== 'undefined' ? ACCOUNTS.DISCOUNT_ALLOWED : '510001';
      addMovement(discountAccountId, discount, POS_REF_TYPES.SALE_DISCOUNT, invoiceId, formData.invoice_date, true);
    }
    
    // قيد العميل/الكاش (مدين)
    if (netTotal > 0) {
      var customerId = formData.customer_id || 'CASH_CUSTOMER';
      addMovement(customerId, netTotal, POS_REF_TYPES.POS_SALE, invoiceId, formData.invoice_date, true);
    }
    
  } catch (e) {
    console.error("❌ recordPOSSaleAccountingEntries error:", e);
  }
}

function recordPOSShiftAccounting(shiftId, cashierId, amount, action, year, now) {
  try {
    var accMovId = getYearlyTableId("Account_Movements", year);
    if (!accMovId) return;
    
    var accSheet = SpreadsheetApp.openById(accMovId).getSheets()[0];
    var genId = function() { return typeof generateID === 'function' ? generateID() : Date.now().toString(); };
    
    var safeAccountId = cashierId;  // يمكن تحسينه للربط مع حساب فعلي
    
    if (action === 'open') {
      accSheet.appendRow([
        genId(),
        safeAccountId,
        year,
        new Date().toISOString().split('T')[0],
        POS_REF_TYPES.POS_SHIFT_OPEN,
        shiftId,
        amount.toString(),  // debit
        "0",  // credit
        amount.toString(),
        now
      ]);
    } else if (action === 'close') {
      accSheet.appendRow([
        genId(),
        safeAccountId,
        year,
        new Date().toISOString().split('T')[0],
        POS_REF_TYPES.POS_SHIFT_CLOSE,
        shiftId,
        "0",  // debit
        amount.toString(),  // credit
        (-amount).toString(),
        now
      ]);
    }
  } catch (e) {
    console.error("❌ recordPOSShiftAccounting error:", e);
  }
}

// ========== 📊 إحصائيات POS ==========
function getPOSDashboardStats(year) {
  try {
    year = year || getFiscalYearCode();
    if (!year) return { success: false, stats: {}, error: 'السنة المالية غير محددة' };
    
    var shiftsId = getYearlyTableId("POS_Shifts", year);
    var invoicesId = getYearlyTableId("POS_Invoices", year);
    
    var stats = {
      total_shifts: 0,
      open_shifts: 0,
      closed_shifts: 0,
      total_sales: 0,
      cash_sales: 0,
      credit_sales: 0,
      total_invoices: 0,
      today_sales: 0
    };
    
    if (shiftsId) {
      var shiftsSheet = SpreadsheetApp.openById(shiftsId).getSheets()[0];
      var shiftsData = shiftsSheet.getDataRange().getDisplayValues();
      
      for (var i = 1; i < shiftsData.length; i++) {
        stats.total_shifts++;
        if (shiftsData[i][11] === 'open' || shiftsData[i][11] === 'مفتوح') {
          stats.open_shifts++;
        } else {
          stats.closed_shifts++;
        }
        stats.cash_sales += parseFloat(shiftsData[i][6]) || 0;
        stats.credit_sales += parseFloat(shiftsData[i][7]) || 0;
      }
      stats.total_sales = stats.cash_sales + stats.credit_sales;
    }
    
    if (invoicesId) {
      var invSheet = SpreadsheetApp.openById(invoicesId).getSheets()[0];
      var invData = invSheet.getDataRange().getDisplayValues();
      stats.total_invoices = invData.length - 1;
      
      var today = new Date().toISOString().split('T')[0];
      for (var i = 1; i < invData.length; i++) {
        if (String(invData[i][3]) === today) {
          stats.today_sales += parseFloat(invData[i][12]) || 0;
        }
      }
    }
    
    return {
      success: true,
      stats: stats,
      year: year
    };
  } catch (e) {
    console.error("❌ getPOSDashboardStats error:", e);
    return { success: false, stats: {}, error: e.toString() };
  }
}

// ========== 🛠 دوال مساعدة ==========
function generateTimestamp() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
}

function getPOSSettings() {
  try {
    var settings = typeof loadJSON === 'function' ? loadJSON('COMPANY_SETTINGS', {}) : {};
    return {
      service_charge_percentage: settings.service_charge_percentage || '0',
      pos_enabled: settings.pos_enabled !== false,
      thermal_printer_width: settings.thermal_printer_width || '80'
    };
  } catch (e) {
    console.error("❌ getPOSSettings error:", e);
    return {
      service_charge_percentage: '0',
      pos_enabled: true,
      thermal_printer_width: '80'
    };
  }
}

function getLibraryVersionForPOS() {
  return LIBRARY_VERSION;
}



/**
 * POS_Client.gs – ZEIOS ERP POS (SHEET VERSION)
 * ⚠️ واجهة لاستدعاء دوال المكتبة من الـ HTML
 * ⚠️ هذا الملف في مشروع الجدول (ليس في المكتبة)
 */

// ========== 🔗 ربط المكتبة ==========
var ZEIOS = ZEIOS;  // غيّر للاسم اللي ظهر عندك

// ========== 📦 كاشير ==========
function getCashiersForPOS() {
  try {
    if (typeof ZEIOS !== 'undefined' && typeof ZEIOS.getCashiersForPOS === 'function') {
      return ZEIOS.getCashiersForPOS();
    }
    return [];
  } catch (e) {
    console.error('❌ getCashiersForPOS error:', e);
    return [];
  }
}

function getPOSItems(warehouseId) {
  try {
    if (typeof ZEIOS !== 'undefined' && typeof ZEIOS.getPOSItems === 'function') {
      return ZEIOS.getPOSItems(warehouseId);
    }
    return [];
  } catch (e) {
    console.error('❌ getPOSItems error:', e);
    return [];
  }
}

function searchPOSItems(searchTerm, warehouseId, categoryId) {
  try {
    if (typeof ZEIOS !== 'undefined' && typeof ZEIOS.searchPOSItems === 'function') {
      return ZEIOS.searchPOSItems(searchTerm, warehouseId, categoryId);
    }
    return [];
  } catch (e) {
    console.error('❌ searchPOSItems error:', e);
    return [];
  }
}

// ========== 🔄 شيفت ==========
function openPOSShift(cashierId, cashierName, openingBalance) {
  try {
    if (typeof ZEIOS !== 'undefined' && typeof ZEIOS.openPOSShift === 'function') {
      return ZEIOS.openPOSShift(cashierId, cashierName, openingBalance);
    }
    return { success: false, message: 'دالة فتح الشيفت غير متاحة' };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

function closePOSShift(shiftId, closingBalance, serviceChargePercent) {
  try {
    if (typeof ZEIOS !== 'undefined' && typeof ZEIOS.closePOSShift === 'function') {
      return ZEIOS.closePOSShift(shiftId, closingBalance, serviceChargePercent);
    }
    return { success: false, message: 'دالة إغلاق الشيفت غير متاحة' };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

function getOpenShiftForCashier(cashierId, year) {
  try {
    if (typeof ZEIOS !== 'undefined' && typeof ZEIOS.getOpenShiftForCashier === 'function') {
      return ZEIOS.getOpenShiftForCashier(cashierId, year);
    }
    return null;
  } catch (e) {
    return null;
  }
}

// ========== 💾 فواتير ==========
function savePOSSale(formData, shiftId) {
  try {
    if (typeof ZEIOS !== 'undefined' && typeof ZEIOS.savePOSSale === 'function') {
      return ZEIOS.savePOSSale(formData, shiftId);
    }
    return { success: false, message: 'دالة حفظ الفاتورة غير متاحة' };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

// ========== 📊 إحصائيات ==========
function getPOSDashboardStats(year) {
  try {
    if (typeof ZEIOS !== 'undefined' && typeof ZEIOS.getPOSDashboardStats === 'function') {
      return ZEIOS.getPOSDashboardStats(year);
    }
    return { success: false, stats: {} };
  } catch (e) {
    return { success: false, stats: {} };
  }
}

// ========== ⚙️ إعدادات ==========
function getPOSSettings() {
  try {
    if (typeof ZEIOS !== 'undefined' && typeof ZEIOS.getPOSSettings === 'function') {
      return ZEIOS.getPOSSettings();
    }
    return {
      service_charge_percentage: '0',
      pos_enabled: true,
      thermal_printer_width: '80'
    };
  } catch (e) {
    return {
      service_charge_percentage: '0',
      pos_enabled: true,
      thermal_printer_width: '80'
    };
  }
}

// ========== 🧾 إيصال ==========
function generatePOSReceipt(invoiceId, invoiceNo, formData, year) {
  try {
    if (typeof ZEIOS !== 'undefined' && typeof ZEIOS.generatePOSReceipt === 'function') {
      return ZEIOS.generatePOSReceipt(invoiceId, invoiceNo, formData, year);
    }
    return null;
  } catch (e) {
    return null;
  }
}

// ========== 📝 مساعدة ==========
function getLibraryVersionForPOS() {
  try {
    if (typeof ZEIOS !== 'undefined' && typeof ZEIOS.getLibraryVersionForPOS === 'function') {
      return ZEIOS.getLibraryVersionForPOS();
    }
    return 'غير متصل';
  } catch (e) {
    return 'غير متصل';
  }
}

// ========== ✅ فحص الاتصال ==========
function checkPOSConnection() {
  try {
    if (typeof ZEIOS === 'undefined') {
      return { connected: false, message: '❌ المكتبة غير مربوطة' };
    }
    var version = typeof ZEIOS.getLibraryVersionForPOS === 'function' ? ZEIOS.getLibraryVersionForPOS() : 'غير معروف';
    return { connected: true, message: '✅ المكتبة مربوطة', version: version };
  } catch (e) {
    return { connected: false, message: '❌ خطأ: ' + e.toString() };
  }
}
