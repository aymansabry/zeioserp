/**
 * Reports_Library.gs – ZEIOS ERP SYSTEM (LIBRARY VERSION)
 * الإصدار: 3.3.0
 * ⚠️ دوال Backend فقط - بدون HtmlService
 * ⚠️ لا توجد دوال تبدأ بـ _ (كلها عامة للمكتبة)
 * 📞 الدعم: zeioszeios0@gmail.com | WhatsApp: 00201205951462
 */

// ========== 🔐 ثوابت النظام ==========
var HASH_ALGORITHM = 'SHA_256';
var SCRIPT_TZ = Session.getScriptTimeZone();
var DATE_FORMAT = 'dd-MM-yyyy HH:mm:ss';
var LIBRARY_VERSION = '3.3.0';

// ========== 🗂️ خريطة الأعمدة (fallback) ==========
var REPORTS_COL = {
  INVENTORY_BALANCE: { ID: 0, ITEM_ID: 1, COLOR_ID: 2, WAREHOUSE_ID: 3, BALANCE: 4, UPDATED_AT: 5, FISCAL_YEAR: 6 },
  STOCK_MOVEMENTS: { ID: 0, ITEM_ID: 1, WAREHOUSE_ID: 2, FISCAL_YEAR: 3, DATE: 4, QTY_IN: 5, QTY_OUT: 6, COLOR_ID: 7, REF_TYPE: 8, REF_ID: 9, BALANCE_AFTER: 10, UNIT_COST: 11, CREATED_AT: 12, NOTES: 13 },
  ITEMS: { ID: 0, ITEM_CODE: 1, ITEM_NAME: 2, IMAGE_ID: 3, DESCRIPTION: 4, CATEGORY: 5, UNIT: 6, SALE_PRICE: 7, COST_PRICE: 8, OPENING_BAL: 9, LAST_PURCHASE: 10, CREATED_AT: 11 },
  CHART_OF_ACCOUNTS: { ID: 0, ACCOUNT_NO: 1, ACCOUNT_NAME: 2, PARENT: 3, BS_GROUP: 4, PL_GROUP: 5, CONTACT: 6, ADDRESS: 7, PHONE: 8, EMAIL: 9, CREDIT_LIMIT: 10, CREATED_AT: 11, LOCKED: 12 },
  ACCOUNT_MOVEMENTS: { ID: 0, ACCOUNT_ID: 1, FISCAL_YEAR: 2, DATE: 3, REF_TYPE: 4, REF_ID: 5, DEBIT: 6, CREDIT: 7, BALANCE_AFTER: 8, CREATED_AT: 9 },
  PAYMENTS_RECEIPTS: { ID: 0, FISCAL_YEAR: 1, DATE: 2, REF_TYPE: 3, REF_ID: 4, AMOUNT: 5, ACCOUNT_ID: 6, SAFE_ID: 7, NOTES: 8, CREATED_AT: 9 },
  WAREHOUSES: { ID: 0, WAREHOUSE_CODE: 1, WAREHOUSE_NAME: 2, CREATED_AT: 3 },
  COLORS: { ID: 0, COLOR_CODE: 1, COLOR_NAME: 2, CREATED_AT: 3 }
};

// ========== 🔧 دوال مساعدة (داخلية - لا تُستدعى من الخارج) ==========
function _getCOL() {
  if (typeof COL !== 'undefined' && COL) { return COL; }
  return REPORTS_COL;
}

function _round2(num) { return Math.round((num || 0) * 100) / 100; }
function _isMaterial(num, threshold) { threshold = threshold || 0.01; return Math.abs(num || 0) >= threshold; }

// ========== 📅 السنة المالية (دوال عامة للمكتبة) ==========
function getFiscalYearInfoForReports(fiscalYear) {
  if (typeof getFiscalYearInfo === 'function') { return getFiscalYearInfo(fiscalYear); }
  try {
    var year = null;
    if (fiscalYear && String(fiscalYear).trim() !== '') {
      year = String(fiscalYear).trim();
      return { year_code: year, is_active: true, date_from: '', date_to: '', folder_id: '' };
    }
    if (typeof getCurrentUserFiscalYear === 'function') {
      year = getCurrentUserFiscalYear();
      if (year) { return { year_code: year, is_active: true, date_from: '', date_to: '', folder_id: '' }; }
    }
    if (typeof getActiveFiscalYear === 'function') { return getActiveFiscalYear(); }
    year = new Date().getFullYear().toString();
    return { year_code: year, is_active: true, date_from: '', date_to: '', folder_id: '' };
  } catch (e) {
    console.error("❌ getFiscalYearInfoForReports error:", e);
    return { year_code: null, is_active: false, date_from: '', date_to: '', folder_id: '' };
  }
}

function getFiscalYearCodeForReports(fiscalYear) {
  var fy = getFiscalYearInfoForReports(fiscalYear);
  return fy && fy.year_code ? fy.year_code : null;
}

// ========== 📊 كشف الحساب ==========
function getAllAccountsForStatementForReports(fiscalYear) {
  try {
    var COL = _getCOL();
    var coaId = typeof getMasterTableId === 'function' ? getMasterTableId("Chart_Of_Accounts") : null;
    if (!coaId) return [];
    var sheet = SpreadsheetApp.openById(coaId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    var accounts = [];
    if (data.length > 1) {
      for (var i = 1; i < data.length; i++) {
        var id = (data[i][COL.CHART_OF_ACCOUNTS.ID] || '').toString().trim();
        var accountNo = (data[i][COL.CHART_OF_ACCOUNTS.ACCOUNT_NO] || '').toString().trim();
        var accountName = (data[i][COL.CHART_OF_ACCOUNTS.ACCOUNT_NAME] || '').toString().trim();
        if (!id && !accountNo && !accountName) continue;
        accounts.push({ id: id, account_no: accountNo, account_name: accountName });
      }
    }
    console.log("✅ getAllAccountsForStatementForReports: Found", accounts.length, "accounts");
    return accounts;
  } catch (e) {
    console.error("❌ getAllAccountsForStatementForReports error:", e.toString());
    return [];
  }
}

function getAccountStatementForReports(accountId, fromDate, toDate, fiscalYear) {
  try {
    var COL = _getCOL();
    var year = getFiscalYearCodeForReports(fiscalYear);
    if (!year) { return { error: "No fiscal year specified" }; }
    var accMovId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Account_Movements", year) : null;
    if (!accMovId) { throw new Error("Account_Movements table not found for year: " + year); }
    var account = typeof getAccountInfo === 'function' ? getAccountInfo(accountId) : null;
    if (!account) throw new Error("Account not found: " + accountId);
    var accSheet = SpreadsheetApp.openById(accMovId).getSheets()[0];
    var accData = accSheet.getDataRange().getDisplayValues();
    var allMovements = [];
    if (accData.length > 1) {
      for (var i = 1; i < accData.length; i++) {
        var rowYear = (accData[i][COL.ACCOUNT_MOVEMENTS.FISCAL_YEAR] || '').toString().trim();
        if (rowYear !== String(year)) continue;
        if (String(accData[i][COL.ACCOUNT_MOVEMENTS.ACCOUNT_ID]).trim() === String(accountId).trim()) {
          allMovements.push({
            date: accData[i][COL.ACCOUNT_MOVEMENTS.DATE],
            ref_type: accData[i][COL.ACCOUNT_MOVEMENTS.REF_TYPE],
            ref_id: accData[i][COL.ACCOUNT_MOVEMENTS.REF_ID],
            debit: parseFloat(accData[i][COL.ACCOUNT_MOVEMENTS.DEBIT]) || 0,
            credit: parseFloat(accData[i][COL.ACCOUNT_MOVEMENTS.CREDIT]) || 0
          });
        }
      }
    }
    allMovements.sort(function(a, b) { return new Date(a.date) - new Date(b.date); });
    var openingBalance = 0;
    var filteredMovements = [];
    for (var i = 0; i < allMovements.length; i++) {
      var mov = allMovements[i];
      if (fromDate && mov.date < fromDate) {
        openingBalance += mov.debit - mov.credit;
      } else if (!fromDate || (!toDate || mov.date <= toDate)) {
        filteredMovements.push(mov);
      }
    }
    var runningBalance = openingBalance;
    var movementsWithBalance = filteredMovements.map(function(mov) {
      runningBalance += mov.debit - mov.credit;
      return {
        date: mov.date, ref_type: mov.ref_type, ref_id: mov.ref_id,
        debit: mov.debit, credit: mov.credit, balance_after: runningBalance
      };
    });
    var totalDebit = 0, totalCredit = 0;
    for (var i = 0; i < movementsWithBalance.length; i++) {
      totalDebit += movementsWithBalance[i].debit;
      totalCredit += movementsWithBalance[i].credit;
    }
    return {
      account: account, movements: movementsWithBalance,
      opening_balance: _round2(openingBalance), total_debit: _round2(totalDebit),
      total_credit: _round2(totalCredit), closing_balance: _round2(runningBalance),
      fiscal_year: year
    };
  } catch (e) {
    console.error("❌ getAccountStatementForReports error:", e.toString());
    return { error: e.toString() };
  }
}

// ========== 📦 دوال المخزون ==========
function getItemsForReportsForReports() {
  try { return typeof getItems === 'function' ? getItems() : []; }
  catch (e) { console.error("❌ getItemsForReportsForReports error:", e.toString()); return []; }
}

function getWarehousesForReportsForReports() {
  try { return typeof getWarehouses === 'function' ? getWarehouses() : []; }
  catch (e) { console.error("❌ getWarehousesForReportsForReports error:", e.toString()); return []; }
}

function getWarehouseBalancesForReports(warehouseId, fiscalYear) {
  try {
    var COL = _getCOL();
    var year = getFiscalYearCodeForReports(fiscalYear);
    if (!year) { return []; }
    var invBalId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Inventory_Balance", year) : null;
    if (!invBalId) { return []; }
    var items = typeof getItems === 'function' ? getItems() : [];
    var itemsMap = {};
    for (var i = 0; i < items.length; i++) {
      itemsMap[items[i].id] = { code: items[i].item_code, name: items[i].item_name };
    }
    var sheet = SpreadsheetApp.openById(invBalId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    var balances = {};
    if (data.length > 1) {
      for (var i = 1; i < data.length; i++) {
        var rowYear = (data[i][COL.INVENTORY_BALANCE.FISCAL_YEAR] || '').toString().trim();
        if (rowYear !== String(year)) continue;
        var rowWhId = (data[i][COL.INVENTORY_BALANCE.WAREHOUSE_ID] || '').toString().trim();
        if (warehouseId && String(rowWhId).trim() !== String(warehouseId).trim()) continue;
        var itemId = (data[i][COL.INVENTORY_BALANCE.ITEM_ID] || '').toString().trim();
        var balance = parseFloat(data[i][COL.INVENTORY_BALANCE.BALANCE]) || 0;
        if (!itemId) continue;
        if (!balances[itemId]) {
          balances[itemId] = {
            item_id: itemId,
            item_code: itemsMap[itemId] ? itemsMap[itemId].code : itemId,
            item_name: itemsMap[itemId] ? itemsMap[itemId].name : 'Unknown',
            balance: 0
          };
        }
        balances[itemId].balance += balance;
      }
    }
    var result = [];
    for (var itemId in balances) { result.push(balances[itemId]); }
    result.sort(function(a, b) { return b.balance - a.balance; });
    console.log("✅ getWarehouseBalancesForReports: Found", result.length, "items");
    return result;
  } catch (e) {
    console.error("❌ getWarehouseBalancesForReports error:", e.toString());
    return [];
  }
}

function getItemBalancesForReports(warehouseId, itemId, fiscalYear) {
  try {
    var COL = _getCOL();
    var year = getFiscalYearCodeForReports(fiscalYear);
    if (!year) { return []; }
    var invBalId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Inventory_Balance", year) : null;
    if (!invBalId) { return []; }
    var colors = typeof getColors === 'function' ? getColors() : [];
    var colorsMap = {};
    for (var i = 0; i < colors.length; i++) { colorsMap[colors[i].id] = colors[i].color_name; }
    var sheet = SpreadsheetApp.openById(invBalId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    var balances = [];
    if (data.length > 1) {
      for (var i = 1; i < data.length; i++) {
        var rowYear = (data[i][COL.INVENTORY_BALANCE.FISCAL_YEAR] || '').toString().trim();
        if (rowYear !== String(year)) continue;
        var rowWhId = (data[i][COL.INVENTORY_BALANCE.WAREHOUSE_ID] || '').toString().trim();
        if (warehouseId && String(rowWhId).trim() !== String(warehouseId).trim()) continue;
        var rowItemId = (data[i][COL.INVENTORY_BALANCE.ITEM_ID] || '').toString().trim();
        if (String(rowItemId).trim() !== String(itemId).trim()) continue;
        var colorId = (data[i][COL.INVENTORY_BALANCE.COLOR_ID] || '').toString().trim();
        var balance = parseFloat(data[i][COL.INVENTORY_BALANCE.BALANCE]) || 0;
        var updatedAt = data[i][COL.INVENTORY_BALANCE.UPDATED_AT] || '';
        balances.push({
          color_id: colorId,
          color_name: colorsMap[colorId] || (colorId ? 'لون ' + colorId : 'بدون لون'),
          balance: balance, last_update: updatedAt
        });
      }
    }
    balances.sort(function(a, b) { return b.balance - a.balance; });
    console.log("✅ getItemBalancesForReports: Found", balances.length, "colors for item", itemId);
    return balances;
  } catch (e) {
    console.error("❌ getItemBalancesForReports error:", e.toString());
    return [];
  }
}

function getColorBalancesForReports(warehouseId, itemId, colorId, fiscalYear) {
  try {
    var COL = _getCOL();
    var year = getFiscalYearCodeForReports(fiscalYear);
    if (!year) { return []; }
    var invBalId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Inventory_Balance", year) : null;
    if (!invBalId) { return []; }
    var colors = typeof getColors === 'function' ? getColors() : [];
    var colorsMap = {};
    for (var i = 0; i < colors.length; i++) { colorsMap[colors[i].id] = colors[i].color_name; }
    var items = typeof getItems === 'function' ? getItems() : [];
    var itemsMap = {};
    for (var i = 0; i < items.length; i++) {
      itemsMap[items[i].id] = {
        code: items[i].item_code, name: items[i].item_name,
        cost_price: items[i].cost_price, sale_price: items[i].sale_price
      };
    }
    var sheet = SpreadsheetApp.openById(invBalId).getSheets()[0];
    var data = sheet.getDataRange().getDisplayValues();
    var colorBalance = null;
    if (data.length > 1) {
      for (var i = 1; i < data.length; i++) {
        var rowYear = (data[i][COL.INVENTORY_BALANCE.FISCAL_YEAR] || '').toString().trim();
        if (rowYear !== String(year)) continue;
        var rowWhId = (data[i][COL.INVENTORY_BALANCE.WAREHOUSE_ID] || '').toString().trim();
        var rowItemId = (data[i][COL.INVENTORY_BALANCE.ITEM_ID] || '').toString().trim();
        var rowColorId = (data[i][COL.INVENTORY_BALANCE.COLOR_ID] || '').toString().trim();
        if (String(rowWhId).trim() === String(warehouseId).trim() &&
            String(rowItemId).trim() === String(itemId).trim() &&
            String(rowColorId).trim() === String(colorId).trim()) {
          colorBalance = {
            item_id: itemId,
            item_code: itemsMap[itemId] ? itemsMap[itemId].code : itemId,
            item_name: itemsMap[itemId] ? itemsMap[itemId].name : 'Unknown',
            color_id: colorId,
            color_name: colorsMap[colorId] || (colorId ? 'لون ' + colorId : 'بدون لون'),
            balance: parseFloat(data[i][COL.INVENTORY_BALANCE.BALANCE]) || 0,
            avg_cost: itemsMap[itemId] ? itemsMap[itemId].cost_price : 0,
            last_update: data[i][COL.INVENTORY_BALANCE.UPDATED_AT] || ''
          };
          break;
        }
      }
    }
    if (!colorBalance) { return []; }
    return [colorBalance];
  } catch (e) {
    console.error("❌ getColorBalancesForReports error:", e.toString());
    return [];
  }
}

function getItemStockMovementsForReports(warehouseId, itemId, colorId, fiscalYear) {
  try {
    var COL = _getCOL();
    var year = getFiscalYearCodeForReports(fiscalYear);
    if (!year) { return { error: "No fiscal year specified" }; }
    var stockMovId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Stock_Movements", year) : null;
    if (!stockMovId) { throw new Error("Stock_Movements table not found for year: " + year); }
    var items = typeof getItems === 'function' ? getItems() : [];
    var itemsMap = {};
    for (var i = 0; i < items.length; i++) { itemsMap[items[i].id] = { code: items[i].item_code, name: items[i].item_name }; }
    var colors = typeof getColors === 'function' ? getColors() : [];
    var colorsMap = {};
    for (var i = 0; i < colors.length; i++) { colorsMap[colors[i].id] = colors[i].color_name; }
    var warehouses = typeof getWarehouses === 'function' ? getWarehouses() : [];
    var whMap = {};
    for (var i = 0; i < warehouses.length; i++) { whMap[warehouses[i].id] = { code: warehouses[i].warehouse_code, name: warehouses[i].warehouse_name }; }
    var stockSheet = SpreadsheetApp.openById(stockMovId).getSheets()[0];
    var stockData = stockSheet.getDataRange().getDisplayValues();
    var movements = [];
    var runningBalance = 0;
    if (stockData.length > 1) {
      for (var i = 1; i < stockData.length; i++) {
        var rowYear = (stockData[i][COL.STOCK_MOVEMENTS.FISCAL_YEAR] || '').toString().trim();
        if (rowYear !== String(year)) continue;
        var movWhId = (stockData[i][COL.STOCK_MOVEMENTS.WAREHOUSE_ID] || '').toString().trim();
        var movItemId = (stockData[i][COL.STOCK_MOVEMENTS.ITEM_ID] || '').toString().trim();
        var movColorId = (stockData[i][COL.STOCK_MOVEMENTS.COLOR_ID] || '').toString().trim();
        if (warehouseId && String(movWhId).trim() !== String(warehouseId).trim()) continue;
        if (itemId && String(movItemId).trim() !== String(itemId).trim()) continue;
        if (colorId && String(movColorId).trim() !== String(colorId).trim()) continue;
        var qtyIn = parseFloat(stockData[i][COL.STOCK_MOVEMENTS.QTY_IN]) || 0;
        var qtyOut = parseFloat(stockData[i][COL.STOCK_MOVEMENTS.QTY_OUT]) || 0;
        var unitCost = parseFloat(stockData[i][COL.STOCK_MOVEMENTS.UNIT_COST]) || 0;
        var date = stockData[i][COL.STOCK_MOVEMENTS.DATE];
        var refType = stockData[i][COL.STOCK_MOVEMENTS.REF_TYPE];
        var refId = stockData[i][COL.STOCK_MOVEMENTS.REF_ID];
        var notes = stockData[i][COL.STOCK_MOVEMENTS.NOTES] || '';
        runningBalance += qtyIn - qtyOut;
        movements.push({
          date: date,
          item_code: itemsMap[movItemId] ? itemsMap[movItemId].code : movItemId,
          item_name: itemsMap[movItemId] ? itemsMap[movItemId].name : 'Unknown',
          warehouse_code: whMap[movWhId] ? whMap[movWhId].code : movWhId,
          warehouse_name: whMap[movWhId] ? whMap[movWhId].name : 'Unknown',
          color_id: movColorId,
          color_name: colorsMap[movColorId] || (movColorId ? 'لون ' + movColorId : 'بدون لون'),
          qty_in: qtyIn, qty_out: qtyOut, balance_after: runningBalance,
          cost_price: unitCost, ref_type: refType, ref_id: refId, notes: notes
        });
      }
    }
    movements.sort(function(a, b) { return new Date(a.date) - new Date(b.date); });
    var totalQtyIn = 0, totalQtyOut = 0;
    for (var i = 0; i < movements.length; i++) {
      totalQtyIn += movements[i].qty_in;
      totalQtyOut += movements[i].qty_out;
    }
    return {
      movements: movements, total_qty_in: totalQtyIn, total_qty_out: totalQtyOut,
      final_balance: runningBalance, fiscal_year: year
    };
  } catch (e) {
    console.error("❌ getItemStockMovementsForReports error:", e.toString());
    return { error: e.toString() };
  }
}

// ========== ⚖️ التقارير المالية ==========
function getTrialBalanceForReports(fromDate, toDate, fiscalYear) {
  try {
    var COL = _getCOL();
    var year = getFiscalYearCodeForReports(fiscalYear);
    if (!year) { return { error: "No fiscal year specified" }; }
    var accMovId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Account_Movements", year) : null;
    var coaId = typeof getMasterTableId === 'function' ? getMasterTableId("Chart_Of_Accounts") : null;
    if (!accMovId || !coaId) { throw new Error("Required tables not found for year: " + year); }
    var accounts = {};
    var coaSheet = SpreadsheetApp.openById(coaId).getSheets()[0];
    var coaData = coaSheet.getDataRange().getDisplayValues();
    if (coaData.length > 1) {
      for (var i = 1; i < coaData.length; i++) {
        var id = (coaData[i][COL.CHART_OF_ACCOUNTS.ID] || '').toString().trim();
        if (id) {
          accounts[id] = {
            id: id, account_no: coaData[i][COL.CHART_OF_ACCOUNTS.ACCOUNT_NO],
            account_name: coaData[i][COL.CHART_OF_ACCOUNTS.ACCOUNT_NAME],
            bs_group: (coaData[i][COL.CHART_OF_ACCOUNTS.BS_GROUP] || '').trim(),
            pl_group: (coaData[i][COL.CHART_OF_ACCOUNTS.PL_GROUP] || '').trim()
          };
        }
      }
    }
    var accSheet = SpreadsheetApp.openById(accMovId).getSheets()[0];
    var accData = accSheet.getDataRange().getDisplayValues();
    var openingBalances = {}, periodDebit = {}, periodCredit = {};
    if (accData.length > 1) {
      for (var i = 1; i < accData.length; i++) {
        var rowYear = (accData[i][COL.ACCOUNT_MOVEMENTS.FISCAL_YEAR] || '').toString().trim();
        if (rowYear !== String(year)) continue;
        var accountId = (accData[i][COL.ACCOUNT_MOVEMENTS.ACCOUNT_ID] || '').toString().trim();
        if (!accountId) continue;
        var movDate = accData[i][COL.ACCOUNT_MOVEMENTS.DATE];
        var debit = parseFloat(accData[i][COL.ACCOUNT_MOVEMENTS.DEBIT]) || 0;
        var credit = parseFloat(accData[i][COL.ACCOUNT_MOVEMENTS.CREDIT]) || 0;
        if (fromDate && movDate < fromDate) {
          openingBalances[accountId] = (openingBalances[accountId] || 0) + (debit - credit);
        } else if (!fromDate || (!toDate || (movDate >= fromDate && movDate <= toDate))) {
          periodDebit[accountId] = (periodDebit[accountId] || 0) + debit;
          periodCredit[accountId] = (periodCredit[accountId] || 0) + credit;
        }
      }
    }
    var tb = [];
    var totalDebit = 0, totalCredit = 0;
    for (var id in accounts) {
      var acc = accounts[id];
      var opening = openingBalances[id] || 0;
      var debit = periodDebit[id] || 0;
      var credit = periodCredit[id] || 0;
      var closing = opening + debit - credit;
      totalDebit += debit;
      totalCredit += credit;
      tb.push({
        id: acc.id, account_no: acc.account_no, account_name: acc.account_name,
        bs_group: acc.bs_group, pl_group: acc.pl_group,
        opening_balance: _round2(opening), debit: _round2(debit),
        credit: _round2(credit), closing_balance: _round2(closing)
      });
    }
    console.log("📊 ميزان المراجعة - الإجماليات:", {
      total_debit: totalDebit, total_credit: totalCredit,
      difference: Math.abs(totalDebit - totalCredit)
    });
    return {
      accounts: tb, total_debit: _round2(totalDebit), total_credit: _round2(totalCredit),
      from_date: fromDate || "Beginning", to_date: toDate || "Present", fiscal_year: year
    };
  } catch (e) {
    console.error("❌ getTrialBalanceForReports error:", e.toString());
    return { error: e.toString() };
  }
}

// ========== 📈 قائمة الدخل - النسخة المُصححة ==========
/**
 * الحصول على قائمة الدخل
 * ✅ تتعامل مع أرصدة الحسابات (مدين - دائن = رصيد)
 * ✅ الرصيد يظهر في مكانه سواء موجب أو سالب
 */
function getProfitAndLossForReports(fiscalYear) {
  try {
    // ✅ استخدام دوال core.gs مباشرة
    var year = typeof getFiscalYearCode === 'function' ? getFiscalYearCode(fiscalYear) : null;
    if (!year && typeof getFiscalYearInfo === 'function') {
      var fy = getFiscalYearInfo(fiscalYear);
      year = fy && fy.year_code ? fy.year_code : null;
    }
    if (!year) { year = new Date().getFullYear().toString(); }
    
    const coaId = typeof getMasterTableId === 'function' ? getMasterTableId("Chart_Of_Accounts") : null;
    const accMovId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Account_Movements", year) : null;
    
    if (!accMovId || !coaId) {
      throw new Error("Required tables not found for year: " + year);
    }
    
    // دوال مساعدة
    const round2 = function(num) { return Math.round((num || 0) * 100) / 100; };
    
    // ✅ 1. قراءة شجرة الحسابات
    const accountTypes = {};
    const accountNames = {};
    const coaSheet = SpreadsheetApp.openById(coaId).getSheets()[0];
    const coaData = coaSheet.getDataRange().getDisplayValues();
    
    if (coaData.length > 1) {
      for (let i = 1; i < coaData.length; i++) {
        const id = (coaData[i][COL.CHART_OF_ACCOUNTS.ID] || '').toString().trim();
        const plGroup = (coaData[i][COL.CHART_OF_ACCOUNTS.PL_GROUP] || '').trim();
        const accountName = (coaData[i][COL.CHART_OF_ACCOUNTS.ACCOUNT_NAME] || '').toString().trim();
        if (!id) continue;
        
        accountTypes[id] = plGroup;
        accountNames[id] = accountName;
      }
    }
    
    // ✅ 2. حساب الرصيد الصافي لكل حساب
    const accSheet = SpreadsheetApp.openById(accMovId).getSheets()[0];
    const accData = accSheet.getDataRange().getDisplayValues();
    
    const accountNetBalance = {};
    
    if (accData.length > 1) {
      for (let i = 1; i < accData.length; i++) {
        const rowYear = (accData[i][COL.ACCOUNT_MOVEMENTS.FISCAL_YEAR] || '').toString().trim();
        if (rowYear !== String(year)) continue;
        
        const accountId = (accData[i][COL.ACCOUNT_MOVEMENTS.ACCOUNT_ID] || '').toString().trim();
        if (!accountId) continue;
        
        const debit = parseFloat(accData[i][COL.ACCOUNT_MOVEMENTS.DEBIT]) || 0;
        const credit = parseFloat(accData[i][COL.ACCOUNT_MOVEMENTS.CREDIT]) || 0;
        
        if (!accountNetBalance[accountId]) {
          accountNetBalance[accountId] = 0;
        }
        accountNetBalance[accountId] += (debit - credit);
      }
    }
    
    // ✅ 3. حساب المجاميع حسب التصنيف (مع الحفاظ على الإشارات الحقيقية)
    let totalRevenue = 0;           // PL-R
    let totalOtherRevenue = 0;      // PL-OR
    let totalCOGS = 0;              // PL-C
    let totalExpenses = 0;          // PL-E
    let totalOtherExpenses = 0;     // PL-OE
    
    // تفاصيل كل مجموعة للتدقيق
    const revenueAccounts = [];
    const otherRevenueAccounts = [];
    const cogsAccounts = [];
    const expensesAccounts = [];
    const otherExpensesAccounts = [];
    
    for (const accountId in accountNetBalance) {
      const netBalance = accountNetBalance[accountId]; // debit - credit
      const plGroup = accountTypes[accountId];
      
      if (!plGroup) continue;
      
      const accountName = accountNames[accountId] || accountId;
      let displayValue = 0;
      
      switch(plGroup) {
        case 'PL-R':  // إيرادات المبيعات
          // الإيرادات: الرصيد الطبيعي دائن، netBalance = debit - credit يكون سالب
          // نحوله لموجب: displayValue = -netBalance
          displayValue = -netBalance;
          totalRevenue += displayValue;
          if (Math.abs(displayValue) >= 0.01) {
            revenueAccounts.push({ id: accountId, name: accountName, balance: displayValue });
          }
          break;
          
        case 'PL-OR': // إيرادات أخرى
          displayValue = -netBalance;
          totalOtherRevenue += displayValue;
          if (Math.abs(displayValue) >= 0.01) {
            otherRevenueAccounts.push({ id: accountId, name: accountName, balance: displayValue });
          }
          break;
          
        case 'PL-C':  // تكلفة المبيعات
          // التكلفة: الرصيد الطبيعي مدين، netBalance = debit - credit يكون موجب
          displayValue = netBalance;
          totalCOGS += displayValue;
          if (Math.abs(displayValue) >= 0.01) {
            cogsAccounts.push({ id: accountId, name: accountName, balance: displayValue });
          }
          break;
          
        case 'PL-E':  // مصروفات تشغيلية
          // المصروفات: الرصيد الطبيعي مدين، netBalance = debit - credit
          // إذا كان موجب = مصروف، إذا كان سالب = استرداد مصروف
          displayValue = netBalance;
          totalExpenses += displayValue;
          if (Math.abs(displayValue) >= 0.01) {
            expensesAccounts.push({ id: accountId, name: accountName, balance: displayValue });
          }
          break;
          
        case 'PL-OE': // مصروفات أخرى
          displayValue = netBalance;
          totalOtherExpenses += displayValue;
          if (Math.abs(displayValue) >= 0.01) {
            otherExpensesAccounts.push({ id: accountId, name: accountName, balance: displayValue });
          }
          break;
      }
    }
    
    // ✅ حساب النتائج النهائية
    const totalRevenueAll = totalRevenue + totalOtherRevenue;
    const totalExpensesAll = totalExpenses + totalOtherExpenses;
    const grossProfit = totalRevenueAll - totalCOGS;
    const netProfit = grossProfit - totalExpensesAll;
    
    // ✅ تسجيل للتدقيق
    console.log("=" .repeat(50));
    console.log("📊 P&L Report for Year:", year);
    console.log("-".repeat(50));
    console.log("💰 REVENUE (PL-R):");
    revenueAccounts.forEach(acc => console.log(`   ${acc.name}: ${acc.balance.toFixed(2)}`));
    console.log(`   Total Revenue: ${totalRevenue.toFixed(2)}`);
    console.log("\n💰 OTHER REVENUE (PL-OR):");
    otherRevenueAccounts.forEach(acc => console.log(`   ${acc.name}: ${acc.balance.toFixed(2)}`));
    console.log(`   Total Other Revenue: ${totalOtherRevenue.toFixed(2)}`);
    console.log("\n📦 COST OF SALES (PL-C):");
    cogsAccounts.forEach(acc => console.log(`   ${acc.name}: ${acc.balance.toFixed(2)}`));
    console.log(`   Total COGS: ${totalCOGS.toFixed(2)}`);
    console.log("\n📉 EXPENSES (PL-E):");
    expensesAccounts.forEach(acc => console.log(`   ${acc.name}: ${acc.balance.toFixed(2)}`));
    console.log(`   Total Expenses: ${totalExpenses.toFixed(2)}`);
    console.log("\n📉 OTHER EXPENSES (PL-OE):");
    otherExpensesAccounts.forEach(acc => console.log(`   ${acc.name}: ${acc.balance.toFixed(2)}`));
    console.log(`   Total Other Expenses: ${totalOtherExpenses.toFixed(2)}`);
    console.log("-".repeat(50));
    console.log(`Gross Profit: ${grossProfit.toFixed(2)}`);
    console.log(`Net Profit: ${netProfit.toFixed(2)}`);
    console.log("=" .repeat(50));
    
    // ✅ إرجاع النتائج مع الإشارات الصحيحة
    return {
      // القيم الأساسية (مع الإشارات الحقيقية)
      revenue: round2(totalRevenue),                    // 90,000
      other_revenue: round2(totalOtherRevenue),         // 50
      cost_of_sales: round2(totalCOGS),                 // 81,000
      expenses: round2(totalExpenses),                  // -50 (مصروف سالب)
      other_expenses: round2(totalOtherExpenses),       // 100 (مصروف موجب)
      operating_expenses: round2(totalExpenses),        // -50
      
      // النتائج المحسوبة
      gross_profit: round2(grossProfit),                // 9,050
      net_profit: round2(netProfit),                    // 9,000
      
      // مجاميع إضافية
      total_revenue: round2(totalRevenueAll),           // 90,050
      total_expenses: round2(totalExpensesAll),         // 50
      
      // بيانات تعريفية
      fiscal_year: year,
      
      // تفاصيل للتدقيق (يمكن استخدامها في التقارير)
      details: {
        revenue: revenueAccounts,
        other_revenue: otherRevenueAccounts,
        cost_of_sales: cogsAccounts,
        expenses: expensesAccounts,
        other_expenses: otherExpensesAccounts
      },
      
      // ✅ إضافة معلومات مساعدة للواجهة الأمامية
      _display: {
        // القيم المهيأة للعرض (مع إشارات واضحة)
        formatted_expenses: totalExpenses < 0 ? `(${Math.abs(totalExpenses).toFixed(2)})` : totalExpenses.toFixed(2),
        formatted_other_expenses: totalOtherExpenses < 0 ? `(${Math.abs(totalOtherExpenses).toFixed(2)})` : totalOtherExpenses.toFixed(2),
        formatted_total_expenses: totalExpensesAll < 0 ? `(${Math.abs(totalExpensesAll).toFixed(2)})` : totalExpensesAll.toFixed(2),
        
        // إشارات للواجهة (لتحديد كيفية العرض)
        expenses_sign: totalExpenses >= 0 ? "positive" : "negative",
        other_expenses_sign: totalOtherExpenses >= 0 ? "positive" : "negative",
        net_profit_sign: netProfit >= 0 ? "profit" : "loss"
      }
    };
    
  } catch (e) {
    console.error("❌ getProfitAndLossForReports error:", e.toString());
    return {
      error: e.toString(),
      revenue: 0,
      other_revenue: 0,
      cost_of_sales: 0,
      gross_profit: 0,
      expenses: 0,
      other_expenses: 0,
      operating_expenses: 0,
      net_profit: 0,
      fiscal_year: fiscalYear || ""
    };
  }
}
// ========== 🏦 الميزانية العمومية - النسخة المُصححة ==========
/**
 * الحصول على الميزانية العمومية مفصلة
 * ✅ تتعامل مع أرصدة الحسابات (مدين - دائن = رصيد)
 * ✅ الرصيد يظهر في مكانه سواء موجب أو سالب
 * ✅ تحافظ على المعادلة المحاسبية: الأصول = الالتزامات + حقوق الملكية
 */
function getBalanceSheetDetailedForReports(fiscalYear) {
  try {
    // ✅ استخدام دوال core.gs مباشرة
    var year = typeof getFiscalYearCode === 'function' ? getFiscalYearCode(fiscalYear) : null;
    if (!year && typeof getFiscalYearInfo === 'function') {
      var fy = getFiscalYearInfo(fiscalYear);
      year = fy && fy.year_code ? fy.year_code : null;
    }
    if (!year) { year = new Date().getFullYear().toString(); }
    
    const accMovId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Account_Movements", year) : null;
    const coaId = typeof getMasterTableId === 'function' ? getMasterTableId("Chart_Of_Accounts") : null;
    
    if (!accMovId || !coaId) { throw new Error("Required tables not found for year: " + year); }
    
    // دوال مساعدة محلية بسيطة
    const round2 = function(num) { return Math.round((num || 0) * 100) / 100; };
    const isMaterial = function(num) { return Math.abs(num || 0) >= 0.01; };
    
    // بناء هيكل الحسابات
    const accounts = {};
    const coaSheet = SpreadsheetApp.openById(coaId).getSheets()[0];
    const coaData = coaSheet.getDataRange().getDisplayValues();
    
    if (coaData.length > 1) {
      for (let i = 1; i < coaData.length; i++) {
        const id = (coaData[i][COL.CHART_OF_ACCOUNTS.ID] || '').toString().trim();
        const accountNo = (coaData[i][COL.CHART_OF_ACCOUNTS.ACCOUNT_NO] || '').toString().trim();
        const name = (coaData[i][COL.CHART_OF_ACCOUNTS.ACCOUNT_NAME] || '').toString().trim();
        const bsGroup = (coaData[i][COL.CHART_OF_ACCOUNTS.BS_GROUP] || "").toString().trim();
        if (!id || !accountNo) continue;
        accounts[id] = { id, name, account_no: accountNo, bs_group: bsGroup ? bsGroup.trim().toUpperCase() : '' };
      }
    }
    
    // ✅ حساب أرصدة الحسابات (تجميع الحركات)
    const accountBalances = {};
    const accSheet = SpreadsheetApp.openById(accMovId).getSheets()[0];
    const accData = accSheet.getDataRange().getDisplayValues();
    
    if (accData.length > 1) {
      for (let i = 1; i < accData.length; i++) {
        const rowYear = (accData[i][COL.ACCOUNT_MOVEMENTS.FISCAL_YEAR] || '').toString().trim();
        if (rowYear !== String(year)) continue;
        const accId = (accData[i][COL.ACCOUNT_MOVEMENTS.ACCOUNT_ID] || '').toString().trim();
        if (!accId || !accounts[accId]) continue;
        const debit = Number(accData[i][COL.ACCOUNT_MOVEMENTS.DEBIT]) || 0;
        const credit = Number(accData[i][COL.ACCOUNT_MOVEMENTS.CREDIT]) || 0;
        
        if (!accountBalances[accId]) {
          accountBalances[accId] = { debit: 0, credit: 0 };
        }
        accountBalances[accId].debit += debit;
        accountBalances[accId].credit += credit;
      }
    }
    
    // ✅ تصنيف الحسابات وحساب المجاميع
    const assetAccounts = [], liabilityAccounts = [], equityAccounts = [];
    let assetsTotal = 0, liabilitiesTotal = 0, equityTotal = 0;
    
    for (const accId in accounts) {
      const acc = accounts[accId];
      const bsGroup = acc.bs_group;
      if (!bsGroup || bsGroup.indexOf('BS-') !== 0) continue;
      
      const balance = accountBalances[accId] || { debit: 0, credit: 0 };
      const netBalance = balance.debit - balance.credit;  // ✅ الرصيد الصافي
      
      // ✅ حساب الرصيد للعرض حسب طبيعة الحساب
      let reportBalance;
      if (bsGroup === 'BS-A') {
        // الأصول: الرصيد الطبيعي مدين → netBalance موجب = مدين
        reportBalance = netBalance;
      } else if (bsGroup === 'BS-L' || bsGroup === 'BS-E') {
        // الالتزامات/حقوق الملكية: الرصيد الطبيعي دائن → netBalance سالب = دائن
        reportBalance = -netBalance;
      } else {
        continue;
      }
      
      // ✅ عرض الرصيد بقيمته الفعلية (موجب أو سالب)
      const roundedBalance = round2(reportBalance);
      const accountInfo = { 
        account_id: accId, 
        account_name: acc.name, 
        account_no: acc.account_no, 
        balance: roundedBalance 
      };
      
      if (bsGroup === 'BS-A') {
        assetAccounts.push(accountInfo);
        assetsTotal += roundedBalance;  // ✅ قد يكون سالب إذا كان الرصيد معكوس
      } else if (bsGroup === 'BS-L') {
        liabilityAccounts.push(accountInfo);
        liabilitiesTotal += roundedBalance;
      } else if (bsGroup === 'BS-E') {
        equityAccounts.push(accountInfo);
        equityTotal += roundedBalance;
      }
    }
    
    // ✅ إضافة صافي الربح/الخسارة إلى حقوق الملكية
    const plResult = typeof getProfitAndLossForReports === 'function' ? getProfitAndLossForReports(year) : 
                     (typeof getProfitAndLoss === 'function' ? getProfitAndLoss(year) : null);
    const netProfit = (plResult && typeof plResult.net_profit === "number") ? plResult.net_profit : 0;
    
    if (isMaterial(netProfit)) {
      equityAccounts.push({
        account_id: "NET_PROFIT",
        account_name: netProfit >= 0 ? "صافي الربح للسنة" : "صافي الخسارة للسنة",
        account_no: "PL-NET",
        balance: round2(netProfit)  // ✅ مع الإشارة الصحيحة
      });
      equityTotal += netProfit;  // ✅ نضيف مع الإشارة (موجب للربح، سالب للخسارة)
    }
    
    // الفرز والمجاميع النهائية
    assetAccounts.sort((a, b) => a.account_no.localeCompare(b.account_no));
    liabilityAccounts.sort((a, b) => a.account_no.localeCompare(b.account_no));
    equityAccounts.sort((a, b) => a.account_no.localeCompare(b.account_no));
    
    assetsTotal = round2(assetsTotal);
    liabilitiesTotal = round2(liabilitiesTotal);
    equityTotal = round2(equityTotal);
    
    const totalLiabEquity = round2(liabilitiesTotal + equityTotal);
    const balancingDifference = round2(assetsTotal - totalLiabEquity);
    
    return {
      assets: { sub: assetAccounts, total: assetsTotal },
      liabilities: { sub: liabilityAccounts, total: liabilitiesTotal },
      equity: { sub: equityAccounts, total: equityTotal },
      total_assets: assetsTotal,
      total_liabilities_equity: totalLiabEquity,
      balancing_difference: balancingDifference,
      is_balanced: Math.abs(balancingDifference) < 0.01,  // ✅ التحقق من التوازن
      fiscal_year: year,
      net_profit_included: round2(netProfit)
    };
    
  } catch (e) {
    console.error("❌ getBalanceSheetDetailedForReports error:", e.toString());
    return { error: e.toString() };
  }
}
// ========== 📅 السنة المالية للتقارير ==========
function getActiveFiscalYearForReports(fiscalYear) {
  try {
    var year = getFiscalYearCodeForReports(fiscalYear);
    if (year) { return { year_code: year, date_from: "", date_to: "", is_active: true }; }
    var currentYear = new Date().getFullYear().toString();
    return {
      year_code: currentYear, date_from: currentYear + "-01-01",
      date_to: currentYear + "-12-31", is_active: false, note: "Default current year"
    };
  } catch (e) {
    console.error("❌ getActiveFiscalYearForReports error:", e.toString());
    var currentYear = new Date().getFullYear().toString();
    return {
      year_code: currentYear, date_from: currentYear + "-01-01",
      date_to: currentYear + "-12-31", is_active: false, error: e.toString()
    };
  }
}

// ========== 🔍 دوال تشخيصية ==========
function debugProfitAndLossForReports(fiscalYear) {
  console.log("🔍 === DEBUG: Profit & Loss ===");
  var year = getFiscalYearCodeForReports(fiscalYear);
  console.log("Fiscal Year:", year);
  var links = typeof loadJSON === 'function' ? loadJSON('TABLE_LINKS', null) : null;
  console.log("TABLE_LINKS:", links ? "exists" : "NOT FOUND");
  if (year) {
    var accMovId = typeof getYearlyTableId === 'function' ? getYearlyTableId("Account_Movements", year) : null;
    console.log("Account_Movements ID:", accMovId);
    if (accMovId) {
      try {
        var sheet = SpreadsheetApp.openById(accMovId).getSheets()[0];
        console.log("Movement rows:", sheet.getLastRow() - 1);
      } catch (e) { console.log("Error accessing sheet:", e.toString()); }
    }
  }
  var coaId = typeof getMasterTableId === 'function' ? getMasterTableId("Chart_Of_Accounts") : null;
  console.log("Chart_Of_Accounts ID:", coaId);
  var result = getProfitAndLossForReports(year);
  console.log("📊 P&L Result:", result);
  return result;
}

function debugAllReportsForReports(fiscalYear) {
  console.log("🔍 === DEBUG: All Reports ===");
  var year = getFiscalYearCodeForReports(fiscalYear);
  console.log("Fiscal Year:", year);
  var links = typeof loadJSON === 'function' ? loadJSON('TABLE_LINKS', null) : null;
  console.log("TABLE_LINKS:", links ? "exists" : "NOT FOUND");
  return { fiscal_year: year, table_links: links ? "exists" : "not found", timestamp: new Date().toISOString() };
}

// ========== 📋 دوال إضافية ==========
function getLibraryVersionForReports() { return LIBRARY_VERSION; }

function showStoredDataInLogForReports() {
  try {
    var props = typeof getDocProperties === 'function' ? getDocProperties() : PropertiesService.getDocumentProperties();
    var allKeys = props.getKeys();
    console.log('ZEIOS ERP - Reports data');
    console.log('Keys:', allKeys.length);
    return { success: true, count: allKeys.length, keys: allKeys };
  } catch (e) {
    console.error('Error:', e);
    return { success: false, error: e.toString() };
  }
}



/**
 * Reports_Client.gs – ZEIOS ERP Reports (SHEET VERSION)
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

// ========== 📅 السنة المالية ==========
function getActiveFiscalYearForReports() {
  try { return ZEIOS.getActiveFiscalYearForReports(); }
  catch (e) { return {year_code:null,date_from:'',date_to:'',is_active:false}; }
}

function getFiscalYearCodeForReports() {
  try { return ZEIOS.getFiscalYearCodeForReports(); }
  catch (e) { return null; }
}

// ========== 📊 كشف الحساب ==========
function getAllAccountsForStatement() {
  try { return ZEIOS.getAllAccountsForStatementForReports(); }
  catch (e) { return []; }
}

function getAccountStatement(accountId, fromDate, toDate, fiscalYear) {
  try { return ZEIOS.getAccountStatementForReports(accountId, fromDate, toDate, fiscalYear); }
  catch (e) { return { error: e.toString() }; }
}

// ========== 📦 المخزون ==========
function getItemsForReports() {
  try { return ZEIOS.getItemsForReportsForReports(); }
  catch (e) { return []; }
}

function getWarehousesForReports() {
  try { return ZEIOS.getWarehousesForReportsForReports(); }
  catch (e) { return []; }
}

function getWarehouseBalances(warehouseId, fiscalYear) {
  try { return ZEIOS.getWarehouseBalancesForReports(warehouseId, fiscalYear); }
  catch (e) { return []; }
}

function getItemBalances(warehouseId, itemId, fiscalYear) {
  try { return ZEIOS.getItemBalancesForReports(warehouseId, itemId, fiscalYear); }
  catch (e) { return []; }
}

function getColorBalances(warehouseId, itemId, colorId, fiscalYear) {
  try { return ZEIOS.getColorBalancesForReports(warehouseId, itemId, colorId, fiscalYear); }
  catch (e) { return []; }
}

function getItemStockMovements(warehouseId, itemId, colorId, fiscalYear) {
  try { return ZEIOS.getItemStockMovementsForReports(warehouseId, itemId, colorId, fiscalYear); }
  catch (e) { return { error: e.toString() }; }
}

// ========== ⚖️ التقارير المالية ==========
function getTrialBalance(fromDate, toDate, fiscalYear) {
  try { return ZEIOS.getTrialBalanceForReports(fromDate, toDate, fiscalYear); }
  catch (e) { return { error: e.toString() }; }
}

function getProfitAndLoss(fiscalYear) {
  try { return ZEIOS.getProfitAndLossForReports(fiscalYear); }
  catch (e) { return { error: e.toString() }; }
}

function getBalanceSheetDetailed(fiscalYear) {
  try { return ZEIOS.getBalanceSheetDetailedForReports(fiscalYear); }
  catch (e) { return { error: e.toString() }; }
}

// ========== 🔍 دوال مساعدة ==========
function getLibraryVersionForReports() {
  try { return ZEIOS.getLibraryVersionForReports(); }
  catch (e) { return 'غير متصل'; }
}

function debugAllReports(fiscalYear) {
  try { return ZEIOS.debugAllReportsForReports(fiscalYear); }
  catch (e) { return { error: e.toString() }; }
}

function showStoredDataInLogForReports() {
  try { return ZEIOS.showStoredDataInLogForReports(); }
  catch (e) { return { error: e.toString() }; }
}

// ========== 🖥️ دوال واجهة لفتح النماذج (محلية - لا تعتمد على المكتبة) ==========
function openFormWithId(pageName, recordId, fiscalYear, title) {
  try {
    if (!pageName || !recordId) {
      return { success: false, message: '❌ البيانات غير مكتملة' };
    }
    var params = { editMode: true, recordId: recordId, fiscalYear: fiscalYear, timestamp: new Date().toISOString() };
    PropertiesService.getScriptProperties().setProperty('EDIT_REQ_' + pageName + '_' + recordId.substring(0, 8), JSON.stringify(params));
    var html = HtmlService.createHtmlOutputFromFile(pageName)
      .setWidth(1400).setHeight(900)
      .setTitle(title || 'تعديل سجل - ZEIOS ERP')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    try {
      SpreadsheetApp.getUi().showModalDialog(html, title || 'ZEIOS ERP');
      return { success: true, mode: 'spreadsheet' };
    } catch (e) {
      var baseUrl = ScriptApp.getService ? ScriptApp.getService().getUrl() : null;
      if (baseUrl) {
        return { success: true, mode: 'webapp', url: baseUrl + '?page=' + pageName + '&edit=' + recordId };
      }
      return { success: false, message: 'لا يمكن عرض النموذج في هذا السياق' };
    }
  } catch (e) {
    console.error('❌ openFormWithId error:', e);
    return { success: false, message: e.toString() };
  }
}

function getEditRequest(pageName) {
  try {
    var props = PropertiesService.getScriptProperties();
    if (!props) { return { editMode: false }; }
    var keys = props.getKeys();
    for (var i = 0; i < keys.length; i++) {
      if (keys[i].indexOf('EDIT_REQ_' + pageName) === 0) {
        var params = JSON.parse(props.getProperty(keys[i]));
        props.deleteProperty(keys[i]);
        return params;
      }
    }
    return { editMode: false };
  } catch (e) {
    console.error('❌ getEditRequest error:', e);
    return { editMode: false };
  }
}

function showDashboard() {
  try {
    var html = HtmlService.createHtmlOutputFromFile('dashboard')
      .setWidth(1400).setHeight(900)
      .setTitle('📊 لوحة التحكم - ZEIOS ERP')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    SpreadsheetApp.getUi().showModalDialog(html, 'ZEIOS ERP');
    return { success: true };
  } catch (e) { return { success: false, message: e.toString() }; }
}

function openAccountForm() {
  try {
    var html = HtmlService.createHtmlOutputFromFile('accounts')
      .setWidth(1400).setHeight(900)
      .setTitle('📊 إدارة الحسابات - ZEIOS ERP')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    SpreadsheetApp.getUi().showModalDialog(html, 'إدارة الحسابات');
    return { success: true };
  } catch (e) { return { success: false, message: e.toString() }; }
}

function openItemForm() {
  try {
    var html = HtmlService.createHtmlOutputFromFile('items')
      .setWidth(1400).setHeight(900)
      .setTitle('📦 إدارة الأصناف - ZEIOS ERP')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    SpreadsheetApp.getUi().showModalDialog(html, 'إدارة الأصناف');
    return { success: true };
  } catch (e) { return { success: false, message: e.toString() }; }
}

function openColorForm() {
  try {
    var html = HtmlService.createHtmlOutputFromFile('colors')
      .setWidth(1000).setHeight(700)
      .setTitle('🎨 إدارة الألوان - ZEIOS ERP')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    SpreadsheetApp.getUi().showModalDialog(html, 'إدارة الألوان');
    return { success: true };
  } catch (e) { return { success: false, message: e.toString() }; }
}

// ========== ✅ دالة فحص الاتصال ==========
function checkReportsLibraryConnection() {
  try {
    if (typeof ZEIOS === 'undefined') {
      return { connected: false, message: '❌ المكتبة غير مربوطة' };
    }
    var version = typeof ZEIOS.getLibraryVersionForReports === 'function' ? ZEIOS.getLibraryVersionForReports() : 'غير معروف';
    return { connected: true, message: '✅ المكتبة مربوطة', version: version };
  } catch (e) {
    return { connected: false, message: '❌ خطأ: ' + e.toString() };
  }
}

// ========== 🧪 دالة اختبار شاملة ==========
function testAllReportsFunctions() {
  console.log('\n🔍 === اختبار جميع دوال التقارير ===\n');
  var results = {};
  results.library = checkReportsLibraryConnection();
  console.log('🔗 المكتبة:', results.library.message);
  try {
    results.fiscalYear = getActiveFiscalYearForReports();
    console.log('📅 السنة المالية:', results.fiscalYear.year_code);
  } catch (e) { console.log('❌ السنة المالية:', e.message); }
  try {
    results.accounts = getAllAccountsForStatement();
    console.log('📊 الحسابات:', results.accounts.length, 'حساب');
  } catch (e) { console.log('❌ الحسابات:', e.message); }
  try {
    results.items = getItemsForReports();
    console.log('📦 الأصناف:', results.items.length, 'صنف');
  } catch (e) { console.log('❌ الأصناف:', e.message); }
  try {
    results.warehouses = getWarehousesForReports();
    console.log('🏢 المستودعات:', results.warehouses.length, 'مستودع');
  } catch (e) { console.log('❌ المستودعات:', e.message); }
  try {
    var fy = results.fiscalYear?.year_code || null;
    results.pl = getProfitAndLoss(fy);
    console.log('📈 قائمة الدخل:', results.pl.success ? '✅' : '❌', results.pl.net_profit || results.pl.error);
  } catch (e) { console.log('❌ قائمة الدخل:', e.message); }
  try {
    var fy = results.fiscalYear?.year_code || null;
    results.bs = getBalanceSheetDetailed(fy);
    console.log('🏦 الميزانية:', results.bs.success ? '✅' : '❌', results.bs.total_assets || results.bs.error);
  } catch (e) { console.log('❌ الميزانية:', e.message); }
  console.log('\n✅ انتهى الاختبار');
  return results;
}
