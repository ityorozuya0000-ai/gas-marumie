import { DatabaseService, AppData, Transaction, Category } from '@marumie/shared';
import { DriveService } from './DriveService';
import { GeminiService } from './GeminiService';
import { AdminApp } from './AdminApp';

const app = new AdminApp();

// Force update: Scopes v1.3
/**
 * Serve the React SPA for Admin
 */
export function doGet(e: any): GoogleAppsScript.HTML.HtmlOutput {
    // ...
    // Simple Auth Check
    const email = Session.getActiveUser().getEmail();
    if (!email) {
        return HtmlService.createHtmlOutput('Access Denied. Please log in with your Google Account.');
    }

    return HtmlService.createHtmlOutputFromFile('index')
        .setTitle('Marumie Admin')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .append(`<script>window.currentUserEmail = "${email}";</script>`);
}

/**
 * DEBUG: Run this function in GAS Editor to force Authorization for new scopes.
 */
export function forceAuth() {
    console.log('Current User:', Session.getActiveUser().getEmail());
    console.log('Testing DriveApp...');
    DriveApp.getRootFolder();
    console.log('Testing UrlFetchApp...');
    UrlFetchApp.fetch('https://www.google.com'); // This triggers the external_request scope
    console.log('Auth OK!');
}

/*
 * API Entry Points (Delegated to AdminApp)
 */

export function saveSettings(settings: any) { return app.saveSettings(settings); }
export function getSettings() { return app.getSettings(); }
export function processReceiptImage(base64Data: string, mimeType: string) { return app.processReceiptImage(base64Data, mimeType); }
export function getInitialData() { return app.getInitialData(); }
export function addTransaction(data: any) { return app.addTransaction(data); }
export function updateTransaction(data: any) { return app.updateTransaction(data); }
export function deleteTransaction(id: string) { return app.deleteTransaction(id); }
export function addCategory(data: any) { return app.addCategory(data); }
export function updateCategory(data: any) { return app.updateCategory(data); }
export function deleteCategory(id: string) { return app.deleteCategory(id); }
