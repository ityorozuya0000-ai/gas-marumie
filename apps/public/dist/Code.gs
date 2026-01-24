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
    addTransaction: () => addTransaction,
    doGet: () => doGet,
    getInitialData: () => getInitialData,
    seedData: () => seedData
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

  // src/server/seed.ts
  function activeSeed(db) {
    const categories = [
      { id: "cat_01", name: "\u5BC4\u9644", type: "INCOME" },
      { id: "cat_02", name: "\u515A\u8CBB\u30FB\u4F1A\u8CBB", type: "INCOME" },
      { id: "cat_03", name: "\u4E8B\u696D\u53CE\u5165", type: "INCOME" },
      { id: "cat_11", name: "\u4EBA\u4EF6\u8CBB", type: "EXPENSE" },
      { id: "cat_12", name: "\u5149\u71B1\u6C34\u8CBB", type: "EXPENSE" },
      { id: "cat_13", name: "\u5099\u54C1\u30FB\u6D88\u8017\u54C1\u8CBB", type: "EXPENSE" },
      { id: "cat_14", name: "\u4E8B\u52D9\u6240\u8CBB", type: "EXPENSE" },
      { id: "cat_15", name: "\u653F\u6CBB\u6D3B\u52D5\u8CBB", type: "EXPENSE" }
    ];
    const transactions = [];
    const now = /* @__PURE__ */ new Date();
    const getRandomDate = () => {
      const start = new Date(now.getFullYear() - 1, 0, 1);
      const end = /* @__PURE__ */ new Date();
      return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    };
    const formatDate = (date) => Utilities.formatDate(date, "Asia/Tokyo", "yyyy-MM-dd");
    for (let i = 0; i < 20; i++) {
      const cat = categories.filter((c) => c.type === "INCOME")[Math.floor(Math.random() * 3)];
      transactions.push({
        id: `tr_in_${i}`,
        date: formatDate(getRandomDate()),
        amount: Math.floor(Math.random() * 50) * 1e3 + 1e3,
        type: "INCOME",
        categoryId: cat.id,
        description: `${cat.name}\u53D7\u5165`,
        counterparty: "\u652F\u63F4\u8005" + String.fromCharCode(65 + i)
      });
    }
    for (let i = 0; i < 30; i++) {
      const cat = categories.filter((c) => c.type === "EXPENSE")[Math.floor(Math.random() * 5)];
      transactions.push({
        id: `tr_ex_${i}`,
        date: formatDate(getRandomDate()),
        amount: Math.floor(Math.random() * 20) * 1e3 + 500,
        type: "EXPENSE",
        categoryId: cat.id,
        description: `${cat.name}\u652F\u6255\u3044`,
        counterparty: "\u682A\u5F0F\u4F1A\u793E" + String.fromCharCode(65 + i)
      });
    }
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    db.seed(categories, transactions);
    return { categories, transactions };
  }

  // src/server/controllers/AppController.ts
  var AppController = class {
    constructor() {
      this.db = null;
      this.spreadsheetId = null;
      this.spreadsheetId = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
      if (this.spreadsheetId) {
        this.db = new DatabaseService(this.spreadsheetId);
      }
    }
    getDbOrFail() {
      if (!this.db) {
        throw new Error("Spreadsheet ID is not configured in Script Properties.");
      }
      return this.db;
    }
    /**
     * Handle HTTP GET request (Web App)
     */
    doGet(e) {
      let appTitle = "\u307F\u3089\u3044\u307E\u308B\u898B\u3048\u653F\u6CBB\u8CC7\u91D1";
      try {
        if (this.spreadsheetId) {
          const db = new DatabaseService(this.spreadsheetId);
          const settings = db.getSettings();
          if (settings.appTitle) appTitle = settings.appTitle;
        } else {
          appTitle = PropertiesService.getScriptProperties().getProperty("APP_TITLE") || appTitle;
        }
      } catch (e2) {
        appTitle = PropertiesService.getScriptProperties().getProperty("APP_TITLE") || appTitle;
      }
      return HtmlService.createHtmlOutputFromFile("index").setTitle(appTitle).addMetaTag("viewport", "width=device-width, initial-scale=1").setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }
    /**
     * Get initial data for dashboard
     */
    getInitialData() {
      const db = this.getDbOrFail();
      const data = db.getAllData();
      const settings = db.getSettings();
      const appTitle = settings.appTitle || PropertiesService.getScriptProperties().getProperty("APP_TITLE") || "\u307F\u3089\u3044\u307E\u308B\u898B\u3048\u653F\u6CBB\u8CC7\u91D1";
      const fiscalYearStartMonth = Number(settings.fiscalYearStartMonth) || Number(PropertiesService.getScriptProperties().getProperty("FISCAL_YEAR_START_MONTH")) || 4;
      return { ...data, appTitle, fiscalYearStartMonth };
    }
    /**
     * Add a transaction (API)
     */
    addTransaction(transaction) {
      const db = this.getDbOrFail();
      db.addTransaction(transaction);
      return db.getAllData();
    }
    /**
     * Seed dummy data
     */
    seedData() {
      const db = this.getDbOrFail();
      return activeSeed(db);
    }
  };

  // src/server/index.ts
  var app = new AppController();
  function doGet(e) {
    return app.doGet(e);
  }
  function getInitialData() {
    return app.getInitialData();
  }
  function addTransaction(transaction) {
    return app.addTransaction(transaction);
  }
  function seedData() {
    return app.seedData();
  }
  return __toCommonJS(index_exports);
})();

function doGet(e) { return _global.doGet(e); }
function getInitialData() { return _global.getInitialData(); }
function addTransaction(data) { return _global.addTransaction(data); }
function seedData() { return _global.seedData(); }
        
