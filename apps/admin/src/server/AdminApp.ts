import { DatabaseService, AppData, Transaction, Category } from '@marumie/shared';
import { DriveService } from './DriveService';
import { GeminiService } from './GeminiService';

/**
 * Admin Application Logic
 */
export class AdminApp {

    constructor() { }

    /**
     * Checks if the current user is authenticated (has an email).
     * Throws an error if not authenticated.
     */
    private checkAuth(): void {
        const email = Session.getActiveUser().getEmail();
        if (!email) {
            throw new Error('Access Denied');
        }
    }

    /**
     * Retrieves the spreadsheet ID from script properties.
     */
    private get spreadsheetId(): string | null {
        return PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') || null;
    }

    /**
     * Gets or creates a DatabaseService instance.
     * Throws if Spreadsheet ID is not configured.
     */
    private get db(): DatabaseService {
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
    public saveSettings(settings: { geminiApiKey: string; driveFolderId: string; spreadsheetId: string; appTitle: string; fiscalYearStartMonth: number }): boolean {
        this.checkAuth();
        try {
            // Save to Script Properties (Legacy & Key/Folder storage)
            const props = PropertiesService.getScriptProperties();
            props.setProperty('GEMINI_API_KEY', settings.geminiApiKey);
            props.setProperty('DRIVE_FOLDER_ID', settings.driveFolderId);
            props.setProperty('SPREADSHEET_ID', settings.spreadsheetId);
            props.setProperty('APP_TITLE', settings.appTitle);
            props.setProperty('FISCAL_YEAR_START_MONTH', String(settings.fiscalYearStartMonth || 4));

            // Save to Database (Shared with Public App)
            if (settings.spreadsheetId) {
                try {
                    const db = new DatabaseService(settings.spreadsheetId);
                    db.saveSettings({
                        appTitle: settings.appTitle,
                        fiscalYearStartMonth: settings.fiscalYearStartMonth
                    });
                } catch (e) {
                    console.warn('Failed to save settings to spreadsheet db:', e);
                    // Continue even if DB save fails?Ideally yes, to not block admin config.
                }
            }

            return true;
        } catch (e) {
            console.error('Error saving settings:', e);
            throw new Error('Failed to save settings');
        }
    }

    public getSettings(): { geminiApiKey: string; driveFolderId: string; spreadsheetId: string; appTitle: string; fiscalYearStartMonth: number } {
        this.checkAuth();
        const props = PropertiesService.getScriptProperties();

        const settings = {
            geminiApiKey: props.getProperty('GEMINI_API_KEY') || '',
            driveFolderId: props.getProperty('DRIVE_FOLDER_ID') || '',
            spreadsheetId: props.getProperty('SPREADSHEET_ID') || '',
            appTitle: props.getProperty('APP_TITLE') || 'みらいまる見え政治資金-管理画面',
            fiscalYearStartMonth: Number(props.getProperty('FISCAL_YEAR_START_MONTH')) || 4,
        };

        // Try to merge from DB if available (DB is source of truth for Title/FY)
        if (settings.spreadsheetId) {
            try {
                const db = new DatabaseService(settings.spreadsheetId);
                const dbSettings = db.getSettings();
                if (dbSettings.appTitle) settings.appTitle = dbSettings.appTitle;
                if (dbSettings.fiscalYearStartMonth) settings.fiscalYearStartMonth = Number(dbSettings.fiscalYearStartMonth);
            } catch (e) {
                console.warn('Failed to read settings from db:', e);
            }
        }

        return settings;
    }

    /**
     * Receipt Processing
     */
    public processReceiptImage(base64Data: string, mimeType: string): any {
        this.checkAuth();
        const settings = this.getSettings();

        if (!settings.geminiApiKey || !settings.driveFolderId) {
            throw new Error('Please configure Gemini API Key and Drive Folder ID in settings.');
        }

        try {
            // 1. Save to Drive
            const driveResult = DriveService.saveImage(base64Data, mimeType, settings.driveFolderId);

            // 2. Analyze with Gemini
            const analysisResult = GeminiService.analyzeReceipt(base64Data, mimeType, settings.geminiApiKey);

            return {
                success: true,
                data: analysisResult,
                driveFileId: driveResult.fileId,
                driveFileUrl: driveResult.fileUrl,
                driveWebViewLink: driveResult.webViewLink
            };
        } catch (e: any) {
            console.error('Process Receipt Error:', e);
            throw new Error(e.message || 'Failed to process receipt.');
        }
    }

    /**
     * Data Access Methods
     */
    public getInitialData(): AppData {
        this.checkAuth();
        try {
            const id = this.spreadsheetId;
            const settings = this.getSettings();
            const hasApiKey = !!settings.geminiApiKey;

            if (!id) return { transactions: [], categories: [], lastUpdated: '', hasApiKey };

            // Direct use of DatabaseService here to avoid exposing 'db' getter complexity if ID is missing in other contexts,
            // but for getInitialData we want to return empty if ID missing, not throw.
            const db = new DatabaseService(id);
            db.ensureHeaders(); // Ensure schema is up to date
            const data = db.getAllData();
            return { ...data, hasApiKey, appTitle: settings.appTitle, fiscalYearStartMonth: settings.fiscalYearStartMonth };
        } catch (e) {
            console.error(e);
            throw e;
        }
    }

    public addTransaction(transaction: Transaction): AppData {
        this.checkAuth();
        this.db.addTransaction(transaction);
        return this.db.getAllData();
    }

    public updateTransaction(transaction: Transaction): AppData {
        this.checkAuth();
        this.db.updateTransaction(transaction);
        return this.db.getAllData();
    }

    public deleteTransaction(transactionId: string): AppData {
        this.checkAuth();
        this.db.deleteTransaction(transactionId);
        return this.db.getAllData();
    }

    public addCategory(category: Category): AppData {
        this.checkAuth();
        this.db.addCategory(category);
        return this.db.getAllData();
    }

    public updateCategory(category: Category): AppData {
        this.checkAuth();
        this.db.updateCategory(category);
        return this.db.getAllData();
    }

    public deleteCategory(id: string): AppData {
        this.checkAuth();
        this.db.deleteCategory(id);
        return this.db.getAllData();
    }
}
