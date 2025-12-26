import { AppData, Transaction } from '@marumie/shared';

/**
 * Service class for interacting with Google Apps Script backend.
 * Handles both production (google.script.run) and local development (mock) environments.
 */
export class GasClient {
    /**
     * Call a GAS server-side function.
     * @param name Function name
     * @param args Arguments
     */
    private run(name: string, args: any[] = []): Promise<any> {
        return new Promise((resolve, reject) => {
            if ((window as any).google && (window as any).google.script) {
                (window as any).google.script.run
                    .withSuccessHandler(resolve)
                    .withFailureHandler(reject)
                [name](...args);
            } else {
                console.warn(`GAS Mock: Calling ${name} with`, args);
                // Return dummy data for local dev
                setTimeout(() => {
                    if (name === 'getInitialData') {
                        resolve({
                            transactions: [],
                            categories: [],
                            lastUpdated: new Date().toISOString()
                        } as AppData);
                    } else {
                        resolve({});
                    }
                }, 1000);
            }
        });
    }

    /**
     * Fetch initial application data (transactions, categories, etc.)
     */
    async getInitialData(): Promise<AppData> {
        return this.run('getInitialData');
    }

    /**
     * Add a new transaction
     * @param data Transaction data
     */
    async addTransaction(data: Transaction): Promise<AppData> {
        return this.run('addTransaction', [data]);
    }
}
