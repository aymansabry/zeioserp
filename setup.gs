/**
 * setup.gs – ZEIOS ERP SYSTEM (LIBRARY VERSION)
 * الإصدار: 3.3.0
 * ⚠️ هذه المكتبة تحتوي على دوال Backend فقط (بدون HTML)
 * ⚠️ تستخدم DocumentProperties لعزل بيانات كل شيت
 * 📞 الدعم: zeioszeios0@gmail.com | WhatsApp: 00201205951462
 */

// ========== 🔐 ثوابت النظام ==========
var HASH_ALGORITHM = 'SHA_256';
var SCRIPT_TZ = Session.getScriptTimeZone();
var DATE_FORMAT = 'dd-MM-yyyy HH:mm:ss';
var LIBRARY_VERSION = '3.3.0';

// ========== 📦 خصائص المستند (معزولة لكل شيت) ==========
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
    return false;
  }
}

function clearAllJSON() {
  try {
    getDocProperties().deleteAllProperties();
    return true;
  } catch (e) {
    console.error('ClearJSON Error:', e);
    return false;
  }
}

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

// ========== 🔍 كشف حالة النظام ==========
function isSystemInitialized() {
  try {
    var ss = SpreadsheetApp.getActive();
    var sheets = ss.getSheets();
    for (var i = 0; i < sheets.length; i++) {
      var name = sheets[i].getName();
      if (name.indexOf("ZEIOS_ERP_SYSTEM") !== -1 || name.indexOf("ZEIOS_SYSTEM_") !== -1) {
        return true;
      }
    }
    var settings = loadJSON('COMPANY_SETTINGS', null);
    var fiscalYear = loadJSON('FISCAL_YEAR', null);
    var tableLinks = loadJSON('TABLE_LINKS', null);
    if (settings && fiscalYear && tableLinks && tableLinks.master) {
      return true;
    }
    return false;
  } catch (e) {
    console.error('isSystemInitialized error:', e);
    return false;
  }
}

// ========== 🔍 دالة تحديد المرحلة الحالية ==========
function getCurrentPhase() {
  try {
    var licenseValid = false;
    var licenseMessage = '';
    var requiresActivation = true;
    
    if (typeof validateLicense === 'function') {
      var license = validateLicense();
      licenseValid = license.valid || false;
      licenseMessage = license.message || '';
      requiresActivation = license.requiresActivation || false;
    }
    
    var isInitialized = isSystemInitialized();
    
    if (!licenseValid || requiresActivation) {
      return { phase: 1, name: 'تفعيل الترخيص', licenseValid: false, isInitialized: false, message: licenseMessage };
    } else if (licenseValid && !isInitialized) {
      return { phase: 2, name: 'تهيئة النظام', licenseValid: true, isInitialized: false, message: 'تم التفعيل بنجاح' };
    } else {
      return { phase: 3, name: 'النظام جاهز', licenseValid: licenseValid, isInitialized: true, message: licenseValid ? 'ترخيص ساري' : 'ترخيص منتهي' };
    }
  } catch (e) {
    console.error('getCurrentPhase error:', e);
    return { phase: 1, name: 'خطأ', licenseValid: false, isInitialized: false, message: e.toString() };
  }
}

// ========== 📋 تعريف الجداول الرئيسية ==========
var MASTER_TABLES = [
  { name: "Chart_Of_Accounts", headers: ["id", "account_no", "account_name", "parent_account_id", "bs_group_id", "pl_group_id", "contact_name", "address", "phone", "email", "credit_limit", "created_at", "locked"] },
  { name: "Item_Categories", headers: ["id", "category_code", "category_name", "created_at"] },
  { name: "Item_Units", headers: ["id", "unit_code", "unit_name", "created_at"] },
  { name: "Items", headers: ["id", "item_code", "item_name", "item_image_id", "description", "category_id", "unit_id", "sale_price", "cost_price", "opening_balance", "last_purchase_price", "created_at"] },
  { name: "Balance_Sheet_Groups", headers: ["id", "group_code", "group_name", "created_at"] },
  { name: "Profit_Loss_Groups", headers: ["id", "group_code", "group_name", "created_at"] },
  { name: "Warehouses", headers: ["id", "warehouse_code", "warehouse_name", "created_at"] },
  { name: "Users", headers: ["id", "username", "password_hash", "password_salt", "role", "permissions_json", "active", "created_at", "last_login"]},
  { name: "Colors", headers: ["id", "color_code", "color_name", "created_at"] },
  { name: "POS_Cashiers", headers: ["id", "cashier_name", "cashier_code", "account_id", "default_safe_id", "password_hash", "password_salt", "is_active", "created_at", "last_login"] }
];

// ========== 📋 تعريف الجداول السنوية ==========
var YEARLY_TABLES = [
  // ========== 📊 الجداول المحاسبية ==========
  { name: "Account_Movements", headers: ["id", "account_id", "fiscal_year", "date", "ref_type", "ref_id", "debit", "credit", "balance_after", "created_at"] },
  
  // ========== 📦 جداول المخزون ==========
  { name: "Inventory_Balance", headers: ["id", "item_id", "color_id", "warehouse_id", "balance", "updated_at", "fiscal_year"] },
  { name: "Stock_Movements", headers: ["id", "item_id", "warehouse_id", "fiscal_year", "date", "qty_in", "qty_out", "color_id", "ref_type", "ref_id", "balance_after", "unit_cost", "created_at", "notes"] },
  { name: "Stock_Transfers_Header", headers: ["id", "doc_no", "fiscal_year", "date", "from_warehouse_id", "to_warehouse_id", "notes", "created_at"] },
  { name: "Stock_Transfers_Details", headers: ["id", "doc_id", "item_id", "color_id", "qty", "unit_cost", "total_cost", "notes", "created_at"] },
  
  // ========== 🛒 جداول المشتريات ==========
  { name: "Purchase_Invoices", headers: ["id", "invoice_no", "fiscal_year", "invoice_date", "warehouse_id", "supplier_id", "notes", "sub_total", "tax", "Exp", "discount", "net_total", "status", "created_at"] },
  { name: "Purchase_Invoice_Details", headers: ["id", "invoice_id", "item_id", "color_id", "qty", "unit_cost", "total", "notes", "created_at"] },
  
  // ========== 💰 جداول المبيعات ==========
  { name: "Sales_Invoices", headers: ["id", "invoice_no", "fiscal_year", "invoice_date", "warehouse_id", "customer_id", "notes", "sub_total", "tax", "Exp", "discount", "net_total", "status", "created_at"] },
  { name: "Sales_Invoice_Details", headers: ["id", "invoice_id", "item_id", "color_id", "qty", "unit_price", "total", "notes", "created_at"] },
  
  // ========== ↩️ جداول المرتجعات ==========
  { name: "Purchase_Returns", headers: ["id", "return_no", "fiscal_year", "return_date", "warehouse_id", "supplier_id", "notes", "sub_total", "tax", "Exp", "discount", "net_total", "status", "created_at"] },
  { name: "Purchase_Return_Details", headers: ["id", "return_id", "item_id", "color_id", "qty", "unit_cost", "total", "notes", "created_at"] },
  { name: "Sales_Returns", headers: ["id", "return_no", "fiscal_year", "return_date", "warehouse_id", "customer_id", "notes", "sub_total", "tax", "Exp", "discount", "net_total", "status", "created_at"] },
  { name: "Sales_Return_Details", headers: ["id", "return_id", "item_id", "color_id", "qty", "unit_price", "total", "notes", "created_at"] },
  
  // ========== 📋 جداول الطلبيات ==========
  { name: "Customer_Orders", headers: ["id", "order_no", "fiscal_year", "order_date", "customer_id", "customer_phone", "warehouse_id", "delivery_date", "status", "notes", "sub_total", "tax", "Exp", "discount", "net_total", "created_at"] },
  { name: "Order_Details", headers: ["id", "order_id", "item_id", "color_id", "unit_price", "qty", "ready_qty", "preparation_date", "delivery_date", "supplier", "customer_image_id", "notes", "created_at"] },
  
  // ========== 💳 جداول الدفعات والتحصيل ==========
  { name: "Payments", headers: ["id", "fiscal_year", "date", "ref_type", "ref_id", "amount", "account_id", "safe_id", "notes", "created_at"] },
  { name: "Receipts", headers: ["id", "fiscal_year", "date", "ref_type", "ref_id", "amount", "account_id", "safe_id", "notes", "created_at"] },
  { name: "Customer_Checks", headers: ["id", "check_number", "received_date", "due_date", "check_owner_name", "received_from", "issued_to", "export_date", "is_paid", "blacklisted", "bank_name", "branch", "export_response_date", "customer_response_date", "notes", "amount", "created_at"] },
  
  // ========== 🛒 جداول نقطة البيع POS (جديد) ==========
  { name: "POS_Invoices", headers: ["id", "invoice_no", "fiscal_year", "invoice_date", "shift_id", "cashier_id", "customer_id", "warehouse_id", "sub_total", "tax", "service_charge", "discount", "net_total", "payment_type", "status", "printed", "created_at"] },
  { name: "POS_Invoice_Details", headers: ["id", "invoice_id", "item_id", "color_id", "qty", "unit_price", "total", "barcode", "notes", "created_at"] },
  { name: "POS_Shifts", headers: ["id", "cashier_id", "cashier_name", "shift_start", "shift_end", "opening_balance", "cash_sales", "credit_sales", "service_charges", "closing_balance", "status", "summary_invoice_id", "fiscal_year"] },
  
  // ========== 📊 جداول النظام ==========
  { name: "Audit_Log", headers: ["id", "user", "action", "table_name", "record_id", "timestamp"] },
  { name: "Backups", headers: ["id", "fiscal_year", "backup_date", "folder_id", "notes"] }
];

// ========== 🚀 تهيئة النظام ==========
function initializeERP(formData) {
  try {
    var ss = SpreadsheetApp.getActive();
    clearAllJSON();
    
    var setupSheet = ss.getSheetByName("Setup");
    if (!setupSheet) { setupSheet = ss.insertSheet("Setup"); }
    
    updateProgress(0, 100, "🚀 بدء تهيئة نظام ZEIOS...");
    
    // 🗑️ حذف جميع الأوراق الأخرى (ما عدا Setup + License)
    var allSheets = ss.getSheets();
    for (var i = allSheets.length - 1; i >= 0; i--) {
      var sheet = allSheets[i];
      var name = sheet.getName();
      // ✅ تم التعديل: "الترخيص" → "License"
      if (name !== "Setup" && name !== "License") {
        try { ss.deleteSheet(sheet); } catch (e) { console.warn('تعذر حذف الورقة: ' + name, e); }
      }
    }
    
    updateProgress(10, 100, "📁 إنشاء هيكل المجلدات...");
    var file = DriveApp.getFileById(ss.getId());
    var root = file.getParents().hasNext() ? file.getParents().next() : DriveApp.getRootFolder();
    var ssId = ss.getId().substring(0, 6);
    var assets = getOrCreateFolder(root, "ZEIOS_Assets_" + ssId);
    var images = getOrCreateFolder(assets, "Item_Images");
    var fiscalYearsFolder = getOrCreateFolder(assets, "Fiscal_Years");
    
    saveJSON('FOLDERS', { root: root.getId(), assets: assets.getId(), images: images.getId(), fiscal_years: fiscalYearsFolder.getId() });
    
    var tempPassword = Utilities.getUuid().substring(0, 8).toUpperCase();
    saveJSON('ADMIN_PASSWORD', hashPassword(tempPassword));
    SpreadsheetApp.flush();  // ✅ ضمان حفظ كلمة المرور فوراً
    
    updateProgress(30, 100, "📊 إنشاء الجداول الرئيسية...");
    var masterTables = createMasterTables(assets);
    
    var yearlyTables = {};
    if (formData && formData.fiscalYear) {
      updateProgress(60, 100, "📅 إنشاء جداول السنة المالية...");
      yearlyTables = createYearlyTables(formData.fiscalYear, fiscalYearsFolder);
    }
    
    var yearlyData = {};
    if (yearlyTables.folder_id && formData && formData.fiscalYear) {
      yearlyData[formData.fiscalYear] = yearlyTables.tables;
    }
    saveJSON('TABLE_LINKS', { master: masterTables, yearly: yearlyData, created_at: new Date().toISOString() });
    
    if (formData && formData.companyName) {
      saveJSON('COMPANY_SETTINGS', {
        name: formData.companyName.trim(),
        address: formData.address || '',
        postal_address: formData.postalAddress || '',
        phone: formData.phone || '',
        email: formData.email || '',
        tax_no: formData.taxNo || '',
        tax_percentage: formData.taxPercentage || '0',
        service_charge_percentage: formData.serviceChargePercentage || '0',
        pos_enabled: formData.posEnabled || true,
        thermal_printer_width: formData.thermalPrinterWidth || '80',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      SpreadsheetApp.flush();  // ✅ ضمان حفظ الإعدادات فوراً
    }
    
    if (formData && formData.fiscalYear) {
      saveJSON('FISCAL_YEAR', {
        year_code: formData.fiscalYear,
        date_from: formData.fiscalFrom || formData.fiscalYear + '-01-01',
        date_to: formData.fiscalTo || formData.fiscalYear + '-12-31',
        is_active: true,
        folder_id: yearlyTables.folder_id || '',
        created_at: new Date().toISOString()
      });
      SpreadsheetApp.flush();  // ✅ ضمان حفظ السنة المالية فوراً
      ss.setName("ZEIOS ERP " + formData.fiscalYear);
    }
    
    updateProgress(90, 100, "🎯 إنشاء لوحة التحكم...");
    finalizeDashboardSheet(setupSheet, formData ? formData.fiscalYear : null, tempPassword);
    
    updateProgress(100, 100, "✅ تم تهيئة نظام ZEIOS بنجاح.");
    
    return { success: true, tempPassword: tempPassword, message: "✅ تم تهيئة النظام بنجاح - جاهز للعمل", version: LIBRARY_VERSION };
    
  } catch (e) {
    console.error("❌ Initialization Error:", e);
    return { success: false, message: e.toString() };
  }
}

// ========== 🎯 إنشاء ورقة الداشبورد النهائية ==========
function finalizeDashboardSheet(setupSheet, fiscalYear, tempPassword) {
  if (!setupSheet) return null;
  
  try { setupSheet.setName("ZEIOS_ERP_SYSTEM"); }
  catch (e) { setupSheet.setName("ZEIOS_SYSTEM_" + Utilities.getUuid().substring(0, 6)); }
  
  setupSheet.clear();
  var company = loadJSON('COMPANY_SETTINGS', { name: 'شركة غير مسجلة' });
  
  var content = [
    ["🎉 ZEIOS ERP - تم التهيئة بنجاح", "", ""],
    ["", "", ""],
    ["🏢 الشركة: " + company.name, "", ""],
    ["", "", ""],
    ["📌 للوصول إلى النظام:", "", ""],
    ["1️⃣ اضغط على القائمة 📊 ZEIOS ERP", "", ""],
    ["2️⃣ اختر 🏠 لوحة التحكم", "", ""],
    ["", "", ""],
    ["🌐 لنشر التطبيق كـ Web App:", "", ""],
    ["من القائمة اختر 📊 ZEIOS ERP → 🌐 نشر التطبيق", "", ""],
    ["", "", ""],
    ["📞 للدعم والمساعدة:", "", ""],
    ["📧 zeioszeios0@gmail.com", "", ""],
    ["📱 Whatsapp 00201205951462", "", ""],
    ["", "", ""],
    ["✅ النظام جاهز - ابدأ بإضافة بياناتك", "", ""]
  ];
  
  setupSheet.getRange(1, 1, content.length, 3).setValues(content.map(row => [row[0], row[1] || '', row[2] || '']));
  setupSheet.getRange("A:C").setHorizontalAlignment("center");
  setupSheet.autoResizeColumns(1, 3);
  setupSheet.getRange("A1").setFontSize(20).setFontColor("#1a73e8").setFontWeight("bold");
  setupSheet.getRange("A6:A7").setFontColor("#dc3545").setFontWeight("bold");
  setupSheet.getRange("A16:A18").setFontColor("#1a73e8");
  
  return setupSheet;
}

// ========== 🧹 دالة مساعدة لإنشاء المجلدات ==========
function getOrCreateFolder(parent, name) {
  var folders = parent.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : parent.createFolder(name);
}

// ========== 📦 إنشاء الجداول الرئيسية ==========
function createMasterTables(assetsFolder) {
  var tables = {};
  for (var i = 0; i < MASTER_TABLES.length; i++) {
    var table = MASTER_TABLES[i];
    try {
      var ssNew = SpreadsheetApp.create(table.name);
      var sh = ssNew.getSheets()[0];
      sh.setName(table.name);
      sh.appendRow(table.headers);
      sh.setFrozenRows(1);
      sh.getRange(1, 1, 1, table.headers.length).setFontWeight("bold").setBackground("#d9ead3").setHorizontalAlignment("center");
      var file = DriveApp.getFileById(ssNew.getId());
      assetsFolder.addFile(file);
      DriveApp.getRootFolder().removeFile(file);
      tables[table.name] = { id: ssNew.getId(), url: ssNew.getUrl(), created_at: new Date().toISOString() };
    } catch (e) { console.error("Error creating " + table.name + ":", e); }
  }
  insertMasterDefaultData(tables);
  return tables;
}

// ========== 📦 إنشاء الجداول السنوية ==========
function createYearlyTables(year, fiscalYearsFolder) {
  var yearFolder;
  var folders = fiscalYearsFolder.getFoldersByName(year);
  if (folders.hasNext()) { yearFolder = folders.next(); }
  else { yearFolder = fiscalYearsFolder.createFolder(year); }
  
  var tables = {};
  for (var i = 0; i < YEARLY_TABLES.length; i++) {
    var table = YEARLY_TABLES[i];
    try {
      var ssNew = SpreadsheetApp.create(table.name + "_" + year);
      var sh = ssNew.getSheets()[0];
      sh.setName(table.name);
      sh.appendRow(table.headers);
      sh.setFrozenRows(1);
      sh.getRange(1, 1, 1, table.headers.length).setFontWeight("bold").setBackground("#cfe2f3").setHorizontalAlignment("center");
      var file = DriveApp.getFileById(ssNew.getId());
      file.moveTo(yearFolder);
      tables[table.name] = { id: ssNew.getId(), url: ssNew.getUrl(), created_at: new Date().toISOString() };
    } catch (e) { console.error("Error creating " + table.name + ":", e); }
  }
  return { folder_id: yearFolder.getId(), tables: tables };
}

// ========== 📥 إدخال البيانات الافتراضية ==========
function insertMasterDefaultData(tables) {
  var now = Utilities.formatDate(new Date(), SCRIPT_TZ, DATE_FORMAT);
  insertChartOfAccounts(tables["Chart_Of_Accounts"] ? tables["Chart_Of_Accounts"].id : null, now);
  
  var unitsData = [["PCS", "قطعة"], ["BOX", "صندوق"], ["KG", "كيلوجرام"], ["LTR", "لتر"], ["MTR", "متر"], ["SET", "طقم"]];
  insertTableData(tables["Item_Units"] ? tables["Item_Units"].id : null, unitsData, now);
  
  var catsData = [["RAW", "مواد خام"], ["FIN", "سلع تامة"], ["SER", "خدمات"], ["CON", "مستلزمات"]];
  insertTableData(tables["Item_Categories"] ? tables["Item_Categories"].id : null, catsData, now);
  
  var bsData = [["BS-A", "الأصول"], ["BS-L", "الالتزامات"], ["BS-E", "حقوق الملكية"]];
  insertTableData(tables["Balance_Sheet_Groups"] ? tables["Balance_Sheet_Groups"].id : null, bsData, now);
  
  var plData = [["PL-R", "إيرادات المبيعات"], ["PL-OR", "إيرادات أخرى"], ["PL-C", "تكلفة المبيعات"], ["PL-OE", "مصروفات أخرى"], ["PL-E", "المصروفات التشغيلية"]];
  insertTableData(tables["Profit_Loss_Groups"] ? tables["Profit_Loss_Groups"].id : null, plData, now);
  
  var colorsData = [["RED", "أحمر"], ["BLUE", "أزرق"], ["GREEN", "أخضر"], ["YELLOW", "أصفر"], ["BLACK", "أسود"], ["WHITE", "أبيض"], ["BROWN", "بني"], ["GRAY", "رمادي"]];
  insertTableData(tables["Colors"] ? tables["Colors"].id : null, colorsData, now);
  
  insertWarehouses(tables["Warehouses"] ? tables["Warehouses"].id : null, now);
  insertUsers(tables["Users"] ? tables["Users"].id : null, now);
}

// ========== 📊 شجرة الحسابات ==========
function insertChartOfAccounts(tableId, now) {
  if (!tableId) return;
  try {
    var ss = SpreadsheetApp.openById(tableId);
    var sh = ss.getSheets()[0];
    
    var standardAccounts = [
      { account_no: "1000", account_name: "الأصول", parent: "0", bs_group: "BS-A", pl_group: "" },
      { account_no: "1100", account_name: "الأصول المتداولة", parent: "1000", bs_group: "BS-A", pl_group: "" },
      { account_no: "110001", account_name: "صندوق الكاش الرئيسي", parent: "1100", bs_group: "BS-A", pl_group: "" },
      { account_no: "110002", account_name: "حساب بنكي - رئيسي", parent: "1100", bs_group: "BS-A", pl_group: "" },
      { account_no: "110003", account_name: "صندوق مصروفات", parent: "1100", bs_group: "BS-A", pl_group: "" },
      { account_no: "1200", account_name: "حسابات القبض", parent: "1100", bs_group: "BS-A", pl_group: "" },
      { account_no: "120001", account_name: "عملاء", parent: "1200", bs_group: "BS-A", pl_group: "" },
      { account_no: "120002", account_name: "شيكات تحت التحصيل", parent: "1200", bs_group: "BS-A", pl_group: "" },
      { account_no: "1300", account_name: "المخزون", parent: "1100", bs_group: "BS-A", pl_group: "" },
      { account_no: "130001", account_name: "بضاعة", parent: "1300", bs_group: "BS-A", pl_group: "" },
      { account_no: "130002", account_name: "مواد خام", parent: "1300", bs_group: "BS-A", pl_group: "" },
      { account_no: "1500", account_name: "الأصول الثابتة", parent: "1000", bs_group: "BS-A", pl_group: "" },
      { account_no: "150001", account_name: "أثاث ومعدات", parent: "1500", bs_group: "BS-A", pl_group: "" },
      { account_no: "150002", account_name: "أجهزة وحاسبات", parent: "1500", bs_group: "BS-A", pl_group: "" },
      { account_no: "2000", account_name: "الالتزامات", parent: "0", bs_group: "BS-L", pl_group: "" },
      { account_no: "2100", account_name: "الالتزامات المتداولة", parent: "2000", bs_group: "BS-L", pl_group: "" },
      { account_no: "210001", account_name: "حسابات الدفع", parent: "2100", bs_group: "BS-L", pl_group: "" },
      { account_no: "210002", account_name: "موردون", parent: "2100", bs_group: "BS-L", pl_group: "" },
      { account_no: "2200", account_name: "الضرائب المستحقة", parent: "2100", bs_group: "BS-L", pl_group: "" },
      { account_no: "220001", account_name: "ضريبة القيمة المضافة", parent: "2200", bs_group: "BS-L", pl_group: "" },
      { account_no: "3000", account_name: "حقوق الملكية", parent: "0", bs_group: "BS-E", pl_group: "" },
      { account_no: "3100", account_name: "رأس المال", parent: "3000", bs_group: "BS-E", pl_group: "" },
      { account_no: "310001", account_name: "رأس المال المدفوع", parent: "3100", bs_group: "BS-E", pl_group: "" },
      { account_no: "3200", account_name: "الأرباح المحتجزة", parent: "3000", bs_group: "BS-E", pl_group: "" },
      { account_no: "320001", account_name: "أرباح سنوات سابقة", parent: "3200", bs_group: "BS-E", pl_group: "" },
      { account_no: "4000", account_name: "إيرادات المبيعات", parent: "0", bs_group: "", pl_group: "PL-R" },
      { account_no: "400001", account_name: "مبيعات المنتجات", parent: "4000", bs_group: "", pl_group: "PL-R" },
      { account_no: "400002", account_name: "مبيعات الخدمات", parent: "4000", bs_group: "", pl_group: "PL-R" },
      { account_no: "400003", account_name: "مبيعات نقدية", parent: "4000", bs_group: "", pl_group: "PL-R" },
      { account_no: "400004", account_name: "مبيعات آجلة", parent: "4000", bs_group: "", pl_group: "PL-R" },
      { account_no: "4100", account_name: "إيرادات أخرى", parent: "0", bs_group: "", pl_group: "PL-OR" },
      { account_no: "410001", account_name: "خصم مكتسب", parent: "4100", bs_group: "", pl_group: "PL-OR" },
      { account_no: "410002", account_name: "إيرادات متنوعة", parent: "4100", bs_group: "", pl_group: "PL-OR" },
      { account_no: "410003", account_name: "خدمة", parent: "4100", bs_group: "", pl_group: "PL-OR" },
      { account_no: "5000", account_name: "تكلفة البضاعة المباعة", parent: "0", bs_group: "", pl_group: "PL-C" },
      { account_no: "500001", account_name: "تكلفة مبيعات المنتجات", parent: "5000", bs_group: "", pl_group: "PL-C" },
      { account_no: "500002", account_name: "تكلفة مبيعات الخدمات", parent: "5000", bs_group: "", pl_group: "PL-C" },
      { account_no: "500003", account_name: "مشتريات", parent: "5000", bs_group: "", pl_group: "PL-C" },
      { account_no: "5100", account_name: "مصروفات أخرى", parent: "0", bs_group: "", pl_group: "PL-OE" },
      { account_no: "510001", account_name: "خصم ممنوح", parent: "5100", bs_group: "", pl_group: "PL-OE" },
      { account_no: "510002", account_name: "فوائد بنكية", parent: "5100", bs_group: "", pl_group: "PL-OE" },
      { account_no: "510003", account_name: "عمولات بنكية", parent: "5100", bs_group: "", pl_group: "PL-OE" },
      { account_no: "6000", account_name: "المصروفات التشغيلية", parent: "0", bs_group: "", pl_group: "PL-E" },
      { account_no: "600001", account_name: "مصروفات نقل وشحن", parent: "6000", bs_group: "", pl_group: "PL-E" },
      { account_no: "600002", account_name: "إيجارات", parent: "6000", bs_group: "", pl_group: "PL-E" },
      { account_no: "600003", account_name: "رواتب وأجور", parent: "6000", bs_group: "", pl_group: "PL-E" },
      { account_no: "600004", account_name: "مصروفات إدارية", parent: "6000", bs_group: "", pl_group: "PL-E" },
      { account_no: "600005", account_name: "مصروفات تسويق وإعلان", parent: "6000", bs_group: "", pl_group: "PL-E" },
      { account_no: "600006", account_name: "مصروفات صيانة", parent: "6000", bs_group: "", pl_group: "PL-E" },
      { account_no: "600007", account_name: "مصروفات كهرباء ومياه", parent: "6000", bs_group: "", pl_group: "PL-E" },
      { account_no: "600008", account_name: "مصروفات اتصالات", parent: "6000", bs_group: "", pl_group: "PL-E" },
      { account_no: "600009", account_name: "مصروفات سفر وانتقال", parent: "6000", bs_group: "", pl_group: "PL-E" },
    ];
    
    for (var i = 0; i < standardAccounts.length; i++) {
      var acc = standardAccounts[i];
      var id = acc.account_no;
      var parentId = acc.parent && acc.parent.trim() !== "" ? acc.parent : "0";
      
      var newRow = [
        id, acc.account_no, acc.account_name, parentId,
        acc.bs_group || "", acc.pl_group || "", "", "", "", "", "0", now, "TRUE"
      ];
      sh.appendRow(newRow);
    }
    
    if (typeof protectSheet === 'function') {
      protectSheet(sh, 2, sh.getLastRow());
    }
    
    console.log("✅ تم إدخال " + standardAccounts.length + " حساب بنجاح");
    
  } catch (e) { 
    console.error("❌ Error inserting accounts:", e); 
  }
}

// ========== 📥 دوال مساعدة للإدخال ==========
function insertTableData(tableId, data, now) {
  if (!tableId) return;
  try {
    var ss = SpreadsheetApp.openById(tableId);
    var sh = ss.getSheets()[0];
    for (var i = 0; i < data.length; i++) {
      var row = [(i + 1).toString(), data[i][0], data[i][1], now];
      sh.appendRow(row);
    }
  } catch (e) { console.error("Error inserting data:", e); }
}

function insertWarehouses(tableId, now) {
  if (!tableId) return;
  try {
    var ss = SpreadsheetApp.openById(tableId);
    var sh = ss.getSheets()[0];
    sh.appendRow(["1", "WH01", "المستودع الرئيسي", now]);
    sh.appendRow(["2", "WH02", "مستودع المبيعات", now]);
  } catch (e) { console.error("Error inserting warehouses:", e); }
}

// ========== 👥 إدخال المستخدمين (مُحدَّث) ==========
function insertUsers(tableId, now) {
  if (!tableId) return;
  try {
    var ss = SpreadsheetApp.openById(tableId);
    var sh = ss.getSheets()[0];
    
    // ✅ إضافة مستخدم المدير الافتراضي
    // هيكل الأعمدة: [id, username, password_hash, password_salt, role, permissions_json, active, created_at, last_login]
    sh.appendRow([
      "1",                    // 0: id
      "admin",                // 1: username
      "",                     // 2: password_hash (فارغ ← يُملأ عند تغيير كلمة المرور)
      "",                     // 3: password_salt (فارغ ← يُملأ عند تغيير كلمة المرور)
      "admin",                // 4: role
      '{"allowed_pages":["*"],"role":"admin","read_only":false}',  // 5: permissions_json
      "TRUE",                 // 6: active
      now,                    // 7: created_at
      ""                      // 8: last_login
    ]);
    
  } catch (e) { 
    console.error("Error inserting users:", e); 
  }
}

/**
 * ✅ تحديث كلمة مرور مستخدم في جدول Users
 * @param {string} userId - معرف المستخدم (مثلاً "1" للمدير)
 * @param {string} newHash - الهاش الجديد لكلمة المرور
 * @param {string} newSalt - الملح الجديد
 * @returns {boolean} نجاح العملية
 */
function updateAdminPasswordInTable(userId, newHash, newSalt) {
  try {
    var usersId = getMasterTableId("Users");
    if (!usersId) {
      console.error('❌ جدول Users غير موجود');
      return false;
    }
    
    var sheet = SpreadsheetApp.openById(usersId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    
    for (var i = 1; i < data.length; i++) {
      // البحث عن المستخدم بالمعرف (العمود 1، مؤشر 0)
      if (String(data[i][0]) === String(userId)) {
        // تحديث عمود password_hash (العمود 3، مؤشر 2)
        sheet.getRange(i + 1, 3).setValue(newHash);
        // تحديث عمود password_salt (العمود 4، مؤشر 3)
        sheet.getRange(i + 1, 4).setValue(newSalt);
        
        console.log('✅ تم تحديث كلمة المرور للمستخدم ' + userId + ' في الصف ' + (i + 1));
        return true;
      }
    }
    
    console.warn('⚠️ لم يتم العثور على المستخدم بالمعرف: ' + userId);
    return false;
    
  } catch (e) {
    console.error("❌ updateAdminPasswordInTable error:", e);
    return false;
  }
}

// ========== 🛠 أدوات مساعدة ==========
function protectSheet(sheet, startRow, endRow) {
  try {
    var protection = sheet.protect().setDescription("ZEIOS - بيانات محمية");
    protection.setWarningOnly(false);
    protection.removeEditors(protection.getEditors());
    if (protection.canDomainEdit) protection.setDomainEdit(false);
    protection.setRange(sheet.getRange(startRow, 1, endRow - startRow + 1, sheet.getLastColumn()));
  } catch (e) { console.log("Protection skipped:", e.message); }
}

function updateProgress(step, total, message) {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName("Setup");
  if (!sh) return;
  var percent = Math.min(100, Math.round((step / total) * 100));
  var filled = Math.floor(percent / 5);
  var bar = "";
  for (var i = 0; i < 20; i++) { bar += (i < filled) ? "█" : "░"; }
  sh.getRange("A10:C15").clear();
  sh.getRange("A10").setValue("📊 تقدم التهيئة - ZEIOS").setFontWeight("bold").setFontSize(12);
  sh.getRange("A12").setValue("[" + bar + "] " + percent + "%").setFontFamily("Courier New");
  sh.getRange("A13").setValue("➡️ " + message).setFontColor("#555");
  SpreadsheetApp.flush();
}

// ========== 🔗 دوال الوصول للجداول ==========
function getMasterTableId(tableName) {
  var links = loadJSON('TABLE_LINKS', { master: {} });
  return (links.master && links.master[tableName] && links.master[tableName].id) || null;
}

function getYearlyTableId(tableName, fiscalYear) {
  var links = loadJSON('TABLE_LINKS', { yearly: {} });
  return (links.yearly && links.yearly[fiscalYear] && links.yearly[fiscalYear][tableName] && links.yearly[fiscalYear][tableName].id) || null;
}

// ========== 🔐 دوال التحقق من كلمة مرور المسؤول ==========
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
    // ✅ 1. التحقق من كلمة المرور الحالية (من الـ Properties)
    var verify = verifyAdminPassword(currentPassword);
    if (!verify.success) { 
      return { success: false, message: 'كلمة المرور الحالية غير صحيحة' }; 
    }
    
    if (!newPassword || newPassword.length < 4) {
      return { success: false, message: 'كلمة المرور الجديدة يجب أن تكون 4 أحرف على الأقل' };
    }
    
    // ✅ 2. تشفير كلمة المرور الجديدة
    var hashed = hashPassword(newPassword);
    
    // ✅ 3. تحديث في الـ Properties (للتحقق من صلاحيات النظام)
    saveJSON('ADMIN_PASSWORD', hashed);
    
    // ✅ 4. تحديث أيضاً في جدول Users للمدير (id = "1")
    var updatedInTable = updateAdminPasswordInTable("1", hashed.hash, hashed.salt);
    
    // ✅ 5. ضمان حفظ التغييرات فوراً
    SpreadsheetApp.flush();
    
    console.log('✅ تم تغيير كلمة مرور المسؤول:');
    console.log('   • Properties: محدث');
    console.log('   • جدول Users: ' + (updatedInTable ? 'محدث ✅' : 'فشل التحديث ⚠️'));
    
    return { 
      success: true, 
      message: 'تم تغيير كلمة المرور بنجاح',
      updated_in_table: updatedInTable
    };
    
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

function validateAndChangePassword(requestData) {
  try {
    if (!requestData) { return { success: false, message: '❌ لم يتم استلام البيانات' }; }
    var oldPassword = requestData.oldPassword || requestData.oldPass || requestData.currentPassword || '';
    var newPassword = requestData.newPassword || requestData.newPass || '';
    var confirmPassword = requestData.confirmPassword || requestData.confirmPass || '';
    
    if (!oldPassword) { return { success: false, message: '❌ يرجى إدخال كلمة المرور الحالية' }; }
    if (!newPassword) { return { success: false, message: '❌ يرجى إدخال كلمة المرور الجديدة' }; }
    if (!confirmPassword) { return { success: false, message: '❌ يرجى تأكيد كلمة المرور الجديدة' }; }
    if (newPassword !== confirmPassword) { return { success: false, message: '❌ كلمة المرور الجديدة غير متطابقة' }; }
    if (newPassword.length < 6) { return { success: false, message: '❌ كلمة المرور يجب أن تكون 6 أحرف على الأقل' }; }
    
    var stored = loadJSON('ADMIN_PASSWORD', null);
    if (!stored || !stored.hash || !stored.salt) {
      var newHash = hashPassword(newPassword);
      saveJSON('ADMIN_PASSWORD', newHash);
      return { success: true, message: '✅ تم تعيين كلمة المرور بنجاح' };
    }
    
    if (!verifyPassword(oldPassword, stored.hash, stored.salt)) {
      return { success: false, message: '❌ كلمة المرور الحالية غير صحيحة' };
    }
    
    var newHash = hashPassword(newPassword);
    saveJSON('ADMIN_PASSWORD', newHash);
    console.log('✅ تم تغيير كلمة مرور المسؤول بنجاح');
    return { success: true, message: '✅ تم تغيير كلمة المرور بنجاح' };
  } catch (e) {
    console.error('❌ Error in validateAndChangePassword:', e);
    return { success: false, message: '❌ خطأ: ' + e.toString() };
  }
}

// ========== 📋 دوال معلومات النظام ==========
function getLibraryVersion() { return LIBRARY_VERSION; }

function getCompanySettings() {
  return loadJSON('COMPANY_SETTINGS', { name: 'شركة غير مسجلة' });
}

function getActiveFiscalYear() {
  return loadJSON('FISCAL_YEAR', { year_code: null, is_active: false });
}

function getAllTableLinks() {
  return loadJSON('TABLE_LINKS', { master: {}, yearly: {} });
}

function showStoredDataInLog() {
  try {
    var props = getDocProperties();
    var allKeys = props.getKeys();
    console.log('ZEIOS ERP - البيانات المخزنة');
    console.log('عدد المفاتيح:', allKeys.length);
    for (var i = 0; i < allKeys.length; i++) {
      var key = allKeys[i];
      console.log('[' + (i + 1) + '] ' + key);
      try {
        var value = props.getProperty(key);
        if (!value) { console.log('   فارغة'); continue; }
        try { var parsed = JSON.parse(value); console.log('   JSON:', JSON.stringify(parsed, null, 2)); }
        catch (e) { console.log('   نص:', value.substring(0, 100)); }
      } catch (e) { console.log('   خطأ:', e.toString()); }
    }
    return { success: true, count: allKeys.length, keys: allKeys };
  } catch (e) {
    console.error('خطأ:', e);
    return { success: false, error: e.toString() };
  }
}

/**
 * setup.gs – ZEIOS ERP SYSTEM (SHEET VERSION)
 * دوال بنفس أسماء المكتبة عشان HTML من غير تعديل
 * 
 * ⚠️ قبل التشغيل: أضف المكتبة من Extensions → Libraries
 */

// ========== 🔗 ربط المكتبة ==========
var ZEIOS = ZEIOS; // غيّر للاسم اللي أنت سميته

// ========== 📦 خصائص المستند (معزولة لكل شيت) ==========
function getDocProperties() {
  try { return ZEIOS.getDocProperties(); }
  catch (e) { return PropertiesService.getDocumentProperties(); }
}

function loadJSON(key, defaultValue) {
  try { return ZEIOS.loadJSON(key, defaultValue); }
  catch (e) {
    try {
      var val = PropertiesService.getDocumentProperties().getProperty(key);
      return val ? JSON.parse(val) : defaultValue;
    } catch (ex) { return defaultValue; }
  }
}

function saveJSON(key, data) {
  try { return ZEIOS.saveJSON(key, data); }
  catch (e) {
    try {
      PropertiesService.getDocumentProperties().setProperty(key, JSON.stringify(data));
      return true;
    } catch (ex) { return false; }
  }
}

function clearAllJSON() {
  try { return ZEIOS.clearAllJSON(); }
  catch (e) {
    try {
      PropertiesService.getDocumentProperties().deleteAllProperties();
      return true;
    } catch (ex) { return false; }
  }
}

// ========== 🔐 أدوات كلمات المرور ==========
function generateSalt() { try { return ZEIOS.generateSalt(); } catch (e) { return ''; } }
function hashPassword(password, salt) { try { return ZEIOS.hashPassword(password, salt); } catch (e) { return {hash:'',salt:'',algorithm:''}; } }
function verifyPassword(password, storedHash, storedSalt) { try { return ZEIOS.verifyPassword(password, storedHash, storedSalt); } catch (e) { return false; } }

// ========== 🔍 كشف حالة النظام ==========
function isSystemInitialized() { try { return ZEIOS.isSystemInitialized(); } catch (e) { return false; } }
function getCurrentPhase() { try { return ZEIOS.getCurrentPhase(); } catch (e) { return {phase:1,name:'خطأ',licenseValid:false,isInitialized:false,message:e.toString()}; } }

// ========== 🚀 تهيئة النظام ==========
function initializeERP(formData) {
  try { return ZEIOS.initializeERP(formData); }
  catch (e) { return { success: false, message: '❌ ' + e.toString() }; }
}

function finalizeDashboardSheet(setupSheet, fiscalYear, tempPassword) {
  try { return ZEIOS.finalizeDashboardSheet(setupSheet, fiscalYear, tempPassword); }
  catch (e) { return null; }
}

function getOrCreateFolder(parent, name) {
  try { return ZEIOS.getOrCreateFolder(parent, name); }
  catch (e) { return parent.getFoldersByName(name).hasNext() ? parent.getFoldersByName(name).next() : parent.createFolder(name); }
}

function createMasterTables(assetsFolder) { try { return ZEIOS.createMasterTables(assetsFolder); } catch (e) { return {}; } }
function createYearlyTables(year, fiscalYearsFolder) { try { return ZEIOS.createYearlyTables(year, fiscalYearsFolder); } catch (e) { return {folder_id:'',tables:{}}; } }
function insertMasterDefaultData(tables) { try { ZEIOS.insertMasterDefaultData(tables); } catch (e) {} }
function insertChartOfAccounts(tableId, now) { try { ZEIOS.insertChartOfAccounts(tableId, now); } catch (e) {} }
function insertTableData(tableId, data, now) { try { ZEIOS.insertTableData(tableId, data, now); } catch (e) {} }
function insertWarehouses(tableId, now) { try { ZEIOS.insertWarehouses(tableId, now); } catch (e) {} }
function insertUsers(tableId, now) { try { ZEIOS.insertUsers(tableId, now); } catch (e) {} }
function protectSheet(sheet, startRow, endRow) { try { ZEIOS.protectSheet(sheet, startRow, endRow); } catch (e) {} }
function updateProgress(step, total, message) { try { ZEIOS.updateProgress(step, total, message); } catch (e) {} }

// ========== 🔗 دوال الوصول للجداول ==========
function getMasterTableId(tableName) { try { return ZEIOS.getMasterTableId(tableName); } catch (e) { return null; } }
function getYearlyTableId(tableName, fiscalYear) { try { return ZEIOS.getYearlyTableId(tableName, fiscalYear); } catch (e) { return null; } }

// ========== 🔐 دوال كلمة المرور ==========
function verifyAdminPassword(password) { try { return ZEIOS.verifyAdminPassword(password); } catch (e) { return {success:false,message:e.toString()}; } }
function changeAdminPassword(currentPassword, newPassword) { try { return ZEIOS.changeAdminPassword(currentPassword, newPassword); } catch (e) { return {success:false,message:e.toString()}; } }
function hasAdminPassword() { try { return ZEIOS.hasAdminPassword(); } catch (e) { return false; } }
function resetAdminPassword() { try { return ZEIOS.resetAdminPassword(); } catch (e) { return {success:false,message:e.toString()}; } }
function validateAndChangePassword(requestData) { try { return ZEIOS.validateAndChangePassword(requestData); } catch (e) { return {success:false,message:'❌ '+e.toString()}; } }

// ========== 📋 دوال معلومات النظام ==========
function getLibraryVersion() { try { return ZEIOS.getLibraryVersion(); } catch (e) { return 'غير متصل'; } }
function getCompanySettings() { try { return ZEIOS.getCompanySettings(); } catch (e) { return {name:'شركة غير مسجلة'}; } }
function getActiveFiscalYear() { try { return ZEIOS.getActiveFiscalYear(); } catch (e) { return {year_code:null,is_active:false}; } }
function getAllTableLinks() { try { return ZEIOS.getAllTableLinks(); } catch (e) { return {master:{},yearly:{}}; } }
function showStoredDataInLog() { try { return ZEIOS.showStoredDataInLog(); } catch (e) { return {success:false,error:e.toString()}; } }

// ========== 🎨 دوال عرض الواجهات (تستخدم في الشيت فقط - مش في المكتبة) ==========
function onOpen() {
  try {
    var ui = SpreadsheetApp.getUi();
    ZEIOS.createInitialSetupSheet && ZEIOS.createInitialSetupSheet();
    var phase = getCurrentPhase();
    var menu = ui.createMenu('📊 ZEIOS ERP');
    
    if (phase.phase === 1) {
      menu.addItem('🔐 تفعيل الترخيص', 'showActivationDialog');
    } else if (phase.phase === 2) {
      menu.addItem('⚙️ تهيئة النظام', 'showSetupWizard');
      menu.addItem('📋 حالة الترخيص', 'showLicenseStatus');
    } else {
      menu.addItem('🏠 لوحة التحكم', 'showDashboard');
      if (!phase.licenseValid) { menu.addItem('🔄 تجديد الترخيص', 'showActivationDialog'); }
      menu.addItem('📋 حالة الترخيص', 'showLicenseStatus');
      menu.addItem('🔐 تغيير كلمة المرور', 'showPasswordForm');
    }
    
    menu.addSeparator();
    menu.addItem('📞 الدعم الفني', 'showSupportDialog');
    menu.addItem('🔄 إعادة التحقق', 'refreshAndReload');
    menu.addToUi();
    
    if (phase.phase === 2) {
      ui.alert('🎉 تم تفعيل الترخيص بنجاح!', 'الآن يمكنك تهيئة النظام بالضغط على "⚙️ تهيئة النظام" من القائمة.', ui.ButtonSet.OK);
    } else if (phase.phase === 3 && !phase.licenseValid) {
      ui.alert('⚠️ تنبيه', 'الترخيص منتهي الصلاحية. يرجى تجديد الترخيص للاستمرار.', ui.ButtonSet.OK);
    }
  } catch (e) { console.error('❌ onOpen error:', e.toString()); }
}

function showSetupWizard() {
  try {
    SpreadsheetApp.getUi().showModalDialog(
      HtmlService.createHtmlOutputFromFile('setup_wizard').setWidth(700).setHeight(600),
      '⚙️ تهيئة نظام ZEIOS'
    );
  } catch (e) { SpreadsheetApp.getUi().alert('❌ خطأ: تأكد من وجود ملف setup_wizard.html'); }
}

function showDashboard() {
  try {
    SpreadsheetApp.getUi().showModalDialog(
      HtmlService.createHtmlOutputFromFile('dashboard').setWidth(1300).setHeight(800),
      "📊 لوحة تحكم ZEIOS"
    );
  } catch (e) { SpreadsheetApp.getUi().alert('❌ خطأ: تأكد من وجود ملف dashboard.html'); }
}

function showPasswordForm() {
  try {
    var phase = getCurrentPhase();
    if (phase.phase !== 3) {
      SpreadsheetApp.getUi().alert('⚠️ تنبيه', 'لا يمكن تغيير كلمة المرور قبل تهيئة النظام.', SpreadsheetApp.getUi().ButtonSet.OK);
      return;
    }
    SpreadsheetApp.getUi().showModalDialog(
      HtmlService.createHtmlOutputFromFile('admin_password_form').setWidth(500).setHeight(600),
      '🔐 تغيير كلمة مرور المسؤول'
    );
  } catch (e) { SpreadsheetApp.getUi().alert('❌ خطأ في فتح النموذج: ' + e.toString()); }
}

function showLicenseStatus() {
  try {
    var license = (typeof validateLicense === 'function') ? validateLicense() : {valid:false,message:'غير مفعل',expiresAt:null,daysRemaining:0};
    var status = license.valid ? '✅ نشط' : '❌ غير نشط';
    var expiry = license.expiresAt ? new Date(license.expiresAt).toLocaleDateString('ar-EG') : 'غير محدد';
    var html = HtmlService.createHtmlOutput(`
      <div style="padding:30px; text-align:center; font-family: 'Cairo', sans-serif;">
      <div style="font-size:60px; margin-bottom:20px;">${license.valid ? '✅' : '❌'}</div>
      <h3 style="color:#333; margin-bottom:15px;">حالة الترخيص</h3>
      <p style="background:#f5f5f5; padding:15px; border-radius:8px; margin:10px 0;">
      <strong>الحالة:</strong> ${status}<br>
      <strong>تاريخ الانتهاء:</strong> ${expiry}<br>
      <strong>الأيام المتبقية:</strong> ${license.daysRemaining || 0}<br>
      <strong>الرسالة:</strong> ${license.message}
      </p>
      <button onclick="google.script.host.close()" style="padding:10px 30px; background:#667eea; color:white; border:none; border-radius:5px; cursor:pointer;">إغلاق</button>
      </div>
    `).setWidth(400).setHeight(350);
    SpreadsheetApp.getUi().showModalDialog(html, '📋 حالة الترخيص');
  } catch (e) { SpreadsheetApp.getUi().alert('❌ خطأ: ' + e.toString()); }
}

function showSupportDialog() {
  var html = HtmlService.createHtmlOutput(`
    <!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><style>
    body{font-family:'Segoe UI',Tahoma,sans-serif;padding:25px;background:#f8f9fa}
    .container{max-width:400px;margin:0 auto;background:#fff;padding:30px;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,0.08);text-align:center}
    h3{color:#1a73e8;margin:0 0 20px}
    .contact-card{background:#f1f8ff;padding:20px;border-radius:12px;margin:15px 0;text-align:right}
    .contact-card.whatsapp{background:#e8f5e9}
    .contact-card a{color:#1a73e8;text-decoration:none;font-weight:500}
    .contact-card.whatsapp a{color:#25d366}
    .close-btn{padding:12px 40px;background:#6c757d;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px;margin-top:20px}
    </style></head><body><div class="container">
    <div style="font-size:32px;margin-bottom:10px">🌟</div>
    <h3>📞 الدعم الفني - ZEIOS ERP</h3>
    <p style="color:#666;margin-bottom:25px">فريق الدعم جاهز لمساعدتك على مدار الساعة</p>
    <div class="contact-card"><strong>📧 البريد الإلكتروني:</strong><br><a href="mailto:zeioszeios0@gmail.com">zeioszeios0@gmail.com</a></div>
    <div class="contact-card whatsapp"><strong>📱 واتساب:</strong><br><a href="https://wa.me/201205951462" target="_blank">00201205951462</a></div>
    <p style="font-size:12px;color:#999;margin-top:25px">⚡ ZEIOS ERP - نسخة 3.3</p>
    <button class="close-btn" onclick="google.script.host.close()">✕ إغلاق</button>
    </div></body></html>
  `).setWidth(450).setHeight(420);
  SpreadsheetApp.getUi().showModalDialog(html, '📞 الدعم الفني');
}

function refreshAndReload() {
  try {
    if (typeof clearLicenseCache === 'function') { clearLicenseCache(); }
    onOpen();
    SpreadsheetApp.getUi().alert('✅ تم تحديث القائمة بنجاح');
  } catch (e) { SpreadsheetApp.getUi().alert('❌ خطأ في التحديث: ' + e.toString()); }
}
