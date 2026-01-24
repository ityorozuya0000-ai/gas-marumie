import { AppData, Transaction, DatabaseService } from '@marumie/shared';
import { activeSeed } from '../seed';

export class AppController {
    private db: DatabaseService | null = null;
    private spreadsheetId: string | null = null;

    constructor() {
        this.spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
        if (this.spreadsheetId) {
            this.db = new DatabaseService(this.spreadsheetId);
        }
    }

    private getDbOrFail(): DatabaseService {
        if (!this.db) {
            throw new Error("Spreadsheet ID is not configured in Script Properties.");
        }
        return this.db;
    }

    /**
     * Handle HTTP GET request (Web App)
     */
    doGet(e: any): GoogleAppsScript.HTML.HtmlOutput {
        // Try to get dynamic title from DB
        let appTitle = 'みらいまる見え政治資金';
        try {
            if (this.spreadsheetId) {
                const db = new DatabaseService(this.spreadsheetId);
                const settings = db.getSettings();
                if (settings.appTitle) appTitle = settings.appTitle;
            } else {
                appTitle = PropertiesService.getScriptProperties().getProperty('APP_TITLE') || appTitle;
            }
        } catch (e) {
            // Fallback if DB err
            appTitle = PropertiesService.getScriptProperties().getProperty('APP_TITLE') || appTitle;
        }

        return HtmlService.createHtmlOutputFromFile('index')
            .setTitle(appTitle)
            .addMetaTag('viewport', 'width=device-width, initial-scale=1')
            .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }

    /**
     * Get initial data for dashboard
     */
    getInitialData(): AppData {
        const db = this.getDbOrFail();
        const data = db.getAllData();
        const settings = db.getSettings();

        // Use DB settings, fallback to Script Properties, then hard default
        const appTitle = settings.appTitle || PropertiesService.getScriptProperties().getProperty('APP_TITLE') || 'みらいまる見え政治資金';
        const fiscalYearStartMonth = Number(settings.fiscalYearStartMonth) || Number(PropertiesService.getScriptProperties().getProperty('FISCAL_YEAR_START_MONTH')) || 4;

        return { ...data, appTitle, fiscalYearStartMonth };
    }

    /**
     * Add a transaction (API)
     */
    addTransaction(transaction: Transaction): AppData {
        const db = this.getDbOrFail();
        db.addTransaction(transaction);
        return db.getAllData();
    }

    /**
     * Seed dummy data
     */
    seedData(): any {
        const db = this.getDbOrFail();
        return activeSeed(db);
    }
}
