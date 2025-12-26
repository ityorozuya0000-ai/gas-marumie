import { AppController } from './controllers/AppController';
import { AppData, Transaction, DatabaseService } from '@marumie/shared';

const app = new AppController();

// --- Entry Points (Must be global functions) ---

export function doGet(e: any): GoogleAppsScript.HTML.HtmlOutput {
    return app.doGet(e);
}

export function getInitialData(): AppData {
    return app.getInitialData();
}

export function addTransaction(transaction: Transaction): AppData {
    return app.addTransaction(transaction);
}

export function seedData(): any {
    return app.seedData();
}

