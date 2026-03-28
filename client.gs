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


