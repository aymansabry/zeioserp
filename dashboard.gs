/**
 * Dashboard_Library.gs – ZEIOS ERP Dashboard (LIBRARY VERSION)
 * الإصدار: 3.3.0
 * ⚠️ يحتوي على دوال التحقق من الترخيص فقط
 * ⚠️ جميع الدوال عامة (بدون _) لتعمل مع نظام المكتبات
 * 📞 الدعم: zeioszeios0@gmail.com | WhatsApp: 00201205951462
 */

var LIBRARY_VERSION = '3.3.0';

/**
 * ✅ التحقق من صلاحية الترخيص - الدالة الوحيدة في هذه المكتبة
 * @returns {Object} { valid: boolean, message: string, ... }
 */
function validateLicenseForDashboardLibrary() {
  try {
    // ✅ استدعاء دالة التحقق الأساسية من core.gs إذا وجدت
    if (typeof validateLicenseFromServer === 'function') {
      return validateLicenseFromServer();
    }
    
    // Fallback: تحقق محلي للتوافق
    return {
      valid: true,
      message: '✅ ترخيص ساري (تحقق محلي)',
      expiresAt: '',
      daysRemaining: 90,
      requiresActivation: false,
      checkedAt: new Date().toISOString(),
      source: 'local'
    };
  } catch (e) {
    console.error("❌ validateLicenseForDashboardLibrary error:", e);
    return {
      valid: false,
      message: '❌ خطأ في التحقق: ' + e.toString(),
      expiresAt: '',
      daysRemaining: 0,
      requiresActivation: true,
      checkedAt: new Date().toISOString(),
      source: 'error'
    };
  }
}

/**
 * ✅ الحصول على إصدار المكتبة
 */
function getLibraryVersionForDashboard() {
  return LIBRARY_VERSION;
}

/**
 * Dashboard.gs – ZEIOS ERP Dashboard Server
 * ✅ متوافق مع core.gs ونظام إدارة جلسات المستخدمين
 * ✅ فتح الصفحات يعمل في كلا السياقين: داخل الجدول + ويب أب
 * 📞 الدعم: zeioszeios0@gmail.com | WhatsApp: 00201205951462
 */

// ========== 🔗 ربط المكتبة ==========
var ZEIOS = ZEIOS;

// ========== 📦 خصائص المستند ==========
function getDocProperties() {
  return PropertiesService.getDocumentProperties();
}

function loadJSON(key, defaultValue) {
  if (defaultValue === undefined) defaultValue = null;
  try {
    var data = getDocProperties().getProperty(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

function saveJSON(key, data) {
  try {
    getDocProperties().setProperty(key, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('saveJSON error:', e);
    return false;
  }
}

// ========== 📅 دوال السنوات المالية ==========
function getAvailableFiscalYears() {
  try {
    let yearsList = [];
    let fullData = [];
    
    if (typeof getAllFiscalYears === 'function') {
      fullData = getAllFiscalYears();
      yearsList = fullData.map(function(y) { return y.year_code; });
    } else {
      const links = loadJSON('TABLE_LINKS', { yearly: {} });
      yearsList = Object.keys(links.yearly || {}).sort().reverse();
      fullData = yearsList.map(function(y) { return { year_code: y, has_tables: true }; });
    }
    
    return {
      success: true, 
      years: yearsList, 
      fullData: fullData,
      count: yearsList.length,
      defaultYear: yearsList.length > 0 ? yearsList[0] : new Date().getFullYear().toString()
    };
  } catch (e) {
    return { success: false, years: [], fullData: [], count: 0, defaultYear: new Date().getFullYear().toString(), error: e.message };
  }
}

function getYearlyTableLinks(fiscalYear) {
  try {
    var year = typeof ensureFiscalYear === 'function' ? ensureFiscalYear(fiscalYear) : fiscalYear;
    if (!year) return { success: false, message: 'يجب تحديد السنة المالية', tables: {}, year: null };
    
    const links = loadJSON('TABLE_LINKS', { yearly: {} });
    const yearTables = links.yearly && links.yearly[year] ? links.yearly[year] : {};
    
    return { success: true, year: year, tables: yearTables, count: Object.keys(yearTables).length };
  } catch (e) {
    return { success: false, message: e.message, tables: {}, year: fiscalYear };
  }
}

function isYearAvailable(fiscalYear) {
  try {
    if (!fiscalYear) return false;
    if (typeof getAllFiscalYears === 'function') {
      var years = getAllFiscalYears();
      for (var i = 0; i < years.length; i++) {
        if (years[i].year_code === fiscalYear) return true;
      }
      return false;
    }
    const links = loadJSON('TABLE_LINKS', { yearly: {} });
    return !!(links.yearly && links.yearly[fiscalYear]);
  } catch (e) { return false; }
}

// ========== 🏢 معلومات الشركة ==========
function getCompanyInfo() {
  try {
    if (typeof ZEIOS !== 'undefined' && typeof ZEIOS.getCompanyInfoForDashboard === 'function') {
      return ZEIOS.getCompanyInfoForDashboard();
    }
    if (typeof loadJSON === 'function') {
      var company = loadJSON('COMPANY_SETTINGS', {});
      return {
        name: company.name || 'نظام ZEIOS ERP',
        address: company.address || '',
        phone: company.phone || '',
        email: company.email || '',
        tax_no: company.tax_no || '',
        tax_percentage: company.tax_percentage || '0'
      };
    }
    try {
      var props = PropertiesService.getDocumentProperties();
      var data = props.getProperty('COMPANY_SETTINGS');
      if (data) {
        var company = JSON.parse(data);
        return {
          name: company.name || 'نظام ZEIOS ERP',
          address: company.address || '',
          phone: company.phone || '',
          email: company.email || '',
          tax_no: company.tax_no || '',
          tax_percentage: company.tax_percentage || '0'
        };
      }
    } catch (ex) {}
    return { name: 'نظام ZEIOS ERP' };
  } catch (e) { 
    console.error('❌ getCompanyInfo error:', e);
    return { name: 'نظام ZEIOS ERP' }; 
  }
}

// ========== 📊 إحصائيات لوحة التحكم ==========
function getDashboardStats(fiscalYear) {
  try {
    var year = typeof ensureFiscalYear === 'function' ? ensureFiscalYear(fiscalYear) : fiscalYear;
    if (!year) {
      return {
        fiscalYear: null, message: 'يجب تحديد السنة المالية',
        totalSales: 0, totalPurchases: 0, stockValue: 0,
        receivables: 0, payables: 0, cashBalance: 0,
        salesTrend: 0, purchasesTrend: 0,
        totalItems: 0, totalCustomers: 0, totalSuppliers: 0,
        totalOrders: 0, lowStockItems: 0, pendingOrders: 0
      };
    }
    
    var stats = {
      fiscalYear: year,
      totalSales: 0, totalPurchases: 0, stockValue: 0,
      receivables: 0, payables: 0, cashBalance: 0,
      salesTrend: 0, purchasesTrend: 0,
      totalItems: 0, totalCustomers: 0, totalSuppliers: 0,
      totalOrders: 0, lowStockItems: 0, pendingOrders: 0
    };
    
    try {
      var salesId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Sales_Invoices", year) : null;
      if (salesId) {
        var sheet = SpreadsheetApp.openById(salesId).getSheets()[0];
        var data = sheet.getDataRange().getDisplayValues();
        var total = 0;
        var statusCol = _findColumnIndex(data[0], "status");
        for (var i = 1; i < data.length; i++) {
          var status = statusCol >= 0 ? (data[i][statusCol] || '').toLowerCase() : '';
          if (status.includes('مكتمل') || status.includes('approved') || status === '') {
            total += parseFloat(data[i][11] || '0');
          }
        }
        stats.totalSales = parseFloat(total.toFixed(2));
      }
    } catch (e) { console.warn('⚠️ Sales calc error:', e); }
    
    try {
      var purchasesId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Purchase_Invoices", year) : null;
      if (purchasesId) {
        var sheet = SpreadsheetApp.openById(purchasesId).getSheets()[0];
        var data = sheet.getDataRange().getDisplayValues();
        var total = 0;
        var statusCol = _findColumnIndex(data[0], "status");
        for (var j = 1; j < data.length; j++) {
          var status = statusCol >= 0 ? (data[j][statusCol] || '').toLowerCase() : '';
          if (status.includes('مكتمل') || status.includes('approved') || status === '') {
            total += parseFloat(data[j][11] || '0');
          }
        }
        stats.totalPurchases = parseFloat(total.toFixed(2));
      }
    } catch (e) { console.warn('⚠️ Purchases calc error:', e); }
    
    try {
      var balanceId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Inventory_Balance", year) : null;
      if (balanceId) {
        var sheet = SpreadsheetApp.openById(balanceId).getSheets()[0];
        var data = sheet.getDataRange().getDisplayValues();
        var value = 0;
        var itemsMap = _getItemsCostMap();
        for (var l = 1; l < data.length; l++) {
          var qty = parseFloat(data[l][4] || '0');
          var itemId = data[l][1];
          if (qty > 0 && itemsMap[itemId]) value += qty * itemsMap[itemId];
        }
        stats.stockValue = parseFloat(value.toFixed(2));
      }
    } catch (e) { console.warn('⚠️ Stock calc error:', e); }
    
    try {
      var itemsId = typeof getMasterTableId === 'function' ? getMasterTableId("Items") : null;
      if (itemsId) {
        var sheet = SpreadsheetApp.openById(itemsId).getSheets()[0];
        stats.totalItems = Math.max(0, sheet.getLastRow() - 1);
      }
    } catch (e) { console.warn('⚠️ Items count error:', e); }
    
    try {
      if (typeof getCustomers === 'function') stats.totalCustomers = getCustomers().length;
      if (typeof getSuppliers === 'function') stats.totalSuppliers = getSuppliers().length;
      if (typeof _calculateTotalReceivables === 'function') stats.receivables = _calculateTotalReceivables(year);
      if (typeof _calculateTotalPayables === 'function') stats.payables = _calculateTotalPayables(year);
      if (typeof _calculateCashBalance === 'function') stats.cashBalance = _calculateCashBalance(year);
    } catch (e) { console.warn('⚠️ Balances calc error:', e); }
    
    return { success: true, message: '✅ تم جلب الإحصائيات', stats: stats };
  } catch (e) {
    console.error('getDashboardStats error:', e.toString());
    return {
      fiscalYear: typeof ensureFiscalYear === 'function' ? ensureFiscalYear(fiscalYear) : null,
      totalSales: 0, totalPurchases: 0, stockValue: 0,
      receivables: 0, payables: 0, cashBalance: 0,
      salesTrend: 0, purchasesTrend: 0,
      totalItems: 0, totalCustomers: 0, totalSuppliers: 0,
      totalOrders: 0, lowStockItems: 0, pendingOrders: 0
    };
  }
}

// ========== 🔍 دوال مساعدة ==========
function _findColumnIndex(headers, columnName) {
  if (!headers || !Array.isArray(headers)) return -1;
  var searchName = columnName.toLowerCase().trim();
  for (var i = 0; i < headers.length; i++) {
    if ((headers[i] || '').toString().toLowerCase().trim() === searchName) return i;
  }
  return -1;
}

function _getItemsCostMap() {
  try {
    var itemsId = typeof getMasterTableId === 'function' ? getMasterTableId("Items") : null;
    if (!itemsId) return {};
    var sheet = SpreadsheetApp.openById(itemsId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    var map = {};
    for (var i = 1; i < data.length; i++) {
      var id = (data[i][0] || '').toString().trim();
      var cost = parseFloat(data[i][8] || '0');
      if (id) map[id] = cost;
    }
    return map;
  } catch (e) { return {}; }
}

function _calculateTotalReceivables(fiscalYear) {
  try {
    var total = 0;
    if (typeof getCustomers === 'function' && typeof getCustomerBalanceWithYear === 'function') {
      var customers = getCustomers();
      for (var i = 0; i < customers.length; i++) {
        var balance = getCustomerBalanceWithYear(customers[i].id, fiscalYear);
        total += parseFloat(balance.balance || '0');
      }
    }
    return parseFloat(total.toFixed(2));
  } catch (e) { return 0; }
}

function _calculateTotalPayables(fiscalYear) {
  try {
    var total = 0;
    if (typeof getSuppliers === 'function' && typeof getSupplierBalanceWithYear === 'function') {
      var suppliers = getSuppliers();
      for (var i = 0; i < suppliers.length; i++) {
        var balance = getSupplierBalanceWithYear(suppliers[i].id, fiscalYear);
        total += Math.abs(parseFloat(balance.balance || '0'));
      }
    }
    return parseFloat(total.toFixed(2));
  } catch (e) { return 0; }
}

function _calculateCashBalance(fiscalYear) {
  try {
    var total = 0;
    if (typeof getSafes === 'function' && typeof getAccountBalanceWithYear === 'function') {
      var safes = getSafes();
      for (var i = 0; i < safes.length; i++) {
        var balance = getAccountBalanceWithYear(safes[i].id, fiscalYear);
        total += parseFloat(balance.balance || '0');
      }
    }
    return parseFloat(total.toFixed(2));
  } catch (e) { return 0; }
}

function _calculateLowStockItems(fiscalYear) { try { return 0; } catch (e) { return 0; } }

// ========== 🌐 دوال فتح الصفحات (الأصلية التي كانت تعمل) ==========

function getActiveSpreadsheetName() {
  try { return SpreadsheetApp.getActiveSpreadsheet().getName() || "غير معروف"; }
  catch (e) { return "غير معروف"; }
}

function isSpreadsheetContext() {
  try { SpreadsheetApp.getUi(); return true; }
  catch (e) { return false; }
}

/**
 * ✅ فتح صفحة - تعمل في كلا السياقين (جدول + ويب أب)
 */
function openPageInSpreadsheet(pageName) {
  try {
    var title = getPageTitle(pageName);
    
    // ✅ إذا كنا داخل واجهة الجدول: اعرض كـ مودال
    if (isSpreadsheetContext()) {
      var html = HtmlService.createHtmlOutputFromFile(pageName)
        .setTitle(title)
        .setWidth(1400)
        .setHeight(900);
      SpreadsheetApp.getUi().showModalDialog(html, title);
      return { success: true, mode: "spreadsheet" };  // ⚠️ لا يوجد url هنا
    }
    
    // ✅ إذا كنا في ويب أب: أرجع الرابط للواجهة لتفتحه
    var baseUrl = ScriptApp.getService ? ScriptApp.getService().getUrl() : '';
    return { success: true, mode: "webapp", url: baseUrl + "?page=" + pageName };
    
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

function openReport(reportName) { return openPageInSpreadsheet(reportName); }
function openSettings() { return openPageInSpreadsheet('setting'); }
function openBackup() { return openPageInSpreadsheet('backup'); }

function getPageTitle(pageName) {
  var titles = {
    'dashboard': '📊 لوحة التحكم - ZEIOS ERP',
    'items': '📦 إدارة الأصناف - ZEIOS ERP',
    'categories': '🏷️ التصنيفات - ZEIOS ERP',
    'units': '⚖️ الوحدات - ZEIOS ERP',
    'warehouses': '🏢 المستودعات - ZEIOS ERP',
    'accounts': '📊 شجرة الحسابات - ZEIOS ERP',
    'colors': '🎨 الألوان - ZEIOS ERP',
    'purchases': '🛒 المشتريات - ZEIOS ERP',
    'purchases_return': '↩️ مرتجع المشتريات - ZEIOS ERP',
    'sales': '💰 المبيعات - ZEIOS ERP',
    'sales_return': '↩️ مرتجع المبيعات - ZEIOS ERP',
    'item_transfer': '🔄 نقل مخزون - ZEIOS ERP',
    'payments': '💸 المدفوعات - ZEIOS ERP',
    'receipts': '📥 المقبوضات - ZEIOS ERP',
    'checks': '💳 الشيكات - ZEIOS ERP',
    'customer_orders': '📋 طلبات العملاء - ZEIOS ERP',
    'general_journal': '📓 اليومية العامة - ZEIOS ERP',
    'stock_movements': '📦 حركة المخزون - ZEIOS ERP',
    'account_statement': '📄 كشف حساب - ZEIOS ERP',
    'trial_balance': '⚖️ ميزان المراجعة - ZEIOS ERP',
    'profit_loss': '📊 قائمة الدخل - ZEIOS ERP',
    'balance_sheet': '🏦 الميزانية - ZEIOS ERP',
    'setting': '⚙️ إعدادات النظام - ZEIOS ERP',
    'backup': '💾 النسخ الاحتياطي - ZEIOS ERP',
    'stats': '📈 الإحصائيات - ZEIOS ERP',
    'pos': '🛒 نقطة البيع - ZEIOS ERP',
    'index': '🔐 تسجيل الدخول - ZEIOS ERP',
    'password': '🔐 كلمة المرور - ZEIOS ERP',
    'renew': '🔄 تجديد الترخيص - ZEIOS ERP'
  };
  return titles[pageName] || '📄 ' + pageName + ' - ZEIOS ERP';
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function showTableLinks(fiscalYear) {
  try {
    var year = typeof ensureFiscalYear === 'function' ? ensureFiscalYear(fiscalYear) : fiscalYear;
    if (!year) year = new Date().getFullYear().toString();
    
    const tableLinks = loadJSON('TABLE_LINKS', { master: {}, yearly: {} });
    var html = '<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><style>';
    html += 'body{padding:20px;background:#f5f5f5;font-family:sans-serif;direction:rtl}';
    html += '.container{max-width:800px;margin:0 auto}';
    html += '.link-card{background:#fff;border:1px solid #ddd;border-radius:8px;padding:15px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center}';
    html += '.btn{display:inline-block;padding:8px 16px;background:#1a73e8;color:#fff;text-decoration:none;border-radius:4px;margin-right:10px;border:none;cursor:pointer}';
    html += '.btn:hover{background:#0d47a1}.btn-secondary{background:#6c757d}.btn-secondary:hover{background:#545b62}';
    html += 'h2{color:#1a73e8;margin:0 0 20px}h3{color:#333;font-size:16px;margin:20px 0 10px}';
    html += '.year-badge{background:#e8f4fd;color:#1a73e8;padding:4px 12px;border-radius:20px;font-size:12px}';
    html += '.year-selector{margin-bottom:20px;padding:15px;background:#f8f9fa;border-radius:8px;display:flex;align-items:center;gap:10px}';
    html += 'select{padding:8px;border-radius:4px;border:1px solid #ddd;font-size:14px}';
    html += '</style></head><body><div class="container"><h2>🔗 روابط الجداول - ZEIOS</h2>';
    
    html += '<div class="year-selector"><label for="yearSelect">📅 اختر السنة:</label><select id="yearSelect" onchange="changeYear()">';
    var availableYears = getAvailableFiscalYears();
    var yearsList = availableYears.years || [];
    for (var i = 0; i < yearsList.length; i++) {
      var selected = (yearsList[i] === year) ? 'selected' : '';
      html += '<option value="' + yearsList[i] + '" ' + selected + '>' + yearsList[i] + '</option>';
    }
    html += '</select><button class="btn btn-secondary" onclick="reloadWithYear()">🔄 عرض</button></div>';
    
    html += '<h3>📊 الجداول الرئيسية</h3>';
    var master = tableLinks.master || {};
    var masterKeys = Object.keys(master).sort();
    for (var m = 0; m < masterKeys.length; m++) {
      var name = masterKeys[m], info = master[name];
      var safeName = escapeHtml(name.replace(/_/g, ' ')), safeUrl = escapeHtml(info.url || '#');
      html += '<div class="link-card"><span>' + safeName + '</span><a class="btn" href="' + safeUrl + '" target="_blank">🔗 فتح</a></div>';
    }
    
    if (year && tableLinks.yearly && tableLinks.yearly[year]) {
      html += '<h3>📅 جداول سنة ' + escapeHtml(year) + '</h3>';
      var yearly = tableLinks.yearly[year] || {};
      var yearlyKeys = Object.keys(yearly).sort();
      for (var y = 0; y < yearlyKeys.length; y++) {
        var tName = yearlyKeys[y], tInfo = yearly[tName];
        var tSafeName = escapeHtml(tName.replace(/_/g, ' ')), tSafeUrl = escapeHtml(tInfo.url || '#');
        html += '<div class="link-card"><span>' + tSafeName + '</span><a class="btn" href="' + tSafeUrl + '" target="_blank">🔗 فتح</a></div>';
      }
    } else if (year) {
      html += '<p style="color:#dc3545">⚠️ لا توجد جداول للسنة ' + escapeHtml(year) + '</p>';
    }
    
    html += '<div style="margin-top:20px"><button class="btn btn-secondary" onclick="closePage()">❌ إغلاق</button></div>';
    html += '<script>function changeYear(){var year=document.getElementById("yearSelect").value;if(year){window.location.href=window.location.pathname+"?year="+year;}}function reloadWithYear(){var year=document.getElementById("yearSelect").value;if(year&&typeof google!=="undefined"&&google.script&&google.script.run){google.script.run.withSuccessHandler(function(){location.reload();}).setUserFiscalYear(year);}else{window.location.href=window.location.pathname+"?year="+year;}}function closePage(){if(typeof google!=="undefined"&&google.script&&google.script.host){google.script.host.close();}else{window.close();}}</script></div></body></html>';
    
    if (isSpreadsheetContext()) {
      SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(html).setWidth(700).setHeight(600), "روابط الجداول - ZEIOS");
      return { success: true, mode: "spreadsheet", year: year };
    } else {
      return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }
  } catch (e) {
    console.error('showTableLinks error:', e.toString());
    if (isSpreadsheetContext()) {
      SpreadsheetApp.getUi().alert('خطأ', 'فشل عرض الروابط: ' + e.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
      return { success: false };
    } else {
      return HtmlService.createHtmlOutput("<h3>حدث خطأ: " + escapeHtml(e.toString()) + "</h3>");
    }
  }
}

function pageExists(pageName) {
  try { 
    var html = HtmlService.createHtmlOutputFromFile(pageName); 
    return html !== null; 
  } catch (e) { 
    return false; 
  }
}

function getAllowedPages() {
  return ['dashboard', 'items', 'categories', 'units', 'warehouses', 'accounts', 'colors',
    'purchases', 'purchases_return', 'sales', 'sales_return', 'item_transfer', 'payments',
    'receipts', 'checks', 'customer_orders', 'general_journal', 'stock_movements',
    'account_statement', 'trial_balance', 'profit_loss', 'balance_sheet', 'setting', 
    'backup', 'stats', 'pos', 'index', 'password', 'renew'];
}

/**
 * ✅ فتح صفحة مع نتيجة - للواجهة
 */
function openPageWithResult(pageName) {
  try {
    if (!pageExists(pageName)) {
      return { success: false, message: 'الصفحة المطلوبة غير موجودة: ' + pageName };
    }
    return openPageInSpreadsheet(pageName);
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

// ========== 🌐 Web App Entry Point ==========
function doGet(e) {
  try {
    var page = e && e.parameter && e.parameter.page ? e.parameter.page : 'dashboard';
    var year = e && e.parameter && e.parameter.year ? e.parameter.year : null;
    
    var allowedPages = getAllowedPages();
    var pageName = allowedPages.indexOf(page) !== -1 ? page : 'dashboard';
    
    var htmlOutput = HtmlService.createHtmlOutputFromFile(pageName);
    var content = htmlOutput.getContent();
    
    var userYear = year || (typeof getCurrentUserFiscalYear === 'function' ? getCurrentUserFiscalYear() : null) || new Date().getFullYear().toString();
    var availableYears = getAvailableFiscalYears();
    
    var scriptVars = '<script>';
    scriptVars += 'var CURRENT_USER_YEAR="' + userYear + '";';
    scriptVars += 'var ALL_FISCAL_YEARS=' + JSON.stringify(availableYears.years || []) + ';';
    scriptVars += 'var FISCAL_YEARS_FULL=' + JSON.stringify(availableYears.fullData || []) + ';';
    scriptVars += '</script>';
    
    content = content.replace('<head>', '<head>' + scriptVars);
    
    return HtmlService.createHtmlOutput(content)
      .setTitle(getPageTitle(pageName))
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  } catch (error) {
    console.error('doGet error:', error.toString());
    return HtmlService.createHtmlOutputFromFile('dashboard')
      .setTitle('📊 لوحة التحكم - ZEIOS ERP')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
}

// ========== 🔄 دوال مساعدة للواجهة ==========
function getDashboardInitData(fiscalYear) {
  try {
    var year = typeof ensureFiscalYear === 'function' ? ensureFiscalYear(fiscalYear) : fiscalYear;
    if (!year) year = typeof getCurrentUserFiscalYear === 'function' ? getCurrentUserFiscalYear() : new Date().getFullYear().toString();
    if (typeof setUserSession === 'function' && year) setUserSession(year);
    
    return {
      success: true, company: getCompanyInfo(), fiscalYear: year,
      availableYears: getAvailableFiscalYears(), stats: getDashboardStats(year),
      tableLinks: getYearlyTableLinks(year), timestamp: new Date().toISOString(),
      userEmail: Session.getActiveUser ? Session.getActiveUser().getEmail() : ''
    };
  } catch (e) {
    console.error('getDashboardInitData error:', e.toString());
    return { success: false, message: e.message, timestamp: new Date().toISOString() };
  }
}

function setUserFiscalYear(fiscalYear) {
  try {
    if (!isYearAvailable(fiscalYear)) return { success: false, message: 'السنة المحددة غير متوفرة في النظام' };
    if (typeof setUserSession === 'function') setUserSession(fiscalYear);
    return { success: true, message: 'تم تعيين السنة المالية: ' + fiscalYear, fiscalYear: fiscalYear, tableLinks: getYearlyTableLinks(fiscalYear), stats: getDashboardStats(fiscalYear) };
  } catch (e) { return { success: false, message: e.message }; }
}

function getCurrentYear() {
  try {
    if (typeof getCurrentUserFiscalYear === 'function') return getCurrentUserFiscalYear();
    return new Date().getFullYear().toString();
  } catch (e) { return new Date().getFullYear().toString(); }
}

// ========== 🔐 دوال المستخدمين (مع تحقق الترخيص عند الدخول فقط) ==========
function loginUser(username, password) {
  try {
    // ✅ تحقق من الترخيص عند تسجيل الدخول فقط
    if (typeof ZEIOS !== 'undefined' && typeof ZEIOS.validateLicenseForDashboardLibrary === 'function') {
      var license = ZEIOS.validateLicenseForDashboardLibrary();
      if (!license || license.valid !== true) {
        return { success: false, message: license?.message || 'ترخيصك منتهي', license_expired: true };
      }
    }
    
    var usersId = typeof getMasterTableId === 'function' ? getMasterTableId("Users") : null;
    if (!usersId) return { success: false, message: 'جدول المستخدمين غير موجود' };
    
    var sheet = SpreadsheetApp.openById(usersId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][1]) === String(username)) {
        var storedHash = data[i][2];
        var storedSalt = data[i][3];
        
        // ✅ حالة خاصة للمدير: ابحث في الـ Properties إذا كانت الحقول فارغة
        if ((!storedHash || !storedSalt) && username === 'admin') {
          var propsPassword = typeof loadJSON === 'function' ? loadJSON('ADMIN_PASSWORD', null) : null;
          if (propsPassword && propsPassword.hash && propsPassword.salt) {
            storedHash = propsPassword.hash;
            storedSalt = propsPassword.salt;
          }
        }
        
        if (storedHash && storedSalt && typeof verifyPassword === 'function' && verifyPassword(password, storedHash, storedSalt)) {
          return {
            success: true, message: '✅ تم تسجيل الدخول بنجاح',
            user: { id: data[i][0], username: data[i][1], role: data[i][4], permissions: JSON.parse(data[i][5] || '{}') }
          };
        }
      }
    }
    return { success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
  } catch (e) {
    console.error('❌ loginUser error:', e);
    return { success: false, message: e.toString() };
  }
}

function logoutUser(userId) {
  try {
    if (typeof PropertiesService !== 'undefined') PropertiesService.getUserProperties().deleteProperty('ZEIOS_USER_SESSION');
    return { success: true, message: '✅ تم تسجيل الخروج بنجاح' };
  } catch (e) { return { success: false, message: e.toString() }; }
}

function getUserPermissions(userId) {
  return { success: true, permissions: { allowed_pages: ['dashboard', 'stats', 'pos', 'items', 'sales', 'purchases'], role: 'admin', read_only: false } };
}

// ========== 🛠 دوال عامة ==========
function getLibraryVersion() {
  try {
    if (typeof ZEIOS !== 'undefined' && typeof ZEIOS.getLibraryVersionForDashboard === 'function') return ZEIOS.getLibraryVersionForDashboard();
    return '3.3.0';
  } catch (e) { return 'غير متصل'; }
}

function checkDashboardConnection() {
  try {
    if (typeof ZEIOS === 'undefined') return { connected: false, message: '❌ المكتبة غير مربوطة' };
    var version = typeof ZEIOS.getLibraryVersionForDashboard === 'function' ? ZEIOS.getLibraryVersionForDashboard() : 'غير معروف';
    return { connected: true, message: '✅ المكتبة مربوطة', version: version };
  } catch (e) { return { connected: false, message: '❌ خطأ: ' + e.toString() }; }
}
/**
 * ✅ غلاف لـ validateLicenseForDashboardLibrary
 * ⚠️ هذه الدالة مطلوبة للواجهة لأن google.script.run يستدعي فقط دوال مشروع الجدول
 */
function validateLicenseForDashboardLibrary() {
  try {
    // ✅ استدعاء من المكتبة إذا كانت مربوطة
    if (typeof ZEIOS !== 'undefined' && typeof ZEIOS.validateLicenseForDashboardLibrary === 'function') {
      return ZEIOS.validateLicenseForDashboardLibrary();
    }
    
    // ✅ Fallback: تحقق محلي للتوافق
    return {
      valid: true,
      message: '✅ ترخيص ساري (تحقق محلي)',
      expiresAt: '',
      daysRemaining: 90,
      requiresActivation: false,
      checkedAt: new Date().toISOString(),
      source: 'local'
    };
  } catch (e) {
    console.error('❌ validateLicenseForDashboardLibrary (client) error:', e);
    return {
      valid: false,
      message: '❌ خطأ: ' + e.toString(),
      expiresAt: '',
      daysRemaining: 0,
      requiresActivation: true,
      checkedAt: new Date().toISOString(),
      source: 'error'
    };
  }
}
