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
        return HtmlService.createHtmlOutputFromFile('index')
            .setTitle('Marumie GAS')
            .addMetaTag('viewport', 'width=device-width, initial-scale=1')
            .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }

    /**
     * Get initial data for dashboard
     */
    getInitialData(): AppData {
        const db = this.getDbOrFail();
        return db.getAllData();
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
