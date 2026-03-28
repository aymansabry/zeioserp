/**
 * Auth_Library.gs – ZEIOS ERP Authentication (LIBRARY VERSION)
 * الإصدار: 3.3.0
 * ⚠️ دوال المصادقة والصلاحيات الديناميكية - حساسة فقط
 * ⚠️ جميع الدوال عامة (بدون _) لتعمل مع نظام المكتبات
 * 📞 الدعم: zeioszeios0@gmail.com | WhatsApp: 00201205951462
 */

// ========== 🔐 ثوابت النظام ==========
var AUTH_LIBRARY_VERSION = '3.3.0';
var MIN_PASSWORD_LENGTH = 4;

// ========== 📋 قائمة الصفحات المتاحة للنظام (قابلة للتوسيع) ==========
var AVAILABLE_PAGES = [
  { id: 'dashboard', name: 'لوحة التحكم', icon: '📊', category: 'main' },
  { id: 'stats', name: 'الإحصائيات', icon: '📈', category: 'reports' },
  { id: 'pos', name: 'نقطة البيع', icon: '🛒', category: 'sales' },
  { id: 'items', name: 'الأصناف', icon: '📦', category: 'database' },
  { id: 'categories', name: 'التصنيفات', icon: '🏷️', category: 'database' },
  { id: 'warehouses', name: 'المستودعات', icon: '🏢', category: 'database' },
  { id: 'accounts', name: 'شجرة الحسابات', icon: '📊', category: 'database' },
  { id: 'colors', name: 'الألوان', icon: '🎨', category: 'database' },
  { id: 'purchases', name: 'المشتريات', icon: '🛒', category: 'transactions' },
  { id: 'purchases_return', name: 'مرتجع المشتريات', icon: '↩️', category: 'transactions' },
  { id: 'sales', name: 'المبيعات', icon: '💰', category: 'transactions' },
  { id: 'sales_return', name: 'مرتجع المبيعات', icon: '↩️', category: 'transactions' },
  { id: 'customer_orders', name: 'طلبات العملاء', icon: '📋', category: 'transactions' },
  { id: 'payments', name: 'المدفوعات', icon: '💳', category: 'finance' },
  { id: 'receipts', name: 'المقبوضات', icon: '📥', category: 'finance' },
  { id: 'checks', name: 'الشيكات', icon: '💳', category: 'finance' },
  { id: 'stock_movements', name: 'حركة المخزون', icon: '📦', category: 'reports' },
  { id: 'account_statement', name: 'كشف حساب', icon: '📄', category: 'reports' },
  { id: 'trial_balance', name: 'ميزان المراجعة', icon: '⚖️', category: 'reports' },
  { id: 'profit_loss', name: 'قائمة الدخل', icon: '📊', category: 'reports' },
  { id: 'balance_sheet', name: 'الميزانية', icon: '🏦', category: 'reports' },
  { id: 'setting', name: 'إعدادات النظام', icon: '⚙️', category: 'admin' },
  { id: 'backup', name: 'النسخ الاحتياطي', icon: '💾', category: 'admin' },
  { id: 'users', name: 'إدارة المستخدمين', icon: '👥', category: 'admin' }
];

// ========== 🔐 أدوات كلمات المرور ==========
function generateSaltForAuth() {
  return Utilities.base64EncodeWebSafe(
    Utilities.newBlob(Utilities.getUuid()).getBytes()
  ).substring(0, 16);
}

function hashPasswordForAuth(password, salt) {
  if (!salt) salt = generateSaltForAuth();
  var digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm['SHA_256'],
    salt + password,
    Utilities.Charset.UTF_8
  );
  return {
    hash: Utilities.base64EncodeWebSafe(digest),
    salt: salt,
    algorithm: 'SHA_256'
  };
}

function verifyPasswordForAuth(password, storedHash, storedSalt) {
  return password && storedHash && storedSalt &&
         hashPasswordForAuth(password, storedSalt).hash === storedHash;
}

// ========== 🔒 التحقق من قوة كلمة المرور ==========
function validatePasswordStrength(password) {
  try {
    if (!password) return { valid: false, score: 0, message: '❌ كلمة المرور مطلوبة' };
    if (password.length < MIN_PASSWORD_LENGTH) {
      return { valid: false, score: 1, message: '❌ كلمة المرور قصيرة جداً (4 أحرف على الأقل)' };
    }
    var score = 0;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    if (score <= 2) return { valid: false, score: score, message: '⚠️ كلمة المرور ضعيفة' };
    else if (score <= 4) return { valid: true, score: score, message: '✅ كلمة المرور مقبولة' };
    else return { valid: true, score: score, message: '✅✅ كلمة المرور قوية' };
  } catch (e) {
    return { valid: false, score: 0, message: 'خطأ: ' + e.toString() };
  }
}

// ========== 📋 دوال الصفحات المتاحة (لإدارة الصلاحيات الديناميكية) ==========
function getAvailablePages() {
  try {
    return { success: true, pages: AVAILABLE_PAGES, count: AVAILABLE_PAGES.length };
  } catch (e) {
    return { success: false, message: e.toString(), pages: [] };
  }
}

function addNewPageToSystem(pageData) {
  try {
    if (!pageData.id || !pageData.name) {
      return { success: false, message: 'معرف الصفحة واسمها مطلوبان' };
    }
    // التحقق من عدم التكرار
    for (var i = 0; i < AVAILABLE_PAGES.length; i++) {
      if (AVAILABLE_PAGES[i].id === pageData.id) {
        return { success: false, message: 'هذه الصفحة موجودة بالفعل في النظام' };
      }
    }
    // إضافة الصفحة الجديدة
    var newPage = {
      id: pageData.id,
      name: pageData.name,
      icon: pageData.icon || '📄',
      category: pageData.category || 'custom'
    };
    AVAILABLE_PAGES.push(newPage);
    return { success: true, message: '✅ تمت إضافة الصفحة الجديدة: ' + pageData.name, page: newPage };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

// ========== 👥 دوال المستخدمين (حساسة) ==========
function createUser(userData) {
  try {
    if (!userData.username || !userData.password) {
      return { success: false, message: 'اسم المستخدم وكلمة المرور مطلوبان' };
    }
    var strength = validatePasswordStrength(userData.password);
    if (!strength.valid) return { success: false, message: strength.message };
    var hashed = hashPasswordForAuth(userData.password);
    var usersId = typeof getMasterTableId === 'function' ? getMasterTableId("Users") : null;
    if (!usersId) return { success: false, message: 'جدول المستخدمين غير موجود' };
    var sheet = SpreadsheetApp.openById(usersId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][1]) === String(userData.username)) {
        return { success: false, message: 'اسم المستخدم موجود بالفعل' };
      }
    }
    var userId = typeof generateID === 'function' ? generateID() : Utilities.getUuid().replace(/-/g, '');
    var now = typeof getNowTimestamp === 'function' ? getNowTimestamp() : Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
    // صلاحيات ديناميكية: مصفوفة من معرفات الصفحات المسموحة
    var permissions = userData.permissions || { allowed_pages: [], role: userData.role || 'user', read_only: false };
    sheet.appendRow([
      userId, userData.username, hashed.hash, hashed.salt,
      userData.role || 'user',
      JSON.stringify(permissions),
      userData.active !== false ? 'TRUE' : 'FALSE', now, ''
    ]);
    return { success: true, user_id: userId, message: '✅ تم إضافة المستخدم بنجاح', username: userData.username };
  } catch (e) {
    console.error("❌ createUser error:", e);
    return { success: false, message: e.toString() };
  }
}

function loginUser(username, password) {
  try {
    if (!username || !password) return { success: false, message: 'اسم المستخدم وكلمة المرور مطلوبان' };
    var usersId = typeof getMasterTableId === 'function' ? getMasterTableId("Users") : null;
    if (!usersId) return { success: false, message: 'جدول المستخدمين غير موجود' };
    var sheet = SpreadsheetApp.openById(usersId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][1]) === String(username)) {
        if (data[i][6] !== 'TRUE') return { success: false, message: 'الحساب غير مفعل' };
        var storedHash = data[i][2];
        var storedSalt = data[i][3];
        if ((!storedHash || !storedSalt) && username === 'admin') {
          if (typeof loadJSON === 'function') {
            var propsPassword = loadJSON('ADMIN_PASSWORD', null);
            if (propsPassword && propsPassword.hash && propsPassword.salt) {
              storedHash = propsPassword.hash;
              storedSalt = propsPassword.salt;
            }
          }
        }
        if (!verifyPasswordForAuth(password, storedHash, storedSalt)) {
          return { success: false, message: 'كلمة المرور غير صحيحة' };
        }
        var now = typeof getNowTimestamp === 'function' ? getNowTimestamp() : Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
        sheet.getRange(i + 1, 9).setValue(now);
        var permissions = {};
        try { permissions = JSON.parse(data[i][5] || '{}'); } catch (ex) { permissions = { allowed_pages: [], role: data[i][4] }; }
        return {
          success: true, message: '✅ تم تسجيل الدخول بنجاح',
          user: {
            id: data[i][0], username: data[i][1], role: data[i][4],
            permissions: permissions, last_login: now
          }
        };
      }
    }
    return { success: false, message: 'اسم المستخدم غير موجود' };
  } catch (e) {
    console.error("❌ loginUser error:", e);
    return { success: false, message: e.toString() };
  }
}

function updateUser(userData) {
  try {
    if (!userData || !userData.id) return { success: false, message: 'معرف المستخدم مطلوب' };
    var usersId = typeof getMasterTableId === 'function' ? getMasterTableId("Users") : null;
    if (!usersId) return { success: false, message: 'جدول المستخدمين غير موجود' };
    var sheet = SpreadsheetApp.openById(usersId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(userData.id)) {
        var row = i + 1;
        if (userData.username) sheet.getRange(row, 2).setValue(userData.username);
        if (userData.role) sheet.getRange(row, 5).setValue(userData.role);
        // تحديث الصلاحيات الديناميكية
        if (userData.permissions) {
          sheet.getRange(row, 6).setValue(JSON.stringify(userData.permissions));
        }
        if (userData.active !== undefined) sheet.getRange(row, 7).setValue(userData.active ? 'TRUE' : 'FALSE');
        if (userData.password && userData.password.length > 0) {
          var hashed = hashPasswordForAuth(userData.password);
          sheet.getRange(row, 3).setValue(hashed.hash);
          sheet.getRange(row, 4).setValue(hashed.salt);
        }
        return { success: true, message: '✅ تم تحديث المستخدم بنجاح' };
      }
    }
    return { success: false, message: 'المستخدم غير موجود' };
  } catch (e) {
    console.error('❌ updateUser error:', e);
    return { success: false, message: e.toString() };
  }
}

function deleteUser(userId) {
  try {
    if (!userId) return { success: false, message: 'معرف المستخدم مطلوب' };
    var user = getUserById(userId);
    if (user.success && user.user && user.user.username === 'admin') {
      return { success: false, message: '❌ لا يمكن حذف حساب المدير' };
    }
    var usersId = typeof getMasterTableId === 'function' ? getMasterTableId("Users") : null;
    if (!usersId) return { success: false, message: 'جدول المستخدمين غير موجود' };
    var sheet = SpreadsheetApp.openById(usersId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    for (var i = data.length - 1; i >= 1; i--) {
      if (String(data[i][0]) === String(userId)) {
        sheet.deleteRow(i + 1);
        return { success: true, message: '✅ تم حذف المستخدم بنجاح' };
      }
    }
    return { success: false, message: 'المستخدم غير موجود' };
  } catch (e) {
    console.error('❌ deleteUser error:', e);
    return { success: false, message: e.toString() };
  }
}

function resetUserPassword(userId) {
  try {
    if (!userId) return { success: false, message: 'معرف المستخدم مطلوب' };
    var tempPassword = Utilities.getUuid().substring(0, 8).toUpperCase();
    var hashed = hashPasswordForAuth(tempPassword);
    var usersId = typeof getMasterTableId === 'function' ? getMasterTableId("Users") : null;
    if (!usersId) return { success: false, message: 'جدول المستخدمين غير موجود' };
    var sheet = SpreadsheetApp.openById(usersId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(userId)) {
        sheet.getRange(i + 1, 3).setValue(hashed.hash);
        sheet.getRange(i + 1, 4).setValue(hashed.salt);
        return { success: true, message: '✅ تم إعادة تعيين كلمة المرور', tempPassword: tempPassword };
      }
    }
    return { success: false, message: 'المستخدم غير موجود' };
  } catch (e) {
    console.error('❌ resetUserPassword error:', e);
    return { success: false, message: e.toString() };
  }
}

function changeUserPassword(userId, currentPassword, newPassword) {
  try {
    if (!userId || !currentPassword || !newPassword) return { success: false, message: 'جميع الحقول مطلوبة' };
    var strength = validatePasswordStrength(newPassword);
    if (!strength.valid) return { success: false, message: strength.message };
    var usersId = typeof getMasterTableId === 'function' ? getMasterTableId("Users") : null;
    if (!usersId) return { success: false, message: 'جدول المستخدمين غير موجود' };
    var sheet = SpreadsheetApp.openById(usersId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(userId)) {
        var storedHash = data[i][2];
        var storedSalt = data[i][3];
        if ((!storedHash || !storedSalt) && data[i][1] === 'admin') {
          var propsPassword = typeof loadJSON === 'function' ? loadJSON('ADMIN_PASSWORD', null) : null;
          if (propsPassword && propsPassword.hash && propsPassword.salt) {
            storedHash = propsPassword.hash;
            storedSalt = propsPassword.salt;
          }
        }
        if (storedHash && storedSalt && !verifyPasswordForAuth(currentPassword, storedHash, storedSalt)) {
          return { success: false, message: 'كلمة المرور الحالية غير صحيحة' };
        }
        var hashed = hashPasswordForAuth(newPassword);
        sheet.getRange(i + 1, 3).setValue(hashed.hash);
        sheet.getRange(i + 1, 4).setValue(hashed.salt);
        if (data[i][1] === 'admin') {
          if (typeof saveJSON === 'function') saveJSON('ADMIN_PASSWORD', hashed);
        }
        return { success: true, message: '✅ تم تغيير كلمة المرور بنجاح' };
      }
    }
    return { success: false, message: 'المستخدم غير موجود' };
  } catch (e) {
    console.error('❌ changeUserPassword error:', e);
    return { success: false, message: e.toString() };
  }
}

// ========== 🛒 دوال الكاشير (حساسة) - مع إنشاء مستخدم تلقائي ==========
function createCashier(cashierData) {
  try {
    if (!cashierData.cashier_name || !cashierData.cashier_code) {
      return { success: false, message: 'اسم الكاشير والكود مطلوبان' };
    }
    // 1️⃣ إنشاء الكاشير
    var cashiersId = typeof getMasterTableId === 'function' ? getMasterTableId("POS_Cashiers") : null;
    if (!cashiersId) return { success: false, message: 'جدول الكاشير غير موجود' };
    var cashiersSheet = SpreadsheetApp.openById(cashiersId).getSheets()[0];
    var cashiersData = cashiersSheet.getDataRange().getDisplayValues();
    for (var i = 1; i < cashiersData.length; i++) {
      if (String(cashiersData[i][2]) === String(cashierData.cashier_code)) {
        return { success: false, message: 'كود الكاشير موجود بالفعل' };
      }
    }
    var hashed = { hash: '', salt: '' };
    if (cashierData.password && cashierData.password.length > 0) {
      hashed = hashPasswordForAuth(cashierData.password);
    }
    var cashierId = typeof generateID === 'function' ? generateID() : Utilities.getUuid().replace(/-/g, '');
    var now = typeof getNowTimestamp === 'function' ? getNowTimestamp() : Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
    cashiersSheet.appendRow([
      cashierId, cashierData.cashier_name, cashierData.cashier_code,
      cashierData.account_id || '', cashierData.default_safe_id || '',
      hashed.hash, hashed.salt,
      cashierData.is_active !== false ? 'TRUE' : 'FALSE', now, ''
    ]);
    // 2️⃣ إنشاء حساب مستخدم تلقائي للكاشير
    var usersId = typeof getMasterTableId === 'function' ? getMasterTableId("Users") : null;
    if (usersId) {
      var usersSheet = SpreadsheetApp.openById(usersId).getSheets()[0];
      var usersData = usersSheet.getDataRange().getDisplayValues();
      var username = 'cashier_' + cashierData.cashier_code;
      var usernameExists = false;
      for (var j = 1; j < usersData.length; j++) {
        if (String(usersData[j][1]) === String(username)) { usernameExists = true; break; }
      }
      if (!usernameExists) {
        var cashierPermissions = {
          allowed_pages: ['pos', 'dashboard'],
          role: 'cashier',
          read_only: false,
          pos_only: true
        };
        var userId = typeof generateID === 'function' ? generateID() : Utilities.getUuid().replace(/-/g, '');
        usersSheet.appendRow([
          userId, username, hashed.hash, hashed.salt,
          'cashier', JSON.stringify(cashierPermissions),
          cashierData.is_active !== false ? 'TRUE' : 'FALSE', now, ''
        ]);
      }
    }
    return {
      success: true, cashier_id: cashierId,
      message: '✅ تم إضافة الكاشير وحساب المستخدم بنجاح',
      cashier_code: cashierData.cashier_code,
      login_username: 'cashier_' + cashierData.cashier_code
    };
  } catch (e) {
    console.error("❌ createCashier error:", e);
    return { success: false, message: e.toString() };
  }
}

function loginCashier(cashierCode, password) {
  try {
    if (!cashierCode || !password) return { success: false, message: 'كود الكاشير وكلمة المرور مطلوبان' };
    var cashiersId = typeof getMasterTableId === 'function' ? getMasterTableId("POS_Cashiers") : null;
    if (!cashiersId) return { success: false, message: 'جدول الكاشير غير موجود' };
    var sheet = SpreadsheetApp.openById(cashiersId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][2]) === String(cashierCode)) {
        if (data[i][7] !== 'TRUE') return { success: false, message: 'حساب الكاشير غير مفعل' };
        var storedHash = data[i][5];
        var storedSalt = data[i][6];
        if (!storedHash || !storedSalt || !verifyPasswordForAuth(password, storedHash, storedSalt)) {
          return { success: false, message: 'كلمة المرور غير صحيحة' };
        }
        var now = typeof getNowTimestamp === 'function' ? getNowTimestamp() : Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
        sheet.getRange(i + 1, 10).setValue(now);
        return {
          success: true, message: '✅ تم تسجيل دخول الكاشير بنجاح',
          cashier: {
            id: data[i][0], name: data[i][1], code: data[i][2],
            account_id: data[i][3], default_safe_id: data[i][4], last_login: now
          }
        };
      }
    }
    return { success: false, message: 'كود الكاشير غير موجود' };
  } catch (e) {
    console.error("❌ loginCashier error:", e);
    return { success: false, message: e.toString() };
  }
}

function updateCashier(cashierData) {
  try {
    if (!cashierData || !cashierData.id) return { success: false, message: 'معرف الكاشير مطلوب' };
    var cashiersId = typeof getMasterTableId === 'function' ? getMasterTableId("POS_Cashiers") : null;
    if (!cashiersId) return { success: false, message: 'جدول الكاشير غير موجود' };
    var sheet = SpreadsheetApp.openById(cashiersId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(cashierData.id)) {
        var row = i + 1;
        if (cashierData.cashier_name) sheet.getRange(row, 2).setValue(cashierData.cashier_name);
        if (cashierData.cashier_code) sheet.getRange(row, 3).setValue(cashierData.cashier_code);
        if (cashierData.account_id !== undefined) sheet.getRange(row, 4).setValue(cashierData.account_id);
        if (cashierData.default_safe_id !== undefined) sheet.getRange(row, 5).setValue(cashierData.default_safe_id);
        if (cashierData.is_active !== undefined) sheet.getRange(row, 8).setValue(cashierData.is_active ? 'TRUE' : 'FALSE');
        if (cashierData.password && cashierData.password.length > 0) {
          var hashed = hashPasswordForAuth(cashierData.password);
          sheet.getRange(row, 6).setValue(hashed.hash);
          sheet.getRange(row, 7).setValue(hashed.salt);
          // تحديث كلمة مرور المستخدم المرتبط
          var username = 'cashier_' + cashierData.cashier_code;
          _updateUserPasswordByUsername(username, hashed.hash, hashed.salt);
        }
        return { success: true, message: '✅ تم تحديث الكاشير بنجاح' };
      }
    }
    return { success: false, message: 'الكاشير غير موجود' };
  } catch (e) {
    console.error('❌ updateCashier error:', e);
    return { success: false, message: e.toString() };
  }
}

function resetCashierPassword(cashierId) {
  try {
    if (!cashierId) return { success: false, message: 'معرف الكاشير مطلوب' };
    var temp = Utilities.getUuid().substring(0, 8).toUpperCase();
    var hashed = hashPasswordForAuth(temp);
    var cashiersId = typeof getMasterTableId === 'function' ? getMasterTableId("POS_Cashiers") : null;
    if (!cashiersId) return { success: false, message: 'جدول الكاشير غير موجود' };
    var sheet = SpreadsheetApp.openById(cashiersId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(cashierId)) {
        sheet.getRange(i + 1, 6).setValue(hashed.hash);
        sheet.getRange(i + 1, 7).setValue(hashed.salt);
        // تحديث المستخدم المرتبط
        var username = 'cashier_' + data[i][2];
        _updateUserPasswordByUsername(username, hashed.hash, hashed.salt);
        return { success: true, tempPassword: temp, message: '✅ تم إعادة تعيين كلمة المرور', login_username: username };
      }
    }
    return { success: false, message: 'الكاشير غير موجود' };
  } catch (e) {
    console.error('❌ resetCashierPassword error:', e);
    return { success: false, message: e.toString() };
  }
}

function deleteCashier(cashierId) {
  try {
    if (!cashierId) return { success: false, message: 'معرف الكاشير مطلوب' };
    var cashier = getCashierById(cashierId);
    if (!cashier.success || !cashier.cashier) return { success: false, message: 'الكاشير غير موجود' };
    // حذف المستخدم المرتبط أولاً
    var username = 'cashier_' + cashier.cashier.cashier_code;
    _deleteUserByUsername(username);
    // حذف الكاشير
    var cashiersId = typeof getMasterTableId === 'function' ? getMasterTableId("POS_Cashiers") : null;
    if (!cashiersId) return { success: false, message: 'جدول الكاشير غير موجود' };
    var sheet = SpreadsheetApp.openById(cashiersId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    for (var i = data.length - 1; i >= 1; i--) {
      if (String(data[i][0]) === String(cashierId)) {
        sheet.deleteRow(i + 1);
        return { success: true, message: '✅ تم حذف الكاشير وحساب المستخدم بنجاح' };
      }
    }
    return { success: false, message: 'فشل حذف الكاشير' };
  } catch (e) {
    console.error('❌ deleteCashier error:', e);
    return { success: false, message: e.toString() };
  }
}

// ========== 💰 دوال مساعدة للقوائم ==========
function getCashAccountsForDropdown() {
  try {
    var coaId = typeof getMasterTableId === 'function' ? getMasterTableId("Chart_Of_Accounts") : null;
    if (!coaId) return { success: false, message: 'شجرة الحسابات غير موجودة', accounts: [] };
    var sheet = SpreadsheetApp.openById(coaId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    var accounts = [];
    for (var i = 1; i < data.length; i++) {
      var id = (data[i][0] || '').toString().trim();
      var accountNo = (data[i][1] || '').toString().trim();
      var accountName = (data[i][2] || '').toString().trim();
      var bsGroup = (data[i][4] || '').toString().trim();
      if (id && accountNo && bsGroup === 'BS-A' && accountNo.startsWith('11')) {
        accounts.push({ id: id, account_no: accountNo, account_name: accountName, display_text: accountNo + ' - ' + accountName });
      }
    }
    return { success: true, accounts: accounts, count: accounts.length };
  } catch (e) {
    console.error('❌ getCashAccountsForDropdown error:', e);
    return { success: false, message: e.toString(), accounts: [] };
  }
}

// ========== 🛠 دوال مساعدة خاصة ==========
function updateUserPasswordByUsername(username, newHash, newSalt) {
  try {
    var usersId = typeof getMasterTableId === 'function' ? getMasterTableId("Users") : null;
    if (!usersId) return false;
    var sheet = SpreadsheetApp.openById(usersId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][1]) === String(username)) {
        sheet.getRange(i + 1, 3).setValue(newHash);
        sheet.getRange(i + 1, 4).setValue(newSalt);
        return true;
      }
    }
    return false;
  } catch (e) { return false; }
}

function deleteUserByUsername(username) {
  try {
    var usersId = typeof getMasterTableId === 'function' ? getMasterTableId("Users") : null;
    if (!usersId) return false;
    var sheet = SpreadsheetApp.openById(usersId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    for (var i = data.length - 1; i >= 1; i--) {
      if (String(data[i][1]) === String(username)) {
        sheet.deleteRow(i + 1);
        return true;
      }
    }
    return false;
  } catch (e) { return false; }
}

function getAuthLibraryVersion() { return AUTH_LIBRARY_VERSION; }


/**
 * Dashboard_Client.gs – ZEIOS ERP (SHEET VERSION)
 * ⚠️ أغلفة لاستدعاء دوال المكتبة + دوال الواجهة فقط
 * ⚠️ لا توجد دوال حساسة هنا - كلها في المكتبة
 */

// ========== 🔗 ربط المكتبة ==========
var ZEIOS = ZEIOS;  // ⚠️ غيّر للاسم الظاهر عند إضافة المكتبة

// ========== 🔐 غلاف التحقق من الترخيص ==========
function validateLicenseForDashboardLibrary() {
  try {
    if (typeof ZEIOS !== 'undefined' && typeof ZEIOS.validateLicenseForDashboardLibrary === 'function') {
      return ZEIOS.validateLicenseForDashboardLibrary();
    }
    return { valid: true, message: '✅ ترخيص ساري', expiresAt: '', daysRemaining: 90 };
  } catch (e) { return { valid: false, message: e.toString() }; }
}

// ========== 👥 أغلفة دوال المستخدمين ==========
function createUser(userData) {
  try {
    if (typeof ZEIOS !== 'undefined' && typeof ZEIOS.createUser === 'function') {
      return ZEIOS.createUser(userData);
    }
    return { success: false, message: 'الدالة غير متاحة' };
  } catch (e) { return { success: false, message: e.toString() }; }
}

function loginUser(username, password) {
  try {
    if (typeof ZEIOS !== 'undefined' && typeof ZEIOS.loginUser === 'function') {
      return ZEIOS.loginUser(username, password);
    }
    return { success: false, message: 'الدالة غير متاحة' };
  } catch (e) { return { success: false, message: e.toString() }; }
}

function updateUser(userData) {
  try {
    if (typeof ZEIOS !== 'undefined' && typeof ZEIOS.updateUser === 'function') {
      return ZEIOS.updateUser(userData);
    }
    return { success: false, message: 'الدالة غير متاحة' };
  } catch (e) { return { success: false, message: e.toString() }; }
}

function deleteUser(userId) {
  try {
    if (typeof ZEIOS !== 'undefined' && typeof ZEIOS.deleteUser === 'function') {
      return ZEIOS.deleteUser(userId);
    }
    return { success: false, message: 'الدالة غير متاحة' };
  } catch (e) { return { success: false, message: e.toString() }; }
}

function resetUserPassword(userId) {
  try {
    if (typeof ZEIOS !== 'undefined' && typeof ZEIOS.resetUserPassword === 'function') {
      return ZEIOS.resetUserPassword(userId);
    }
    return { success: false, message: 'الدالة غير متاحة' };
  } catch (e) { return { success: false, message: e.toString() }; }
}

function changeUserPassword(userId, currentPassword, newPassword) {
  try {
    if (typeof ZEIOS !== 'undefined' && typeof ZEIOS.changeUserPassword === 'function') {
      return ZEIOS.changeUserPassword(userId, currentPassword, newPassword);
    }
    return { success: false, message: 'الدالة غير متاحة' };
  } catch (e) { return { success: false, message: e.toString() }; }
}

// ========== 📋 دوال قراءة المستخدمين (واجهة - في الشيت) ==========
function getUsersList() {
  try {
    var usersId = typeof getMasterTableId === 'function' ? getMasterTableId("Users") : null;
    if (!usersId) return { success: false, message: 'جدول المستخدمين غير موجود', users: [] };
    var sheet = SpreadsheetApp.openById(usersId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    var users = [];
    for (var i = 1; i < data.length; i++) {
      var perms = {};
      try { perms = JSON.parse(data[i][5] || '{}'); } catch (ex) { perms = { allowed_pages: [] }; }
      users.push({
        id: data[i][0] || '', username: data[i][1] || '', role: data[i][4] || 'user',
        permissions: perms, active: data[i][6] || 'TRUE',
        created_at: data[i][7] || '', last_login: data[i][8] || ''
      });
    }
    return { success: true, users: users, count: users.length };
  } catch (e) {
    console.error('❌ getUsersList error:', e);
    return { success: false, message: e.toString(), users: [] };
  }
}

function getUserById(userId) {
  try {
    if (!userId) return { success: false, message: 'معرف المستخدم مطلوب', user: null };
    var usersId = typeof getMasterTableId === 'function' ? getMasterTableId("Users") : null;
    if (!usersId) return { success: false, message: 'جدول المستخدمين غير موجود', user: null };
    var sheet = SpreadsheetApp.openById(usersId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(userId)) {
        var perms = {};
        try { perms = JSON.parse(data[i][5] || '{}'); } catch (ex) { perms = { allowed_pages: [] }; }
        return { success: true, user: {
          id: data[i][0], username: data[i][1], role: data[i][4],
          permissions: perms, active: data[i][6],
          created_at: data[i][7], last_login: data[i][8]
        }};
      }
    }
    return { success: false, message: 'المستخدم غير موجود', user: null };
  } catch (e) {
    return { success: false, message: e.toString(), user: null };
  }
}

// ========== 🛒 أغلفة دوال الكاشير ==========
function createCashier(cashierData) {
  try {
    if (typeof ZEIOS !== 'undefined' && typeof ZEIOS.createCashier === 'function') {
      return ZEIOS.createCashier(cashierData);
    }
    return { success: false, message: 'الدالة غير متاحة' };
  } catch (e) { return { success: false, message: e.toString() }; }
}

function loginCashier(cashierCode, password) {
  try {
    if (typeof ZEIOS !== 'undefined' && typeof ZEIOS.loginCashier === 'function') {
      return ZEIOS.loginCashier(cashierCode, password);
    }
    return { success: false, message: 'الدالة غير متاحة' };
  } catch (e) { return { success: false, message: e.toString() }; }
}

function updateCashier(cashierData) {
  try {
    if (typeof ZEIOS !== 'undefined' && typeof ZEIOS.updateCashier === 'function') {
      return ZEIOS.updateCashier(cashierData);
    }
    return { success: false, message: 'الدالة غير متاحة' };
  } catch (e) { return { success: false, message: e.toString() }; }
}

function resetCashierPassword(cashierId) {
  try {
    if (typeof ZEIOS !== 'undefined' && typeof ZEIOS.resetCashierPassword === 'function') {
      return ZEIOS.resetCashierPassword(cashierId);
    }
    return { success: false, message: 'الدالة غير متاحة' };
  } catch (e) { return { success: false, message: e.toString() }; }
}

function deleteCashier(cashierId) {
  try {
    if (typeof ZEIOS !== 'undefined' && typeof ZEIOS.deleteCashier === 'function') {
      return ZEIOS.deleteCashier(cashierId);
    }
    return { success: false, message: 'الدالة غير متاحة' };
  } catch (e) { return { success: false, message: e.toString() }; }
}

// ========== 📋 دوال قراءة الكاشير (واجهة - في الشيت) ==========
function getCashiersList() {
  try {
    var cashiersId = typeof getMasterTableId === 'function' ? getMasterTableId("POS_Cashiers") : null;
    if (!cashiersId) return { success: false, message: 'جدول الكاشير غير موجود', cashiers: [] };
    var sheet = SpreadsheetApp.openById(cashiersId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    var cashiers = [];
    for (var i = 1; i < data.length; i++) {
      cashiers.push({
        id: data[i][0] || '', cashier_name: data[i][1] || '', cashier_code: data[i][2] || '',
        account_id: data[i][3] || '', default_safe_id: data[i][4] || '',
        is_active: data[i][7] || 'TRUE', created_at: data[i][8] || '', last_login: data[i][9] || '',
        login_username: 'cashier_' + (data[i][2] || '')  // اسم المستخدم للدخول
      });
    }
    return { success: true, cashiers: cashiers, count: cashiers.length };
  } catch (e) {
    console.error('❌ getCashiersList error:', e);
    return { success: false, message: e.toString(), cashiers: [] };
  }
}

function getCashierById(cashierId) {
  try {
    if (!cashierId) return { success: false, message: 'معرف الكاشير مطلوب', cashier: null };
    var cashiersId = typeof getMasterTableId === 'function' ? getMasterTableId("POS_Cashiers") : null;
    if (!cashiersId) return { success: false, message: 'جدول الكاشير غير موجود', cashier: null };
    var sheet = SpreadsheetApp.openById(cashiersId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(cashierId)) {
        return { success: true, cashier: {
          id: data[i][0], cashier_name: data[i][1], cashier_code: data[i][2],
          account_id: data[i][3], default_safe_id: data[i][4],
          is_active: data[i][7], created_at: data[i][8], last_login: data[i][9],
          login_username: 'cashier_' + (data[i][2] || '')
        }};
      }
    }
    return { success: false, message: 'الكاشير غير موجود', cashier: null };
  } catch (e) {
    return { success: false, message: e.toString(), cashier: null };
  }
}

// ========== 📋 دوال الصلاحيات الديناميكية ==========
function getAvailablePagesList() {
  try {
    if (typeof ZEIOS !== 'undefined' && typeof ZEIOS.getAvailablePages === 'function') {
      return ZEIOS.getAvailablePages();
    }
    return { success: false, message: 'الدالة غير متاحة', pages: [] };
  } catch (e) { return { success: false, message: e.toString(), pages: [] }; }
}

function addNewSystemPage(pageData) {
  try {
    if (typeof ZEIOS !== 'undefined' && typeof ZEIOS.addNewPageToSystem === 'function') {
      return ZEIOS.addNewPageToSystem(pageData);
    }
    return { success: false, message: 'الدالة غير متاحة' };
  } catch (e) { return { success: false, message: e.toString() }; }
}

// ========== 💰 أغلفة دوال القوائم ==========
function getCashAccountsForDropdown() {
  try {
    if (typeof ZEIOS !== 'undefined' && typeof ZEIOS.getCashAccountsForDropdown === 'function') {
      return ZEIOS.getCashAccountsForDropdown();
    }
    return { success: false, message: 'الدالة غير متاحة', accounts: [] };
  } catch (e) { return { success: false, message: e.toString(), accounts: [] }; }
}

// ========== 🛠 دوال مساعدة ==========
function getLibraryVersion() {
  try {
    if (typeof ZEIOS !== 'undefined' && typeof ZEIOS.getAuthLibraryVersion === 'function') {
      return ZEIOS.getAuthLibraryVersion();
    }
    return AUTH_LIBRARY_VERSION || '3.3.0';
  } catch (e) { return 'غير متصل'; }
}
