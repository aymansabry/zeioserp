/**
 * YearEnd_Library.gs – ZEIOS ERP SYSTEM (LIBRARY VERSION)
 * الإصدار: 3.3.0
 * ⚠️ هذه المكتبة تحتوي على دوال Backend فقط (بدون HtmlService)
 * ⚠️ تستخدم DocumentProperties لعزل بيانات كل شيت
 * ⚠️ لا توجد دوال تبدأ بـ _ (كلها عامة للمكتبة)
 * 📞 الدعم: zeioszeios0@gmail.com | WhatsApp: 00201205951462
 */

// ========== 🔐 ثوابت النظام ==========
var HASH_ALGORITHM = 'SHA_256';
var SCRIPT_TZ = Session.getScriptTimeZone();
var DATE_FORMAT = 'dd-MM-yyyy HH:mm:ss';
var LIBRARY_VERSION = '3.3.0';

// ========== 📅 دوال تخزين بيانات السنوات ==========

/**
 * تخزين بيانات سنة جديدة في ALL_YEARS_DATA
 */
function saveYearDataForYearEnd(yearCode, yearData) {
  const allYears = loadJSON('ALL_YEARS_DATA', {});
  allYears[yearCode] = {
    ...yearData,
    updated_at: new Date().toISOString()
  };
  saveJSON('ALL_YEARS_DATA', allYears);
}

/**
 * الحصول على بيانات سنة محددة
 */
function getYearDataForYearEnd(yearCode) {
  const allYears = loadJSON('ALL_YEARS_DATA', {});
  const fiscalData = loadJSON('FISCAL_YEAR', {});
  
  // إذا كانت هي السنة النشطة في FISCAL_YEAR
  if (yearCode === fiscalData.year_code) {
    return {
      year_code: yearCode,
      date_from: fiscalData.date_from || '',
      date_to: fiscalData.date_to || '',
      is_active: fiscalData.is_active === true,
      folder_id: fiscalData.folder_id || ''
    };
  }
  
  // وإلا من ALL_YEARS_DATA
  return allYears[yearCode] || {
    year_code: yearCode,
    date_from: '',
    date_to: '',
    is_active: true,
    folder_id: ''
  };
}

// ========== 🚀 إنشاء هيكل السنة الجديدة ==========
function createNewYearStructureForYearEnd() {
  try {
    const ss = SpreadsheetApp.getActive();
    const currentFile = DriveApp.getFileById(ss.getId());
    
    // جلب جميع السنوات الموجودة
    const links = loadJSON('TABLE_LINKS', { yearly: {} });
    const existingYears = Object.keys(links.yearly || {}).sort();
    
    // تحديد السنة الجديدة (آخر سنة + 1)
    let newYear;
    if (existingYears.length > 0) {
      const lastYear = existingYears[existingYears.length - 1];
      newYear = (parseInt(lastYear) + 1).toString();
    } else {
      newYear = new Date().getFullYear().toString();
    }
    
    // ===== 1️⃣ إنشاء مجلد السنة الجديدة =====
    const folders = loadJSON('FOLDERS', {});
    if (!folders.assets) throw new Error("مجلد Assets غير موجود");
    
    const assetsFolder = DriveApp.getFolderById(folders.assets);
    const fiscalYearsFolder = getOrCreateFolderForYearEnd(assetsFolder, "Fiscal_Years");
    
    // إنشاء مجلد السنة الجديدة
    let newYearFolder;
    const existingFolders = fiscalYearsFolder.getFoldersByName(newYear);
    if (existingFolders.hasNext()) {
      newYearFolder = existingFolders.next();
    } else {
      newYearFolder = fiscalYearsFolder.createFolder(newYear);
    }
    
    // ===== 2️⃣ إنشاء جميع جداول السنة الجديدة =====
    const newTables = createAllYearlyTablesForYearEnd(newYear, newYearFolder);
    
    // ===== 3️⃣ تحديث TABLE_LINKS =====
    links.yearly[newYear] = newTables;
    links.updated_at = new Date().toISOString();
    saveJSON('TABLE_LINKS', links);
    
    // ===== 4️⃣ تخزين بيانات السنة الجديدة =====
    saveYearDataForYearEnd(newYear, {
      year_code: newYear,
      date_from: newYear + '-01-01',
      date_to: newYear + '-12-31',
      is_active: true,
      folder_id: newYearFolder.getId(),
      created_at: new Date().toISOString()
    });
    
    // ===== 5️⃣ تحديث اسم الملف =====
    ss.setName("ZEIOS ERP (سنوات متعددة)");
    
    // رسالة نجاح
    const allYearsList = Object.keys(links.yearly).sort();
    const message = `✅ تم إنشاء جداول السنة ${newYear} بنجاح\n\n` +
      `📁 مجلد السنة: ${newYear}\n` +
      `📊 عدد الجداول: ${Object.keys(newTables).length}\n` +
      `📅 السنة الجديدة نشطة ويمكن العمل عليها فوراً\n\n` +
      `📅 السنوات المتوفرة الآن: ${allYearsList.join(', ')}`;
    
    return {
      success: true,
      message: message,
      newYear: newYear,
      tables: newTables,
      availableYears: allYearsList
    };
    
  } catch (e) {
    console.error("createNewYearStructureForYearEnd error:", e.toString());
    return { success: false, message: e.message };
  }
}

// ========== 📊 إنشاء جميع جداول السنة الجديدة ==========
function createAllYearlyTablesForYearEnd(year, yearFolder) {
  const allTables = [
    { name: "Account_Movements", headers: ["id","account_id","fiscal_year","date","ref_type","ref_id","debit","credit","balance_after","created_at"] },
    { name: "Inventory_Balance", headers: ["id","item_id","color_id","warehouse_id","balance","updated_at","fiscal_year"] },
    { name: "Customer_Orders", headers: ["id","order_no","fiscal_year","order_date","customer_id","customer_phone","warehouse_id","delivery_date","status","notes","sub_total","tax","Exp","discount","net_total","created_at"] },
    { name: "Order_Details", headers: ["id","order_id","item_id","color_id","unit_price","qty","ready_qty","preparation_date","delivery_date","supplier","customer_image_id","notes","created_at"] },
    { name: "Stock_Movements", headers: ["id","item_id","warehouse_id","fiscal_year","date","qty_in","qty_out","color_id","ref_type","ref_id","balance_after","unit_cost","created_at","notes"] },
    { name: "Payments", headers: ["id","fiscal_year","date","ref_type","ref_id","amount","account_id","safe_id","notes","created_at"] },
    { name: "Receipts", headers: ["id","fiscal_year","date","ref_type","ref_id","amount","account_id","safe_id","notes","created_at"] },
    { name: "Purchase_Invoices", headers: ["id","invoice_no","fiscal_year","invoice_date","warehouse_id","supplier_id","notes","sub_total","tax","Exp","discount","net_total","status","created_at"] },
    { name: "Purchase_Invoice_Details", headers: ["id","invoice_id","item_id","color_id","qty","unit_cost","total","notes","created_at"] },
    { name: "Sales_Invoices", headers: ["id","invoice_no","fiscal_year","invoice_date","warehouse_id","customer_id","notes","sub_total","tax","Exp","discount","net_total","status","created_at"] },
    { name: "Sales_Invoice_Details", headers: ["id","invoice_id","item_id","color_id","qty","unit_price","total","notes","created_at"] },
    { name: "Purchase_Returns", headers: ["id","return_no","fiscal_year","return_date","warehouse_id","supplier_id","notes","sub_total","tax","Exp","discount","net_total","status","created_at"] },
    { name: "Purchase_Return_Details", headers: ["id","return_id","item_id","color_id","qty","unit_cost","total","notes","created_at"] },
    { name: "Sales_Returns", headers: ["id","return_no","fiscal_year","return_date","warehouse_id","customer_id","notes","sub_total","tax","Exp","discount","net_total","status","created_at"] },
    { name: "Sales_Return_Details", headers: ["id","return_id","item_id","color_id","qty","unit_price","total","notes","created_at"] },
    { name: "Stock_Transfers_Header", headers: ["id","doc_no","fiscal_year","date","from_warehouse_id","to_warehouse_id","notes","created_at"] },
    { name: "Stock_Transfers_Details", headers: ["id","doc_id","item_id","color_id","qty","unit_cost","total_cost","notes","created_at"] },
    { name: "Customer_Checks", headers: ["id","check_number","received_date","due_date","check_owner_name","received_from","issued_to","export_date","is_paid","blacklisted","bank_name","branch","export_response_date","customer_response_date","notes","amount","created_at"] },
    { name: "Audit_Log", headers: ["id","user","action","table_name","record_id","timestamp"] },
    { name: "Backups", headers: ["id","fiscal_year","backup_date","folder_id","notes"] }
  ];
  
  const tables = {};
  
  for (let i = 0; i < allTables.length; i++) {
    const t = allTables[i];
    try {
      const ssNew = SpreadsheetApp.create(`${t.name}_${year}`);
      const fileId = ssNew.getId();
      
      const sh = ssNew.getSheets()[0];
      sh.setName(t.name);
      sh.appendRow(t.headers);
      sh.setFrozenRows(1);
      sh.getRange(1, 1, 1, t.headers.length)
        .setFontWeight("bold")
        .setBackground("#cfe2f3")
        .setHorizontalAlignment("center");
      
      const file = DriveApp.getFileById(fileId);
      file.moveTo(yearFolder);
      
      tables[t.name] = {
        id: fileId,
        url: ssNew.getUrl(),
        created_at: new Date().toISOString()
      };
      
    } catch (e) {
      console.error(`خطأ في إنشاء ${t.name}:`, e.toString());
    }
  }
  
  return tables;
}

// ========== 🔄 ترحيل الأرصدة ==========
function transferYearBalancesForYearEnd(oldYear, newYear) {
  try {
    if (!oldYear || !newYear) {
      throw new Error("يجب تحديد السنة القديمة والجديدة");
    }
    
    const links = loadJSON('TABLE_LINKS', { yearly: {} });
    
    if (!links.yearly[oldYear]) {
      throw new Error(`جداول السنة ${oldYear} غير موجودة`);
    }
    
    if (!links.yearly[newYear]) {
      throw new Error(`جداول السنة ${newYear} غير موجودة. نفذ 'إنشاء هيكل السنة الجديدة' أولاً.`);
    }
    
    showProgressNotificationForYearEnd(`بدء ترحيل الأرصدة من ${oldYear} إلى ${newYear}...`, 0);
    
    showProgressNotificationForYearEnd("جاري ترحيل الأرصدة المحاسبية...", 20);
    const accountResult = transferAccountBalancesForYearEnd(oldYear, newYear);
    
    showProgressNotificationForYearEnd("جاري ترحيل أرصدة المخزون...", 50);
    const inventoryResult = transferInventoryBalancesForYearEnd(oldYear, newYear);
    
    showProgressNotificationForYearEnd("جاري ترحيل الطلبيات غير المستلمة...", 75);
    const ordersResult = transferPendingOrdersForYearEnd(oldYear, newYear);
    
    showProgressNotificationForYearEnd("✅ اكتمل الترحيل!", 100);
    Utilities.sleep(500);
    
    const summary = `✅ تم ترحيل أرصدة السنة ${oldYear} → ${newYear}\n\n` +
      `💰 الأرصدة المحاسبية: ${accountResult.count} قيد\n` +
      `💰 صافي قائمة الدخل: ${accountResult.plNetTotal?.toFixed(2) || '0.00'}\n` +
      `📦 أرصدة المخزون: ${inventoryResult.count} صنف\n` +
      `📋 الطلبيات غير المستلمة: ${ordersResult.count} طلبية\n\n` +
      `🔄 يمكنك الآن العمل على السنة ${newYear} من الداشبورد`;
    
    return {
      success: true,
      message: summary,
      accounts: accountResult,
      inventory: inventoryResult,
      orders: ordersResult
    };
    
  } catch (e) {
    console.error("transferYearBalancesForYearEnd error:", e.toString());
    return { success: false, message: e.message };
  }
}

// ========== 💰 ترحيل الأرصدة المحاسبية ==========
function transferAccountBalancesForYearEnd(oldYear, newYear) {
  const oldAccMovId = getYearlyTableId("Account_Movements", oldYear);
  const newAccMovId = getYearlyTableId("Account_Movements", newYear);
  
  if (!oldAccMovId || !newAccMovId) {
    throw new Error("جداول حركات الحسابات غير موجودة");
  }
  
  const oldSheet = SpreadsheetApp.openById(oldAccMovId).getSheets()[0];
  const newSheet = SpreadsheetApp.openById(newAccMovId).getSheets()[0];
  
  clearOpeningBalancesForYearEnd(newSheet);
  const balances = calculateAccountBalancesForYearEnd(oldSheet);
  
  const retainedEarningsId = getRetainedEarningsAccountIdForYearEnd();
  const plNetTotal = calculatePLNetTotalForYearEnd(oldSheet);
  
  const now = typeof getNowTimestamp === 'function' ? getNowTimestamp() : generateTimestampForYearEnd();
  const openingDate = `${newYear}-01-01`;
  let count = 0;
  
  for (const [accountId, balance] of Object.entries(balances)) {
    if (isPLAccountForYearEnd(accountId)) continue;
    
    if (Math.abs(balance) > 0.001) {
      let finalBalance = balance;
      
      if (accountId === retainedEarningsId) {
        finalBalance = balance + plNetTotal;
      }
      
      newSheet.appendRow([
        typeof generateID === 'function' ? generateID() : Date.now().toString(),
        accountId,
        newYear,
        openingDate,
        "OPENING_BALANCE",
        `OB-${typeof generateID === 'function' ? generateID() : Date.now().toString()}`,
        finalBalance > 0 ? finalBalance.toFixed(2) : "0",
        finalBalance < 0 ? Math.abs(finalBalance).toFixed(2) : "0",
        finalBalance.toFixed(2),
        now
      ]);
      count++;
    }
  }
  
  return { count, plNetTotal };
}

// ========== 📦 ترحيل أرصدة المخزون ==========
function transferInventoryBalancesForYearEnd(oldYear, newYear) {
  const oldInvId = getYearlyTableId("Inventory_Balance", oldYear);
  const newInvId = getYearlyTableId("Inventory_Balance", newYear);
  
  if (!oldInvId || !newInvId) {
    throw new Error("جداول أرصدة المخزون غير موجودة");
  }
  
  const oldSheet = SpreadsheetApp.openById(oldInvId).getSheets()[0];
  const newSheet = SpreadsheetApp.openById(newInvId).getSheets()[0];
  
  clearSheetForYearEnd(newSheet);
  
  const data = oldSheet.getDataRange().getDisplayValues();
  const now = typeof getNowTimestamp === 'function' ? getNowTimestamp() : generateTimestampForYearEnd();
  let count = 0;
  
  for (let i = 1; i < data.length; i++) {
    const balance = parseFloat(data[i][COL.INVENTORY_BALANCE.BALANCE] || '0');
    if (balance > 0) {
      newSheet.appendRow([
        typeof generateID === 'function' ? generateID() : Date.now().toString(),
        data[i][COL.INVENTORY_BALANCE.ITEM_ID],
        data[i][COL.INVENTORY_BALANCE.COLOR_ID],
        data[i][COL.INVENTORY_BALANCE.WAREHOUSE_ID],
        balance.toFixed(2),
        now,
        newYear
      ]);
      count++;
    }
  }
  
  return { count };
}

// ========== 📋 ترحيل الطلبيات غير المستلمة ==========
function transferPendingOrdersForYearEnd(oldYear, newYear) {
  const oldOrdersId = getYearlyTableId("Customer_Orders", oldYear);
  const newOrdersId = getYearlyTableId("Customer_Orders", newYear);
  const oldDetailsId = getYearlyTableId("Order_Details", oldYear);
  const newDetailsId = getYearlyTableId("Order_Details", newYear);
  
  if (!oldOrdersId || !newOrdersId || !oldDetailsId || !newDetailsId) {
    throw new Error("جداول الطلبيات غير موجودة");
  }
  
  const oldOrdersSheet = SpreadsheetApp.openById(oldOrdersId).getSheets()[0];
  const newOrdersSheet = SpreadsheetApp.openById(newOrdersId).getSheets()[0];
  const oldDetailsSheet = SpreadsheetApp.openById(oldDetailsId).getSheets()[0];
  const newDetailsSheet = SpreadsheetApp.openById(newDetailsId).getSheets()[0];
  
  const ordersData = oldOrdersSheet.getDataRange().getDisplayValues();
  const headers = ordersData[0];
  
  const idCol = headers.indexOf("id");
  const deliveryDateCol = headers.indexOf("delivery_date");
  const fiscalYearCol = headers.indexOf("fiscal_year");
  const createdAtCol = headers.indexOf("created_at");
  const statusCol = headers.indexOf("status");
  
  if ([idCol, deliveryDateCol, fiscalYearCol, createdAtCol, statusCol].includes(-1)) {
    throw new Error("هيكل جدول الطلبات غير متوافق");
  }
  
  let count = 0;
  const now = typeof getNowTimestamp === 'function' ? getNowTimestamp() : generateTimestampForYearEnd();
  const yearEnd = new Date(`${oldYear}-12-31`);
  
  for (let i = 1; i < ordersData.length; i++) {
    const deliveryDate = ordersData[i][deliveryDateCol] || '';
    const status = (ordersData[i][statusCol] || '').toString().toLowerCase();
    
    const isPending = !deliveryDate || isDateAfterForYearEnd(deliveryDate, yearEnd);
    const isNotCompleted = !status.includes('مكتمل') && !status.includes('completed') && !status.includes('مسلم');
    
    if (isPending && isNotCompleted) {
      const newOrderId = typeof generateID === 'function' ? generateID() : Date.now().toString();
      const newOrderRow = ordersData[i].slice();
      newOrderRow[idCol] = newOrderId;
      newOrderRow[fiscalYearCol] = newYear;
      newOrderRow[createdAtCol] = now;
      newOrdersSheet.appendRow(newOrderRow);
      
      copyOrderDetailsForYearEnd(oldDetailsSheet, newDetailsSheet, ordersData[i][idCol], newOrderId, newYear, now);
      count++;
    }
  }
  
  return { count };
}

// ========== 🛠 دوال مساعدة ==========

function showProgressNotificationForYearEnd(message, percent) {
  if (typeof SpreadsheetApp !== 'undefined') {
    SpreadsheetApp.getActive().toast(`🕗 ${message} (${percent}%)`, 'ترحيل الأرصدة', 3);
  }
  Utilities.sleep(200);
}

function clearOpeningBalancesForYearEnd(sheet) {
  const data = sheet.getDataRange().getDisplayValues();
  for (let i = data.length - 1; i >= 1; i--) {
    if ((data[i][COL.ACCOUNT_MOVEMENTS.REF_TYPE] || '').toString() === "OPENING_BALANCE") {
      sheet.deleteRow(i + 1);
    }
  }
}

function clearSheetForYearEnd(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
  }
}

function calculateAccountBalancesForYearEnd(sheet) {
  const data = sheet.getDataRange().getDisplayValues();
  const balances = {};
  
  for (let i = 1; i < data.length; i++) {
    const accountId = (data[i][COL.ACCOUNT_MOVEMENTS.ACCOUNT_ID] || '').toString().trim();
    if (!accountId) continue;
    
    const debit = parseFloat(data[i][COL.ACCOUNT_MOVEMENTS.DEBIT]) || 0;
    const credit = parseFloat(data[i][COL.ACCOUNT_MOVEMENTS.CREDIT]) || 0;
    
    balances[accountId] = (balances[accountId] || 0) + debit - credit;
  }
  
  return balances;
}

function calculatePLNetTotalForYearEnd(sheet) {
  let total = 0;
  const data = sheet.getDataRange().getDisplayValues();
  
  for (let i = 1; i < data.length; i++) {
    const accountId = (data[i][COL.ACCOUNT_MOVEMENTS.ACCOUNT_ID] || '').toString().trim();
    if (isPLAccountForYearEnd(accountId)) {
      const debit = parseFloat(data[i][COL.ACCOUNT_MOVEMENTS.DEBIT]) || 0;
      const credit = parseFloat(data[i][COL.ACCOUNT_MOVEMENTS.CREDIT]) || 0;
      total += debit - credit;
    }
  }
  
  return total;
}

function isPLAccountForYearEnd(accountId) {
  if (!accountId) return false;
  const firstChar = accountId.toString().charAt(0);
  return ['4', '5', '6'].includes(firstChar);
}

function getRetainedEarningsAccountIdForYearEnd() {
  const coaId = typeof getMasterTableId === 'function' ? getMasterTableId("Chart_Of_Accounts") : null;
  if (coaId) {
    try {
      const sheet = SpreadsheetApp.openById(coaId).getSheets()[0];
      const data = sheet.getDataRange().getDisplayValues();
      
      for (let i = 1; i < data.length; i++) {
        if ((data[i][COL.CHART_OF_ACCOUNTS.ACCOUNT_NO] || '').toString().trim() === "3200") {
          return (data[i][COL.CHART_OF_ACCOUNTS.ID] || '').toString().trim();
        }
      }
    } catch (e) {
      console.error("خطأ في البحث عن حساب الأرباح المحتجزة:", e.toString());
    }
  }
  return null;
}

function copyOrderDetailsForYearEnd(oldSheet, newSheet, oldOrderId, newOrderId, newYear, now) {
  const data = oldSheet.getDataRange().getDisplayValues();
  const headers = data[0];
  
  const orderIdCol = headers.indexOf("order_id");
  const idCol = headers.indexOf("id");
  const fiscalYearCol = headers.indexOf("fiscal_year");
  const createdAtCol = headers.indexOf("created_at");
  
  if ([orderIdCol, idCol, fiscalYearCol, createdAtCol].includes(-1)) return;
  
  for (let i = 1; i < data.length; i++) {
    if ((data[i][orderIdCol] || '').toString() === (oldOrderId || '').toString()) {
      const newRow = data[i].slice();
      newRow[idCol] = typeof generateID === 'function' ? generateID() : Date.now().toString();
      newRow[orderIdCol] = newOrderId;
      newRow[fiscalYearCol] = newYear;
      newRow[createdAtCol] = now;
      newSheet.appendRow(newRow);
    }
  }
}

function isDateAfterForYearEnd(dateStr, afterDate) {
  if (!dateStr) return true;
  try {
    const d1 = new Date(dateStr);
    if (isNaN(d1.getTime())) return true;
    return d1 > afterDate;
  } catch (e) {
    return true;
  }
}

function getOrCreateFolderForYearEnd(parent, name) {
  const folders = parent.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : parent.createFolder(name);
}

function generateTimestampForYearEnd() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
}

// ========== 📋 دوال الحصول على بيانات السنوات ==========

function getAvailableFiscalYearsForYearEnd() {
  try {
    const folders = loadJSON('FOLDERS', {});
    let yearsList = [];
    
    if (folders.fiscal_years) {
      const fiscalYearsFolder = DriveApp.getFolderById(folders.fiscal_years);
      const yearFolders = fiscalYearsFolder.getFolders();
      
      while (yearFolders.hasNext()) {
        yearsList.push(yearFolders.next().getName());
      }
    }
    
    const fiscalData = loadJSON('FISCAL_YEAR', {});
    const allYearsData = loadJSON('ALL_YEARS_DATA', {});
    const links = loadJSON('TABLE_LINKS', { yearly: {} });
    
    const fullData = [];
    yearsList.sort().forEach(year => {
      const hasTables = links.yearly && links.yearly[year] && 
                        Object.keys(links.yearly[year]).length > 0;
      
      let yearInfo;
      if (year === fiscalData.year_code) {
        yearInfo = {
          year_code: year,
          date_from: fiscalData.date_from || year + '-01-01',
          date_to: fiscalData.date_to || year + '-12-31',
          is_active: fiscalData.is_active === true,
          folder_id: fiscalData.folder_id || ''
        };
      } else if (allYearsData[year]) {
        yearInfo = {
          year_code: year,
          date_from: allYearsData[year].date_from || year + '-01-01',
          date_to: allYearsData[year].date_to || year + '-12-31',
          is_active: allYearsData[year].is_active !== false,
          folder_id: allYearsData[year].folder_id || ''
        };
      } else {
        yearInfo = {
          year_code: year,
          date_from: year + '-01-01',
          date_to: year + '-12-31',
          is_active: true,
          folder_id: ''
        };
        saveYearDataForYearEnd(year, yearInfo);
      }
      
      fullData.push(yearInfo);
    });
    
    return {
      success: true,
      years: yearsList,
      fullData: fullData,
      activeYear: fiscalData.year_code || null,
      count: yearsList.length
    };
    
  } catch (e) {
    console.error('Error in getAvailableFiscalYearsForYearEnd:', e);
    return {
      success: false,
      years: [],
      fullData: [],
      activeYear: null,
      count: 0
    };
  }
}

function getYearDetailsForYearEnd(yearCode) {
  try {
    const yearData = getYearDataForYearEnd(yearCode);
    
    const links = loadJSON('TABLE_LINKS', { yearly: {} });
    const tables = (links.yearly && links.yearly[yearCode]) || {};
    
    return {
      success: true,
      yearData: yearData,
      stats: {
        tables_count: Object.keys(tables).length,
        tables: tables
      }
    };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

function updateFiscalYearForYearEnd(yearData) {
  try {
    if (!yearData || !yearData.year_code) {
      return { success: false, message: 'بيانات السنة غير مكتملة' };
    }
    
    saveYearDataForYearEnd(yearData.year_code, {
      year_code: yearData.year_code,
      date_from: yearData.date_from || yearData.year_code + '-01-01',
      date_to: yearData.date_to || yearData.year_code + '-12-31',
      is_active: yearData.is_active,
      folder_id: yearData.folder_id || ''
    });
    
    const fiscalData = loadJSON('FISCAL_YEAR', {});
    if (yearData.year_code === fiscalData.year_code) {
      fiscalData.date_from = yearData.date_from || fiscalData.date_from;
      fiscalData.date_to = yearData.date_to || fiscalData.date_to;
      fiscalData.is_active = yearData.is_active;
      saveJSON('FISCAL_YEAR', fiscalData);
    }
    
    return { 
      success: true, 
      message: 'تم تحديث بيانات السنة بنجاح',
      year: yearData.year_code
    };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

// ========== 🎯 دوال القوائم ==========

function showCreateYearStructureForYearEnd() {
  const result = createNewYearStructureForYearEnd();
  if (result.success && typeof SpreadsheetApp !== 'undefined') {
    SpreadsheetApp.getActive().toast(result.message, '✅ نجاح', 5);
  }
  return result;
}

function showTransferBalancesForYearEnd(oldYear, newYear) {
  if (!oldYear || !newYear) {
    return { success: false, message: 'يجب تحديد السنتين' };
  }
  
  const links = loadJSON('TABLE_LINKS', { yearly: {} });
  if (!links.yearly[oldYear] || !links.yearly[newYear]) {
    return { success: false, message: 'تأكد من إنشاء جداول السنتين المطلوب ترحيلهما.' };
  }
  
  return transferYearBalancesForYearEnd(oldYear, newYear);
}

function showCompleteYearEndForYearEnd() {
  const years = getAvailableFiscalYearsForYearEnd();
  if (!years.success || years.years.length === 0) {
    return { success: false, message: 'يجب إنشاء سنة واحدة على الأقل أولاً.' };
  }
  
  const createResult = createNewYearStructureForYearEnd();
  if (!createResult.success) {
    return { success: false, message: createResult.message };
  }
  
  const availableYears = Object.keys(loadJSON('TABLE_LINKS', { yearly: {} }).yearly || {}).sort();
  const currentYear = availableYears[availableYears.length - 2] || (parseInt(createResult.newYear) - 1).toString();
  
  const transferResult = transferYearBalancesForYearEnd(currentYear, createResult.newYear);
  
  const finalMessage = 
    "✅ اكتملت عملية إقفال السنة بنجاح\n\n" +
    `📅 السنة القديمة: ${currentYear}\n` +
    `🆕 السنة الجديدة: ${createResult.newYear}\n\n` +
    `📊 تفاصيل الترحيل:\n` +
    `💰 الأرصدة المحاسبية: ${transferResult.accounts?.count || 0} قيد\n` +
    `📦 أرصدة المخزون: ${transferResult.inventory?.count || 0} صنف\n` +
    `📋 الطلبيات: ${transferResult.orders?.count || 0} طلبية`;
  
  return {
    success: true,
    message: finalMessage,
    oldYear: currentYear,
    newYear: createResult.newYear,
    transferResult: transferResult
  };
}

// ========== 📋 دوال إضافية ==========
function getLibraryVersionForYearEnd() { return LIBRARY_VERSION; }

function showStoredDataInLogForYearEnd() {
  try {
    var props = typeof getDocProperties === 'function' ? getDocProperties() : PropertiesService.getDocumentProperties();
    var allKeys = props.getKeys();
    console.log('ZEIOS ERP - YearEnd data');
    console.log('Keys:', allKeys.length);
    return { success: true, count: allKeys.length, keys: allKeys };
  } catch (e) {
    console.error('Error:', e);
    return { success: false, error: e.toString() };
  }
}


/**
 * YearEnd_Client.gs – ZEIOS ERP YearEnd (SHEET VERSION)
 * ⚠️ واجهة لاستدعاء دوال المكتبة من الـ HTML عبر google.script.run
 * ⚠️ هذا الملف يجب أن يكون في مشروع الجدول (ليس في المكتبة)
 */

// ========== 🔗 ربط المكتبة ==========
var ZEIOS = ZEIOS; // غيّر للاسم اللي ظهر عندك

// ========== 📦 خصائص المستند ==========
function getDocProperties() {
  try { return ZEIOS.getDocProperties(); }
  catch (e) { return PropertiesService.getDocumentProperties(); }
}

function loadJSON(key, defaultValue) {
  try { return ZEIOS.loadJSON(key, defaultValue); }
  catch (e) {
    try { var val = PropertiesService.getDocumentProperties().getProperty(key); return val ? JSON.parse(val) : defaultValue; }
    catch (ex) { return defaultValue; }
  }
}

function saveJSON(key, data) {
  try {
    getDocProperties().setProperty(key, JSON.stringify(data));
    return true;
  } catch (e) { return false; }
}

// ========== 📅 دوال تخزين بيانات السنوات ==========
function saveYearData(yearCode, yearData) {
  try { return ZEIOS.saveYearDataForYearEnd(yearCode, yearData); }
  catch (e) { return { success: false, message: e.toString() }; }
}

function getYearData(yearCode) {
  try { return ZEIOS.getYearDataForYearEnd(yearCode); }
  catch (e) { return { success: false, message: e.toString() }; }
}

// ========== 🚀 إنشاء هيكل السنة الجديدة ==========
function createNewYearStructure() {
  try { return ZEIOS.createNewYearStructureForYearEnd(); }
  catch (e) { return { success: false, message: e.toString() }; }
}

function createAllYearlyTables(year, yearFolder) {
  try { return ZEIOS.createAllYearlyTablesForYearEnd(year, yearFolder); }
  catch (e) { return {}; }
}

// ========== 🔄 ترحيل الأرصدة ==========
function transferYearBalances(oldYear, newYear) {
  try { return ZEIOS.transferYearBalancesForYearEnd(oldYear, newYear); }
  catch (e) { return { success: false, message: e.toString() }; }
}

function transferAccountBalances(oldYear, newYear) {
  try { return ZEIOS.transferAccountBalancesForYearEnd(oldYear, newYear); }
  catch (e) { return { count: 0, plNetTotal: 0 }; }
}

function transferInventoryBalances(oldYear, newYear) {
  try { return ZEIOS.transferInventoryBalancesForYearEnd(oldYear, newYear); }
  catch (e) { return { count: 0 }; }
}

function transferPendingOrders(oldYear, newYear) {
  try { return ZEIOS.transferPendingOrdersForYearEnd(oldYear, newYear); }
  catch (e) { return { count: 0 }; }
}

// ========== 🛠 دوال مساعدة ==========
function showProgressNotification(message, percent) {
  try { return ZEIOS.showProgressNotificationForYearEnd(message, percent); }
  catch (e) { console.error(e); }
}

function clearOpeningBalances(sheet) {
  try { return ZEIOS.clearOpeningBalancesForYearEnd(sheet); }
  catch (e) { console.error(e); }
}

function clearSheet(sheet) {
  try { return ZEIOS.clearSheetForYearEnd(sheet); }
  catch (e) { console.error(e); }
}

function calculateAccountBalances(sheet) {
  try { return ZEIOS.calculateAccountBalancesForYearEnd(sheet); }
  catch (e) { return {}; }
}

function calculatePLNetTotal(sheet) {
  try { return ZEIOS.calculatePLNetTotalForYearEnd(sheet); }
  catch (e) { return 0; }
}

function isPLAccount(accountId) {
  try { return ZEIOS.isPLAccountForYearEnd(accountId); }
  catch (e) { return false; }
}

function getRetainedEarningsAccountId() {
  try { return ZEIOS.getRetainedEarningsAccountIdForYearEnd(); }
  catch (e) { return null; }
}

function copyOrderDetails(oldSheet, newSheet, oldOrderId, newOrderId, newYear, now) {
  try { return ZEIOS.copyOrderDetailsForYearEnd(oldSheet, newSheet, oldOrderId, newOrderId, newYear, now); }
  catch (e) { console.error(e); }
}

function isDateAfter(dateStr, afterDate) {
  try { return ZEIOS.isDateAfterForYearEnd(dateStr, afterDate); }
  catch (e) { return true; }
}

function getOrCreateFolder(parent, name) {
  try { return ZEIOS.getOrCreateFolderForYearEnd(parent, name); }
  catch (e) { return null; }
}

function generateTimestamp() {
  try { return ZEIOS.generateTimestampForYearEnd(); }
  catch (e) { return new Date().toISOString(); }
}

// ========== 📋 دوال الحصول على بيانات السنوات ==========
function getAvailableFiscalYears() {
  try { return ZEIOS.getAvailableFiscalYearsForYearEnd(); }
  catch (e) { return { success: false, years: [], fullData: [], activeYear: null, count: 0 }; }
}

function getYearDetails(yearCode) {
  try { return ZEIOS.getYearDetailsForYearEnd(yearCode); }
  catch (e) { return { success: false, message: e.toString() }; }
}

function updateFiscalYear(yearData) {
  try { return ZEIOS.updateFiscalYearForYearEnd(yearData); }
  catch (e) { return { success: false, message: e.toString() }; }
}

// ========== 🎯 دوال القوائم ==========
function showCreateYearStructure() {
  try { return ZEIOS.showCreateYearStructureForYearEnd(); }
  catch (e) { return { success: false, message: e.toString() }; }
}

function showTransferBalances(oldYear, newYear) {
  try { return ZEIOS.showTransferBalancesForYearEnd(oldYear, newYear); }
  catch (e) { return { success: false, message: e.toString() }; }
}

function showCompleteYearEnd() {
  try { return ZEIOS.showCompleteYearEndForYearEnd(); }
  catch (e) { return { success: false, message: e.toString() }; }
}

// ========== 📋 دوال إضافية ==========
function getLibraryVersion() {
  try { return ZEIOS.getLibraryVersionForYearEnd(); }
  catch (e) { return 'غير متصل'; }
}

function showStoredDataInLog() {
  try { return ZEIOS.showStoredDataInLogForYearEnd(); }
  catch (e) { return { success: false, error: e.toString() }; }
}

// ========== ✅ دالة فحص الاتصال ==========
function checkYearEndLibraryConnection() {
  try {
    if (typeof ZEIOS === 'undefined') {
      return { connected: false, message: '❌ المكتبة غير مربوطة' };
    }
    var version = typeof ZEIOS.getLibraryVersionForYearEnd === 'function' ? ZEIOS.getLibraryVersionForYearEnd() : 'غير معروف';
    return { connected: true, message: '✅ المكتبة مربوطة', version: version };
  } catch (e) {
    return { connected: false, message: '❌ خطأ: ' + e.toString() };
  }
}
