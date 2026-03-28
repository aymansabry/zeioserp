/**
 * SystemHealth.gs – ZEIOS ERP SYSTEM (LIBRARY VERSION)
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



// ========== 🔧 دوال مساعدة ==========
function formatBytesForSystemHealth(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + " MB";
  return (bytes / 1073741824).toFixed(1) + " GB";
}

function getTableRowCountForSystemHealth(spreadsheetId) {
  try {
    var ss = SpreadsheetApp.openById(spreadsheetId);
    var sheet = ss.getSheets()[0];
    var lastRow = sheet.getLastRow();
    return lastRow > 1 ? lastRow - 1 : 0;
  } catch (e) {
    return -1;
  }
}

// ========== 🩺 فحص صحة النظام ==========
function checkSystemHealthForSystem() {
  var report = {
    timestamp: new Date().toISOString(),
    status: "healthy",
    checks: [],
    tables: [],
    summary: ""
  };
  
  try {
    // === الفحص 1: الوصول إلى جدول البيانات الرئيسي ===
    var ss = SpreadsheetApp.getActive();
    report.checks.push({
      name: "جدول البيانات الرئيسي",
      status: "pass",
      details: "المعرف: " + ss.getId().substring(0, 15) + "... | الاسم: " + ss.getName()
    });
    
    // === الفحص 2: وجود ورقة الإعدادات (Setup) ===
    var setupSheet = ss.getSheetByName("Setup");
    if (!setupSheet) {
      report.checks.push({
        name: "ورقة الإعدادات",
        status: "critical",
        details: "⚠️ غير موجودة - يرجى تشغيل تهيئة النظام"
      });
      report.status = "critical";
    } else {
      report.checks.push({
        name: "ورقة الإعدادات",
        status: "pass",
        details: "✅ موجودة"
      });
    }

    // === الفحص 3: البيانات المخزنة في Properties ===
    var criticalSettings = ["FISCAL_YEAR", "FOLDERS", "ADMIN_PASSWORD", "TABLE_LINKS"];
    var missingSettings = [];
    for (var i = 0; i < criticalSettings.length; i++) {
      var setting = criticalSettings[i];
      var value = loadJSON(setting, null);
      if (!value) missingSettings.push(setting);
    }
    
    if (missingSettings.length > 0) {
      report.checks.push({
        name: "الإعدادات الحرجة",
        status: missingSettings.length >= 3 ? "critical" : "warning",
        details: "❌ مفقودة: " + missingSettings.join("، ")
      });
      report.status = missingSettings.length >= 3 ? "critical" : "warning";
    } else {
      report.checks.push({
        name: "الإعدادات الحرجة",
        status: "pass",
        details: "✅ جميع الإعدادات موجودة"
      });
    }
    
    // === الفحص 4: السنة المالية النشطة ===
    var fiscal = loadJSON('FISCAL_YEAR', {});
    var activeYear = fiscal.year_code;
    
    if (!activeYear) {
      report.checks.push({
        name: "السنة المالية النشطة",
        status: "critical",
        details: "❌ لا توجد سنة مالية نشطة"
      });
      report.status = "critical";
    } else {
      var isActive = fiscal.is_active === true || fiscal.is_active === 'true';
      report.checks.push({
        name: "السنة المالية النشطة",
        status: "pass",
        details: "✅ " + activeYear + " " + (isActive ? '(نشطة)' : '(غير نشطة)')
      });
    }
    
    // === الفحص 5: هيكل المجلدات ===
    var folders = loadJSON('FOLDERS', {});
    if (!folders.root || !folders.assets) {
      report.checks.push({
        name: "هيكل المجلدات",
        status: "critical",
        details: "❌ غير مكتمل"
      });
      report.status = "critical";
    } else {
      try {
        var assetsFolder = DriveApp.getFolderById(folders.assets);
        var subfolderCount = 0;
        var subfolders = assetsFolder.getFolders();
        while (subfolders.hasNext()) {
          subfolders.next();
          subfolderCount++;
        }
        report.checks.push({
          name: "هيكل المجلدات",
          status: "pass",
          details: "✅ " + subfolderCount + " مجلد فرعي"
        });
      } catch (e) {
        report.checks.push({
          name: "هيكل المجلدات",
          status: "critical",
          details: "❌ لا يمكن الوصول (المعرف: " + folders.assets.substring(0, 15) + "...)"
        });
        report.status = "critical";
      }
    }
    
    // === الفحص 6: الجداول الرئيسية ===
    var links = loadJSON('TABLE_LINKS', { master: {} });
    var masterTables = links.master || {};
    var masterTableNames = [];
    for (var key in masterTables) { masterTableNames.push(key); }
    
    if (masterTableNames.length === 0) {
      report.checks.push({
        name: "الجداول الرئيسية",
        status: "critical",
        details: "❌ لا توجد جداول رئيسية مسجلة"
      });
      report.status = "critical";
    } else {
      report.checks.push({
        name: "الجداول الرئيسية",
        status: "pass",
        details: "✅ " + masterTableNames.length + " جدول مسجل"
      });
    }
    
    // ✅ إحصائيات الجداول مع عدد السجلات
    report.tables = [];
    
    // إحصائيات الجداول الرئيسية
    for (var j = 0; j < masterTableNames.length; j++) {
      var tableName = masterTableNames[j];
      var tableInfo = masterTables[tableName];
      var tableData = {
        name: tableName,
        type: "master",
        count: 0,
        status: "pass",
        url: tableInfo.url || ''
      };
      
      try {
        if (!tableInfo.id) throw new Error("لم يتم تسجيل المعرف");
        var count = getTableRowCountForSystemHealth(tableInfo.id);
        if (count === -1) throw new Error("لا يمكن الوصول");
        tableData.count = count;
        tableData.status = count === 0 ? "warning" : "pass";
      } catch (e) {
        tableData.status = "error";
        tableData.error = e.message;
        tableData.count = 0;
      }
      report.tables.push(tableData);
    }
    
    // إحصائيات الجداول السنوية للسنة النشطة
    if (activeYear) {
      var yearlyTables = (links.yearly && links.yearly[activeYear]) || {};
      var yearlyTableNames = [];
      for (var yKey in yearlyTables) { yearlyTableNames.push(yKey); }
      
      for (var k = 0; k < yearlyTableNames.length; k++) {
        var yTableName = yearlyTableNames[k];
        var yTableInfo = yearlyTables[yTableName];
        var yTableData = {
          name: yTableName + " (" + activeYear + ")",
          type: "yearly",
          fiscalYear: activeYear,
          count: 0,
          status: "pass",
          url: yTableInfo.url || ''
        };
        
        try {
          if (!yTableInfo.id) throw new Error("لم يتم تسجيل المعرف");
          var yCount = getTableRowCountForSystemHealth(yTableInfo.id);
          if (yCount === -1) throw new Error("لا يمكن الوصول");
          yTableData.count = yCount;
          yTableData.status = yCount === 0 ? "warning" : "pass";
        } catch (e) {
          yTableData.status = "error";
          yTableData.error = e.message;
          yTableData.count = 0;
        }
        report.tables.push(yTableData);
      }
    }
    
    // === الملخص النهائي ===
    var warningCount = 0, criticalCount = 0;
    for (var c = 0; c < report.checks.length; c++) {
      if (report.checks[c].status === "warning") warningCount++;
      else if (report.checks[c].status === "critical") criticalCount++;
    }
    
    var totalTables = report.tables.length;
    var totalRecords = 0;
    for (var t = 0; t < report.tables.length; t++) {
      if (report.tables[t].count > 0) totalRecords += report.tables[t].count;
    }
    
    if (criticalCount > 0) {
      report.status = "critical";
      report.summary = "❌ حالة النظام: حرجة\\n" + criticalCount + " مشكلة حرجة تحتاج تدخل فوري.\\nإجمالي الجداول: " + totalTables + " | إجمالي السجلات: " + totalRecords;
      report.recommendation = "قم بتشغيل 'تهيئة النظام' من القائمة الرئيسية";
    } else if (warningCount > 0) {
      report.status = "warning";
      report.summary = "⚠️ حالة النظام: تحذير\\n" + warningCount + " مكون يحتاج انتباه.\\nإجمالي الجداول: " + totalTables + " | إجمالي السجلات: " + totalRecords;
      report.recommendation = "راجع التحذيرات أعلاه. الجداول الفارغة قد تحتاج إدخال بيانات";
    } else {
      report.summary = "✅ حالة النظام: سليم\\nجميع المكونات تعمل بشكل طبيعي.\\nإجمالي الجداول: " + totalTables + " | إجمالي السجلات: " + totalRecords;
    }
    
    console.log("📊 فحص صحة النظام: " + report.status + " | جداول: " + totalTables + " | سجلات: " + totalRecords);
    
  } catch (e) {
    report.status = "critical";
    report.summary = "❌ فشل التشخيص\\nخطأ: " + (e.message || e.toString());
    report.error = e.toString();
    report.tables = report.tables || [];
    console.error("❌ خطأ في checkSystemHealthForSystem:", e);
  }
  
  return report;
}

// ========== 📋 عرض معلومات النظام ==========
function showSystemInfoForSystem() {
  try {
    var ss = SpreadsheetApp.getActive();
    var company = loadJSON('COMPANY_SETTINGS', { name: 'غير مسجلة', tax_no: '', phone: '', email: '' });
    var fiscal = loadJSON('FISCAL_YEAR', { year_code: new Date().getFullYear().toString(), date_from: '', date_to: '' });
    var links = loadJSON('TABLE_LINKS', { master: {}, yearly: {} });
    
    var masterCount = 0;
    for (var key in links.master || {}) { masterCount++; }
    
    var yearlyCount = 0;
    if (fiscal.year_code && links.yearly && links.yearly[fiscal.year_code]) {
      for (var yKey in links.yearly[fiscal.year_code]) { yearlyCount++; }
    }
    
    var storageUsed = 0;
    try {
      var folders = loadJSON('FOLDERS', {});
      if (folders.assets) {
        var assetsFolder = DriveApp.getFolderById(folders.assets);
        var files = assetsFolder.getFiles();
        while (files.hasNext()) storageUsed += files.next().getSize();
      }
    } catch (e) { storageUsed = -1; }
    
    return {
      system: { name: "ZEIOS ERP", version: "2.0.0", edition: "احترافي", timezone: Session.getScriptTimeZone() },
      workbook: { id: ss.getId(), name: ss.getName(), url: ss.getUrl(), created: ss.getDateCreated().toISOString() },
      company: { name: company.name, tax_no: company.tax_no || 'غير مسجل', phone: company.phone || 'غير مسجل', email: company.email || 'غير مسجل' },
      fiscalYear: { active: fiscal.year_code, from: fiscal.date_from || 'غير محدد', to: fiscal.date_to || 'غير محدد', isActive: fiscal.is_active === true },
      tables: { master: masterCount, yearly: yearlyCount, total: masterCount + yearlyCount },
      storage: { used: storageUsed > 0 ? formatBytesForSystemHealth(storageUsed) : "غير معروف" },
      user: { email: Session.getActiveUser().getEmail() || "غير معروف" }
    };
  } catch (e) {
    console.error("❌ showSystemInfoForSystem error:", e);
    return { error: e.message || "خطأ غير معروف", timestamp: new Date().toISOString() };
  }
}

// ========== 📊 حالة الحصة (Quota) ==========
function checkQuotaStatusForSystem() {
  try {
    var triggers = ScriptApp.getProjectTriggers();
    return {
      triggers: { used: triggers.length, limit: 20, status: triggers.length >= 18 ? "warning" : "healthy" },
      scriptProperties: { used: PropertiesService.getScriptProperties().getKeys().length, limit: 500, status: "healthy" }
    };
  } catch (e) {
    console.error("❌ checkQuotaStatusForSystem error:", e);
    return { error: e.message };
  }
}

// ========== 🔧 دوال مساعدة إضافية ==========
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
    console.log('ZEIOS ERP - SystemHealth data');
    console.log('Keys:', allKeys.length);
    return { success: true, count: allKeys.length, keys: allKeys };
  } catch (e) { console.error('Error:', e); return { success: false, error: e.toString() }; }
}

function getLibraryVersion() { return LIBRARY_VERSION; }


/**
 * SystemHealth_client.gs – ZEIOS ERP SYSTEM (SHEET VERSION)
 * دوال بنفس أسماء المكتبة عشان الكود يشتغل من غير تعديل
 * 
 * ⚠️ قبل التشغيل: أضف المكتبة من Extensions → Libraries
 */

// ========== 🔗 ربط المكتبة ==========
var ZEIOS = ZEIOS; // غيّر للاسم اللي أنت سميته


// ========== 🩺 فحص صحة النظام ==========
function checkSystemHealthForSystem() { try { return ZEIOS.checkSystemHealthForSystem(); } catch (e) { return {status:"critical",summary:"❌ خطأ: "+e.toString(),checks:[],tables:[]}; } }

// ========== 📋 معلومات النظام ==========
function showSystemInfoForSystem() { try { return ZEIOS.showSystemInfoForSystem(); } catch (e) { return {error:e.toString(),timestamp:new Date().toISOString()}; } }

// ========== 📊 حالة الحصة ==========
function checkQuotaStatusForSystem() { try { return ZEIOS.checkQuotaStatusForSystem(); } catch (e) { return {error:e.toString()}; } }

// ========== 🔧 مساعدة ==========
function formatBytesForSystemHealth(bytes) { try { return ZEIOS.formatBytesForSystemHealth(bytes); } catch (e) { return bytes + " B"; } }
function generateTimestamp() { try { return ZEIOS.generateTimestamp(); } catch (e) { return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss'); } }
function generateUniqueId() { try { return ZEIOS.generateUniqueId(); } catch (e) { return Utilities.getUuid().replace(/-/g, ''); } }
function showStoredDataInLog() { try { return ZEIOS.showStoredDataInLog(); } catch (e) { return {success:false,error:e.toString()}; } }
function getLibraryVersion() { try { return ZEIOS.getLibraryVersion(); } catch (e) { return 'غير متصل'; } }

// ========== 🎨 دوال الواجهة (في الشيت فقط - مش في المكتبة) ==========
function isSpreadsheetContext() {
  try { SpreadsheetApp.getUi(); return true; }
  catch (e) { return false; }
}

function showHealthReport() {
  try {
    var report = checkSystemHealthForSystem();
    
    var html = '<!DOCTYPE html><html dir="rtl"><head>';
    html += '<meta charset="UTF-8">';
    html += '<style>';
    html += 'body{font-family:"Segoe UI",Tahoma,sans-serif;background:#f5f5f5;margin:0;padding:20px}';
    html += '.container{max-width:1200px;margin:0 auto;background:#fff;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);padding:25px}';
    html += 'h1{color:#1a73e8;margin:0 0 20px;font-size:24px;border-bottom:2px solid #e0e0e0;padding-bottom:10px}';
    html += '.status-badge{display:inline-block;padding:8px 16px;border-radius:20px;font-weight:bold;margin-bottom:20px}';
    html += '.healthy{background:#d4edda;color:#155724;border:1px solid #c3e6cb}';
    html += '.warning{background:#fff3cd;color:#856404;border:1px solid #ffeeba}';
    html += '.critical{background:#f8d7da;color:#721c24;border:1px solid #f5c6cb}';
    html += '.summary{background:#f8f9fa;padding:15px;border-radius:8px;margin:20px 0;border-right:4px solid #1a73e8}';
    html += 'table{width:100%;border-collapse:collapse;margin:15px 0}';
    html += 'th{background:linear-gradient(135deg,#1a73e8,#0d5bdb);color:#fff;padding:12px;text-align:right}';
    html += 'td{padding:10px;border-bottom:1px solid #eee}';
    html += 'tr:hover{background:#f5f7ff}';
    html += '.pass{color:#28a745;font-weight:bold}';
    html += '.warning-text{color:#ffc107;font-weight:bold}';
    html += '.critical-text{color:#dc3545;font-weight:bold}';
    html += '.error-text{color:#dc3545}';
    html += '.count{font-weight:bold;font-size:16px}';
    html += '.btn{background:#1a73e8;color:#fff;border:none;padding:12px 24px;border-radius:8px;cursor:pointer;font-size:14px;margin-top:20px}';
    html += '.btn:hover{background:#0d5bdb}';
    html += '.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:15px;margin:20px 0}';
    html += '.card{background:#f8f9fa;border-radius:8px;padding:15px;border:1px solid #e0e0e0}';
    html += '.card-title{font-size:14px;color:#666;margin-bottom:5px}';
    html += '.card-value{font-size:24px;font-weight:bold;color:#1a73e8}';
    html += '</style>';
    html += '</head><body>';
    html += '<div class="container">';
    html += '<h1>📊 تقرير صحة النظام - ZEIOS ERP</h1>';
    
    var statusClass = report.status === 'healthy' ? 'healthy' : (report.status === 'warning' ? 'warning' : 'critical');
    html += '<div class="status-badge ' + statusClass + '">';
    html += report.status === 'healthy' ? '✅ سليم' : (report.status === 'warning' ? '⚠️ تحذير' : '❌ حرج');
    html += '</div>';
    
    html += '<div class="summary">';
    html += '<strong>📋 الملخص:</strong><br>';
    html += report.summary.replace(/\\n/g, '<br>');
    if (report.recommendation) {
      html += '<br><br><strong>💡 توصية:</strong> ' + report.recommendation;
    }
    html += '</div>';
    
    var totalRecords = 0;
    for (var i = 0; i < report.tables.length; i++) { if (report.tables[i].count > 0) totalRecords += report.tables[i].count; }
    var warningTables = 0, errorTables = 0;
    for (var j = 0; j < report.tables.length; j++) {
      if (report.tables[j].status === 'warning') warningTables++;
      else if (report.tables[j].status === 'error') errorTables++;
    }
    
    html += '<div class="grid">';
    html += '<div class="card"><div class="card-title">إجمالي الجداول</div><div class="card-value">' + report.tables.length + '</div></div>';
    html += '<div class="card"><div class="card-title">إجمالي السجلات</div><div class="card-value">' + totalRecords.toLocaleString() + '</div></div>';
    html += '<div class="card"><div class="card-title">جداول رئيسية</div><div class="card-value">' + report.tables.filter(function(t){return t.type==='master';}).length + '</div></div>';
    html += '<div class="card"><div class="card-title">جداول سنوية</div><div class="card-value">' + report.tables.filter(function(t){return t.type==='yearly';}).length + '</div></div>';
    html += '<div class="card"><div class="card-title">تحذيرات</div><div class="card-value warning-text">' + warningTables + '</div></div>';
    html += '<div class="card"><div class="card-title">أخطاء</div><div class="card-value critical-text">' + errorTables + '</div></div>';
    html += '</div>';
    
    html += '<h2>🔍 نتائج الفحص</h2>';
    html += '<table><tr><th>الفحص</th><th>الحالة</th><th>التفاصيل</th></tr>';
    for (var c = 0; c < report.checks.length; c++) {
      var check = report.checks[c];
      var statusIcon = check.status === 'pass' ? '✅' : (check.status === 'warning' ? '⚠️' : '❌');
      var statusCls = check.status === 'pass' ? 'pass' : (check.status === 'warning' ? 'warning-text' : 'critical-text');
      html += '<tr><td>' + check.name + '</td><td class="' + statusCls + '">' + statusIcon + ' ' + check.status + '</td><td>' + check.details + '</td></tr>';
    }
    html += '</table>';
    
    html += '<h2>📈 إحصائيات الجداول</h2>';
    html += '<table><tr><th>الجدول</th><th>النوع</th><th>السنة</th><th>عدد السجلات</th><th>الحالة</th></tr>';
    
    report.tables.sort(function(a, b) {
      if (a.type !== b.type) return a.type === 'master' ? -1 : 1;
      return a.name.localeCompare(b.name, 'ar');
    }).forEach(function(table) {
      var statusIcon = table.status === 'pass' ? '✅' : (table.status === 'warning' ? '⚠️' : '❌');
      var statusCls = table.status === 'pass' ? 'pass' : (table.status === 'warning' ? 'warning-text' : 'critical-text');
      var yearDisplay = table.fiscalYear || '-';
      var countDisplay = table.count >= 0 ? table.count.toLocaleString() : '?';
      html += '<tr><td>' + table.name + '</td><td>' + (table.type === 'master' ? 'رئيسي' : 'سنوي') + '</td><td>' + yearDisplay + '</td><td class="count">' + countDisplay + '</td><td class="' + statusCls + '">' + statusIcon + ' ' + table.status + '</td></tr>';
    });
    
    html += '</table>';
    html += '<div style="text-align:center"><button class="btn" onclick="google.script.host.close()">✕ إغلاق التقرير</button></div>';
    html += '<div style="margin-top:20px;font-size:12px;color:#999;text-align:left">آخر تحديث: ' + new Date(report.timestamp).toLocaleString('ar-EG') + '</div>';
    html += '</div></body></html>';
    
    SpreadsheetApp.getUi().showModalDialog(
      HtmlService.createHtmlOutput(html).setWidth(1200).setHeight(800),
      "📊 تقرير صحة النظام - ZEIOS"
    );
    return { success: true };
  } catch (e) {
    console.error("❌ showHealthReport error:", e);
    return { success: false, message: e.toString() };
  }
}
