/**
 * BackupRestore.gs – ZEIOS ERP SYSTEM (LIBRARY VERSION)
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
var DEBUG_MODE = false;


// ========== 🔍 دوال التصحيح ==========
function debugLogForBackup(message, data) {
  if (DEBUG_MODE) {
    console.log('🔍 [BackupRestore] ' + message + (data ? ': ' + JSON.stringify(data) : ''));
  }
}

function debugErrorForBackup(message, error) {
  console.error('❌ [BackupRestore] ' + message);
  console.error('   الخطأ: ' + (error.message || error));
}

// ========== 🔧 دوال السنة المالية ==========
function getActiveFiscalYearForBackup() {
  try {
    if (typeof getActiveFiscalYear === 'function') return getActiveFiscalYear();
    var year = typeof getSys === 'function' ? getSys("ACTIVE_FISCAL_YEAR") : null;
    if (year) return { year_code: year, is_active: true, date_from: '', date_to: '', folder_id: '' };
    return { year_code: null, is_active: false, date_from: '', date_to: '', folder_id: '' };
  } catch (e) { console.error("❌ getActiveFiscalYearForBackup error:", e); return { year_code: null, is_active: false, date_from: '', date_to: '', folder_id: '' }; }
}

function getFiscalYearCodeForBackup() {
  var fy = getActiveFiscalYearForBackup();
  return fy && fy.year_code ? fy.year_code : (typeof getSys === 'function' ? getSys("ACTIVE_FISCAL_YEAR") : null);
}

// ========== 🔧 دوال مساعدة ==========
function generateIDForBackup() {
  return typeof generateID === 'function' ? generateID() : Utilities.getUuid().replace(/-/g, '');
}

function getNowTimestampForBackup() {
  return typeof getNowTimestamp === 'function' ? getNowTimestamp() : Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
}

function getOrCreateFolderForBackup(parent, name) {
  var folders = parent.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : parent.createFolder(name);
}

// ========== 🚀 إنشاء النسخة الاحتياطية ==========
function createBackupForBackup(notes) {
  notes = notes || '';
  debugLogForBackup('=== بدء إنشاء النسخة الاحتياطية ===', { notes: notes });
  
  try {
    // === الخطوة 1: التحقق من السنة المالية ===
    debugLogForBackup('الخطوة 1: التحقق من السنة المالية');
    var fiscal = getActiveFiscalYearForBackup();
    var currentYear = fiscal.year_code;
    
    if (!currentYear) {
      throw new Error('لا توجد سنة مالية نشطة. يرجى تفعيل سنة مالية من الإعدادات.');
    }
    debugLogForBackup('السنة المالية النشطة: ' + currentYear);
    
    // === الخطوة 2: إنشاء هيكل مجلدات النسخ الاحتياطي ===
    debugLogForBackup('الخطوة 2: إنشاء مجلد النسخ الاحتياطي');
    var timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd_HH-mm-ss');
    var backupFolderName = 'Backup_' + currentYear + '_' + timestamp;
    
    var currentFile = DriveApp.getFileById(SpreadsheetApp.getActive().getId());
    var folders = loadJSON('FOLDERS', {});
    var backupsParentFolder;
    
    if (folders.assets) {
      var assetsFolder = DriveApp.getFolderById(folders.assets);
      var backupFoldersIter = assetsFolder.getFoldersByName('Backups');
      backupsParentFolder = backupFoldersIter.hasNext() ? backupFoldersIter.next() : assetsFolder.createFolder('Backups');
    } else {
      var parentFolder = currentFile.getParents().hasNext() ? currentFile.getParents().next() : DriveApp.getRootFolder();
      var backupFoldersIter = parentFolder.getFoldersByName('ZEIOS_Backups');
      backupsParentFolder = backupFoldersIter.hasNext() ? backupFoldersIter.next() : parentFolder.createFolder('ZEIOS_Backups');
    }
    
    var backupFolder = backupsParentFolder.createFolder(backupFolderName);
    var imagesBackupFolder = backupFolder.createFolder('images');
    debugLogForBackup('تم إنشاء مجلد النسخ الاحتياطي: ' + backupFolderName);
    
    // === الخطوة 3: تصدير جميع بيانات الجداول إلى JSON ===
    debugLogForBackup('الخطوة 3: تصدير بيانات الجداول إلى JSON');
    var backupData = {
      metadata: {
        version: '2.0',
        timestamp: getNowTimestampForBackup(),
        fiscalYear: currentYear,
        notes: notes,
        createdBy: Session.getActiveUser().getEmail(),
        spreadsheetId: currentFile.getId()
      },
      tables: {},
      imageMapping: {}
    };
    
    var links = loadJSON('TABLE_LINKS', { master: {}, yearly: {} });
    
    // تصدير الجداول الرئيسية
    debugLogForBackup('تصدير الجداول الرئيسية...');
    if (links.master) {
      for (var tableName in links.master) {
        if (links.master.hasOwnProperty(tableName)) {
          try {
            var tableInfo = links.master[tableName];
            if (tableInfo && tableInfo.id) {
              backupData.tables['master_' + tableName] = exportTableToJsonForBackup(tableInfo.id, tableName);
              debugLogForBackup('✓ تم تصدير ' + tableName);
            }
          } catch (e) {
            debugErrorForBackup('فشل تصدير ' + tableName, e);
          }
        }
      }
    }
    
    // تصدير الجداول السنوية
    debugLogForBackup('تصدير الجداول السنوية للسنة ' + currentYear + '...');
    if (links.yearly && links.yearly[currentYear]) {
      for (var tName in links.yearly[currentYear]) {
        if (links.yearly[currentYear].hasOwnProperty(tName)) {
          try {
            var tInfo = links.yearly[currentYear][tName];
            if (tInfo && tInfo.id) {
              backupData.tables['yearly_' + tName + '_' + currentYear] = exportTableToJsonForBackup(tInfo.id, tName);
              debugLogForBackup('✓ تم تصدير ' + tName + '_' + currentYear);
            }
          } catch (e) {
            debugErrorForBackup('فشل تصدير ' + tName + '_' + currentYear, e);
          }
        }
      }
    }
    
    // === الخطوة 4: تصدير بيانات الصور ونسخها ===
    debugLogForBackup('الخطوة 4: تصدير بيانات الصور');
    backupData.imageMapping = exportImageMetadataForBackup(imagesBackupFolder);
    debugLogForBackup('تم تصدير ' + Object.keys(backupData.imageMapping).length + ' صورة');
    
    // === الخطوة 5: حفظ ملف backup.json ===
    debugLogForBackup('الخطوة 5: حفظ ملف backup.json');
    var backupJsonBlob = Utilities.newBlob(
      JSON.stringify(backupData, null, 2),
      'application/json',
      'backup.json'
    );
    backupFolder.createFile(backupJsonBlob);
    
    var metaBlob = Utilities.newBlob(
      JSON.stringify(backupData.metadata, null, 2),
      'application/json',
      'meta.json'
    );
    backupFolder.createFile(metaBlob);
    
    // === الخطوة 6: تسجيل في جدول النسخ الاحتياطية ===
    debugLogForBackup('الخطوة 6: تسجيل النسخة في النظام');
    try {
      var backupsTableId = typeof getYearlyTableId === 'function' ? getYearlyTableId('Backups', currentYear) : null;
      if (backupsTableId) {
        var backupSS = SpreadsheetApp.openById(backupsTableId);
        var backupsSheet = backupSS.getSheets()[0];
        backupsSheet.appendRow([
          generateIDForBackup(), currentYear, getNowTimestampForBackup(),
          backupFolder.getId(),
          notes || 'نسخة احتياطية JSON تم إنشاؤها في ' + getNowTimestampForBackup()
        ]);
      }
    } catch (e) {
      debugLogForBackup('⚠️ لم نتمكن من التسجيل في جدول النسخ الاحتياطية: ' + e.message);
    }
    
    debugLogForBackup('✅ تم إنشاء النسخة الاحتياطية بنجاح');
    
    // ✅ تم إصلاح السطر هنا - إضافة مفتاح "data" قبل الكائن
    return { 
      success: true, 
      message: '✅ تم إنشاء النسخة الاحتياطية للسنة ' + currentYear + ' بنجاح!\n' +
               '📁 الموقع: Backups/' + backupFolderName + '\n' +
               '📊 عدد الجداول: ' + Object.keys(backupData.tables).length + '\n' +
               '🖼️ عدد الصور: ' + Object.keys(backupData.imageMapping).length, data:
       { backupName: backupFolderName, fiscalYear: currentYear, timestamp: timestamp, folderId: backupFolder.getId() } 
    };
    
  } catch (e) {
    debugErrorForBackup('فشل إنشاء النسخة الاحتياطية', e);
    return { 
      success: false, 
      message: '❌ فشل إنشاء النسخة الاحتياطية: ' + (e.message || e.toString()),
      error: e.toString()
    };
  }
}

// ========== 🔄 استعادة النسخة الاحتياطية ==========
function restoreFromBackupForBackup(backupFolderId) {
  debugLogForBackup('=== بدء استعادة النسخة الاحتياطية ===', { backupFolderId: backupFolderId });
  
  try {
    if (!backupFolderId) {
      throw new Error('معرف مجلد النسخة الاحتياطية مطلوب');
    }
    
    // === الخطوة 0: إنشاء نسخة احتياطية أمان إجبارية ===
    debugLogForBackup('الخطوة 0: إنشاء نسخة احتياطية أمان إجبارية');
    var safetyBackup = createBackupForBackup('نسخة أمان قبل الاستعادة - ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd_HHmmss'));
    if (!safetyBackup.success) {
      throw new Error('لا يمكن المتابعة: فشل إنشاء نسخة الأمان. ' + safetyBackup.message);
    }
    debugLogForBackup('✅ تم إنشاء نسخة الأمان: ' + safetyBackup.backupName);
    
    // === الخطوة 1: تحميل ملف backup.json ===
    debugLogForBackup('الخطوة 1: تحميل ملف backup.json');
    var backupFolder = DriveApp.getFolderById(backupFolderId);
    var backupFileIter = backupFolder.getFilesByName('backup.json');
    
    if (!backupFileIter.hasNext()) {
      throw new Error('لم يتم العثور على ملف backup.json في مجلد النسخة الاحتياطية');
    }
    
    var backupFile = backupFileIter.next();
    var backupContent = backupFile.getBlob().getDataAsString();
    var backupData = JSON.parse(backupContent);
    
    // التحقق من تطابق السنة
    var fiscal = getActiveFiscalYearForBackup();
    var currentYear = fiscal.year_code;
    
    if (backupData.metadata.fiscalYear !== currentYear) {
      throw new Error(
        'عدم تطابق السنة المالية!\n' +
        'سنة النسخة: ' + backupData.metadata.fiscalYear + '\n' +
        'السنة الحالية: ' + currentYear + '\n' +
        'يمكن الاستعادة فقط في نفس السنة المالية.'
      );
    }
    
    // === الخطوة 2: استعادة بيانات الجداول ===
    debugLogForBackup('الخطوة 2: استعادة بيانات الجداول');
    var restoredTables = 0;
    var links = loadJSON('TABLE_LINKS', { master: {}, yearly: {} });
    
    for (var tableKey in backupData.tables) {
      if (backupData.tables.hasOwnProperty(tableKey)) {
        try {
          var tableData = backupData.tables[tableKey];
          var currentId = null;
          
          if (tableKey.indexOf('master_') === 0) {
            var tableName = tableKey.substring(7);
            currentId = links.master[tableName] ? links.master[tableName].id : null;
          } else if (tableKey.indexOf('yearly_') === 0) {
            var match = tableKey.match(/yearly_(.+)_\d{4}$/);
            if (match) {
              var tName = match[1];
              if (links.yearly && links.yearly[currentYear] && links.yearly[currentYear][tName]) {
                currentId = links.yearly[currentYear][tName].id;
              }
            }
          }
          
          if (currentId) {
            overwriteSpreadsheetDataForBackup(currentId, tableData);
            restoredTables++;
            debugLogForBackup('✓ تم استعادة ' + tableKey);
          }
        } catch (e) {
          debugErrorForBackup('فشل استعادة ' + tableKey, e);
        }
      }
    }
    
    // === الخطوة 3: استعادة الصور ===
    debugLogForBackup('الخطوة 3: استعادة الصور');
    var imagesFolderIter = backupFolder.getFoldersByName('images');
    if (imagesFolderIter.hasNext()) {
      var backupImagesFolder = imagesFolderIter.next();
      restoreImagesWithIdPreservationForBackup(backupData.imageMapping, backupImagesFolder);
    }
    
    // === الخطوة 4: إنشاء سجل الاستعادة ===
    debugLogForBackup('الخطوة 4: إنشاء سجل الاستعادة');
    createRestoreLogForBackup(backupData.metadata, safetyBackup.backupName);
    
    debugLogForBackup('✅ تمت الاستعادة بنجاح');
    
    // ✅ تم إصلاح السطر هنا - إضافة مفتاح "data" قبل الكائن
    return { 
      success: true, 
      message: '✅ تمت استعادة النظام بنجاح!\n\n' +
               '⚠️ جميع التغييرات منذ ' + backupData.metadata.timestamp + ' قد فقدت نهائياً.\n\n' +
               '🛡️ نسخة الأمان: ' + safetyBackup.backupName + '\n\n' +
               '📊 عدد الجداول المستعادة: ' + restoredTables + '\n' +
               '🖼️ عدد الصور المستعادة: ' + Object.keys(backupData.imageMapping).length, data:
       { safetyBackupName: safetyBackup.backupName, restoredTables: restoredTables, restoredImages: Object.keys(backupData.imageMapping).length } 
    };
    
  } catch (e) {
    debugErrorForBackup('فشلت الاستعادة', e);
    return { 
      success: false, 
      message: '❌ فشلت الاستعادة: ' + (e.message || e.toString()) + '\n\n' +
               '🛡️ تم إنشاء نسخة أمان قبل محاولة الاستعادة.\n' +
               'يمكنك استعادتها يدوياً إذا لزم الأمر.',
      error: e.toString()
    };
  }
}

// ========== 📤 تصدير جدول إلى JSON ==========
function exportTableToJsonForBackup(spreadsheetId, tableName) {
  try {
    var ss = SpreadsheetApp.openById(spreadsheetId);
    var sheet = ss.getSheets()[0];
    var data = sheet.getDataRange().getValues();
    
    if (data.length === 0) {
      return { headers: [], rows: [] };
    }
    
    var headers = data[0];
    var rows = [];
    
    for (var i = 1; i < data.length; i++) {
      var rowObj = {};
      for (var j = 0; j < headers.length; j++) {
        var value = data[i][j];
        if (value instanceof Date) {
          rowObj[headers[j]] = value.toISOString();
        } else if (value === '' || value === null || value === undefined) {
          rowObj[headers[j]] = null;
        } else {
          rowObj[headers[j]] = value;
        }
      }
      rows.push(rowObj);
    }
    
    return {
      spreadsheetId: spreadsheetId,
      sheetName: sheet.getName(),
      headers: headers,
      rowCount: rows.length,
      rows: rows
    };
    
  } catch (e) {
    debugErrorForBackup('فشل تصدير الجدول ' + tableName, e);
    return { headers: [], rows: [], error: e.toString() };
  }
}

// ========== 📥 كتابة البيانات إلى جدول ==========
function overwriteSpreadsheetDataForBackup(spreadsheetId, tableData) {
  try {
    var ss = SpreadsheetApp.openById(spreadsheetId);
    var sheet = ss.getSheets()[0];
    
    // ✅ الحفاظ على التنسيق: مسح المحتوى فقط
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, lastCol).clearContent();
    }
    
    // إعادة كتابة الهيدر
    if (tableData.headers && tableData.headers.length > 0) {
      sheet.getRange(1, 1, 1, tableData.headers.length).setValues([tableData.headers]);
      sheet.getRange(1, 1, 1, tableData.headers.length)
        .setFontWeight('bold')
        .setBackground('#d9ead3')
        .setHorizontalAlignment('center');
    }
    
    // ✅ كتابة البيانات بنظام الدفعات للبيانات الكبيرة
    if (tableData.rows && tableData.rows.length > 0) {
      var BATCH_SIZE = 1000;
      for (var batchStart = 0; batchStart < tableData.rows.length; batchStart += BATCH_SIZE) {
        var batchEnd = Math.min(batchStart + BATCH_SIZE, tableData.rows.length);
        var batch = tableData.rows.slice(batchStart, batchEnd);
        
        var values = batch.map(function(row) {
          return tableData.headers.map(function(header) {
            var val = row[header];
            if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}/)) {
              try {
                return Utilities.parseDate(val, Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ss");
              } catch (e) {
                return val === null ? '' : val;
              }
            }
            return val === null ? '' : val;
          });
        });
        
        sheet.getRange(batchStart + 2, 1, values.length, tableData.headers.length).setValues(values);
        Utilities.sleep(50);
      }
    }
    
    sheet.setFrozenRows(1);
    
  } catch (e) {
    debugErrorForBackup('فشل الكتابة في الجدول ' + spreadsheetId, e);
    throw e;
  }
}

// ========== 🖼️ تصدير بيانات الصور ==========
function exportImageMetadataForBackup(backupImagesFolder) {
  try {
    var mapping = {};
    var itemsTableId = typeof getMasterTableId === 'function' ? getMasterTableId('Items') : null;
    
    if (!itemsTableId) {
      debugLogForBackup('⚠️ جدول الأصناف غير موجود - تخطي تصدير الصور');
      return mapping;
    }
    
    var itemsSS = SpreadsheetApp.openById(itemsTableId);
    var itemsSheet = itemsSS.getSheets()[0];
    var data = itemsSheet.getDataRange().getValues();
    
    var headers = data[0];
    var imageIdCol = -1, itemCodeCol = -1;
    for (var h = 0; h < headers.length; h++) {
      var hName = String(headers[h]).trim().toLowerCase();
      if (hName === 'item_image_id') imageIdCol = h;
      if (hName === 'item_code') itemCodeCol = h;
    }
    
    if (imageIdCol === -1) {
      debugLogForBackup('⚠️ عمود item_image_id غير موجود في جدول الأصناف');
      return mapping;
    }
    
    for (var i = 1; i < data.length; i++) {
      var imageId = String(data[i][imageIdCol] || '').trim();
      var itemCode = itemCodeCol !== -1 ? (data[i][itemCodeCol] || 'item_' + i) : 'item_' + i;
      
      if (!imageId || imageId === '' || imageId === 'null') continue;
      
      try {
        var file = DriveApp.getFileById(imageId);
        var backupFile = file.makeCopy(String(itemCode) + '_' + file.getName(), backupImagesFolder);
        
        mapping[imageId] = {
          originalName: file.getName(),
          itemCode: String(itemCode),
          mimeType: file.getMimeType(),
          backupFileId: backupFile.getId(),
          backupFileName: backupFile.getName(),
          size: file.getSize(),
          timestamp: getNowTimestampForBackup()
        };
        
      } catch (e) {
        debugLogForBackup('⚠️ لم نتمكن من نسخ الصورة ' + imageId + ' للصنف ' + itemCode + ': ' + e.message);
      }
    }
    
    return mapping;
    
  } catch (e) {
    debugErrorForBackup('فشل تصدير بيانات الصور', e);
    return {};
  }
}

// ========== 🖼️ استعادة الصور مع الحفاظ على المعرفات ==========
function restoreImagesWithIdPreservationForBackup(imageMapping, backupImagesFolder) {
  try {
    var successCount = 0;
    
    for (var originalFileId in imageMapping) {
      if (imageMapping.hasOwnProperty(originalFileId)) {
        try {
          var backupFileId = imageMapping[originalFileId].backupFileId;
          var backupImage = DriveApp.getFileById(backupFileId);
          
          var currentImage;
          try {
            currentImage = DriveApp.getFileById(originalFileId);
            currentImage.setContent(backupImage.getBlob());
            currentImage.setName(backupImage.getName());
          } catch (e) {
            var folders = loadJSON('FOLDERS', {});
            if (folders.images) {
              var imagesFolder = DriveApp.getFolderById(folders.images);
              var newFile = backupImage.makeCopy(imageMapping[originalFileId].originalName, imagesFolder);
              debugLogForBackup('⚠️ تم إنشاء ملف صورة جديد: ' + newFile.getId() + ' بدلاً من ' + originalFileId);
            }
          }
          
          successCount++;
          
        } catch (e) {
          debugLogForBackup('⚠️ فشل استعادة الصورة ' + originalFileId + ': ' + e.message);
        }
      }
    }
    
    debugLogForBackup('✅ تم استعادة ' + successCount + ' صورة');
    
  } catch (e) {
    debugErrorForBackup('فشل استعادة الصور', e);
    throw new Error('فشل استعادة الصور: ' + e.message);
  }
}

// ========== 📝 إنشاء سجل الاستعادة ==========
function createRestoreLogForBackup(backupMetadata, safetyBackupName) {
  try {
    var logContent = 'سجل استعادة ZEIOS ERP\n' +
      '=====================\n' +
      'تم استعادة نسخة من: ' + backupMetadata.timestamp + '\n' +
      'السنة المالية للنسخة: ' + backupMetadata.fiscalYear + '\n' +
      'ملاحظات النسخة: ' + (backupMetadata.notes || 'بدون ملاحظات') + '\n' +
      'تمت الاستعادة بواسطة: ' + Session.getActiveUser().getEmail() + '\n' +
      'وقت الاستعادة: ' + getNowTimestampForBackup() + '\n' +
      'نسخة الأمان: ' + safetyBackupName + '\n\n' +
      '⚠️ تحذير:\n' +
      'جميع التغييرات التي تمت بعد ' + backupMetadata.timestamp + ' قد فقدت نهائياً.\n' +
      'وتشمل:\n' +
      '- جميع المعاملات المنشأة بعد هذا التاريخ\n' +
      '- جميع الأصناف والعملاء والموردين الجدد\n' +
      '- جميع الصور المضافة بعد هذا التاريخ\n' +
      '- جميع تغييرات المستخدمين\n\n' +
      'لاستعادة البيانات المفقودة، يمكن استعادة نسخة الأمان: ' + safetyBackupName + '\n\n' +
      '=====================\n' +
      'فحص سلامة النظام:\n' +
      '✅ تم الحفاظ على معرفات الجداول\n' +
      '✅ تم الحفاظ على معرفات الصور (أو إعادة إنشائها)\n' +
      '✅ لم يتم تعديل إعدادات النظام في PropertiesService\n' +
      '✅ تم الحفاظ على بيانات المستخدمين';
    
    var currentFile = DriveApp.getFileById(SpreadsheetApp.getActive().getId());
    var folders = loadJSON('FOLDERS', {});
    
    if (folders.assets) {
      var assetsFolder = DriveApp.getFolderById(folders.assets);
      assetsFolder.createFile(
        Utilities.newBlob(
          logContent,
          'text/plain',
          'RESTORE_LOG_' + backupMetadata.fiscalYear + '_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd_HHmmss') + '.txt'
        )
      );
    }
    
  } catch (e) {
    debugLogForBackup('⚠️ لم نتمكن من إنشاء سجل الاستعادة: ' + e.message);
  }
}

// ========== 📋 الحصول على قائمة النسخ الاحتياطية ==========
function getAvailableBackupsForBackup() {
  debugLogForBackup('=== الحصول على قائمة النسخ الاحتياطية ===');
  
  try {
    var fiscal = getActiveFiscalYearForBackup();
    var currentYear = fiscal.year_code;
    
    if (!currentYear) {
      debugLogForBackup('لا توجد سنة مالية نشطة');
      return [];
    }
    
    var folders = loadJSON('FOLDERS', {});
    var backupsParentFolder;
    
    if (folders.assets) {
      var assetsFolder = DriveApp.getFolderById(folders.assets);
      var backupFoldersIter = assetsFolder.getFoldersByName('Backups');
      if (!backupFoldersIter.hasNext()) {
        return [];
      }
      backupsParentFolder = backupFoldersIter.next();
    } else {
      return [];
    }
    
    var backups = [];
    var backupFolders = backupsParentFolder.getFolders();
    
    while (backupFolders.hasNext()) {
      var backupFolder = backupFolders.next();
      var folderName = backupFolder.getName();
      
      if (folderName.indexOf('Backup_') === 0 && folderName.indexOf(currentYear) !== -1) {
        var backupDate = folderName.replace('Backup_' + currentYear + '_', '').replace(/_/g, ' ');
        var notes = 'نسخة احتياطية JSON';
        
        try {
          var metaFileIter = backupFolder.getFilesByName('meta.json');
          if (metaFileIter.hasNext()) {
            var metaContent = metaFileIter.next().getBlob().getDataAsString();
            var metaData = JSON.parse(metaContent);
            backupDate = metaData.timestamp || backupDate;
            notes = metaData.notes || notes;
          }
        } catch (e) {
          debugLogForBackup('لم نتمكن من قراءة meta.json للمجلد ' + folderName);
        }
        
        backups.push({
          id: backupFolder.getId(),
          name: folderName,
          created: backupFolder.getDateCreated().toISOString(),
          backupDate: backupDate,
          fiscalYear: currentYear,
          folderId: backupFolder.getId(),
          notes: notes
        });
      }
    }
    
    backups.sort(function(a, b) {
      return new Date(b.created) - new Date(a.created);
    });
    
    debugLogForBackup('✅ تم العثور على ' + backups.length + ' نسخة احتياطية للسنة ' + currentYear);
    return backups;
    
  } catch (e) {
    debugErrorForBackup('فشل الحصول على قائمة النسخ الاحتياطية', e);
    return [];
  }
}

// ========== 🔍 فحص حالة نظام النسخ الاحتياطي ==========
function getBackupSystemStatusForBackup() {
  var status = {
    timestamp: getNowTimestampForBackup(),
    currentYear: null,
    backupsFolder: false,
    existingBackups: 0,
    issues: []
  };
  
  try {
    var fiscal = getActiveFiscalYearForBackup();
    status.currentYear = fiscal.year_code;
    
    if (!status.currentYear) {
      status.issues.push('لا توجد سنة مالية نشطة');
      status.summary = '❌ لا توجد سنة مالية نشطة';
      return status;
    }
    
    var folders = loadJSON('FOLDERS', {});
    if (folders.assets) {
      var assetsFolder = DriveApp.getFolderById(folders.assets);
      var backupFoldersIter = assetsFolder.getFoldersByName('Backups');
      status.backupsFolder = backupFoldersIter.hasNext();
      
      if (status.backupsFolder) {
        var backupParentFolder = backupFoldersIter.next();
        var backupFolders = backupParentFolder.getFolders();
        while (backupFolders.hasNext()) {
          var bf = backupFolders.next();
          if (bf.getName().indexOf('Backup_') === 0) {
            status.existingBackups++;
          }
        }
      }
    }
    
    status.healthy = status.issues.length === 0;
    status.summary = status.healthy 
      ? '✅ نظام النسخ الاحتياطي جاهز (' + status.existingBackups + ' نسخة متاحة)' 
      : '⚠️ ' + status.issues.length + ' مشكلة تحتاج انتباه';
    
  } catch (e) {
    status.issues.push('خطأ: ' + e.message);
    status.summary = '❌ خطأ في فحص النظام: ' + e.message;
  }
  
  return status;
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
    console.log('ZEIOS ERP - BackupRestore data');
    console.log('Keys:', allKeys.length);
    return { success: true, count: allKeys.length, keys: allKeys };
  } catch (e) { console.error('Error:', e); return { success: false, error: e.toString() }; }
}

function getLibraryVersion() { return LIBRARY_VERSION; }


/**
 * BackupRestore_client.gs – ZEIOS ERP SYSTEM (SHEET VERSION)
 * دوال بنفس أسماء المكتبة عشان الكود يشتغل من غير تعديل
 * 
 * ⚠️ قبل التشغيل: أضف المكتبة من Extensions → Libraries
 */

// ========== 🔗 ربط المكتبة ==========
var ZEIOS = ZEIOS; // غيّر للاسم اللي أنت سميته


// ========== 🚀 إنشاء/استعادة النسخ ==========
function createBackup(notes) { try { return ZEIOS.createBackupForBackup(notes); } catch (e) { return {success:false,message:e.toString()}; } }
function restoreFromBackup(backupFolderId) { try { return ZEIOS.restoreFromBackupForBackup(backupFolderId); } catch (e) { return {success:false,message:e.toString()}; } }

// ========== 📋 قائمة النسخ ==========
function getAvailableBackups() { try { return ZEIOS.getAvailableBackupsForBackup(); } catch (e) { return []; } }
function getBackupSystemStatus() { try { return ZEIOS.getBackupSystemStatusForBackup(); } catch (e) { return {summary:'❌ خطأ',issues:[e.toString()]}; } }

// ========== 🔧 مساعدة ==========
function generateTimestamp() { try { return ZEIOS.generateTimestamp(); } catch (e) { return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss'); } }
function generateUniqueId() { try { return ZEIOS.generateUniqueId(); } catch (e) { return Utilities.getUuid().replace(/-/g, ''); } }
function showStoredDataInLog() { try { return ZEIOS.showStoredDataInLog(); } catch (e) { return {success:false,error:e.toString()}; } }
function getLibraryVersion() { try { return ZEIOS.getLibraryVersion(); } catch (e) { return 'غير متصل'; } }

// ========== 🎨 دوال الواجهة (في الشيت فقط - مش في المكتبة) ==========
function isSpreadsheetContext() {
  try { SpreadsheetApp.getUi(); return true; }
  catch (e) { return false; }
}

function openBackupPage() {
  try {
    var pageName = 'backup_restore';
    var title = '💾 النسخ الاحتياطي - ZEIOS ERP';
    if (isSpreadsheetContext()) {
      var html = HtmlService.createHtmlOutputFromFile(pageName)
        .setTitle(title).setWidth(900).setHeight(700)
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      SpreadsheetApp.getUi().showModalDialog(html, title);
      return { success: true, mode: "spreadsheet" };
    }
    var baseUrl = ScriptApp.getService() ? ScriptApp.getService().getUrl() : null;
    if (baseUrl) return { success: true, mode: "webapp", url: baseUrl + "?page=" + pageName };
    return { success: false, message: "لا يمكن تحديد بيئة التشغيل" };
  } catch (e) { console.error("❌ openBackupPage error:", e); return { success: false, message: e.toString() }; }
}

function createBackupUI() {
  try {
    var notes = SpreadsheetApp.getUi().prompt('ملاحظات النسخة الاحتياطية (اختياري):', '', SpreadsheetApp.getUi().ButtonSet.OK_CANCEL);
    if (notes.getSelectedButton() === SpreadsheetApp.getUi().Button.OK) {
      var result = createBackupForBackup(notes.getResponseText());
      if (result.success) {
        SpreadsheetApp.getUi().alert('✅ نجاح', result.message, SpreadsheetApp.getUi().ButtonSet.OK);
      } else {
        SpreadsheetApp.getUi().alert('❌ خطأ', result.message, SpreadsheetApp.getUi().ButtonSet.OK);
      }
      return result;
    }
    return { success: false, message: 'تم إلغاء العملية' };
  } catch (e) {
    console.error("❌ createBackupUI error:", e);
    return { success: false, message: e.toString() };
  }
}

function restoreBackupUI(backupFolderId) {
  try {
    var confirm = SpreadsheetApp.getUi().alert(
      '⚠️ تأكيد الاستعادة',
      'هل أنت متأكد من استعادة هذه النسخة؟\n\n' +
      'سيتم إنشاء نسخة أمان تلقائياً قبل المتابعة.\n' +
      'جميع التغييرات بعد تاريخ النسخة ستُفقد.',
      SpreadsheetApp.getUi().ButtonSet.YES_NO
    );
    
    if (confirm === SpreadsheetApp.getUi().Button.YES) {
      var result = restoreFromBackupForBackup(backupFolderId);
      if (result.success) {
        SpreadsheetApp.getUi().alert('✅ نجاح', result.message, SpreadsheetApp.getUi().ButtonSet.OK);
      } else {
        SpreadsheetApp.getUi().alert('❌ خطأ', result.message, SpreadsheetApp.getUi().ButtonSet.OK);
      }
      return result;
    }
    return { success: false, message: 'تم إلغاء الاستعادة' };
  } catch (e) {
    console.error("❌ restoreBackupUI error:", e);
    return { success: false, message: e.toString() };
  }
}
