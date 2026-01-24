var _global = this;
"use strict";
var _global = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // src/server/index.ts
  var index_exports = {};
  __export(index_exports, {
    addCategory: () => addCategory,
    addTransaction: () => addTransaction,
    deleteCategory: () => deleteCategory,
    deleteTransaction: () => deleteTransaction,
    doGet: () => doGet,
    forceAuth: () => forceAuth,
    getInitialData: () => getInitialData,
    getSettings: () => getSettings,
    processReceiptImage: () => processReceiptImage,
    saveSettings: () => saveSettings,
    updateCategory: () => updateCategory,
    updateTransaction: () => updateTransaction
  });

  // ../../packages/shared/src/server/DatabaseService.ts
  var TRANSACTIONS_SHEET_NAME = "Transactions";
  var CATEGORIES_SHEET_NAME = "Categories";
  var SETTINGS_SHEET_NAME = "Settings";
  var CACHE_FILE_NAME = "marumie_db_cache.json";
  var DatabaseService = class {
    constructor(spreadsheetId) {
      __publicField(this, "spreadsheetId");
      __publicField(this, "cacheFileId", null);
      this.spreadsheetId = spreadsheetId;
      this.cacheFileId = this.findCacheFile();
    }
    getSpreadsheet() {
      return SpreadsheetApp.openById(this.spreadsheetId);
    }
    findCacheFile() {
      const files = DriveApp.getFilesByName(CACHE_FILE_NAME);
      if (files.hasNext()) {
        return files.next().getId();
      }
      return null;
    }
    /**
     * Get all data, preferring cache if available.
     */
    getAllData() {
      if (this.cacheFileId) {
        try {
          const file = DriveApp.getFileById(this.cacheFileId);
          const json = file.getBlob().getDataAsString();
          return JSON.parse(json);
        } catch (e) {
          console.warn("Cache read failed, falling back to Sheets", e);
        }
      }
      return this.refreshCache();
    }
    // --- CRUD Operations (Write-through) ---
    // ... (getAllData calls refreshCache)
    /**
     * Read directly from Sheets and update the cache.
     */
    refreshCache() {
      const ss = this.getSpreadsheet();
      const catSheet = ss.getSheetByName(CATEGORIES_SHEET_NAME);
      const categories = [];
      if (catSheet) {
        const data = catSheet.getDataRange().getValues();
        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          if (row[0]) {
            categories.push({
              id: String(row[0]),
              name: String(row[1]),
              type: String(row[2])
            });
          }
        }
      }
      const transSheet = ss.getSheetByName(TRANSACTIONS_SHEET_NAME);
      const transactions = [];
      if (transSheet) {
        const data = transSheet.getDataRange().getValues();
        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          if (row[0]) {
            transactions.push({
              id: String(row[0]),
              date: this.formatDate(new Date(row[1])),
              amount: Number(row[2]),
              type: String(row[3]),
              categoryId: String(row[4]),
              description: String(row[5]),
              counterparty: String(row[6]),
              receiptUrl: row[7] ? String(row[7]) : void 0
            });
          }
        }
      }
      const appData = {
        transactions,
        categories,
        lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
      };
      this.saveCache(appData);
      return appData;
    }
    // ... (saveCache, formatDate helper omitted/kept)
    saveCache(data) {
      const json = JSON.stringify(data);
      if (this.cacheFileId) {
        DriveApp.getFileById(this.cacheFileId).setContent(json);
      } else {
        const file = DriveApp.createFile(CACHE_FILE_NAME, json, "text/plain");
        this.cacheFileId = file.getId();
      }
    }
    formatDate(date) {
      return Utilities.formatDate(date, "Asia/Tokyo", "yyyy-MM-dd");
    }
    addTransaction(transaction) {
      this.validateRelation(transaction);
      const ss = this.getSpreadsheet();
      let sheet = ss.getSheetByName(TRANSACTIONS_SHEET_NAME);
      if (!sheet) {
        sheet = ss.insertSheet(TRANSACTIONS_SHEET_NAME);
        sheet.appendRow(["id", "date", "amount", "type", "categoryId", "description", "counterparty", "receiptUrl"]);
      }
      sheet.appendRow([
        transaction.id,
        transaction.date,
        transaction.amount,
        transaction.type,
        transaction.categoryId,
        transaction.description,
        transaction.counterparty,
        transaction.receiptUrl || ""
      ]);
      this.refreshCache();
    }
    validateRelation(transaction) {
      const data = this.getAllData();
      const categoryExists = data.categories.some((c) => c.id === transaction.categoryId);
      if (!categoryExists) {
        throw new Error(`Invalid category ID: ${transaction.categoryId}`);
      }
    }
    updateTransaction(transaction) {
      this.validateRelation(transaction);
      const ss = this.getSpreadsheet();
      const sheet = ss.getSheetByName(TRANSACTIONS_SHEET_NAME);
      if (!sheet) throw new Error("Transaction sheet missing");
      const range = sheet.getDataRange();
      const values = range.getValues();
      let rowIndex = -1;
      for (let i = 1; i < values.length; i++) {
        if (String(values[i][0]) === transaction.id) {
          rowIndex = i + 1;
          break;
        }
      }
      if (rowIndex === -1) {
        throw new Error(`Transaction row not found: ${transaction.id}`);
      }
      sheet.getRange(rowIndex, 2, 1, 7).setValues([[
        transaction.date,
        transaction.amount,
        transaction.type,
        transaction.categoryId,
        transaction.description,
        transaction.counterparty,
        transaction.receiptUrl || ""
      ]]);
      this.refreshCache();
    }
    deleteTransaction(id) {
      const ss = this.getSpreadsheet();
      const sheet = ss.getSheetByName(TRANSACTIONS_SHEET_NAME);
      if (!sheet) throw new Error("Transaction sheet missing");
      const range = sheet.getDataRange();
      const values = range.getValues();
      let rowIndex = -1;
      for (let i = 1; i < values.length; i++) {
        if (String(values[i][0]) === id) {
          rowIndex = i + 1;
          break;
        }
      }
      if (rowIndex === -1) {
        console.warn(`Transaction to delete not found: ${id}`);
        return;
      }
      sheet.deleteRow(rowIndex);
      this.refreshCache();
    }
    // --- Category CRUD (Kept same) ---
    addCategory(category) {
      const ss = this.getSpreadsheet();
      let sheet = ss.getSheetByName(CATEGORIES_SHEET_NAME);
      if (!sheet) {
        sheet = ss.insertSheet(CATEGORIES_SHEET_NAME);
        sheet.appendRow(["id", "name", "type"]);
      }
      sheet.appendRow([category.id, category.name, category.type]);
      this.refreshCache();
    }
    updateCategory(category) {
      const ss = this.getSpreadsheet();
      const sheet = ss.getSheetByName(CATEGORIES_SHEET_NAME);
      if (!sheet) throw new Error("Category sheet missing");
      const range = sheet.getDataRange();
      const values = range.getValues();
      let rowIndex = -1;
      for (let i = 1; i < values.length; i++) {
        if (String(values[i][0]) === category.id) {
          rowIndex = i + 1;
          break;
        }
      }
      if (rowIndex === -1) throw new Error(`Category not found: ${category.id}`);
      sheet.getRange(rowIndex, 2, 1, 2).setValues([[category.name, category.type]]);
      this.refreshCache();
    }
    deleteCategory(id) {
      const ss = this.getSpreadsheet();
      const sheet = ss.getSheetByName(CATEGORIES_SHEET_NAME);
      if (!sheet) throw new Error("Category sheet missing");
      const range = sheet.getDataRange();
      const values = range.getValues();
      let rowIndex = -1;
      for (let i = 1; i < values.length; i++) {
        if (String(values[i][0]) === id) {
          rowIndex = i + 1;
          break;
        }
      }
      if (rowIndex === -1) {
        console.warn(`Category to delete not found: ${id}`);
        return;
      }
      sheet.deleteRow(rowIndex);
      this.refreshCache();
    }
    seed(categories, transactions) {
      const ss = this.getSpreadsheet();
      let catSheet = ss.getSheetByName(CATEGORIES_SHEET_NAME);
      if (catSheet) {
        catSheet.clear();
      } else {
        catSheet = ss.insertSheet(CATEGORIES_SHEET_NAME);
      }
      catSheet.appendRow(["id", "name", "type"]);
      if (categories.length > 0) {
        const catRows = categories.map((c) => [c.id, c.name, c.type]);
        catSheet.getRange(2, 1, catRows.length, 3).setValues(catRows);
      }
      let transSheet = ss.getSheetByName(TRANSACTIONS_SHEET_NAME);
      if (transSheet) {
        transSheet.clear();
      } else {
        transSheet = ss.insertSheet(TRANSACTIONS_SHEET_NAME);
      }
      transSheet.appendRow(["id", "date", "amount", "type", "categoryId", "description", "counterparty", "receiptUrl"]);
      if (transactions.length > 0) {
        const transRows = transactions.map((t) => [
          t.id,
          t.date,
          t.amount,
          t.type,
          t.categoryId,
          t.description,
          t.counterparty,
          t.receiptUrl || ""
        ]);
        transSheet.getRange(2, 1, transRows.length, 8).setValues(transRows);
      }
      this.refreshCache();
    }
    ensureHeaders() {
      const ss = this.getSpreadsheet();
      let sheet = ss.getSheetByName(TRANSACTIONS_SHEET_NAME);
      if (!sheet) {
        this.seed([], []);
        return;
      }
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn() || 1).getValues()[0].map((h) => String(h));
      const requiredHeaders = ["id", "date", "amount", "type", "categoryId", "description", "counterparty", "receiptUrl"];
      requiredHeaders.forEach((header, index) => {
        if (index >= headers.length) {
          sheet == null ? void 0 : sheet.getRange(1, index + 1).setValue(header);
        } else if (headers[index] !== header && index === 7 && header === "receiptUrl") {
          if (headers[index] === "" || headers[index] === void 0) {
            sheet == null ? void 0 : sheet.getRange(1, index + 1).setValue(header);
          }
        }
      });
      if (headers.length < 8) {
        sheet.getRange(1, 8).setValue("receiptUrl");
      } else if (headers[7] === "") {
        sheet.getRange(1, 8).setValue("receiptUrl");
      }
    }
    // --- Settings Management ---
    getSettings() {
      const ss = this.getSpreadsheet();
      const sheet = ss.getSheetByName(SETTINGS_SHEET_NAME);
      if (!sheet) return {};
      const data = sheet.getDataRange().getValues();
      const settings = {};
      if (data.length >= 2) {
        const keys = data[0];
        const values = data[1];
        keys.forEach((key, index) => {
          if (key) {
            settings[String(key)] = values[index];
          }
        });
      }
      return settings;
    }
    saveSettings(settings) {
      const ss = this.getSpreadsheet();
      let sheet = ss.getSheetByName(SETTINGS_SHEET_NAME);
      if (!sheet) {
        sheet = ss.insertSheet(SETTINGS_SHEET_NAME);
      } else {
        sheet.clear();
      }
      const keys = Object.keys(settings);
      const values = keys.map((k) => settings[k]);
      if (keys.length > 0) {
        sheet.appendRow(keys);
        sheet.appendRow(values);
      }
    }
  };

  // src/server/DriveService.ts
  var DriveService = class {
    /**
     * 画像データをDriveに保存します。
     * @param base64Data 画像のBase64データ
     * @param contentType MIMEタイプ
     * @param folderId 保存先フォルダID
     * @param prefix ファイル名のプレフィックス (デフォルト: receipt)
     * @returns 保存されたファイルのIDとURL
     */
    static saveImage(base64Data, contentType, folderId, prefix = "receipt") {
      try {
        const folder = DriveApp.getFolderById(folderId);
        const decoded = Utilities.base64Decode(base64Data);
        const blob = Utilities.newBlob(decoded, contentType, `${prefix}_${Utilities.formatDate(/* @__PURE__ */ new Date(), "Asia/Tokyo", "yyyyMMdd_HHmmss")}.jpg`);
        const file = folder.createFile(blob);
        return {
          fileId: file.getId(),
          fileUrl: file.getUrl(),
          // ユーザーがクリックして開く用
          webViewLink: file.getUrl()
          // プレビュー用リンク
        };
      } catch (e) {
        console.error("Error saving to Drive:", e);
        throw new Error(`Failed to save image to Drive: ${e}`);
      }
    }
  };

  // src/server/GeminiService.ts
  var GeminiService = class {
    /**
     * レシート画像を解析します。
     * @param base64Data 画像のBase64データ
     * @param mimeType 画像のMIMEタイプ
     * @param apiKey Gemini API Key
     * @returns 解析結果のJSONオブジェクト
     */
    static analyzeReceipt(base64Data, mimeType, apiKey) {
      const payload = {
        contents: [
          {
            parts: [
              {
                text: `\u3053\u306E\u30EC\u30B7\u30FC\u30C8\u753B\u50CF\u3092\u89E3\u6790\u3057\u3001\u4EE5\u4E0B\u306E\u60C5\u5831\u3092JSON\u5F62\u5F0F\u3067\u62BD\u51FA\u3057\u3066\u304F\u3060\u3055\u3044\u3002
- date (YYYY-MM-DD\u5F62\u5F0F,string)
- shopName (\u5E97\u8217\u540D, string)
- totalAmount (\u5408\u8A08\u91D1\u984D, number)
- items (\u54C1\u76EE\u30EA\u30B9\u30C8: [{name: \u5546\u54C1\u540D, price: \u5358\u4FA1(number), category: \u63A8\u6E2C\u3055\u308C\u308B\u30AB\u30C6\u30B4\u30EA\u540D(string)}])

\u65E5\u4ED8\u304C\u8AAD\u307F\u53D6\u308C\u306A\u3044\u5834\u5408\u306F\u4ECA\u65E5\u306E\u65E5\u4ED8\u3092\u5165\u308C\u3066\u304F\u3060\u3055\u3044\u3002
JSON\u306E\u307F\u3092\u51FA\u529B\u3057\u3066\u304F\u3060\u3055\u3044\u3002Markdown\u306E\u30B3\u30FC\u30C9\u30D6\u30ED\u30C3\u30AF\u306F\u542B\u3081\u306A\u3044\u3067\u304F\u3060\u3055\u3044\u3002`
              },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data
                }
              }
            ]
          }
        ],
        generationConfig: {
          response_mime_type: "application/json"
          // JSONモードを強制
        }
      };
      const options = {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      };
      try {
        const response = UrlFetchApp.fetch(`${this.API_ENDPOINT}?key=${apiKey}`, options);
        const code = response.getResponseCode();
        const content = response.getContentText();
        if (code !== 200) {
          throw new Error(`Gemini API Error (${code}): ${content}`);
        }
        const json = JSON.parse(content);
        if (!json.candidates || json.candidates.length === 0 || !json.candidates[0].content) {
          throw new Error("No content generated from Gemini.");
        }
        const text = json.candidates[0].content.parts[0].text;
        const cleanedText = text.replace(/^```json\s*/, "").replace(/\s*```$/, "");
        return JSON.parse(cleanedText);
      } catch (e) {
        console.error("Gemini API Error:", e);
        throw new Error(`Gemini Analysis Failed: ${e.message}`);
      }
    }
  };
  GeminiService.API_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

  // src/server/AdminApp.ts
  var AdminApp = class {
    constructor() {
    }
    /**
     * Checks if the current user is authenticated (has an email).
     * Throws an error if not authenticated.
     */
    checkAuth() {
      const email = Session.getActiveUser().getEmail();
      if (!email) {
        throw new Error("Access Denied");
      }
    }
    /**
     * Retrieves the spreadsheet ID from script properties.
     */
    get spreadsheetId() {
      return PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID") || null;
    }
    /**
     * Gets or creates a DatabaseService instance.
     * Throws if Spreadsheet ID is not configured.
     */
    get db() {
      const id = this.spreadsheetId;
      if (!id) {
        throw new Error("Spreadsheet ID not configured.");
      }
      return new DatabaseService(id);
    }
    /**
     * Settings Management
     */
    /**
     * Settings Management
     */
    saveSettings(settings) {
      this.checkAuth();
      try {
        const props = PropertiesService.getScriptProperties();
        props.setProperty("GEMINI_API_KEY", settings.geminiApiKey);
        props.setProperty("DRIVE_FOLDER_ID", settings.driveFolderId);
        props.setProperty("SPREADSHEET_ID", settings.spreadsheetId);
        props.setProperty("APP_TITLE", settings.appTitle);
        props.setProperty("FISCAL_YEAR_START_MONTH", String(settings.fiscalYearStartMonth || 4));
        if (settings.spreadsheetId) {
          try {
            const db = new DatabaseService(settings.spreadsheetId);
            db.saveSettings({
              appTitle: settings.appTitle,
              fiscalYearStartMonth: settings.fiscalYearStartMonth
            });
          } catch (e) {
            console.warn("Failed to save settings to spreadsheet db:", e);
          }
        }
        return true;
      } catch (e) {
        console.error("Error saving settings:", e);
        throw new Error("Failed to save settings");
      }
    }
    getSettings() {
      this.checkAuth();
      const props = PropertiesService.getScriptProperties();
      const settings = {
        geminiApiKey: props.getProperty("GEMINI_API_KEY") || "",
        driveFolderId: props.getProperty("DRIVE_FOLDER_ID") || "",
        spreadsheetId: props.getProperty("SPREADSHEET_ID") || "",
        appTitle: props.getProperty("APP_TITLE") || "\u307F\u3089\u3044\u307E\u308B\u898B\u3048\u653F\u6CBB\u8CC7\u91D1-\u7BA1\u7406\u753B\u9762",
        fiscalYearStartMonth: Number(props.getProperty("FISCAL_YEAR_START_MONTH")) || 4
      };
      if (settings.spreadsheetId) {
        try {
          const db = new DatabaseService(settings.spreadsheetId);
          const dbSettings = db.getSettings();
          if (dbSettings.appTitle) settings.appTitle = dbSettings.appTitle;
          if (dbSettings.fiscalYearStartMonth) settings.fiscalYearStartMonth = Number(dbSettings.fiscalYearStartMonth);
        } catch (e) {
          console.warn("Failed to read settings from db:", e);
        }
      }
      return settings;
    }
    /**
     * Receipt Processing
     */
    processReceiptImage(base64Data, mimeType) {
      this.checkAuth();
      const settings = this.getSettings();
      if (!settings.geminiApiKey || !settings.driveFolderId) {
        throw new Error("Please configure Gemini API Key and Drive Folder ID in settings.");
      }
      try {
        const driveResult = DriveService.saveImage(base64Data, mimeType, settings.driveFolderId);
        const analysisResult = GeminiService.analyzeReceipt(base64Data, mimeType, settings.geminiApiKey);
        return {
          success: true,
          data: analysisResult,
          driveFileId: driveResult.fileId,
          driveFileUrl: driveResult.fileUrl,
          driveWebViewLink: driveResult.webViewLink
        };
      } catch (e) {
        console.error("Process Receipt Error:", e);
        throw new Error(e.message || "Failed to process receipt.");
      }
    }
    /**
     * Data Access Methods
     */
    getInitialData() {
      this.checkAuth();
      try {
        const id = this.spreadsheetId;
        const settings = this.getSettings();
        const hasApiKey = !!settings.geminiApiKey;
        if (!id) return { transactions: [], categories: [], lastUpdated: "", hasApiKey };
        const db = new DatabaseService(id);
        db.ensureHeaders();
        const data = db.getAllData();
        return { ...data, hasApiKey, appTitle: settings.appTitle, fiscalYearStartMonth: settings.fiscalYearStartMonth };
      } catch (e) {
        console.error(e);
        throw e;
      }
    }
    addTransaction(transaction) {
      this.checkAuth();
      this.db.addTransaction(transaction);
      return this.db.getAllData();
    }
    updateTransaction(transaction) {
      this.checkAuth();
      this.db.updateTransaction(transaction);
      return this.db.getAllData();
    }
    deleteTransaction(transactionId) {
      this.checkAuth();
      this.db.deleteTransaction(transactionId);
      return this.db.getAllData();
    }
    addCategory(category) {
      this.checkAuth();
      this.db.addCategory(category);
      return this.db.getAllData();
    }
    updateCategory(category) {
      this.checkAuth();
      this.db.updateCategory(category);
      return this.db.getAllData();
    }
    deleteCategory(id) {
      this.checkAuth();
      this.db.deleteCategory(id);
      return this.db.getAllData();
    }
  };

  // src/server/index.ts
  var app = new AdminApp();
  function doGet(e) {
    const email = Session.getActiveUser().getEmail();
    if (!email) {
      return HtmlService.createHtmlOutput("Access Denied. Please log in with your Google Account.");
    }
    return HtmlService.createHtmlOutputFromFile("index").setTitle("Marumie Admin").addMetaTag("viewport", "width=device-width, initial-scale=1").setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL).append(`<script>window.currentUserEmail = "${email}";<\/script>`);
  }
  function forceAuth() {
    console.log("Current User:", Session.getActiveUser().getEmail());
    console.log("Testing DriveApp...");
    DriveApp.getRootFolder();
    console.log("Testing UrlFetchApp...");
    UrlFetchApp.fetch("https://www.google.com");
    console.log("Auth OK!");
  }
  function saveSettings(settings) {
    return app.saveSettings(settings);
  }
  function getSettings() {
    return app.getSettings();
  }
  function processReceiptImage(base64Data, mimeType) {
    return app.processReceiptImage(base64Data, mimeType);
  }
  function getInitialData() {
    return app.getInitialData();
  }
  function addTransaction(data) {
    return app.addTransaction(data);
  }
  function updateTransaction(data) {
    return app.updateTransaction(data);
  }
  function deleteTransaction(id) {
    return app.deleteTransaction(id);
  }
  function addCategory(data) {
    return app.addCategory(data);
  }
  function updateCategory(data) {
    return app.updateCategory(data);
  }
  function deleteCategory(id) {
    return app.deleteCategory(id);
  }
  return __toCommonJS(index_exports);
})();

function doGet(e) { return _global.doGet(e); }
function getInitialData() { return _global.getInitialData(); }
function addTransaction(data) { return _global.addTransaction(data); }
function updateTransaction(data) { return _global.updateTransaction(data); }
function deleteTransaction(id) { return _global.deleteTransaction(id); }
function addCategory(data) { return _global.addCategory(data); }
function updateCategory(data) { return _global.updateCategory(data); }
function deleteCategory(id) { return _global.deleteCategory(id); }
function saveSettings(settings) { return _global.saveSettings(settings); }
function getSettings() { return _global.getSettings(); }
function processReceiptImage(base64Data, mimeType) { return _global.processReceiptImage(base64Data, mimeType); }
function forceAuth() { return _global.forceAuth(); }
        
