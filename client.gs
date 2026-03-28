/**
 * client_core.gs – ZEIOS ERP CLIENT CORE (LIBRARY VERSION)
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

// ========== ⚙️ إعدادات الاتصال بالسيرفر ==========
var DEFAULT_SERVER_URL = 'https://script.google.com/macros/s/AKfycbwuC-8vaI1NoLtQpZJCMspb-tjyct5Il5IlDkBWF3pNIry3vwrkd6ESKfkdnJblmMQe/exec';
var CHECK_INTERVAL_HOURS = 24; // التحقق كل 24 ساعة


// ========== 1️⃣ التحقق الرئيسي من الترخيص ==========
function validateLicense() {
  try {
    var clientSecret = getClientSecret();
    if (!clientSecret) {
      return { valid: false, message: '❌ ملف الترخيص غير موجود', requiresActivation: true };
    }
    
    var licenseKey = PropertiesService.getUserProperties().getProperty('ZEIOS_LICENSE_KEY');
    if (!licenseKey) {
      return { valid: false, message: '❌ لم يتم تفعيل الترخيص', requiresActivation: true };
    }
    
    // التحقق من الكاش المحلي
    var cached = getCachedLicense();
    if (cached && cached.valid) {
      var hoursSinceCheck = (new Date() - new Date(cached.checkedAt)) / (1000 * 60 * 60);
      if (hoursSinceCheck < CHECK_INTERVAL_HOURS) {
        return cached;
      }
    }
    
    // الاتصال بالسيرفر للتحقق
    var result = validateWithServer(licenseKey, clientSecret);
    
    // حفظ النتيجة في الكاش إذا كانت صالحة
    if (result.valid) {
      saveLicenseCache(result);
    }
    
    return result;
    
  } catch (e) {
    console.error('validateLicense error:', e.toString());
    // في حالة فشل الاتصال، نستخدم آخر كاش
    var lastCache = getCachedLicense();
    if (lastCache) {
      return lastCache;
    }
    return { valid: false, message: '❌ فشل الاتصال بالسيرفر: ' + e.toString() };
  }
}

// ========== 2️⃣ قراءة المفتاح السري من الشيت المخفي ==========
function getClientSecret() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('License');
    
    if (!sheet) return null;
    
    var data = sheet.getDataRange().getValues();
    for (var i = 0; i < data.length; i++) {
      if (data[i][0] === 'client_secret') {
        return String(data[i][1]).trim();
      }
    }
    return null;
  } catch (e) {
    console.error('getClientSecret error:', e.toString());
    return null;
  }
}

// ========== 3️⃣ الاتصال بالسيرفر للتحقق ==========
function validateWithServer(licenseKey, clientSecret) {
  try {
    var sheetId = SpreadsheetApp.getActive().getId();
    var serverUrl = getServerUrl();
    
    if (!serverUrl) {
      return { valid: false, message: '❌ عنوان السيرفر غير محدد' };
    }
    
    var payload = {
      action: 'validate',
      licenseKey: licenseKey,
      sheetId: sheetId,
      clientSecret: clientSecret,
      timestamp: new Date().getTime()
    };
    
    var response = UrlFetchApp.fetch(serverUrl, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
      timeout: 10000
    });
    
    var result = JSON.parse(response.getContentText());
    
    return {
      valid: result.valid || false,
      message: result.message || '',
      expiresAt: result.expiresAt || '',
      daysRemaining: result.daysRemaining || 0,
      checkedAt: new Date().toISOString()
    };
    
  } catch (e) {
    console.error('validateWithServer error:', e.toString());
    return { valid: false, message: '❌ فشل الاتصال بالسيرفر: ' + e.toString() };
  }
}

// ========== 4️⃣ إدارة الكاش المحلي ==========
function getCachedLicense() {
  try {
    var cached = getDocProperties().getProperty('LICENSE_CACHE');
    return cached ? JSON.parse(cached) : null;
  } catch (e) {
    return null;
  }
}

function saveLicenseCache(data) {
  try {
    getDocProperties().setProperty('LICENSE_CACHE', JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('saveLicenseCache error:', e.toString());
    return false;
  }
}

function clearLicenseCache() {
  try {
    getDocProperties().deleteProperty('LICENSE_CACHE');
    return true;
  } catch (e) {
    console.error('clearLicenseCache error:', e.toString());
    return false;
  }
}

// ========== 5️⃣ تفعيل الترخيص (لأول مرة) ==========
function activateLicense(licenseKey) {
  try {
    var clientSecret = getClientSecret();
    if (!clientSecret) {
      return { success: false, message: '❌ ملف الترخيص غير موجود' };
    }
    
    var sheetId = SpreadsheetApp.getActive().getId();
    var email = Session.getActiveUser().getEmail();
    var serverUrl = getServerUrl();
    
    if (!serverUrl) {
      return { success: false, message: '❌ عنوان السيرفر غير محدد' };
    }
    
    var payload = {
      action: 'activate',
      licenseKey: licenseKey,
      sheetId: sheetId,
      clientSecret: clientSecret,
      email: email
    };
    
    var response = UrlFetchApp.fetch(serverUrl, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
      timeout: 15000
    });
    
    var result = JSON.parse(response.getContentText());
    
    if (result.success) {
      // حفظ مفتاح الترخيص في خصائص المستخدم
      PropertiesService.getUserProperties().setProperty('ZEIOS_LICENSE_KEY', licenseKey);
      // مسح الكاش القديم
      clearLicenseCache();
    }
    
    return result;
    
  } catch (e) {
    console.error('activateLicense error:', e.toString());
    return { success: false, message: '❌ فشل التفعيل: ' + e.toString() };
  }
}

// ========== 6️⃣ الدالة الموحدة لاستدعاء العمليات المحمية ==========
function callServerOperation(operationName, params) {
  try {
    // التحقق من الترخيص أولاً
    var license = validateLicense();
    if (!license.valid) {
      return { 
        success: false, 
        message: license.message,
        requiresActivation: license.requiresActivation 
      };
    }
    
    // قراءة بيانات الترخيص
    var licenseKey = PropertiesService.getUserProperties().getProperty('ZEIOS_LICENSE_KEY');
    var clientSecret = getClientSecret();
    var sheetId = SpreadsheetApp.getActive().getId();
    var serverUrl = getServerUrl();
    
    if (!serverUrl) {
      return { success: false, message: '❌ عنوان السيرفر غير محدد' };
    }
    
    if (!clientSecret) {
      return { success: false, message: '❌ ملف الترخيص غير موجود' };
    }
    
    // تجهيز البيانات
    var payload = {
      operation: operationName,
      licenseKey: licenseKey,
      sheetId: sheetId,
      clientSecret: clientSecret,
      params: params,
      timestamp: new Date().getTime()
    };
    
    // إرسال الطلب
    var response = UrlFetchApp.fetch(serverUrl, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
      timeout: 30000 // 30 ثانية للعمليات الطويلة
    });
    
    return JSON.parse(response.getContentText());
    
  } catch (e) {
    console.error('callServerOperation error:', e.toString());
    return { success: false, message: '❌ فشل الاتصال: ' + e.toString() };
  }
}

// ========== 7️⃣ دوال مساعدة للترخيص ==========
function getLicenseStatus() {
  var license = validateLicense();
  return {
    valid: license.valid,
    message: license.message,
    expiresAt: license.expiresAt,
    daysRemaining: license.daysRemaining,
    requiresActivation: license.requiresActivation,
    checkedAt: license.checkedAt
  };
}

function isLicenseValid() {
  var license = validateLicense();
  return license.valid === true;
}

function getLicenseDaysRemaining() {
  var license = validateLicense();
  return license.daysRemaining || 0;
}

function getServerUrl() {
  try {
    // أولاً: البحث في خصائص المستند
    var url = getDocProperties().getProperty('SERVER_URL');
    if (url && url.trim() !== '') {
      return url.trim();
    }
    // ثانياً: استخدام العنوان الافتراضي
    return DEFAULT_SERVER_URL.trim();
  } catch (e) {
    console.error('getServerUrl error:', e.toString());
    return DEFAULT_SERVER_URL.trim();
  }
}

function setServerUrl(url) {
  try {
    if (!url || url.trim() === '') {
      return { success: false, message: '❌ عنوان السيرفر غير صالح' };
    }
    getDocProperties().setProperty('SERVER_URL', url.trim());
    return { success: true, message: '✅ تم حفظ عنوان السيرفر' };
  } catch (e) {
    console.error('setServerUrl error:', e.toString());
    return { success: false, message: '❌ خطأ: ' + e.toString() };
  }
}

// ========== 8️⃣ دوال التطوير ==========
function showStoredDataInLog() {
  try {
    var props = getDocProperties();
    var allKeys = props.getKeys();
    console.log('ZEIOS ERP - البيانات المخزنة (client_core)');
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
    console.error('خطأ:', e.toString());
    return { success: false, error: e.toString() };
  }
}

function getLibraryVersion() {
  return LIBRARY_VERSION;
}

function testConnection() {
  try {
    var license = validateLicense();
    return {
      success: true,
      license: license,
      serverUrl: getServerUrl(),
      hasClientSecret: !!getClientSecret(),
      timestamp: new Date().toISOString()
    };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}
/**
 * ✅ التحقق من صلاحية الترخيص من السيرفر مباشرة
 * ✅ تجيب بيانات الترخيص من ورقة "الترخيص" في الشيت (وليس من PropertiesService)
 * ⚠️ تتصل بالسيرفر فقط - لا تقرأ من ملف محلي
 * @returns {Object} { valid: boolean, message: string, expiresAt: string, daysRemaining: number, requiresActivation: boolean, checkedAt: string, source: 'server' }
 */
function validateLicenseFromServer() {
  try {
    console.log("🔐 [validateLicenseFromServer] Starting server license check...");
    
    // ✅ ✅ جلب بيانات الترخيص من ورقة "الترخيص" في الشيت (نفس طريقة validateLicense)
    var clientSecret = s_getClientSecretFromSheet();
    var licenseKey = s_getLicenseKeyFromSheet();
    
    if (!clientSecret || !licenseKey) {
      console.warn("⚠️ [validateLicenseFromServer] Missing clientSecret or licenseKey in sheet 'License'");
      return {
        valid: false,
        message: '❌ بيانات الترخيص غير مكتملة في ورقة "الترخيص". يرجى الاتصال بالدعم الفني.',
        expiresAt: '',
        daysRemaining: 0,
        requiresActivation: true,
        checkedAt: new Date().toISOString(),
        source: 'server',
        error: 'Missing credentials in sheet'
      };
    }
    
    // ✅ الاتصال بالسيرفر للتحقق من الترخيص
    var serverUrl = getServerUrl(); // تستخدم الدالة الأصلية
    var sheetId = SpreadsheetApp.getActive().getId();
    
    var payload = {
      action: 'validate',
      licenseKey: licenseKey,
      sheetId: sheetId,
      clientSecret: clientSecret,
      timestamp: new Date().getTime(),
      version: LIBRARY_VERSION || '3.3.0'
    };
    
    var response = UrlFetchApp.fetch(serverUrl, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
      timeout: 30000,
      headers: {
        'User-Agent': 'ZEIOS-ERP/' + (LIBRARY_VERSION || '3.3.0')
      }
    });
    
    var responseCode = response.getResponseCode();
    console.log("📡 [validateLicenseFromServer] Response code:", responseCode);
    
    if (responseCode !== 200) {
      console.warn("⚠️ [validateLicenseFromServer] Server returned:", responseCode);
      return {
        valid: false,
        message: '❌ خطأ في خادم الترخيص (Code: ' + responseCode + '). يرجى المحاولة لاحقاً.',
        expiresAt: '',
        daysRemaining: 0,
        requiresActivation: false,
        checkedAt: new Date().toISOString(),
        source: 'server',
        error: 'HTTP ' + responseCode
      };
    }
    
    // ✅ تحليل نتيجة السيرفر
    var result = JSON.parse(response.getContentText());
    console.log("📊 [validateLicenseFromServer] Server response:", result);
    
    if (!result || typeof result.valid === 'undefined') {
      return {
        valid: false,
        message: '❌ استجابة غير صالحة من خادم الترخيص.',
        expiresAt: '',
        daysRemaining: 0,
        requiresActivation: false,
        checkedAt: new Date().toISOString(),
        source: 'server',
        error: 'Invalid response format'
      };
    }
    
    // ✅ حساب الأيام المتبقية
    var daysRemaining = 0;
    if (result.expiresAt) {
      var expiryDate = new Date(result.expiresAt);
      var now = new Date();
      daysRemaining = Math.floor((expiryDate - now) / (1000 * 60 * 60 * 24));
    }
    
    // ✅ تحديد رسالة الحالة
    var message = result.message;
    if (!message) {
      if (result.valid === true || result.valid === "true") {
        message = '✅ ترخيص ساري';
      } else {
        message = 'ترخيصك منتهي رجاء التجديد';
      }
    }
    
    // ✅ إرجاع النتيجة النهائية
    var licenseStatus = {
      valid: result.valid === true || result.valid === "true" || result.valid === 1 || result.valid === "1",
      message: message,
      expiresAt: result.expiresAt || '',
      daysRemaining: typeof result.daysRemaining === 'number' ? result.daysRemaining : daysRemaining,
      requiresActivation: result.requiresActivation || false,
      checkedAt: new Date().toISOString(),
      source: 'server'
    };
    
    console.log("✅ [validateLicenseFromServer] License status:", licenseStatus);
    return licenseStatus;
    
  } catch (e) {
    console.error("❌ [validateLicenseFromServer] Error:", e);
    return {
      valid: false,
      message: '❌ خطأ في التحقق من الترخيص: ' + e.toString(),
      expiresAt: '',
      daysRemaining: 0,
      requiresActivation: true,
      checkedAt: new Date().toISOString(),
      source: 'error',
      error: e.toString()
    };
  }
}
/**
 * ✅ دالة مساعدة لجلب العميل سكريت من ورقة "الترخيص" في الشيت
 * @returns {string} clientSecret أو null
 */
function s_getClientSecretFromSheet() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('License');
    
    if (!sheet) return null;
    
    var data = sheet.getDataRange().getValues();
    for (var i = 0; i < data.length; i++) {
      var key = String(data[i][0] || '').trim().toLowerCase();
      if (key === 'client_secret') {
        return String(data[i][1] || '').trim();
      }
    }
    return null;
  } catch (e) {
    console.error("❌ s_getClientSecretFromSheet error:", e);
    return null;
  }
}

/**
 * ✅ دالة مساعدة لجلب مفتاح الترخيص من ورقة "الترخيص" في الشيت
 * @returns {string} licenseKey أو null
 */
/**
 * ✅ دالة مساعدة لجلب مفتاح الترخيص من ورقة "الترخيص" في الشيت
 * ✅ تبحث عن: license_key, licensekey, license_id, مفتاح_الترخيص, معرف_الترخيص
 * @returns {string} licenseKey أو null
 */
function s_getLicenseKeyFromSheet() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('License');
    
    if (!sheet) return null;
    
    var data = sheet.getDataRange().getValues();
    for (var i = 0; i < data.length; i++) {
      var key = String(data[i][0] || '').trim().toLowerCase();
      
      // ✅ البحث عن جميع الأسماء المحتملة لمفتاح الترخيص
      if (key === 'license_key' || 
          key === 'licensekey' || 
          key === 'license_id' ||      // ✅ هذا هو الموجود في شيتك!
          key === 'licenseid' ||
          key === 'مفتاح_الترخيص' ||
          key === 'معرف_الترخيص') {
        return String(data[i][1] || '').trim();
      }
    }
    return null;
  } catch (e) {
    console.error("❌ s_getLicenseKeyFromSheet error:", e);
    return null;
  }
}



/**
 * client_core_client.gs – ZEIOS ERP CLIENT CORE (SHEET VERSION)
 * دوال بنفس أسماء المكتبة عشان الكود يشتغل من غير تعديل
 * 
 * ⚠️ قبل التشغيل: أضف المكتبة من Extensions → Libraries
 */

// ========== 🔗 ربط المكتبة ==========
var ZEIOS = ZEIOS; // غيّر للاسم اللي أنت سميته


// ========== 🔐 التحقق من الترخيص ==========
function validateLicense() { try { return ZEIOS.validateLicense(); } catch (e) { return {valid:false,message:'❌ '+e.toString(),requiresActivation:true}; } }
function getClientSecret() { try { return ZEIOS.getClientSecret(); } catch (e) { return null; } }
function validateWithServer(licenseKey, clientSecret) { try { return ZEIOS.validateWithServer(licenseKey, clientSecret); } catch (e) { return {valid:false,message:'❌ '+e.toString()}; } }
function getCachedLicense() { try { return ZEIOS.getCachedLicense(); } catch (e) { return null; } }
function saveLicenseCache(data) { try { return ZEIOS.saveLicenseCache(data); } catch (e) { return false; } }
function clearLicenseCache() { try { return ZEIOS.clearLicenseCache(); } catch (e) { return false; } }
function activateLicense(licenseKey) { try { return ZEIOS.activateLicense(licenseKey); } catch (e) { return {success:false,message:'❌ '+e.toString()}; } }
function callServerOperation(operationName, params) { try { return ZEIOS.callServerOperation(operationName, params); } catch (e) { return {success:false,message:'❌ '+e.toString()}; } }

// ========== 🔐 دوال مساعدة للترخيص ==========
function getLicenseStatus() { try { return ZEIOS.getLicenseStatus(); } catch (e) { return {valid:false,message:e.toString()}; } }
function isLicenseValid() { try { return ZEIOS.isLicenseValid(); } catch (e) { return false; } }
function getLicenseDaysRemaining() { try { return ZEIOS.getLicenseDaysRemaining(); } catch (e) { return 0; } }
function getServerUrl() { try { return ZEIOS.getServerUrl(); } catch (e) { return ZEIOS.DEFAULT_SERVER_URL || ''; } }
function setServerUrl(url) { try { return ZEIOS.setServerUrl(url); } catch (e) { return {success:false,message:'❌ '+e.toString()}; } }

// ========== 📋 التطوير ==========
function showStoredDataInLog() { try { return ZEIOS.showStoredDataInLog(); } catch (e) { return {success:false,error:e.toString()}; } }
function getLibraryVersion() { try { return ZEIOS.getLibraryVersion(); } catch (e) { return 'غير متصل'; } }
function testConnection() { try { return ZEIOS.testConnection(); } catch (e) { return {success:false,message:e.toString()}; } }

// ========== 🎨 دوال عرض الواجهات (تستخدم في الشيت فقط - مش في المكتبة) ==========

/**
 * فتح نافذة تفعيل الترخيص
 */
function showActivationDialog() {
  try {
    var html = HtmlService.createHtmlOutput(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 25px; background: #f8f9fa; direction: rtl; }
          .container { max-width: 450px; margin: 0 auto; background: #fff; padding: 30px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); text-align: center; }
          h3 { color: #1a73e8; margin: 0 0 15px; font-size: 20px; }
          p { color: #666; margin-bottom: 20px; font-size: 14px; }
          input[type="text"] { width: 100%; padding: 12px 15px; margin: 10px 0; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 14px; transition: border-color 0.2s; }
          input[type="text"]:focus { outline: none; border-color: #1a73e8; }
          button { padding: 12px 40px; background: #27ae60; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; transition: background 0.2s; margin-top: 10px; }
          button:hover { background: #219a52; }
          button:disabled { background: #ccc; cursor: not-allowed; }
          #result { margin-top: 15px; font-size: 14px; min-height: 20px; }
          .success { color: #27ae60; }
          .error { color: #e74c3c; }
          .loading { color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h3>🔐 تفعيل الترخيص</h3>
          <p>الرجاء إدخال مفتاح الترخيص الذي استلمته على بريدك الإلكتروني</p>
          <input type="text" id="licenseKey" placeholder="أدخل مفتاح الترخيص" autocomplete="off">
          <button id="activateBtn" onclick="doActivate()">تفعيل</button>
          <div id="result"></div>
        </div>
        <script>
          function doActivate() {
            var key = document.getElementById('licenseKey').value.trim();
            var btn = document.getElementById('activateBtn');
            var result = document.getElementById('result');
            
            if (!key) {
              result.innerHTML = '<span class="error">❌ الرجاء إدخال مفتاح الترخيص</span>';
              return;
            }
            
            btn.disabled = true;
            btn.textContent = 'جاري التفعيل...';
            result.innerHTML = '<span class="loading">جاري الاتصال بالسيرفر...</span>';
            
            google.script.run
              .withSuccessHandler(function(response) {
                if (response.success) {
                  result.innerHTML = '<span class="success">✅ ' + response.message + '</span>';
                  setTimeout(function() { google.script.host.close(); }, 2000);
                } else {
                  result.innerHTML = '<span class="error">❌ ' + response.message + '</span>';
                  btn.disabled = false;
                  btn.textContent = 'تفعيل';
                }
              })
              .withFailureHandler(function(error) {
                result.innerHTML = '<span class="error">❌ خطأ: ' + error.message + '</span>';
                btn.disabled = false;
                btn.textContent = 'تفعيل';
              })
              .activateLicense(key);
          }
          
          // تفعيل الزر عند الضغط على Enter
          document.getElementById('licenseKey').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') { doActivate(); }
          });
        </script>
      </body>
      </html>
    `).setWidth(450).setHeight(350);
    
    SpreadsheetApp.getUi().showModalDialog(html, '🔐 تفعيل الترخيص');
  } catch (e) {
    console.error('showActivationDialog error:', e.toString());
    SpreadsheetApp.getUi().alert('❌ خطأ في فتح نافذة التفعيل: ' + e.toString());
  }
}

/**
 * عرض حالة الترخيص
 */
function showLicenseStatusDialog() {
  try {
    var license = getLicenseStatus();
    var statusIcon = license.valid ? '✅' : '❌';
    var statusText = license.valid ? 'نشط' : 'غير نشط';
    var expiryText = license.expiresAt ? new Date(license.expiresAt).toLocaleDateString('ar-EG') : 'غير محدد';
    
    var html = HtmlService.createHtmlOutput(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 25px; background: #f8f9fa; direction: rtl; }
          .container { max-width: 400px; margin: 0 auto; background: #fff; padding: 30px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); text-align: center; }
          .status-icon { font-size: 48px; margin-bottom: 15px; }
          h3 { color: #333; margin: 0 0 20px; font-size: 20px; }
          .info-card { background: #f8f9fa; padding: 20px; border-radius: 12px; margin: 10px 0; text-align: right; }
          .info-row { margin: 8px 0; font-size: 14px; }
          .info-label { color: #666; }
          .info-value { font-weight: 600; color: #333; }
          .warning { color: #e74c3c; font-weight: 600; }
          .success { color: #27ae60; font-weight: 600; }
          button { padding: 10px 30px; background: #6c757d; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; margin-top: 20px; }
          button:hover { background: #5a6268; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="status-icon">${statusIcon}</div>
          <h3>حالة الترخيص</h3>
          <div class="info-card">
            <div class="info-row"><span class="info-label">الحالة:</span> <span class="info-value ${license.valid ? 'success' : 'warning'}">${statusText}</span></div>
            <div class="info-row"><span class="info-label">تاريخ الانتهاء:</span> <span class="info-value">${expiryText}</span></div>
            <div class="info-row"><span class="info-label">الأيام المتبقية:</span> <span class="info-value">${license.daysRemaining || 0} يوم</span></div>
            <div class="info-row"><span class="info-label">الرسالة:</span> <span class="info-value">${license.message}</span></div>
            ${license.requiresActivation ? '<div class="info-row"><span class="warning">⚠️ يتطلب التفعيل</span></div>' : ''}
          </div>
          <button onclick="google.script.host.close()">✕ إغلاق</button>
        </div>
      </body>
      </html>
    `).setWidth(420).setHeight(400);
    
    SpreadsheetApp.getUi().showModalDialog(html, '📋 حالة الترخيص');
  } catch (e) {
    console.error('showLicenseStatusDialog error:', e.toString());
    SpreadsheetApp.getUi().alert('❌ خطأ: ' + e.toString());
  }
}

/**
 * اختبار الاتصال بالسيرفر
 */
function testServerConnection() {
  try {
    var result = ZEIOS.testConnection ? ZEIOS.testConnection() : { success: false, message: 'الدالة غير متوفرة' };
    SpreadsheetApp.getUi().alert('نتيجة الاختبار:\n\n' + JSON.stringify(result, null, 2));
    return result;
  } catch (e) {
    SpreadsheetApp.getUi().alert('❌ خطأ في الاختبار: ' + e.toString());
    return { success: false, message: e.toString() };
  }
}

/**
 * إعادة تعيين إعدادات الترخيص
 */
function resetLicenseSettings() {
  try {
    var ui = SpreadsheetApp.getUi();
    var response = ui.alert(
      '⚠️ تأكيد الإعادة',
      'هل أنت متأكد من إعادة تعيين إعدادات الترخيص؟\n\nسيتم حذف مفتاح الترخيص والكاش المحلي.',
      ui.ButtonSet.YES_NO
    );
    
    if (response === ui.Button.YES) {
      PropertiesService.getUserProperties().deleteProperty('ZEIOS_LICENSE_KEY');
      clearLicenseCache();
      ui.alert('✅ تم إعادة تعيين إعدادات الترخيص بنجاح');
      return { success: true, message: 'تمت الإعادة بنجاح' };
    }
    return { success: false, message: 'تم إلغاء العملية' };
  } catch (e) {
    console.error('resetLicenseSettings error:', e.toString());
    return { success: false, message: e.toString() };
  }
}
/**
 * ✅ اختبار دالة التحقق من الترخيص من الشيت
 */
function testValidateLicenseFromSheet() {
  console.log('\n🔐 === اختبار التحقق من الترخيص من ورقة "الترخيص" ===\n');
  
  // 1. اختبار جلب البيانات من الشيت
  console.log('1️⃣ اختبار الدوال المساعدة:');
  var clientSecret = s_getClientSecretFromSheet();
  var licenseKey = s_getLicenseKeyFromSheet();
  console.log('   clientSecret:', clientSecret ? '✅ موجود (' + clientSecret.substring(0, 10) + '...)' : '❌ غير موجود');
  console.log('   licenseKey:', licenseKey ? '✅ موجود (' + licenseKey.substring(0, 10) + '...)' : '❌ غير موجود');
  
  // 2. اختبار التحقق من السيرفر
  console.log('\n2️⃣ اختبار validateLicenseFromServer:');
  var startTime = new Date();
  var result = validateLicenseFromServer();
  var endTime = new Date();
  
  console.log('   ⏱️ وقت الاستجابة:', (endTime - startTime), 'مللي ثانية');
  console.log('   valid:', result.valid);
  console.log('   message:', result.message);
  console.log('   expiresAt:', result.expiresAt);
  console.log('   daysRemaining:', result.daysRemaining);
  console.log('   source:', result.source);
  
  console.log('\n🎯 الحالة:', result.valid ? '✅ الترخيص ساري' : '❌ الترخيص غير ساري');
  console.log('\n=== انتهى الاختبار ===\n');
  
  return result;
}
/**
 * ✅ دالة واجهة لاستدعاء التحقق من الترخيص من السيرفر
 * ⚠️ يجب أن تكون في مشروع الجدول (ليس في المكتبة)
 * ⚠️ مطلوبة من الـ HTML عبر google.script.run
 */
/**
 * ✅ دالة واجهة لاستدعاء التحقق من الترخيص من السيرفر
 * ⚠️ يجب أن تكون في مشروع الجدول (ليس في المكتبة)
 * ⚠️ مطلوبة من الـ HTML عبر google.script.run
 */
function validateLicenseFromServer() {
  try {
    // ✅ استدعاء الدالة من المكتبة إذا كانت متاحة
    if (typeof ZEIOS !== 'undefined' && typeof ZEIOS.validateLicenseFromServer === 'function') {
      return ZEIOS.validateLicenseFromServer();
    }
    
    // ❌ تم إزالة الـ Fallback الذي يستدعي الدالة نفسها (يسبب تكرار لا نهائي)
    
    // ✅ إرجاع خطأ واضح إذا لم تكن الدالة متاحة
    return { 
      valid: false, 
      message: 'دالة التحقق من الترخيص غير متاحة. تأكد من ربط المكتبة.',
      expiresAt: '',
      daysRemaining: 0,
      requiresActivation: true,
      checkedAt: new Date().toISOString(),
      source: 'client'
    };
    
  } catch (e) {
    console.error('❌ validateLicenseFromServer (client) error:', e);
    return {
      valid: false,
      message: 'خطأ: ' + e.toString(),
      expiresAt: '',
      daysRemaining: 0,
      requiresActivation: true,
      checkedAt: new Date().toISOString(),
      source: 'client',
      error: e.toString()
    };
  }
}
/**
 * ✅ دالة واجهة لجلب العميل سكريت من ورقة "الترخيص" في الشيت
 * ⚠️ في مشروع الجدول (ليس في المكتبة)
 * ⚠️ تستدعي الدالة الداخلية من المكتبة
 * @returns {string} clientSecret أو null
 */
function s_getClientSecretFromSheet() {
  try {
    // ✅ استدعاء الدالة من المكتبة إذا كانت متاحة
    if (typeof ZEIOS !== 'undefined' && typeof ZEIOS.s_getClientSecretFromSheet === 'function') {
      return ZEIOS.s_getClientSecretFromSheet();
    }
    
    // ✅ Fallback محلي: قراءة مباشرة من الشيت (نفس منطق المكتبة)
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName('الترخيص');
      if (!sheet) return null;
      var data = sheet.getDataRange().getValues();
      for (var i = 0; i < data.length; i++) {
        var key = String(data[i][0] || '').trim().toLowerCase();
        if (key === 'client_secret') {
          return String(data[i][1] || '').trim();
        }
      }
      return null;
    } catch (localErr) {
      console.warn("⚠️ Local getClientSecretFromSheet error:", localErr);
      return null;
    }
    
  } catch (e) {
    console.error('❌ getClientSecretFromSheet (client) error:', e);
    return null;
  }
}

/**
 * ✅ دالة واجهة لجلب مفتاح الترخيص من ورقة "الترخيص" في الشيت
 * ⚠️ في مشروع الجدول (ليس في المكتبة)
 * ⚠️ تستدعي الدالة الداخلية من المكتبة
 * @returns {string} licenseKey أو null
 */
function s_getLicenseKeyFromSheet() {
  try {
    // ✅ استدعاء الدالة من المكتبة إذا كانت متاحة
    if (typeof ZEIOS !== 'undefined' && typeof ZEIOS.s_getLicenseKeyFromSheet === 'function') {
      return ZEIOS.s_getLicenseKeyFromSheet();
    }
    
    // ✅ Fallback محلي: قراءة مباشرة من الشيت (نفس منطق المكتبة)
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName('الترخيص');
      if (!sheet) return null;
      var data = sheet.getDataRange().getValues();
      for (var i = 0; i < data.length; i++) {
        var key = String(data[i][0] || '').trim().toLowerCase();
        if (key === 'license_key' || key === 'licensekey' || key === 'مفتاح_الترخيص') {
          return String(data[i][1] || '').trim();
        }
      }
      return null;
    } catch (localErr) {
      console.warn("⚠️ Local getLicenseKeyFromSheet error:", localErr);
      return null;
    }
    
  } catch (e) {
    console.error('❌ getLicenseKeyFromSheet (client) error:', e);
    return null;
  }
}

