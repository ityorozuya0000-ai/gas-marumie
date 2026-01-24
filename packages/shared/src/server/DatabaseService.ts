import { AppData, Category, Transaction } from '../types/models';

const TRANSACTIONS_SHEET_NAME = 'Transactions';
const CATEGORIES_SHEET_NAME = 'Categories';
const CACHE_FILE_NAME = 'marumie_db_cache.json';

export class DatabaseService {
    private spreadsheetId: string;
    private cacheFileId: string | null = null;

    constructor(spreadsheetId: string) {
        this.spreadsheetId = spreadsheetId;
        this.cacheFileId = this.findCacheFile();
    }

    private getSpreadsheet(): GoogleAppsScript.Spreadsheet.Spreadsheet {
        return SpreadsheetApp.openById(this.spreadsheetId);
    }

    private findCacheFile(): string | null {
        const files = DriveApp.getFilesByName(CACHE_FILE_NAME);
        if (files.hasNext()) {
            return files.next().getId();
        }
        return null;
    }

    /**
     * Get all data, preferring cache if available.
     */
    public getAllData(): AppData {
        // Try cache first
        if (this.cacheFileId) {
            try {
                const file = DriveApp.getFileById(this.cacheFileId);
                const json = file.getBlob().getDataAsString();
                return JSON.parse(json);
            } catch (e) {
                console.warn('Cache read failed, falling back to Sheets', e);
            }
        }

        // Fallback to Sheets
        return this.refreshCache();
    }

    // --- CRUD Operations (Write-through) ---

    // ... (getAllData calls refreshCache)

    /**
     * Read directly from Sheets and update the cache.
     */
    public refreshCache(): AppData {
        const ss = this.getSpreadsheet();

        // Read Categories
        const catSheet = ss.getSheetByName(CATEGORIES_SHEET_NAME);
        const categories: Category[] = [];
        if (catSheet) {
            const data = catSheet.getDataRange().getValues();
            // Skip header (row 1)
            for (let i = 1; i < data.length; i++) {
                const row = data[i];
                if (row[0]) { // Check ID existence
                    categories.push({
                        id: String(row[0]),
                        name: String(row[1]),
                        type: String(row[2]) as any
                    });
                }
            }
        }

        // Read Transactions
        const transSheet = ss.getSheetByName(TRANSACTIONS_SHEET_NAME);
        const transactions: Transaction[] = [];
        if (transSheet) {
            const data = transSheet.getDataRange().getValues();
            for (let i = 1; i < data.length; i++) {
                const row = data[i];
                if (row[0]) {
                    transactions.push({
                        id: String(row[0]),
                        date: this.formatDate(new Date(row[1])),
                        amount: Number(row[2]),
                        type: String(row[3]) as any,
                        categoryId: String(row[4]),
                        description: String(row[5]),
                        counterparty: String(row[6]),
                        receiptUrl: row[7] ? String(row[7]) : undefined
                    });
                }
            }
        }

        const appData: AppData = {
            transactions,
            categories,
            lastUpdated: new Date().toISOString()
        };

        this.saveCache(appData);
        return appData;
    }

    // ... (saveCache, formatDate helper omitted/kept)

    private saveCache(data: AppData) {
        const json = JSON.stringify(data);
        if (this.cacheFileId) {
            DriveApp.getFileById(this.cacheFileId).setContent(json);
        } else {
            const file = DriveApp.createFile(CACHE_FILE_NAME, json, "text/plain");
            this.cacheFileId = file.getId();
        }
    }

    private formatDate(date: Date): string {
        return Utilities.formatDate(date, 'Asia/Tokyo', 'yyyy-MM-dd');
    }

    public addTransaction(transaction: Transaction): void {
        this.validateRelation(transaction);

        const ss = this.getSpreadsheet();
        let sheet = ss.getSheetByName(TRANSACTIONS_SHEET_NAME);
        if (!sheet) {
            sheet = ss.insertSheet(TRANSACTIONS_SHEET_NAME);
            sheet.appendRow(['id', 'date', 'amount', 'type', 'categoryId', 'description', 'counterparty', 'receiptUrl']);
        }

        // Check header column count to auto-expand schema if needed (optional optimization, but simple append is safer)
        // If sheet exists but assumes 7 cols, appendRow with 8 args will extend it.

        sheet.appendRow([
            transaction.id,
            transaction.date,
            transaction.amount,
            transaction.type,
            transaction.categoryId,
            transaction.description,
            transaction.counterparty,
            transaction.receiptUrl || ''
        ]);

        // Update cache
        this.refreshCache();
    }

    private validateRelation(transaction: Transaction) {
        const data = this.getAllData();
        const categoryExists = data.categories.some(c => c.id === transaction.categoryId);
        if (!categoryExists) {
            throw new Error(`Invalid category ID: ${transaction.categoryId}`);
        }
    }

    public updateTransaction(transaction: Transaction): void {
        this.validateRelation(transaction);

        const ss = this.getSpreadsheet();
        const sheet = ss.getSheetByName(TRANSACTIONS_SHEET_NAME);
        if (!sheet) throw new Error("Transaction sheet missing");

        const range = sheet.getDataRange();
        const values = range.getValues();
        let rowIndex = -1;

        // values[0] is header. Start from 1.
        for (let i = 1; i < values.length; i++) {
            if (String(values[i][0]) === transaction.id) {
                rowIndex = i + 1; // 1-based index
                break;
            }
        }

        if (rowIndex === -1) {
            throw new Error(`Transaction row not found: ${transaction.id}`);
        }

        // Update Row (Cols 2-8: Date, Amount, Type, Category, Desc, Counterpy, Receipt)
        // Note: Col 2 is B. Range(row, 2, 1, 7)
        sheet.getRange(rowIndex, 2, 1, 7).setValues([[
            transaction.date,
            transaction.amount,
            transaction.type,
            transaction.categoryId,
            transaction.description,
            transaction.counterparty,
            transaction.receiptUrl || ''
        ]]);

        this.refreshCache();
    }

    public deleteTransaction(id: string): void {
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

    public addCategory(category: Category): void {
        const ss = this.getSpreadsheet();
        let sheet = ss.getSheetByName(CATEGORIES_SHEET_NAME);
        if (!sheet) {
            sheet = ss.insertSheet(CATEGORIES_SHEET_NAME);
            sheet.appendRow(['id', 'name', 'type']);
        }

        sheet.appendRow([category.id, category.name, category.type]);
        this.refreshCache();
    }

    public updateCategory(category: Category): void {
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

    public deleteCategory(id: string): void {
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

    public seed(categories: Category[], transactions: Transaction[]): void {
        const ss = this.getSpreadsheet();

        // 1. Setup Categories Sheet
        let catSheet = ss.getSheetByName(CATEGORIES_SHEET_NAME);
        if (catSheet) {
            catSheet.clear();
        } else {
            catSheet = ss.insertSheet(CATEGORIES_SHEET_NAME);
        }
        catSheet.appendRow(['id', 'name', 'type']);
        if (categories.length > 0) {
            const catRows = categories.map(c => [c.id, c.name, c.type]);
            catSheet.getRange(2, 1, catRows.length, 3).setValues(catRows);
        }

        // 2. Setup Transactions Sheet
        let transSheet = ss.getSheetByName(TRANSACTIONS_SHEET_NAME);
        if (transSheet) {
            transSheet.clear();
        } else {
            transSheet = ss.insertSheet(TRANSACTIONS_SHEET_NAME);
        }
        transSheet.appendRow(['id', 'date', 'amount', 'type', 'categoryId', 'description', 'counterparty', 'receiptUrl']);
        if (transactions.length > 0) {
            const transRows = transactions.map(t => [
                t.id,
                t.date,
                t.amount,
                t.type,
                t.categoryId,
                t.description,
                t.counterparty,
                t.receiptUrl || ''
            ]);
            transSheet.getRange(2, 1, transRows.length, 8).setValues(transRows);
        }

        // 3. Update Cache
        this.refreshCache();
    }

    public ensureHeaders(): void {
        const ss = this.getSpreadsheet();
        let sheet = ss.getSheetByName(TRANSACTIONS_SHEET_NAME);
        if (!sheet) {
            this.seed([], []);
            return;
        }

        const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn() || 1).getValues()[0].map(h => String(h));
        const requiredHeaders = ['id', 'date', 'amount', 'type', 'categoryId', 'description', 'counterparty', 'receiptUrl'];

        // Check for missing headers and append them
        requiredHeaders.forEach((header, index) => {
            // Simple check: if the column index is beyond existing headers, or if the header at that index doesn't match and we want to enforce it.
            // But existing sheets might have different order? 
            // marumie assumes fixed order in refreshCache (row[0]...row[7]).
            // So we must ensure the headers are in these exact positions.

            if (index >= headers.length) {
                // Column missing entirely
                sheet?.getRange(1, index + 1).setValue(header);
            } else if (headers[index] !== header && index === 7 && header === 'receiptUrl') {
                // Specific fix for the requested issue: if 8th col is missing or empty/different, set it.
                // Be careful not to overwrite if user has custom columns.
                // But for this apps script app, we own the schema.
                if (headers[index] === '' || headers[index] === undefined) {
                    sheet?.getRange(1, index + 1).setValue(header);
                }
            }
        });

        // Actually, safer logic for the specific request "receiptUrl missing":
        if (headers.length < 8) {
            sheet.getRange(1, 8).setValue('receiptUrl');
        } else if (headers[7] === '') {
            sheet.getRange(1, 8).setValue('receiptUrl');
        }
    }

}
