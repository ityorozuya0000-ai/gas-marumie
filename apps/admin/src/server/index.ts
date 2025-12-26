import { DatabaseService, AppData, Transaction, Category } from '@marumie/shared';

/**
 * Serve the React SPA for Admin
 */
export function doGet(e: any): GoogleAppsScript.HTML.HtmlOutput {
    // Simple Auth Check: Only allow access if user is logged in (Google Account)
    // For stricter access control, check specifically against a list of allowed emails.
    const email = Session.getActiveUser().getEmail();
    if (!email) {
        return HtmlService.createHtmlOutput('Access Denied. Please log in with your Google Account.');
    }

    // Optional: Check against allowed list
    // const ALLOWED_USERS = ['your-email@example.com'];
    // if (!ALLOWED_USERS.includes(email)) return HtmlService.createHtmlOutput('Access Denied.');

    return HtmlService.createHtmlOutputFromFile('index')
        .setTitle('Marumie Admin')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .append(`<script>window.currentUserEmail = "${email}";</script>`);
}

/**
 * API: Get Initial Data
 */
export function getInitialData(): AppData {
    checkAuth();
    try {
        const id = getSpreadsheetId();
        if (!id) return { transactions: [], categories: [], lastUpdated: '' };
        const db = new DatabaseService(id);
        return db.getAllData();
    } catch (e) {
        console.error(e);
        throw e;
    }
}

/**
 * API: Add Transaction
 */
export function addTransaction(transaction: Transaction): AppData {
    checkAuth();
    const id = getSpreadsheetId();
    if (!id) throw new Error("Spreadsheet ID not configured.");

    const db = new DatabaseService(id);
    db.addTransaction(transaction);
    return db.getAllData();
}

/**
 * API: Update Transaction
 */
export function updateTransaction(transaction: Transaction): AppData {
    checkAuth();
    const id = getSpreadsheetId();
    if (!id) throw new Error("Spreadsheet ID not configured.");

    const db = new DatabaseService(id);
    db.updateTransaction(transaction);
    return db.getAllData();
}

/**
 * API: Delete Transaction
 */
export function deleteTransaction(transactionId: string): AppData {
    checkAuth();
    const id = getSpreadsheetId();
    if (!id) throw new Error("Spreadsheet ID not configured.");

    const db = new DatabaseService(id);
    db.deleteTransaction(transactionId);
    return db.getAllData();
}

/**
 * API: Category Operations
 */
export function addCategory(category: any): any {
    checkAuth();
    const id = getSpreadsheetId();
    if (!id) throw new Error("ID not configured");
    const db = new DatabaseService(id);
    db.addCategory(category);
    return db.getAllData();
}

export function updateCategory(category: any): any {
    checkAuth();
    const id = getSpreadsheetId();
    if (!id) throw new Error("ID not configured");
    const db = new DatabaseService(id);
    db.updateCategory(category);
    return db.getAllData();
}

export function deleteCategory(id: string): any {
    checkAuth();
    const idStr = getSpreadsheetId();
    if (!idStr) throw new Error("ID not configured");
    const db = new DatabaseService(idStr);
    db.deleteCategory(id);
    return db.getAllData();
}

/**
 * Helper to get ID from Script Properties
 */
function getSpreadsheetId(): string | null {
    return PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') || null;
}

function checkAuth() {
    const email = Session.getActiveUser().getEmail();
    if (!email) {
        throw new Error('Access Denied');
    }
}
