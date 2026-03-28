/**
 * core.gs – ZEIOS ERP SYSTEM (LIBRARY VERSION)
 * الإصدار: 3.3.0
 * ⚠️ هذه المكتبة تحتوي على دوال Backend فقط (بدون واجهات)
 * ⚠️ تستخدم DocumentProperties لعزل بيانات كل شيت
 * 📞 الدعم: zeioszeios0@gmail.com | WhatsApp: 00201205951462
 */

// ========== 🔐 ثوابت النظام ==========
var HASH_ALGORITHM = 'SHA_256';
var SCRIPT_TZ = Session.getScriptTimeZone();
var DATE_FORMAT = 'dd-MM-yyyy HH:mm:ss';
var LIBRARY_VERSION = '3.3.0';

// ========== 📦 مفاتيح التخزين ==========
var COMPANY_KEYS = {
  SETTINGS: 'COMPANY_SETTINGS',
  TAX_NO: 'tax_no',
  TAX_PERCENTAGE: 'tax_percentage',
  SERVICE_CHARGE_PERCENTAGE: 'service_charge_percentage',  // ✅ نسبة مصاريف الخدمة
  POS_ENABLED: 'pos_enabled',                               // ✅ تفعيل نقطة البيع
  THERMAL_PRINTER_WIDTH: 'thermal_printer_width',           // ✅ عرض الطابعة الحرارية
  NAME: 'name',
  ADDRESS: 'address',
  POSTAL_ADDRESS: 'postal_address',
  PHONE: 'phone',
  EMAIL: 'email'
};

// ========== 🗂️ أعمدة الجداول (محدثة لتطابق الهيكل الفعلي) ==========
var COL = {
  // جدول أرصدة المخزون: [id, item_id, color_id, warehouse_id, balance, updated_at, fiscal_year]
  INVENTORY_BALANCE: { ID: 0, ITEM_ID: 1, COLOR_ID: 2, WAREHOUSE_ID: 3, BALANCE: 4, UPDATED_AT: 5, FISCAL_YEAR: 6 },
  
  // جدول حركات المخزون: [id, item_id, warehouse_id, fiscal_year, date, qty_in, qty_out, color_id, ref_type, ref_id, balance_after, unit_cost, created_at, notes]
  STOCK_MOVEMENTS: { ID: 0, ITEM_ID: 1, WAREHOUSE_ID: 2, FISCAL_YEAR: 3, DATE: 4, QTY_IN: 5, QTY_OUT: 6, COLOR_ID: 7, REF_TYPE: 8, REF_ID: 9, BALANCE_AFTER: 10, UNIT_COST: 11, CREATED_AT: 12, NOTES: 13 },
  
  // جدول الأصناف: [id, item_code, item_name, image_id, description, category, unit, sale_price, cost_price, opening_bal, last_purchase, created_at]
  ITEMS: { ID: 0, ITEM_CODE: 1, ITEM_NAME: 2, IMAGE_ID: 3, DESCRIPTION: 4, CATEGORY: 5, UNIT: 6, SALE_PRICE: 7, COST_PRICE: 8, OPENING_BAL: 9, LAST_PURCHASE: 10, CREATED_AT: 11 },
  
  // جدول شجرة الحسابات: [id, account_no, account_name, parent_account_id, bs_group_id, pl_group_id, contact_name, address, phone, email, credit_limit, created_at, locked]
  CHART_OF_ACCOUNTS: { ID: 0, ACCOUNT_NO: 1, ACCOUNT_NAME: 2, PARENT: 3, BS_GROUP: 4, PL_GROUP: 5, CONTACT: 6, ADDRESS: 7, PHONE: 8, EMAIL: 9, CREDIT_LIMIT: 10, CREATED_AT: 11, LOCKED: 12 },
  
  // جدول الحركات المحاسبية: [id, account_id, fiscal_year, date, ref_type, ref_id, debit, credit, balance_after, created_at]
  ACCOUNT_MOVEMENTS: { ID: 0, ACCOUNT_ID: 1, FISCAL_YEAR: 2, DATE: 3, REF_TYPE: 4, REF_ID: 5, DEBIT: 6, CREDIT: 7, BALANCE_AFTER: 8, CREATED_AT: 9 },
  
  // جدول المدفوعات/المقبوضات: [id, fiscal_year, date, ref_type, ref_id, amount, account_id, safe_id, notes, created_at]
  PAYMENTS_RECEIPTS: { ID: 0, FISCAL_YEAR: 1, DATE: 2, REF_TYPE: 3, REF_ID: 4, AMOUNT: 5, ACCOUNT_ID: 6, SAFE_ID: 7, NOTES: 8, CREATED_AT: 9 },
  
  // جدول المستودعات: [id, warehouse_code, warehouse_name, created_at]
  WAREHOUSES: { ID: 0, WAREHOUSE_CODE: 1, WAREHOUSE_NAME: 2, CREATED_AT: 3 },
  
  // جدول الألوان: [id, color_code, color_name, created_at]
  COLORS: { ID: 0, COLOR_CODE: 1, COLOR_NAME: 2, CREATED_AT: 3 }
};

// ========== 🔄 أنواع المراجع ==========
var REF_TYPES = {
  PURCHASE: 'PURCHASE', PURCHASE_INVENTORY: 'PURCHASE_INVENTORY', PURCHASE_TAX: 'PURCHASE_TAX',
  PURCHASE_DISCOUNT: 'PURCHASE_DISCOUNT', SHIPPING_EXPENSE_PURCHASE: 'SHIPPING_EXPENSE_PURCHASE',
  SALE: 'SALE', SALE_INVENTORY: 'SALE_INVENTORY', SALE_TAX: 'SALE_TAX', SALE_DISCOUNT: 'SALE_DISCOUNT',
  PURCHASE_RETURN: 'PURCHASE_RETURN', PURCHASE_RETURN_INVENTORY: 'PURCHASE_RETURN_INVENTORY',
  SALES_RETURN: 'SALES_RETURN', SALES_RETURN_INVENTORY: 'SALES_RETURN_INVENTORY',
  PAYMENT: 'PAYMENT', RECEIPT: 'RECEIPT', OPENING_BALANCE: 'OPENING_BALANCE',
  STOCK_ADJUSTMENT: 'STOCK_ADJUSTMENT', STOCK_TRANSFER: 'STOCK_TRANSFER'
};

// ========== 💰 حسابات النظام ==========
var ACCOUNTS = {
  CASH_MAIN: '110001', BANK_MAIN: '110002', RECEIVABLE_CONTROL: '1200', INVENTORY: '1300',
  FINISHED_GOODS: '1300', PAYABLE_CONTROL: '2100', VAT_PAYABLE: '220001', CAPITAL: '3100',
  RETAINED_EARNINGS: '3200', SALES_REVENUE: '4000', SALES_PRODUCTS: '400001', OTHER_REVENUE: '4100',
  DISCOUNT_EARNED: '410001', COST_OF_SALES: '5000', OTHER_EXPENSES: '5100', DISCOUNT_ALLOWED: '510001',
  ADMIN_EXPENSES: '510002', OPERATING_EXPENSES: '6000', SHIPPING_EXPENSE_OP: '600001'
};

// ========== 🔐 أدوات كلمات المرور ==========
function generateSalt() {
  return Utilities.base64EncodeWebSafe(
    Utilities.newBlob(Utilities.getUuid()).getBytes()
  ).substring(0, 16);
}

function hashPassword(password, salt) {
  if (!salt) salt = generateSalt();
  var digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm[HASH_ALGORITHM],
    salt + password,
    Utilities.Charset.UTF_8
  );
  return {
    hash: Utilities.base64EncodeWebSafe(digest),
    salt: salt,
    algorithm: HASH_ALGORITHM
  };
}

function verifyPassword(password, storedHash, storedSalt) {
  return password && storedHash && storedSalt &&
    hashPassword(password, storedSalt).hash === storedHash;
}

// ========== 👥 إدارة جلسات المستخدمين ==========
var USER_PROPS = PropertiesService.getUserProperties();

function getUserSession() {
  try {
    var session = USER_PROPS.getProperty('ZEIOS_SESSION');
    return session ? JSON.parse(session) : { fiscalYear: null, lastAccess: null };
  } catch (e) { return { fiscalYear: null, lastAccess: null }; }
}

function setUserSession(fiscalYear) {
  try {
    var session = {
      fiscalYear: fiscalYear,
      lastAccess: new Date().toISOString(),
      userEmail: Session.getActiveUser().getEmail()
    };
    USER_PROPS.setProperty('ZEIOS_SESSION', JSON.stringify(session));
    return true;
  } catch (e) { console.error('Error setting user session:', e); return false; }
}

function clearUserSession() {
  try { USER_PROPS.deleteProperty('ZEIOS_SESSION'); return true; }
  catch (e) { return false; }
}

function getCurrentUserFiscalYear() {
  var session = getUserSession();
  return session.fiscalYear;
}

// ========== 🏢 إعدادات الشركة ==========
function getCompanySettings() {
  try {
    return loadJSON(COMPANY_KEYS.SETTINGS, {
      name: 'شركة غير مسجلة',
      address: '',
      postal_address: '',
      phone: '',
      email: '',
      tax_no: '',
      tax_percentage: '0',
      service_charge_percentage: '0',        // ✅ نسبة مصاريف الخدمة (افتراضي: 0)
      pos_enabled: true,                      // ✅ تفعيل نقطة البيع (افتراضي: مفعل)
      thermal_printer_width: '80',            // ✅ عرض الطابعة (افتراضي: 80mm)
      created_at: null,
      updated_at: null
    });
  } catch (e) {
    return {
      name: 'شركة غير مسجلة',
      address: '',
      postal_address: '',
      phone: '',
      email: '',
      tax_no: '',
      tax_percentage: '0',
      service_charge_percentage: '0',
      pos_enabled: true,
      thermal_printer_width: '80',
      created_at: null,
      updated_at: null
    };
  }
}

function getTaxPercentage(asNumber) {
  if (asNumber === undefined) asNumber = false;
  try {
    var settings = getCompanySettings();
    var taxPct = settings[COMPANY_KEYS.TAX_PERCENTAGE] || '0';
    return asNumber ? parseFloat(taxPct) || 0 : taxPct;
  } catch (e) { return asNumber ? 0 : '0'; }
}

function getTaxNumber() {
  try { var settings = getCompanySettings(); return settings[COMPANY_KEYS.TAX_NO] || ''; }
  catch (e) { return ''; }
}

function calculateTax(amount) {
  try { var taxPct = getTaxPercentage(true); return parseFloat((amount * taxPct / 100).toFixed(2)) || 0; }
  catch (e) { return 0; }
}

function calculateTotalWithTax(amount) {
  try { var tax = calculateTax(amount); return parseFloat((amount + tax).toFixed(2)) || 0; }
  catch (e) { return amount || 0; }
}

// ========== 📅 السنة المالية ==========
function getActiveFiscalYear() {
  try {
    var fiscalData = getDocProperties().getProperty('FISCAL_YEAR');
    if (!fiscalData) { return { year_code: null, is_active: false, date_from: '', date_to: '', folder_id: '' }; }
    var fiscal = JSON.parse(fiscalData);
    var isActive = fiscal.is_active === true || fiscal.is_active === 'true' || fiscal.is_active === 1 || fiscal.is_active === '1';
    return {
      year_code: fiscal.year_code || null,
      is_active: isActive,
      date_from: fiscal.date_from || '',
      date_to: fiscal.date_to || '',
      folder_id: fiscal.folder_id || ''
    };
  } catch (e) {
    return { year_code: null, is_active: false, date_from: '', date_to: '', folder_id: '' };
  }
}

function getSys(key) {
  try {
    if (key === 'ACTIVE_FISCAL_YEAR') {
      var userYear = getCurrentUserFiscalYear();
      if (userYear) return userYear;
      var fiscal = getActiveFiscalYear();
      return fiscal.year_code;
    }
    return null;
  } catch (e) { return new Date().getFullYear().toString(); }
}

function getAllFiscalYears() {
  try {
    var folders = loadJSON('FOLDERS', {});
    if (!folders.fiscal_years) {
      var active = getActiveFiscalYear();
      return active.year_code ? [{ year_code: active.year_code, folder_id: active.folder_id || '', has_tables: true, is_active: true }] : [];
    }
    var fiscalYearsFolder = DriveApp.getFolderById(folders.fiscal_years);
    var yearFolders = fiscalYearsFolder.getFolders();
    var years = [];
    while (yearFolders.hasNext()) {
      var folder = yearFolders.next();
      var yearName = folder.getName();
      var links = loadJSON('TABLE_LINKS', { yearly: {} });
      var hasTables = links.yearly && links.yearly[yearName] && Object.keys(links.yearly[yearName]).length > 0;
      years.push({ year_code: yearName, folder_id: folder.getId(), has_tables: hasTables, is_active: true });
    }
    years.sort(function(a, b) { return parseInt(b.year_code) - parseInt(a.year_code); });
    return years;
  } catch (e) {
    console.error('Error getting fiscal years:', e);
    var active = getActiveFiscalYear();
    return active.year_code ? [{ year_code: active.year_code, folder_id: active.folder_id || '', has_tables: true, is_active: true }] : [];
  }
}

function switchFiscalYear(yearCode) {
  try {
    var years = getAllFiscalYears();
    var selectedYear = null;
    for (var i = 0; i < years.length; i++) {
      if (years[i].year_code === yearCode) { selectedYear = years[i]; break; }
    }
    if (!selectedYear) { return { success: false, message: '❌ السنة المالية غير موجودة' }; }
    setUserSession(yearCode);
    return { success: true, message: '✅ تم التبديل إلى السنة المالية ' + yearCode, fiscalYear: yearCode };
  } catch (e) { return { success: false, message: e.toString() }; }
}

function ensureFiscalYear(year) {
  if (year) return year;
  var userYear = getCurrentUserFiscalYear();
  if (userYear) return userYear;
  var systemYear = getSys('ACTIVE_FISCAL_YEAR');
  if (systemYear) return systemYear;
  return new Date().getFullYear().toString();
}

// ========== 🔗 الوصول للجداول ==========
function getMasterTableId(tableName) {
  try {
    var links = loadJSON('TABLE_LINKS', { master: {} });
    return links.master[tableName] ? links.master[tableName].id : null;
  } catch (e) { return null; }
}

function getYearlyTableId(tableName, fiscalYear) {
  try {
    var year = ensureFiscalYear(fiscalYear);
    if (!year) return null;
    var links = loadJSON('TABLE_LINKS', { yearly: {} });
    return links.yearly && links.yearly[year] && links.yearly[year][tableName] ? links.yearly[year][tableName].id : null;
  } catch (e) { return null; }
}

function getTableId(tableName, fiscalYear) {
  try {
    var masterTables = ["Chart_Of_Accounts", "Item_Categories", "Item_Units", "Items", "Balance_Sheet_Groups", "Profit_Loss_Groups", "Warehouses", "Users", "Colors"];
    if (masterTables.indexOf(tableName) !== -1) { return getMasterTableId(tableName); }
    return getYearlyTableId(tableName, fiscalYear);
  } catch (e) { console.error('Error in getTableId:', e); return null; }
}

// ========== 🕐 دوال الوقت والتاريخ ==========
function getNowTimestamp() { return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss"); }
function getTodayDate() { return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"); }
function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    var date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM-dd");
  } catch (e) { return dateStr; }
}
function formatDateForDisplay(dateStr) {
  if (!dateStr) return '';
  try {
    var date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return Utilities.formatDate(date, Session.getScriptTimeZone(), "dd/MM/yyyy");
  } catch (e) { return dateStr; }
}

// ========== 🔢 دوال التوليد ==========
function generateID() { return Utilities.getUuid().replace(/-/g, ''); }
function generateDocumentNumber(prefix, year) {
  var timestamp = new Date().getTime().toString().slice(-6);
  var random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return prefix + '-' + year + '-' + timestamp + random;
}

// ========== 🎨 الألوان ==========
function getColorCodeById(colorId) {
  try {
    if (!colorId) return '';
    var colors = getColors();
    for (var i = 0; i < colors.length; i++) {
      if (String(colors[i].id) === String(colorId)) { return colors[i].color_code || ''; }
    }
    return '';
  } catch (e) { return ''; }
}

function getColorNameById(colorId) {
  try {
    if (!colorId) return '';
    var colors = getColors();
    for (var i = 0; i < colors.length; i++) {
      if (String(colors[i].id) === String(colorId)) { return colors[i].color_name || ''; }
    }
    return '';
  } catch (e) { return ''; }
}

function getColorIdByCode(colorCode) {
  try {
    if (!colorCode) return '';
    var colors = getColors();
    for (var i = 0; i < colors.length; i++) {
      if (String(colors[i].color_code) === String(colorCode)) { return colors[i].id || ''; }
    }
    return '';
  } catch (e) { return ''; }
}

function getColorNameByCode(colorCode) {
  try {
    if (!colorCode) return '';
    var colors = getColors();
    for (var i = 0; i < colors.length; i++) {
      if (String(colors[i].color_code) === String(colorCode)) { return colors[i].color_name || colorCode; }
    }
    return colorCode || '';
  } catch (e) { return colorCode || ''; }
}

function getColors() {
  try {
    var id = getMasterTableId("Colors");
    if (!id) return [];
    var sheet = SpreadsheetApp.openById(id).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    if (data.length <= 1) return [];
    var result = [];
    for (var i = 1; i < data.length; i++) {
      result.push({
        id: (data[i][COL.COLORS.ID] || '').toString().trim(),
        color_code: (data[i][COL.COLORS.COLOR_CODE] || '').toString().trim(),
        color_name: (data[i][COL.COLORS.COLOR_NAME] || '').toString().trim()
      });
    }
    return result.filter(function(c) { return c.id || c.color_name; });
  } catch (e) { return []; }
}

// ========== 🏢 المستودعات ==========
function getWarehouses() {
  try {
    var id = getMasterTableId("Warehouses");
    if (!id) return [];
    var sheet = SpreadsheetApp.openById(id).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    if (data.length <= 1) return [];
    var result = [];
    for (var i = 1; i < data.length; i++) {
      result.push({
        id: (data[i][COL.WAREHOUSES.ID] || '').toString().trim(),
        warehouse_code: (data[i][COL.WAREHOUSES.WAREHOUSE_CODE] || '').toString().trim(),
        warehouse_name: (data[i][COL.WAREHOUSES.WAREHOUSE_NAME] || '').toString().trim()
      });
    }
    return result.filter(function(w) { return w.id && w.warehouse_code; });
  } catch (e) { return []; }
}

function getWarehouseCodeById(warehouseId) {
  try {
    if (!warehouseId) return '';
    var warehouses = getWarehouses();
    for (var i = 0; i < warehouses.length; i++) {
      if (String(warehouses[i].id) === String(warehouseId)) { return warehouses[i].warehouse_code || warehouseId; }
    }
    return warehouseId;
  } catch (e) { return warehouseId || ''; }
}

function getWarehouseNameById(warehouseId) {
  try {
    if (!warehouseId) return 'غير معروف';
    var warehouses = getWarehouses();
    for (var i = 0; i < warehouses.length; i++) {
      if (String(warehouses[i].id) === String(warehouseId)) { return warehouses[i].warehouse_name || 'غير معروف'; }
    }
    return 'غير معروف';
  } catch (e) { return 'غير معروف'; }
}

// ========== 📦 الأصناف ==========
function getItems() {
  try {
    var id = getMasterTableId("Items");
    if (!id) return [];
    var sheet = SpreadsheetApp.openById(id).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    if (data.length <= 1) return [];
    var result = [];
    for (var i = 1; i < data.length; i++) {
      var imageId = (data[i][COL.ITEMS.IMAGE_ID] || '').toString().trim();
      result.push({
        id: (data[i][COL.ITEMS.ID] || '').toString().trim(),
        item_code: (data[i][COL.ITEMS.ITEM_CODE] || '').toString().trim(),
        item_name: (data[i][COL.ITEMS.ITEM_NAME] || '').toString().trim(),
        item_image_id: imageId,
        item_image_url: imageId ? 'https://drive.google.com/uc?export=view&id=' + imageId : '',
        description: (data[i][COL.ITEMS.DESCRIPTION] || '').toString().trim(),
        category_code: (data[i][COL.ITEMS.CATEGORY] || '').toString().trim(),
        unit_code: (data[i][COL.ITEMS.UNIT] || '').toString().trim(),
        sale_price: parseFloat(data[i][COL.ITEMS.SALE_PRICE] || '0'),
        cost_price: parseFloat(data[i][COL.ITEMS.COST_PRICE] || '0'),
        opening_balance: parseFloat(data[i][COL.ITEMS.OPENING_BAL] || '0'),
        last_purchase_price: parseFloat(data[i][COL.ITEMS.LAST_PURCHASE] || '0'),
        created_at: (data[i][COL.ITEMS.CREATED_AT] || '').toString().trim()
      });
    }
    return result.filter(function(item) { return item.id; });
  } catch (e) { return []; }
}

function getItemCostPrice(itemId) {
  try {
    var itemsId = getMasterTableId("Items");
    if (!itemsId) return 0;
    var sheet = SpreadsheetApp.openById(itemsId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][COL.ITEMS.ID]) === String(itemId)) { return parseFloat(data[i][COL.ITEMS.COST_PRICE] || '0'); }
    }
    return 0;
  } catch (e) { return 0; }
}

function getItemSalePrice(itemId) {
  try {
    var itemsId = getMasterTableId("Items");
    if (!itemsId) return 0;
    var sheet = SpreadsheetApp.openById(itemsId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][COL.ITEMS.ID]) === String(itemId)) { return parseFloat(data[i][COL.ITEMS.SALE_PRICE] || '0'); }
    }
    return 0;
  } catch (e) { return 0; }
}

// ========== 📊 المخزون - قراءات ==========
function getCurrentStockBalanceWithYear(itemId, warehouseId, colorId, fiscalYear) {
  if (colorId === undefined) colorId = '';
  var year = ensureFiscalYear(fiscalYear);
  if (!year) { console.error('❌ السنة المالية مطلوبة!'); return 0; }
  try {
    var balanceId = getYearlyTableId("Inventory_Balance", year);
    if (!balanceId) return 0;
    var sheet = SpreadsheetApp.openById(balanceId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    for (var i = data.length - 1; i >= 1; i--) {
      var rowItemId = (data[i][COL.INVENTORY_BALANCE.ITEM_ID] || '').toString().trim();
      var rowWarehouseId = (data[i][COL.INVENTORY_BALANCE.WAREHOUSE_ID] || '').toString().trim();
      var rowColorId = (data[i][COL.INVENTORY_BALANCE.COLOR_ID] || '').toString().trim();
      if (rowItemId === itemId && rowWarehouseId === warehouseId && rowColorId === colorId) {
        return parseFloat(data[i][COL.INVENTORY_BALANCE.BALANCE] || '0');
      }
    }
    return 0;
  } catch (e) { console.error('getCurrentStockBalanceWithYear error:', e); return 0; }
}

function getCurrentStockBalance(itemId, warehouseId, colorId, year) {
  if (colorId === undefined) colorId = '';
  return getCurrentStockBalanceWithYear(itemId, warehouseId, colorId, year);
}

function getAvailableStock(itemId, warehouseId, colorId, year) {
  if (colorId === undefined) colorId = '';
  return getCurrentStockBalanceWithYear(itemId, warehouseId, colorId, year);
}

// ========== 📊 المخزون - عمليات كتابة ==========
function updateStockBalance(itemId, warehouseId, colorId, newBalance, year) {
  if (colorId === undefined) colorId = '';
  try {
    var fiscalYear = year || getSys('ACTIVE_FISCAL_YEAR');
    if (!fiscalYear) return false;
    var balanceId = getYearlyTableId("Inventory_Balance", fiscalYear);
    if (!balanceId) return false;
    var sheet = SpreadsheetApp.openById(balanceId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    var now = getTodayDate();
    for (var i = 1; i < data.length; i++) {
      var rowItemId = (data[i][COL.INVENTORY_BALANCE.ITEM_ID] || '').toString().trim();
      var rowWarehouseId = (data[i][COL.INVENTORY_BALANCE.WAREHOUSE_ID] || '').toString().trim();
      var rowColorId = (data[i][COL.INVENTORY_BALANCE.COLOR_ID] || '').toString().trim();
      if (rowItemId === itemId && rowWarehouseId === warehouseId && rowColorId === colorId) {
        sheet.getRange(i + 1, COL.INVENTORY_BALANCE.BALANCE + 1).setValue(newBalance);
        sheet.getRange(i + 1, COL.INVENTORY_BALANCE.UPDATED_AT + 1).setValue(now);
        return true;
      }
    }
    var newId = generateID();
    sheet.appendRow([newId, itemId, colorId, warehouseId, newBalance, now, fiscalYear]);
    return true;
  } catch (e) { console.error('updateStockBalance error:', e); return false; }
}

function recalcItemBalance(itemId, warehouseId, colorId, year) {
  try {
    var fiscalYear = year || getSys('ACTIVE_FISCAL_YEAR');
    if (!fiscalYear) return 0;
    var stockMovId = getYearlyTableId("Stock_Movements", fiscalYear);
    if (!stockMovId) return 0;
    var sheet = SpreadsheetApp.openById(stockMovId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    var balance = 0;
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][COL.STOCK_MOVEMENTS.ITEM_ID]) === String(itemId) &&
          String(data[i][COL.STOCK_MOVEMENTS.WAREHOUSE_ID]) === String(warehouseId) &&
          String(data[i][COL.STOCK_MOVEMENTS.COLOR_ID]) === String(colorId || '')) {
        balance += parseFloat(data[i][COL.STOCK_MOVEMENTS.QTY_IN] || '0') -
                   parseFloat(data[i][COL.STOCK_MOVEMENTS.QTY_OUT] || '0');
      }
    }
    updateStockBalance(itemId, warehouseId, colorId, balance, fiscalYear);
    return balance;
  } catch (e) { console.error('recalcItemBalance error:', e); return 0; }
}

function addStockMovement(movement) {
  try {
    var itemId = movement.itemId || movement.item_id || movement.id;
    var warehouseId = movement.warehouseId || movement.warehouse_id || movement.store_id;
    var colorId = movement.colorId || movement.color_id || '';
    var quantity = parseFloat(movement.quantity || movement.qty || 0);
    var type = movement.type;
    var refType = movement.refType;
    var refId = movement.refId;
    var costPrice = parseFloat(movement.costPrice || movement.cost_price || 0);
    var fiscalYear = movement.year || getSys('ACTIVE_FISCAL_YEAR');
    var notes = movement.notes || '';
    
    if (!fiscalYear) return false;
    if (!itemId || !warehouseId || !quantity || !refType || !refId) return false;
    
    var currentBalance = getCurrentStockBalance(itemId, warehouseId, colorId, fiscalYear);
    var newBalance, qtyIn = 0, qtyOut = 0;
    
    if (type === 'in') {
      qtyIn = quantity;
      newBalance = currentBalance + quantity;
    } else if (type === 'out') {
      qtyOut = quantity;
      newBalance = currentBalance - quantity;
      if (newBalance < 0) return false;
    } else {
      return false;
    }
    
    var stockMovId = getYearlyTableId("Stock_Movements", fiscalYear);
    if (!stockMovId) return false;
    var stockSheet = SpreadsheetApp.openById(stockMovId).getSheets()[0];
    var movId = generateID();
    var now = getNowTimestamp();
    var today = getTodayDate();
    
    stockSheet.appendRow([
      movId, itemId, warehouseId, fiscalYear, today,
      qtyIn, qtyOut, colorId, refType, refId,
      newBalance, costPrice || 0, now, notes
    ]);
    
    return updateStockBalance(itemId, warehouseId, colorId, newBalance, fiscalYear);
  } catch (e) { console.error('addStockMovement error:', e); return false; }
}

function deleteStockMovements(refType, refId, year) {
  try {
    var fiscalYear = year || getSys('ACTIVE_FISCAL_YEAR');
    if (!fiscalYear) return false;
    var stockMovId = getYearlyTableId("Stock_Movements", fiscalYear);
    if (!stockMovId) return false;
    var sheet = SpreadsheetApp.openById(stockMovId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    var movementsToRecalc = [];
    
    for (var i = data.length - 1; i >= 1; i--) {
      var rowRefType = (data[i][COL.STOCK_MOVEMENTS.REF_TYPE] || '').toString().trim();
      var rowRefId = (data[i][COL.STOCK_MOVEMENTS.REF_ID] || '').toString().trim();
      if (rowRefType === refType && rowRefId === refId) {
        movementsToRecalc.push({
          itemId: (data[i][COL.STOCK_MOVEMENTS.ITEM_ID] || '').toString().trim(),
          warehouseId: (data[i][COL.STOCK_MOVEMENTS.WAREHOUSE_ID] || '').toString().trim(),
          colorId: (data[i][COL.STOCK_MOVEMENTS.COLOR_ID] || '').toString().trim(),
          qtyIn: parseFloat(data[i][COL.STOCK_MOVEMENTS.QTY_IN] || '0'),
          qtyOut: parseFloat(data[i][COL.STOCK_MOVEMENTS.QTY_OUT] || '0')
        });
        sheet.deleteRow(i + 1);
      }
    }
    
    for (var j = 0; j < movementsToRecalc.length; j++) {
      var mov = movementsToRecalc[j];
      recalcItemBalance(mov.itemId, mov.warehouseId, mov.colorId, fiscalYear);
    }
    
    return true;
  } catch (e) { console.error('deleteStockMovements error:', e); return false; }
}

// ========== 💰 الحركات المحاسبية ==========
function addAccountMovement(movement) {
  try {
    var fiscalYear = movement.year || getSys('ACTIVE_FISCAL_YEAR');
    if (!fiscalYear) return false;
    var accMovId = getYearlyTableId("Account_Movements", fiscalYear);
    if (!accMovId) return false;
    var sheet = SpreadsheetApp.openById(accMovId).getSheets()[0];
    var movId = generateID();
    var now = getNowTimestamp();
    
    sheet.appendRow([
      movId,
      movement.account_id,
      fiscalYear,
      movement.date || getTodayDate(),
      movement.ref_type,
      movement.ref_id,
      movement.debit || 0,
      movement.credit || 0,
      movement.balance_after || 0,
      now
    ]);
    
    return true;
  } catch (e) { console.error('addAccountMovement error:', e); return false; }
}

// ========== 👥 الأطراف ==========
function getAllParties() {
  try {
    var coaId = getMasterTableId("Chart_Of_Accounts");
    if (!coaId) return [];
    var sheet = SpreadsheetApp.openById(coaId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    var parties = [];
    
    for (var i = 1; i < data.length; i++) {
      var id = (data[i][COL.CHART_OF_ACCOUNTS.ID] || '').toString().trim();
      var accountNo = (data[i][COL.CHART_OF_ACCOUNTS.ACCOUNT_NO] || '').toString().trim();
      var accountName = (data[i][COL.CHART_OF_ACCOUNTS.ACCOUNT_NAME] || '').toString().trim();
      var bsGroup = (data[i][COL.CHART_OF_ACCOUNTS.BS_GROUP] || '').toString().trim();
      var contact = (data[i][COL.CHART_OF_ACCOUNTS.CONTACT] || '').toString().trim();
      var phone = (data[i][COL.CHART_OF_ACCOUNTS.PHONE] || '').toString().trim();
      var creditLimit = parseFloat(data[i][COL.CHART_OF_ACCOUNTS.CREDIT_LIMIT]) || 0;
      
      if (id && accountNo && (bsGroup === "BS-A" || bsGroup === "BS-L") &&
          (accountNo.startsWith("12") || accountNo.startsWith("21") || contact)) {
        var category = bsGroup === "BS-A" ? "أصول/عميل" : "التزامات/مورد";
        parties.push({
          id: id, account_no: accountNo, account_name: accountName, bs_group: bsGroup,
          contact_name: contact || accountName, phone: phone, credit_limit: creditLimit,
          display_text: accountNo + ' - ' + accountName + ' [' + category + ']',
          account_category: category
        });
      }
    }
    return parties;
  } catch (e) { return []; }
}

function getAccountInfo(accountId) {
  try {
    var coaId = getMasterTableId("Chart_Of_Accounts");
    if (!coaId) return null;
    var sheet = SpreadsheetApp.openById(coaId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    
    for (var i = 1; i < data.length; i++) {
      var id = (data[i][COL.CHART_OF_ACCOUNTS.ID] || '').toString().trim();
      if (id === accountId.toString().trim()) {
        return {
          id: id,
          account_no: (data[i][COL.CHART_OF_ACCOUNTS.ACCOUNT_NO] || '').toString().trim(),
          account_name: (data[i][COL.CHART_OF_ACCOUNTS.ACCOUNT_NAME] || '').toString().trim(),
          parent_account_id: (data[i][COL.CHART_OF_ACCOUNTS.PARENT] || '').toString().trim(),
          bs_group: (data[i][COL.CHART_OF_ACCOUNTS.BS_GROUP] || '').toString().trim(),
          pl_group: (data[i][COL.CHART_OF_ACCOUNTS.PL_GROUP] || '').toString().trim(),
          contact_name: (data[i][COL.CHART_OF_ACCOUNTS.CONTACT] || '').toString().trim(),
          phone: (data[i][COL.CHART_OF_ACCOUNTS.PHONE] || '').toString().trim(),
          email: (data[i][COL.CHART_OF_ACCOUNTS.EMAIL] || '').toString().trim(),
          credit_limit: parseFloat(data[i][COL.CHART_OF_ACCOUNTS.CREDIT_LIMIT]) || 0,
          locked: (data[i][COL.CHART_OF_ACCOUNTS.LOCKED] || '').toString().trim()
        };
      }
    }
    return null;
  } catch (e) { return null; }
}

function getAccountNormalSide(accountId) {
  try {
    var account = getAccountInfo(accountId);
    if (!account) return { normal_side: 'unknown', group_type: 'unknown', group_code: '' };
    
    if (account.bs_group === 'BS-A') { return { normal_side: 'debit', group_type: 'BS', group_code: account.bs_group }; }
    else if (account.bs_group === 'BS-L' || account.bs_group === 'BS-E') { return { normal_side: 'credit', group_type: 'BS', group_code: account.bs_group }; }
    else if (account.pl_group === 'PL-R' || account.pl_group === 'PL-OR') { return { normal_side: 'credit', group_type: 'PL', group_code: account.pl_group }; }
    else if (account.pl_group === 'PL-C' || account.pl_group === 'PL-OE' || account.pl_group === 'PL-E') { return { normal_side: 'debit', group_type: 'PL', group_code: account.pl_group }; }
    
    return { normal_side: 'unknown', group_type: 'unknown', group_code: '' };
  } catch (e) { return { normal_side: 'unknown', group_type: 'unknown', group_code: '' }; }
}

function validateAccountId(accountId) {
  try {
    var coaId = getMasterTableId("Chart_Of_Accounts");
    if (!coaId) return false;
    var sheet = SpreadsheetApp.openById(coaId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    
    for (var i = 1; i < data.length; i++) {
      var id = (data[i][COL.CHART_OF_ACCOUNTS.ID] || '').toString().trim();
      var locked = (data[i][COL.CHART_OF_ACCOUNTS.LOCKED] || '').toString().trim();
      if (id === accountId.toString().trim() && locked !== "TRUE") { return true; }
    }
    return false;
  } catch (e) { return false; }
}

function getCustomers() {
  try {
    var coaId = getMasterTableId("Chart_Of_Accounts");
    if (!coaId) return [];
    var sheet = SpreadsheetApp.openById(coaId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    var accounts = [];
    
    for (var i = 1; i < data.length; i++) {
      var id = (data[i][COL.CHART_OF_ACCOUNTS.ID] || '').toString().trim();
      var accountNo = (data[i][COL.CHART_OF_ACCOUNTS.ACCOUNT_NO] || '').toString().trim();
      var accountName = (data[i][COL.CHART_OF_ACCOUNTS.ACCOUNT_NAME] || '').toString().trim();
      var bsGroup = (data[i][COL.CHART_OF_ACCOUNTS.BS_GROUP] || '').toString().trim();
      
      if (id && accountNo && bsGroup === "BS-A" &&
          (accountNo.startsWith("12") || accountName.indexOf("عميل") !== -1 || accountName.indexOf("customer") !== -1)) {
        accounts.push({
          id: id, account_no: accountNo, account_name: accountName,
          contact_name: (data[i][COL.CHART_OF_ACCOUNTS.CONTACT] || '').toString().trim() || accountName,
          phone: (data[i][COL.CHART_OF_ACCOUNTS.PHONE] || '').toString().trim(),
          credit_limit: parseFloat(data[i][COL.CHART_OF_ACCOUNTS.CREDIT_LIMIT]) || 0
        });
      }
    }
    return accounts;
  } catch (e) { return []; }
}

function getSuppliers() {
  try {
    var coaId = getMasterTableId("Chart_Of_Accounts");
    if (!coaId) return [];
    var sheet = SpreadsheetApp.openById(coaId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    var accounts = [];
    
    for (var i = 1; i < data.length; i++) {
      var id = (data[i][COL.CHART_OF_ACCOUNTS.ID] || '').toString().trim();
      var accountNo = (data[i][COL.CHART_OF_ACCOUNTS.ACCOUNT_NO] || '').toString().trim();
      var accountName = (data[i][COL.CHART_OF_ACCOUNTS.ACCOUNT_NAME] || '').toString().trim();
      var bsGroup = (data[i][COL.CHART_OF_ACCOUNTS.BS_GROUP] || '').toString().trim();
      
      if (id && accountNo && bsGroup === "BS-L" &&
          (accountNo.startsWith("21") || accountName.indexOf("مورد") !== -1 || accountName.indexOf("supplier") !== -1)) {
        accounts.push({
          id: id, account_no: accountNo, account_name: accountName,
          contact_name: (data[i][COL.CHART_OF_ACCOUNTS.CONTACT] || '').toString().trim() || accountName,
          phone: (data[i][COL.CHART_OF_ACCOUNTS.PHONE] || '').toString().trim(),
          credit_limit: parseFloat(data[i][COL.CHART_OF_ACCOUNTS.CREDIT_LIMIT]) || 0
        });
      }
    }
    return accounts;
  } catch (e) { return []; }
}

function getSafes() {
  try {
    var coaId = getMasterTableId("Chart_Of_Accounts");
    if (!coaId) return [];
    var sheet = SpreadsheetApp.openById(coaId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    var safes = [];
    
    for (var i = 1; i < data.length; i++) {
      var id = (data[i][COL.CHART_OF_ACCOUNTS.ID] || '').toString().trim();
      var accountNo = (data[i][COL.CHART_OF_ACCOUNTS.ACCOUNT_NO] || '').toString().trim();
      var accountName = (data[i][COL.CHART_OF_ACCOUNTS.ACCOUNT_NAME] || '').toString().trim();
      var bsGroup = (data[i][COL.CHART_OF_ACCOUNTS.BS_GROUP] || '').toString().trim();
      
      if (id && accountNo && bsGroup === "BS-A" && accountNo.startsWith("11")) {
        safes.push({ id: id, account_no: accountNo, account_name: accountName });
      }
    }
    return safes;
  } catch (e) { return []; }
}

// ========== 💰 أرصدة الحسابات ==========
function getCustomerBalanceWithYear(customerId, fiscalYear) {
  var year = ensureFiscalYear(fiscalYear);
  if (!year) { console.error('❌ السنة المالية مطلوبة!'); return { balance: "0.00", display_balance: "0.00" }; }
  try {
    var accMovId = getYearlyTableId("Account_Movements", year);
    if (!accMovId) return { balance: "0.00", display_balance: "0.00" };
    var sheet = SpreadsheetApp.openById(accMovId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    var balance = 0;
    
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][COL.ACCOUNT_MOVEMENTS.ACCOUNT_ID]) === String(customerId)) {
        balance += parseFloat(data[i][COL.ACCOUNT_MOVEMENTS.DEBIT] || '0') - parseFloat(data[i][COL.ACCOUNT_MOVEMENTS.CREDIT] || '0');
      }
    }
    return { balance: balance.toFixed(2), display_balance: balance.toFixed(2) };
  } catch (e) { console.error('getCustomerBalanceWithYear error:', e); return { balance: "0.00", display_balance: "0.00" }; }
}

function getCustomerBalance(customerId, year) { return getCustomerBalanceWithYear(customerId, year); }

function getSupplierBalanceWithYear(supplierId, fiscalYear) {
  var year = ensureFiscalYear(fiscalYear);
  if (!year) { console.error('❌ السنة المالية مطلوبة!'); return { balance: "0.00", display_balance: "0.00" }; }
  try {
    var accMovId = getYearlyTableId("Account_Movements", year);
    if (!accMovId) return { balance: "0.00", display_balance: "0.00" };
    var sheet = SpreadsheetApp.openById(accMovId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    var balance = 0;
    
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][COL.ACCOUNT_MOVEMENTS.ACCOUNT_ID]) === String(supplierId)) {
        balance += parseFloat(data[i][COL.ACCOUNT_MOVEMENTS.DEBIT] || '0') - parseFloat(data[i][COL.ACCOUNT_MOVEMENTS.CREDIT] || '0');
      }
    }
    return { balance: balance.toFixed(2), display_balance: (-Math.abs(balance)).toFixed(2) };
  } catch (e) { console.error('getSupplierBalanceWithYear error:', e); return { balance: "0.00", display_balance: "0.00" }; }
}

function getSupplierBalance(supplierId, year) { return getSupplierBalanceWithYear(supplierId, year); }

function getPartnerBalanceWithYear(partnerId, fiscalYear) {
  var year = ensureFiscalYear(fiscalYear);
  if (!year) { console.error('❌ السنة المالية مطلوبة!'); return { balance: "0.00", display_balance: "0.00" }; }
  try {
    var account = getAccountInfo(partnerId);
    if (!account) return { balance: "0.00", display_balance: "0.00" };
    if (account.bs_group === 'BS-A') { return getCustomerBalanceWithYear(partnerId, year); }
    else if (account.bs_group === 'BS-L') { return getSupplierBalanceWithYear(partnerId, year); }
    return { balance: "0.00", display_balance: "0.00" };
  } catch (e) { console.error('getPartnerBalanceWithYear error:', e); return { balance: "0.00", display_balance: "0.00" }; }
}

function getPartnerBalance(partnerId, year) { return getPartnerBalanceWithYear(partnerId, year); }

function getAccountBalanceWithYear(accountId, fiscalYear) {
  var year = ensureFiscalYear(fiscalYear);
  if (!year) { console.error('❌ السنة المالية مطلوبة!'); return { balance: "0.00" }; }
  try {
    var accMovId = getYearlyTableId("Account_Movements", year);
    if (!accMovId) return { balance: "0.00" };
    var sheet = SpreadsheetApp.openById(accMovId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    var balance = 0;
    
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][COL.ACCOUNT_MOVEMENTS.ACCOUNT_ID]) === String(accountId)) {
        balance += parseFloat(data[i][COL.ACCOUNT_MOVEMENTS.DEBIT] || '0') - parseFloat(data[i][COL.ACCOUNT_MOVEMENTS.CREDIT] || '0');
      }
    }
    return { balance: balance.toFixed(2) };
  } catch (e) { console.error('getAccountBalanceWithYear error:', e); return { balance: "0.00" }; }
}

// ========== 💳 المدفوعات والمقبوضات ==========
function resolvePaymentTable(refType) {
  if (!refType) return null;
  if (refType.indexOf("PURCHASE") === 0) return "Payments";
  if (refType.indexOf("SALE") === 0 || refType.indexOf("SALES_RETURN") === 0) { return "Receipts"; }
  return null;
}

function getInvoicePayments(invoiceId, refType, year) {
  var fiscalYear = ensureFiscalYear(year);
  if (!fiscalYear) return [];
  try {
    var tablesToCheck = ["Payments", "Receipts"];
    for (var i = 0; i < tablesToCheck.length; i++) {
      var tableName = tablesToCheck[i];
      var tableId = getYearlyTableId(tableName, fiscalYear);
      if (!tableId) continue;
      var sheet = SpreadsheetApp.openById(tableId).getSheets()[0];
      var data = sheet.getDataRange().getDisplayValues();
      
      for (var j = 1; j < data.length; j++) {
        if (String(data[j][COL.PAYMENTS_RECEIPTS.REF_ID]) === String(invoiceId)) {
          return [{
            id: data[j][COL.PAYMENTS_RECEIPTS.ID],
            amount: parseFloat(data[j][COL.PAYMENTS_RECEIPTS.AMOUNT]) || 0,
            ref_type: data[j][COL.PAYMENTS_RECEIPTS.REF_TYPE],
            safe_id: data[j][COL.PAYMENTS_RECEIPTS.SAFE_ID],
            date: data[j][COL.PAYMENTS_RECEIPTS.DATE],
            notes: data[j][COL.PAYMENTS_RECEIPTS.NOTES] || ''
          }];
        }
      }
    }
    return [];
  } catch (e) { return []; }
}

function deleteInvoicePayments(invoiceId, refType, year) {
  try {
    var fiscalYear = year || getSys("ACTIVE_FISCAL_YEAR");
    if (!fiscalYear) return;
    var tablesToCheck = ["Payments", "Receipts"];
    
    for (var i = 0; i < tablesToCheck.length; i++) {
      var tableName = tablesToCheck[i];
      var tableId = getYearlyTableId(tableName, fiscalYear);
      if (!tableId) continue;
      var sheet = SpreadsheetApp.openById(tableId).getSheets()[0];
      var data = sheet.getDataRange().getValues();
      
      for (var j = data.length - 1; j >= 1; j--) {
        if (String(data[j][COL.PAYMENTS_RECEIPTS.REF_ID]) === String(invoiceId)) {
          sheet.deleteRow(j + 1);
        }
      }
    }
  } catch (e) {}
}

function clearRelatedRecords(sheetId, refColIndex, refId) {
  if (!sheetId) return;
  try {
    var sheet = SpreadsheetApp.openById(sheetId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    for (var i = data.length - 1; i >= 1; i--) {
      if (String(data[i][refColIndex]) === String(refId)) {
        sheet.deleteRow(i + 1);
      }
    }
  } catch (e) {}
}

// ========== 📦 الأصناف مع المخزون ==========
function getItemsWithStockBase(warehouseId, fiscalYear) {
  if (!warehouseId || !fiscalYear) return [];
  try {
    var items = getItems();
    var colors = getColors();
    var balanceId = getYearlyTableId("Inventory_Balance", fiscalYear);
    if (!balanceId) return [];
    
    var colorsMap = {};
    for (var i = 0; i < colors.length; i++) {
      colorsMap[colors[i].id] = { color_name: colors[i].color_name, color_code: colors[i].color_code, id: colors[i].id };
    }
    
    var balanceSheet = SpreadsheetApp.openById(balanceId).getSheets()[0];
    var balanceData = balanceSheet.getDataRange().getDisplayValues();
    var balanceMap = {};
    
    for (var i = 1; i < balanceData.length; i++) {
      var itemId = (balanceData[i][COL.INVENTORY_BALANCE.ITEM_ID] || '').toString().trim();
      var colorId = (balanceData[i][COL.INVENTORY_BALANCE.COLOR_ID] || '').toString().trim();
      var whId = (balanceData[i][COL.INVENTORY_BALANCE.WAREHOUSE_ID] || '').toString().trim();
      var balance = parseFloat(balanceData[i][COL.INVENTORY_BALANCE.BALANCE] || '0');
      
      if (whId === warehouseId && itemId) {
        var key = colorId ? itemId + '_' + colorId : itemId + '_';
        balanceMap[key] = balance;
      }
    }
    
    var result = [];
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      if (!item.id) continue;
      
      var noColorKey = item.id + '_';
      var noColorStock = balanceMap[noColorKey] || 0;
      
      if (noColorStock > 0 || item.opening_balance > 0) {
        result.push({
          id: item.id, item_code: item.item_code, item_name: item.item_name,
          item_image_id: item.item_image_id || '',
          color_id: '', color_code: '', color_name: 'بدون لون',
          display_text: item.item_code + ' - ' + item.item_name + ' (بدون لون) - الرصيد: ' + noColorStock,
          stock: noColorStock, cost_price: item.cost_price, sale_price: item.sale_price, unit: item.unit_code
        });
      }
      
      for (var key in balanceMap) {
        if (key.indexOf(item.id + '_') === 0 && key !== noColorKey) {
          var colorId = key.split('_')[1];
          var colorInfo = colorsMap[colorId] || {};
          result.push({
            id: item.id, item_code: item.item_code, item_name: item.item_name,
            item_image_id: item.item_image_id || '',
            color_id: colorInfo.id || colorId, color_code: colorInfo.color_code || '', color_name: colorInfo.color_name || colorId,
            display_text: item.item_code + ' - ' + item.item_name + ' (' + (colorInfo.color_name || colorId) + ') - الرصيد: ' + balanceMap[key],
            stock: balanceMap[key], cost_price: item.cost_price, sale_price: item.sale_price, unit: item.unit_code
          });
        }
      }
    }
    return result;
  } catch (e) { console.error('getItemsWithStockBase error:', e); return []; }
}

function getItemsWithStock(warehouseId, year) {
  var fiscalYear = ensureFiscalYear(year);
  if (!fiscalYear) { console.error('❌ السنة المالية غير محددة'); return []; }
  return getItemsWithStockBase(warehouseId, fiscalYear);
}

// ========== 📊 التقارير المالية ==========
function getGroupTotal(groupId, groupType, fiscalYear) {
  var year = ensureFiscalYear(fiscalYear);
  if (!year) { console.error('❌ السنة المالية مطلوبة!'); return 0; }
  try {
    var coaId = getMasterTableId("Chart_Of_Accounts");
    var accMovId = getYearlyTableId("Account_Movements", year);
    if (!coaId || !accMovId) return 0;
    
    var coaSheet = SpreadsheetApp.openById(coaId).getSheets()[0];
    var coaData = coaSheet.getDataRange().getDisplayValues();
    var accountIds = [];
    
    for (var i = 1; i < coaData.length; i++) {
      var bsGroup = (coaData[i][COL.CHART_OF_ACCOUNTS.BS_GROUP] || '').toString().trim();
      var plGroup = (coaData[i][COL.CHART_OF_ACCOUNTS.PL_GROUP] || '').toString().trim();
      var accId = (coaData[i][COL.CHART_OF_ACCOUNTS.ID] || '').toString().trim();
      
      if ((groupType === 'BS' && bsGroup === groupId) || (groupType === 'PL' && plGroup === groupId)) {
        accountIds.push(accId);
      }
    }
    
    var movSheet = SpreadsheetApp.openById(accMovId).getSheets()[0];
    var movData = movSheet.getDataRange().getDisplayValues();
    var total = 0;
    
    for (var j = 1; j < movData.length; j++) {
      var movAccId = (movData[j][COL.ACCOUNT_MOVEMENTS.ACCOUNT_ID] || '').toString().trim();
      if (accountIds.indexOf(movAccId) !== -1) {
        var debit = parseFloat(movData[j][COL.ACCOUNT_MOVEMENTS.DEBIT] || '0');
        var credit = parseFloat(movData[j][COL.ACCOUNT_MOVEMENTS.CREDIT] || '0');
        
        if (groupType === 'BS') { total += (groupId === 'BS-A') ? debit - credit : credit - debit; }
        else { total += (groupId === 'PL-R' || groupId === 'PL-OR') ? credit - debit : debit - credit; }
      }
    }
    return parseFloat(total.toFixed(2));
  } catch (e) { console.error('getGroupTotal error:', e); return 0; }
}

function buildAccountTree(accounts) {
  var tree = { children: [] };
  var map = {};
  for (var i = 0; i < accounts.length; i++) { var acc = accounts[i]; map[acc.id] = { ...acc, children: [] }; }
  for (var id in map) {
    var acc = map[id];
    var parentId = acc.parent_account_id;
    if (!parentId || parentId === 0 || parentId === "0" || !map[parentId]) { tree.children.push(acc); }
    else { map[parentId].children.push(acc); }
  }
  return tree.children;
}

function getTrialBalance(year) {
  var fiscalYear = ensureFiscalYear(year);
  if (!fiscalYear) { return { success: false, message: '❌ السنة المالية غير محددة' }; }
  try {
    var coaId = getMasterTableId("Chart_Of_Accounts");
    var accMovId = getYearlyTableId("Account_Movements", fiscalYear);
    if (!coaId || !accMovId) { return { success: false, message: '❌ الجداول المطلوبة غير موجودة' }; }
    
    var coaSheet = SpreadsheetApp.openById(coaId).getSheets()[0];
    var coaData = coaSheet.getDataRange().getDisplayValues();
    var movSheet = SpreadsheetApp.openById(accMovId).getSheets()[0];
    var movData = movSheet.getDataRange().getDisplayValues();
    
    var result = [];
    var accountBalances = {};
    
    for (var i = 1; i < movData.length; i++) {
      var accId = (movData[i][COL.ACCOUNT_MOVEMENTS.ACCOUNT_ID] || '').toString().trim();
      var debit = parseFloat(movData[i][COL.ACCOUNT_MOVEMENTS.DEBIT] || '0');
      var credit = parseFloat(movData[i][COL.ACCOUNT_MOVEMENTS.CREDIT] || '0');
      if (!accountBalances[accId]) { accountBalances[accId] = { debit: 0, credit: 0 }; }
      accountBalances[accId].debit += debit;
      accountBalances[accId].credit += credit;
    }
    
    for (var i = 1; i < coaData.length; i++) {
      var accId = (coaData[i][COL.CHART_OF_ACCOUNTS.ID] || '').toString().trim();
      var accNo = (coaData[i][COL.CHART_OF_ACCOUNTS.ACCOUNT_NO] || '').toString().trim();
      var accName = (coaData[i][COL.CHART_OF_ACCOUNTS.ACCOUNT_NAME] || '').toString().trim();
      var balance = accountBalances[accId] || { debit: 0, credit: 0 };
      
      result.push({
        account_id: accId, account_no: accNo, account_name: accName,
        debit_total: balance.debit.toFixed(2), credit_total: balance.credit.toFixed(2),
        balance: (balance.debit - balance.credit).toFixed(2)
      });
    }
    return { success: true, fiscalYear: fiscalYear,  result };
  } catch (e) { return { success: false, message: e.toString() }; }
}

// ========== 🖥️ دوال الواجهة ==========
function getUserFiscalYears() {
  try { return { success: true, years: getAllFiscalYears(), currentYear: getCurrentUserFiscalYear() }; }
  catch (e) { return { success: false, message: e.toString() }; }
}

function switchUserFiscalYear(yearCode) { return switchFiscalYear(yearCode); }

function getFiscalYearInfo(fiscalYear) {
  try {
    var year = ensureFiscalYear(fiscalYear);
    if (year) { return { year_code: year, is_active: true, date_from: '', date_to: '', folder_id: '' }; }
    year = new Date().getFullYear().toString();
    return { year_code: year, is_active: true, date_from: '', date_to: '', folder_id: '' };
  } catch (e) { console.error('❌ getFiscalYearInfo error:', e); return { year_code: null, is_active: false, date_from: '', date_to: '', folder_id: '' }; }
}

function getFiscalYearCode(fiscalYear) { var fy = getFiscalYearInfo(fiscalYear); return fy && fy.year_code ? fy.year_code : null; }

function openFormWithId(pageName, recordId, fiscalYear, title) {
  try {
    if (!pageName || !recordId) { return { success: false, message: '❌ البيانات غير مكتملة' }; }
    var params = { editMode: true, recordId: recordId, fiscalYear: fiscalYear };
    PropertiesService.getScriptProperties().setProperty('EDIT_REQ_' + pageName + '_' + recordId.substring(0, 8), JSON.stringify(params));
    var html = HtmlService.createHtmlOutputFromFile(pageName).setWidth(1400).setHeight(900).setTitle(title || 'تعديل سجل');
    SpreadsheetApp.getUi().showModalDialog(html, title || 'ZEIOS ERP');
    return { success: true };
  } catch (e) { return { success: false, message: e.toString() }; }
}

// ========== 🔐 دوال كلمة المرور ==========
function verifyAdminPassword(password) {
  try {
    if (!password) { return { success: false, message: 'كلمة المرور مطلوبة' }; }
    var storedPassword = loadJSON('ADMIN_PASSWORD', null);
    if (!storedPassword || !storedPassword.hash || !storedPassword.salt) {
      return { success: true, message: 'تم التحقق بنجاح' };
    }
    var isValid = verifyPassword(password, storedPassword.hash, storedPassword.salt);
    if (isValid) { return { success: true, message: 'تم التحقق بنجاح' }; }
    else { return { success: false, message: 'كلمة المرور غير صحيحة' }; }
  } catch (e) {
    console.error('❌ verifyAdminPassword error:', e.toString());
    return { success: false, message: e.toString() };
  }
}

function changeAdminPassword(currentPassword, newPassword) {
  try {
    var verify = verifyAdminPassword(currentPassword);
    if (!verify.success) { return { success: false, message: 'كلمة المرور الحالية غير صحيحة' }; }
    if (!newPassword || newPassword.length < 4) {
      return { success: false, message: 'كلمة المرور الجديدة يجب أن تكون 4 أحرف على الأقل' };
    }
    var hashed = hashPassword(newPassword);
    saveJSON('ADMIN_PASSWORD', hashed);
    return { success: true, message: 'تم تغيير كلمة المرور بنجاح' };
  } catch (e) {
    console.error('❌ changeAdminPassword error:', e.toString());
    return { success: false, message: e.toString() };
  }
}

function hasAdminPassword() {
  try {
    var storedPassword = loadJSON('ADMIN_PASSWORD', null);
    return !!(storedPassword && storedPassword.hash && storedPassword.salt);
  } catch (e) { return false; }
}

function resetAdminPassword() {
  try {
    var tempPassword = Utilities.getUuid().substring(0, 8).toUpperCase();
    var hashed = hashPassword(tempPassword);
    saveJSON('ADMIN_PASSWORD', hashed);
    console.log('🔐 تم إعادة تعيين كلمة مرور المسؤول إلى:', tempPassword);
    return { success: true, message: 'تم إعادة تعيين كلمة المرور', tempPassword: tempPassword };
  } catch (e) {
    console.error('❌ resetAdminPassword error:', e.toString());
    return { success: false, message: e.toString() };
  }
}

// ========== 🌐 دوال الاتصال بالسيرفر (اختياري) ==========
function callServerAPI(funcName, params, serverUrl) {
  try {
    if (typeof validateLicense === 'function') {
      var license = validateLicense();
      if (!license.valid) {
        throw new Error('الترخيص غير صالح: ' + license.message);
      }
    }
    var licenseKey = PropertiesService.getUserProperties().getProperty('ZEIOS_LICENSE_KEY');
    var sheetId = SpreadsheetApp.getActive().getId();
    var url = serverUrl ? serverUrl.trim() : '';
    if (!url) {
      throw new Error('❌ عنوان السيرفر غير محدد');
    }
    var payload = {
      action: funcName,
      licenseKey: licenseKey,
      sheetId: sheetId,
      params: params
    };
    var response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
      timeout: 30000
    });
    var result = JSON.parse(response.getContentText());
    if (!result.success) {
      throw new Error(result.message || 'خطأ غير معروف من السيرفر');
    }
    return result.data;
  } catch (e) {
    console.error('❌ callServerAPI error:', e.toString());
    throw e;
  }
}

// ========== 📋 دوال التطوير ==========
function showStoredDataInLog() {
  try {
    var props = getDocProperties();
    var allKeys = props.getKeys();
    console.log('ZEIOS ERP - البيانات المخزنة');
    console.log('عدد المفاتيح:', allKeys.length);
    console.log('التاريخ:', new Date().toLocaleString('ar-SA'));
    
    for (var i = 0; i < allKeys.length; i++) {
      var key = allKeys[i];
      console.log('[' + (i + 1) + '] ' + key);
      try {
        var value = props.getProperty(key);
        if (!value) { console.log('   فارغة'); continue; }
        try {
          var parsed = JSON.parse(value);
          console.log('   JSON:', JSON.stringify(parsed, null, 2));
        } catch (e) {
          console.log('   نص:', value.substring(0, 100));
        }
      } catch (e) {
        console.log('   خطأ:', e.toString());
      }
    }
    return { success: true, count: allKeys.length, keys: allKeys };
  } catch (e) {
    console.error('خطأ:', e);
    return { success: false, error: e.toString() };
  }
}

function getLibraryVersion() { return LIBRARY_VERSION; }
/**
 * ✅ فتح نموذج التعديل - نسخة المكتبة
 */
function openFormWithIdForLibrary(pageName, recordId, fiscalYear, title) {
  try {
    if (!pageName || !recordId) { 
      return { success: false, message: '❌ البيانات غير مكتملة' }; 
    }
    
    // تخزين معلمات التعديل
    var params = { 
      editMode: true, 
      recordId: recordId, 
      fiscalYear: fiscalYear 
    };
    
    PropertiesService.getScriptProperties()
      .setProperty('EDIT_REQ_' + pageName + '_' + recordId.substring(0, 8), 
                   JSON.stringify(params));
    
    // إنشاء وعرض النموذج
    var html = HtmlService.createHtmlOutputFromFile(pageName)
      .setWidth(1400)
      .setHeight(900)
      .setTitle(title || 'تعديل سجل')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    
    // محاولة العرض في سياق الجدول
    try {
      SpreadsheetApp.getUi().showModalDialog(html, title || 'ZEIOS ERP');
      return { success: true, mode: 'spreadsheet' };
    } catch (e) {
      // Fallback لـ Web App
      var baseUrl = ScriptApp.getService ? ScriptApp.getService().getUrl() : null;
      if (baseUrl) {
        return { 
          success: true, 
          mode: 'webapp', 
          url: baseUrl + '?page=' + pageName + '&edit=' + recordId 
        };
      }
      return { success: false, message: 'لا يمكن عرض النموذج في هذا السياق' };
    }
    
  } catch (e) {
    console.error('❌ openFormWithIdForLibrary error:', e);
    return { success: false, message: e.toString() };
  }
}

/**
 * ✅ الحصول على طلب التعديل - نسخة المكتبة
 */
function getEditRequestForLibrary(pageName) {
  try {
    var props = PropertiesService.getScriptProperties();
    var keys = props.getKeys();
    var editKey = null;
    
    for (var i = 0; i < keys.length; i++) {
      if (keys[i].indexOf('EDIT_REQ_' + pageName) === 0) {
        editKey = keys[i];
        break;
      }
    }
    
    if (!editKey) {
      return { editMode: false };
    }
    
    var params = JSON.parse(props.getProperty(editKey));
    props.deleteProperty(editKey);
    
    return params;
  } catch (e) {
    console.error('❌ getEditRequestForLibrary error:', e);
    return { editMode: false };
  }
}
// ========== 🛒 دوال إعدادات نقطة البيع ==========

/**
 * ✅ الحصول على نسبة مصاريف الخدمة
 * @param {boolean} asNumber - إرجاع القيمة كرقم أم كنص
 * @returns {number|string} نسبة مصاريف الخدمة
 */
function getServiceChargePercentage(asNumber) {
  if (asNumber === undefined) asNumber = false;
  try {
    var settings = getCompanySettings();
    var svcPct = settings[COMPANY_KEYS.SERVICE_CHARGE_PERCENTAGE] || '0';
    return asNumber ? parseFloat(svcPct) || 0 : svcPct;
  } catch (e) {
    return asNumber ? 0 : '0';
  }
}

/**
 * ✅ حساب قيمة مصاريف الخدمة
 * @param {number} amount - المبلغ الأساسي
 * @returns {number} قيمة مصاريف الخدمة
 */
function calculateServiceCharge(amount) {
  try {
    var svcPct = getServiceChargePercentage(true);
    return parseFloat((amount * svcPct / 100).toFixed(2)) || 0;
  } catch (e) {
    return 0;
  }
}

/**
 * ✅ حساب الإجمالي مع الضريبة ومصاريف الخدمة
 * @param {number} amount - المبلغ الأساسي
 * @returns {number} الإجمالي النهائي
 */
function calculateTotalWithTaxAndService(amount) {
  try {
    var tax = calculateTax(amount);
    var service = calculateServiceCharge(amount);
    return parseFloat((amount + tax + service).toFixed(2)) || 0;
  } catch (e) {
    return amount || 0;
  }
}

/**
 * ✅ التحقق من تفعيل نظام نقطة البيع
 * @returns {boolean} true إذا كان النظام مفعل
 */
function isPOSEnabled() {
  try {
    var settings = getCompanySettings();
    return settings[COMPANY_KEYS.POS_ENABLED] !== false;
  } catch (e) {
    return true;  // افتراضي: مفعل
  }
}

/**
 * ✅ الحصول على عرض الطابعة الحرارية
 * @returns {string} '58' أو '80'
 */
function getThermalPrinterWidth() {
  try {
    var settings = getCompanySettings();
    var width = settings[COMPANY_KEYS.THERMAL_PRINTER_WIDTH] || '80';
    return width === '58' ? '58' : '80';
  } catch (e) {
    return '80';  // افتراضي: 80mm
  }
}

/**
 * core_client.gs – ZEIOS ERP SYSTEM (SHEET VERSION)
 * دوال بنفس أسماء المكتبة عشان الكود يشتغل من غير تعديل
 * 
 * ⚠️ قبل التشغيل: أضف المكتبة من Extensions → Libraries
 * ⚠️ غيّر 'Library_ZEIOS_ERP' للاسم اللي ظهر عندك
 */

// ========== 🔗 ربط المكتبة ==========
// ✅ غيّر 'Library_ZEIOS_ERP' للاسم اللي ظهر عندك عند إضافة المكتبة
var ZEIOS = ZEIOS;

// ========== 📦 ثوابت النظام (مع fallback) ==========
var COMPANY_KEYS, COL, REF_TYPES, ACCOUNTS, HASH_ALGORITHM, SCRIPT_TZ, DATE_FORMAT, LIBRARY_VERSION;

try {
  COMPANY_KEYS = ZEIOS.COMPANY_KEYS || {};
  COL = ZEIOS.COL || {};
  REF_TYPES = ZEIOS.REF_TYPES || {};
  ACCOUNTS = ZEIOS.ACCOUNTS || {};
  HASH_ALGORITHM = ZEIOS.HASH_ALGORITHM || 'SHA_256';
  SCRIPT_TZ = ZEIOS.SCRIPT_TZ || Session.getScriptTimeZone();
  DATE_FORMAT = ZEIOS.DATE_FORMAT || 'dd-MM-yyyy HH:mm:ss';
  LIBRARY_VERSION = ZEIOS.LIBRARY_VERSION || '3.3.0';
} catch (e) {
  console.warn('⚠️ فشل تحميل ثوابت المكتبة:', e.message);
  // قيم افتراضية للطوارئ
  COMPANY_KEYS = { SETTINGS: 'COMPANY_SETTINGS', TAX_NO: 'tax_no', TAX_PERCENTAGE: 'tax_percentage', NAME: 'name', ADDRESS: 'address', POSTAL_ADDRESS: 'postal_address', PHONE: 'phone', EMAIL: 'email' };
  COL = { INVENTORY_BALANCE: { ID: 0, ITEM_ID: 1, COLOR_ID: 2, WAREHOUSE_ID: 3, BALANCE: 4, UPDATED_AT: 5, FISCAL_YEAR: 6 }, STOCK_MOVEMENTS: { ID: 0, ITEM_ID: 1, WAREHOUSE_ID: 2, FISCAL_YEAR: 3, DATE: 4, QTY_IN: 5, QTY_OUT: 6, COLOR_ID: 7, REF_TYPE: 8, REF_ID: 9, BALANCE_AFTER: 10, UNIT_COST: 11, CREATED_AT: 12, NOTES: 13 }, ITEMS: { ID: 0, ITEM_CODE: 1, ITEM_NAME: 2, IMAGE_ID: 3, DESCRIPTION: 4, CATEGORY: 5, UNIT: 6, SALE_PRICE: 7, COST_PRICE: 8, OPENING_BAL: 9, LAST_PURCHASE: 10, CREATED_AT: 11 }, CHART_OF_ACCOUNTS: { ID: 0, ACCOUNT_NO: 1, ACCOUNT_NAME: 2, PARENT: 3, BS_GROUP: 4, PL_GROUP: 5, CONTACT: 6, ADDRESS: 7, PHONE: 8, EMAIL: 9, CREDIT_LIMIT: 10, CREATED_AT: 11, LOCKED: 12 }, ACCOUNT_MOVEMENTS: { ID: 0, ACCOUNT_ID: 1, FISCAL_YEAR: 2, DATE: 3, REF_TYPE: 4, REF_ID: 5, DEBIT: 6, CREDIT: 7, BALANCE_AFTER: 8, CREATED_AT: 9 }, PAYMENTS_RECEIPTS: { ID: 0, FISCAL_YEAR: 1, DATE: 2, REF_TYPE: 3, REF_ID: 4, AMOUNT: 5, ACCOUNT_ID: 6, SAFE_ID: 7, NOTES: 8, CREATED_AT: 9 }, WAREHOUSES: { ID: 0, WAREHOUSE_CODE: 1, WAREHOUSE_NAME: 2, CREATED_AT: 3 }, COLORS: { ID: 0, COLOR_CODE: 1, COLOR_NAME: 2, CREATED_AT: 3 } };
  REF_TYPES = { PURCHASE: 'PURCHASE', SALE: 'SALE', PAYMENT: 'PAYMENT', RECEIPT: 'RECEIPT' };
  ACCOUNTS = { CASH_MAIN: '110001', BANK_MAIN: '110002', RECEIVABLE_CONTROL: '1200', INVENTORY: '1300', PAYABLE_CONTROL: '2100', VAT_PAYABLE: '220001', CAPITAL: '3100', RETAINED_EARNINGS: '3200', SALES_REVENUE: '4000', COST_OF_SALES: '5000', OPERATING_EXPENSES: '6000' };
  HASH_ALGORITHM = 'SHA_256';
  SCRIPT_TZ = Session.getScriptTimeZone();
  DATE_FORMAT = 'dd-MM-yyyy HH:mm:ss';
  LIBRARY_VERSION = '3.3.0';
}

// ========== 📦 خصائص المستند (fallback للمكتبة) ==========
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

// ========== 🔐 أدوات كلمات المرور ==========
function generateSalt() { try { return ZEIOS.generateSalt(); } catch (e) { return ''; } }
function hashPassword(password, salt) { try { return ZEIOS.hashPassword(password, salt); } catch (e) { return {hash:'',salt:'',algorithm:''}; } }
function verifyPassword(password, storedHash, storedSalt) { try { return ZEIOS.verifyPassword(password, storedHash, storedSalt); } catch (e) { return false; } }

// ========== 👥 إدارة الجلسات ==========
function getUserSession() { try { return ZEIOS.getUserSession(); } catch (e) { return {fiscalYear:null,lastAccess:null}; } }
function setUserSession(fiscalYear) { try { return ZEIOS.setUserSession(fiscalYear); } catch (e) { return false; } }
function clearUserSession() { try { return ZEIOS.clearUserSession(); } catch (e) { return false; } }
function getCurrentUserFiscalYear() { try { return ZEIOS.getCurrentUserFiscalYear(); } catch (e) { return null; } }

// ========== 🏢 إعدادات الشركة ==========
function getCompanySettings() { try { return ZEIOS.getCompanySettings(); } catch (e) { return {name:'شركة غير مسجلة'}; } }
function getTaxPercentage(asNumber) { try { return ZEIOS.getTaxPercentage(asNumber); } catch (e) { return asNumber?0:'0'; } }
function getTaxNumber() { try { return ZEIOS.getTaxNumber(); } catch (e) { return ''; } }
function calculateTax(amount) { try { return ZEIOS.calculateTax(amount); } catch (e) { return 0; } }
function calculateTotalWithTax(amount) { try { return ZEIOS.calculateTotalWithTax(amount); } catch (e) { return amount||0; } }

// ========== 📅 السنة المالية ==========
function getActiveFiscalYear() { try { return ZEIOS.getActiveFiscalYear(); } catch (e) { return {year_code:null,is_active:false}; } }
function getSys(key) { try { return ZEIOS.getSys(key); } catch (e) { return new Date().getFullYear().toString(); } }
function getAllFiscalYears() { try { return ZEIOS.getAllFiscalYears(); } catch (e) { return []; } }
function switchFiscalYear(yearCode) { try { return ZEIOS.switchFiscalYear(yearCode); } catch (e) { return {success:false,message:e.toString()}; } }
function ensureFiscalYear(year) { try { return ZEIOS.ensureFiscalYear(year); } catch (e) { return new Date().getFullYear().toString(); } }

// ========== 🔗 الوصول للجداول ==========
function getMasterTableId(tableName) { try { return ZEIOS.getMasterTableId(tableName); } catch (e) { return null; } }
function getYearlyTableId(tableName, fiscalYear) { try { return ZEIOS.getYearlyTableId(tableName, fiscalYear); } catch (e) { return null; } }
function getTableId(tableName, fiscalYear) { try { return ZEIOS.getTableId(tableName, fiscalYear); } catch (e) { return null; } }

// ========== 🕐 الوقت والتاريخ ==========
function getNowTimestamp() { try { return ZEIOS.getNowTimestamp(); } catch (e) { return ''; } }
function getTodayDate() { try { return ZEIOS.getTodayDate(); } catch (e) { return ''; } }
function formatDate(dateStr) { try { return ZEIOS.formatDate(dateStr); } catch (e) { return dateStr; } }
function formatDateForDisplay(dateStr) { try { return ZEIOS.formatDateForDisplay(dateStr); } catch (e) { return dateStr; } }

// ========== 🔢 التوليد ==========
function generateID() { try { return ZEIOS.generateID(); } catch (e) { return ''; } }
function generateDocumentNumber(prefix, year) { try { return ZEIOS.generateDocumentNumber(prefix, year); } catch (e) { return ''; } }

// ========== 🎨 الألوان ==========
function getColorCodeById(colorId) { try { return ZEIOS.getColorCodeById(colorId); } catch (e) { return ''; } }
function getColorNameById(colorId) { try { return ZEIOS.getColorNameById(colorId); } catch (e) { return ''; } }
function getColorIdByCode(colorCode) { try { return ZEIOS.getColorIdByCode(colorCode); } catch (e) { return ''; } }
function getColorNameByCode(colorCode) { try { return ZEIOS.getColorNameByCode(colorCode); } catch (e) { return colorCode||''; } }
function getColors() { try { return ZEIOS.getColors(); } catch (e) { return []; } }

// ========== 🏢 المستودعات ==========
function getWarehouses() { try { return ZEIOS.getWarehouses(); } catch (e) { return []; } }
function getWarehouseCodeById(warehouseId) { try { return ZEIOS.getWarehouseCodeById(warehouseId); } catch (e) { return warehouseId||''; } }
function getWarehouseNameById(warehouseId) { try { return ZEIOS.getWarehouseNameById(warehouseId); } catch (e) { return 'غير معروف'; } }

// ========== 📦 الأصناف ==========
function getItems() { try { return ZEIOS.getItems(); } catch (e) { return []; } }
function getItemCostPrice(itemId) { try { return ZEIOS.getItemCostPrice(itemId); } catch (e) { return 0; } }
function getItemSalePrice(itemId) { try { return ZEIOS.getItemSalePrice(itemId); } catch (e) { return 0; } }

// ========== 📊 المخزون ==========
function getCurrentStockBalanceWithYear(itemId, warehouseId, colorId, fiscalYear) { try { return ZEIOS.getCurrentStockBalanceWithYear(itemId, warehouseId, colorId, fiscalYear); } catch (e) { return 0; } }
function getCurrentStockBalance(itemId, warehouseId, colorId, year) { try { return ZEIOS.getCurrentStockBalance(itemId, warehouseId, colorId, year); } catch (e) { return 0; } }
function getAvailableStock(itemId, warehouseId, colorId, year) { try { return ZEIOS.getAvailableStock(itemId, warehouseId, colorId, year); } catch (e) { return 0; } }
function updateStockBalance(itemId, warehouseId, colorId, newBalance, year) { try { return ZEIOS.updateStockBalance(itemId, warehouseId, colorId, newBalance, year); } catch (e) { return false; } }
function recalcItemBalance(itemId, warehouseId, colorId, year) { try { return ZEIOS.recalcItemBalance(itemId, warehouseId, colorId, year); } catch (e) { return 0; } }
function addStockMovement(movement) { try { return ZEIOS.addStockMovement(movement); } catch (e) { return false; } }
function deleteStockMovements(refType, refId, year) { try { return ZEIOS.deleteStockMovements(refType, refId, year); } catch (e) { return false; } }

// ========== 💰 المحاسبة ==========
function addAccountMovement(movement) { try { return ZEIOS.addAccountMovement(movement); } catch (e) { return false; } }
function getAllParties() { try { return ZEIOS.getAllParties(); } catch (e) { return []; } }
function getAccountInfo(accountId) { try { return ZEIOS.getAccountInfo(accountId); } catch (e) { return null; } }
function getAccountNormalSide(accountId) { try { return ZEIOS.getAccountNormalSide(accountId); } catch (e) { return {normal_side:'unknown',group_type:'unknown',group_code:''}; } }
function validateAccountId(accountId) { try { return ZEIOS.validateAccountId(accountId); } catch (e) { return false; } }
function getCustomers() { try { return ZEIOS.getCustomers(); } catch (e) { return []; } }
function getSuppliers() { try { return ZEIOS.getSuppliers(); } catch (e) { return []; } }
function getSafes() { try { return ZEIOS.getSafes(); } catch (e) { return []; } }

// ========== 💰 الأرصدة ==========
function getCustomerBalanceWithYear(customerId, fiscalYear) { try { return ZEIOS.getCustomerBalanceWithYear(customerId, fiscalYear); } catch (e) { return {balance:"0.00",display_balance:"0.00"}; } }
function getCustomerBalance(customerId, year) { try { return ZEIOS.getCustomerBalance(customerId, year); } catch (e) { return {balance:"0.00",display_balance:"0.00"}; } }
function getSupplierBalanceWithYear(supplierId, fiscalYear) { try { return ZEIOS.getSupplierBalanceWithYear(supplierId, fiscalYear); } catch (e) { return {balance:"0.00",display_balance:"0.00"}; } }
function getSupplierBalance(supplierId, year) { try { return ZEIOS.getSupplierBalance(supplierId, year); } catch (e) { return {balance:"0.00",display_balance:"0.00"}; } }
function getPartnerBalanceWithYear(partnerId, fiscalYear) { try { return ZEIOS.getPartnerBalanceWithYear(partnerId, fiscalYear); } catch (e) { return {balance:"0.00",display_balance:"0.00"}; } }
function getPartnerBalance(partnerId, year) { try { return ZEIOS.getPartnerBalance(partnerId, year); } catch (e) { return {balance:"0.00",display_balance:"0.00"}; } }
function getAccountBalanceWithYear(accountId, fiscalYear) { try { return ZEIOS.getAccountBalanceWithYear(accountId, fiscalYear); } catch (e) { return {balance:"0.00"}; } }

// ========== 💳 المدفوعات ==========
function resolvePaymentTable(refType) { try { return ZEIOS.resolvePaymentTable(refType); } catch (e) { return null; } }
function getInvoicePayments(invoiceId, refType, year) { try { return ZEIOS.getInvoicePayments(invoiceId, refType, year); } catch (e) { return []; } }
function deleteInvoicePayments(invoiceId, refType, year) { try { ZEIOS.deleteInvoicePayments(invoiceId, refType, year); } catch (e) {} }
function clearRelatedRecords(sheetId, refColIndex, refId) { try { ZEIOS.clearRelatedRecords(sheetId, refColIndex, refId); } catch (e) {} }

// ========== 📦 المخزون مع الأصناف ==========
function getItemsWithStockBase(warehouseId, fiscalYear) { try { return ZEIOS.getItemsWithStockBase(warehouseId, fiscalYear); } catch (e) { return []; } }
function getItemsWithStock(warehouseId, year) { try { return ZEIOS.getItemsWithStock(warehouseId, year); } catch (e) { return []; } }

// ========== 📊 التقارير ==========
function getGroupTotal(groupId, groupType, fiscalYear) { try { return ZEIOS.getGroupTotal(groupId, groupType, fiscalYear); } catch (e) { return 0; } }
function buildAccountTree(accounts) { try { return ZEIOS.buildAccountTree(accounts); } catch (e) { return []; } }
function getTrialBalance(year) { try { return ZEIOS.getTrialBalance(year); } catch (e) { return {success:false,message:e.toString()}; } }

// ========== 🖥️ الواجهة ==========
function getUserFiscalYears() { try { return ZEIOS.getUserFiscalYears(); } catch (e) { return {success:false,message:e.toString()}; } }
function switchUserFiscalYear(yearCode) { try { return ZEIOS.switchUserFiscalYear(yearCode); } catch (e) { return {success:false,message:e.toString()}; } }
function getFiscalYearInfo(fiscalYear) { try { return ZEIOS.getFiscalYearInfo(fiscalYear); } catch (e) { return {year_code:null,is_active:false}; } }
function getFiscalYearCode(fiscalYear) { try { return ZEIOS.getFiscalYearCode(fiscalYear); } catch (e) { return null; } }
function openFormWithId(pageName, recordId, fiscalYear, title) { try { return ZEIOS.openFormWithId(pageName, recordId, fiscalYear, title); } catch (e) { return {success:false,message:e.toString()}; } }

// ========== 🔐 كلمة المرور ==========
function verifyAdminPassword(password) { try { return ZEIOS.verifyAdminPassword(password); } catch (e) { return {success:false,message:e.toString()}; } }
function changeAdminPassword(currentPassword, newPassword) { try { return ZEIOS.changeAdminPassword(currentPassword, newPassword); } catch (e) { return {success:false,message:e.toString()}; } }
function hasAdminPassword() { try { return ZEIOS.hasAdminPassword(); } catch (e) { return false; } }
function resetAdminPassword() { try { return ZEIOS.resetAdminPassword(); } catch (e) { return {success:false,message:e.toString()}; } }

// ========== 🌐 الاتصال بالسيرفر ==========
function callServerAPI(funcName, params, serverUrl) { 
  try { return ZEIOS.callServerAPI(funcName, params, serverUrl); } 
  catch (e) { console.error('callServerAPI error:', e); throw e; } 
}

// ========== 📋 التطوير ==========
function showStoredDataInLog() { try { return ZEIOS.showStoredDataInLog(); } catch (e) { return {success:false,error:e.toString()}; } }
function getLibraryVersion() { try { return ZEIOS.getLibraryVersion(); } catch (e) { return 'غير متصل'; } }

// ========== 🔍 دالة فحص اتصال المكتبة ==========
function checkLibraryConnection() {
  try {
    if (typeof ZEIOS === 'undefined') {
      return { connected: false, message: '❌ المكتبة غير مربوطة. تأكد من إضافة المكتبة من Extensions > Libraries' };
    }
    var version = ZEIOS.getLibraryVersion ? ZEIOS.getLibraryVersion() : 'غير معروف';
    return { connected: true, message: '✅ المكتبة مربوطة بنجاح', version: version };
  } catch (e) {
    return { connected: false, message: '❌ خطأ في الاتصال بالمكتبة: ' + e.toString() };
  }
}
// ========== 🛒 دوال إعدادات نقطة البيع (واجهة للاستدعاء من الـ HTML) ==========

/**
 * ✅ دالة واجهة للحصول على نسبة مصاريف الخدمة
 * ⚠️ في مشروع الجدول (ليس في المكتبة)
 * @param {boolean} asNumber - إرجاع القيمة كرقم أم كنص
 * @returns {number|string} نسبة مصاريف الخدمة
 */
function getServiceChargePercentage(asNumber) {
  try {
    if (typeof ZEIOS !== 'undefined' && typeof ZEIOS.getServiceChargePercentage === 'function') {
      return ZEIOS.getServiceChargePercentage(asNumber);
    }
    return asNumber ? 0 : '0';
  } catch (e) {
    console.error('❌ getServiceChargePercentage (client) error:', e);
    return asNumber ? 0 : '0';
  }
}

/**
 * ✅ دالة واجهة لحساب قيمة مصاريف الخدمة
 * ⚠️ في مشروع الجدول (ليس في المكتبة)
 * @param {number} amount - المبلغ الأساسي
 * @returns {number} قيمة مصاريف الخدمة
 */
function calculateServiceCharge(amount) {
  try {
    if (typeof ZEIOS !== 'undefined' && typeof ZEIOS.calculateServiceCharge === 'function') {
      return ZEIOS.calculateServiceCharge(amount);
    }
    return 0;
  } catch (e) {
    console.error('❌ calculateServiceCharge (client) error:', e);
    return 0;
  }
}

/**
 * ✅ دالة واجهة لحساب الإجمالي مع الضريبة ومصاريف الخدمة
 * ⚠️ في مشروع الجدول (ليس في المكتبة)
 * @param {number} amount - المبلغ الأساسي
 * @returns {number} الإجمالي النهائي
 */
function calculateTotalWithTaxAndService(amount) {
  try {
    if (typeof ZEIOS !== 'undefined' && typeof ZEIOS.calculateTotalWithTaxAndService === 'function') {
      return ZEIOS.calculateTotalWithTaxAndService(amount);
    }
    return amount || 0;
  } catch (e) {
    console.error('❌ calculateTotalWithTaxAndService (client) error:', e);
    return amount || 0;
  }
}

/**
 * ✅ دالة واجهة للتحقق من تفعيل نظام نقطة البيع
 * ⚠️ في مشروع الجدول (ليس في المكتبة)
 * @returns {boolean} true إذا كان النظام مفعل
 */
function isPOSEnabled() {
  try {
    if (typeof ZEIOS !== 'undefined' && typeof ZEIOS.isPOSEnabled === 'function') {
      return ZEIOS.isPOSEnabled();
    }
    return true;  // افتراضي: مفعل
  } catch (e) {
    console.error('❌ isPOSEnabled (client) error:', e);
    return true;
  }
}

/**
 * ✅ دالة واجهة للحصول على عرض الطابعة الحرارية
 * ⚠️ في مشروع الجدول (ليس في المكتبة)
 * @returns {string} '58' أو '80'
 */
function getThermalPrinterWidth() {
  try {
    if (typeof ZEIOS !== 'undefined' && typeof ZEIOS.getThermalPrinterWidth === 'function') {
      return ZEIOS.getThermalPrinterWidth();
    }
    return '80';  // افتراضي: 80mm
  } catch (e) {
    console.error('❌ getThermalPrinterWidth (client) error:', e);
    return '80';
  }
}

/**
 * ✅ دالة واجهة شاملة لجلب جميع إعدادات نقطة البيع
 * ⚠️ مفيدة لتحميل الإعدادات دفعة واحدة في الواجهة
 * @returns {Object} كائن يحتوي على جميع إعدادات POS
 */
function getPOSSettings() {
  try {
    if (typeof ZEIOS !== 'undefined' && typeof ZEIOS.getCompanySettings === 'function') {
      var settings = ZEIOS.getCompanySettings();
      return {
        service_charge_percentage: settings.service_charge_percentage || '0',
        pos_enabled: settings.pos_enabled !== false,
        thermal_printer_width: settings.thermal_printer_width || '80',
        tax_percentage: settings.tax_percentage || '0',
        currency: settings.currency || ''
      };
    }
    return {
      service_charge_percentage: '0',
      pos_enabled: true,
      thermal_printer_width: '80',
      tax_percentage: '0',
      currency: ''
    };
  } catch (e) {
    console.error('❌ getPOSSettings (client) error:', e);
    return {
      service_charge_percentage: '0',
      pos_enabled: true,
      thermal_printer_width: '80',
      tax_percentage: '0',
      currency: ''
    };
  }
}
