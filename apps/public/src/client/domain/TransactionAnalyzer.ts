import { Transaction, Category } from '@marumie/shared';

export interface FilterCriteria {
    keyword: string;
    month: string;   // YYYY-MM
    categoryId: string;
}

export interface MonthlyData {
    month: string;
    income: number;
    expense: number;
}

export interface CategoryData {
    name: string;
    value: number;
}

export interface GlobalStats {
    totalIncome: number;
    totalExpense: number;
    balance: number;
}

/**
 * Domain class for transaction analysis logic.
 * Encapsulates filtering, pagination, and aggregation calculations.
 */
export class TransactionAnalyzer {
    private transactions: Transaction[];
    private categories: Category[];

    constructor(transactions: Transaction[], categories: Category[]) {
        this.transactions = transactions || [];
        this.categories = categories || [];
    }

    /**
     * Filter transactions based on criteria.
     * @param criteria Filter criteria
     */
    filter(criteria: FilterCriteria): Transaction[] {
        return this.transactions.filter(t => {
            // Month Filter
            if (criteria.month && !t.date.startsWith(criteria.month)) return false;
            // Category Filter
            if (criteria.categoryId && t.categoryId !== criteria.categoryId) return false;
            // Keyword Filter
            if (criteria.keyword) {
                const lowerKeyword = criteria.keyword.toLowerCase();
                return t.description.toLowerCase().includes(lowerKeyword) ||
                    t.counterparty.toLowerCase().includes(lowerKeyword);
            }
            return true;
        });
    }

    /**
     * Paginate transactions.
     * @param transactions List of transactions
     * @param page Current page (1-indexed)
     * @param itemsPerPage Items per page
     */
    paginate(transactions: Transaction[], page: number, itemsPerPage: number): Transaction[] {
        const startIndex = (page - 1) * itemsPerPage;
        return transactions.slice(startIndex, startIndex + itemsPerPage);
    }

    /**
     * Calculate monthly income/expense trends.
     * Uses ALL transactions or Filtered transactions depending on use case.
     * Assuming we want to visualize the provided list (typically all or filtered context).
     */
    getMonthlyTrends(targetTransactions: Transaction[]): MonthlyData[] {
        const map = new Map<string, MonthlyData>();

        // Sort to ensure month order if needed, or rely on aggregation sorting later
        // Typically iterating through transactions is enough.

        targetTransactions.forEach(t => {
            const month = t.date.slice(0, 7); // YYYY-MM
            if (!map.has(month)) {
                map.set(month, { month, income: 0, expense: 0 });
            }
            const entry = map.get(month)!;
            if (t.type === 'INCOME') entry.income += t.amount;
            else entry.expense += t.amount;
        });

        return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
    }

    /**
     * Calculate category share for income or expenses.
     */
    getCategoryShare(targetTransactions: Transaction[], type: 'INCOME' | 'EXPENSE'): CategoryData[] {
        const map = new Map<string, number>();

        targetTransactions
            .filter(t => t.type === type)
            .forEach(t => {
                map.set(t.categoryId, (map.get(t.categoryId) || 0) + t.amount);
            });

        return Array.from(map.entries())
            .map(([id, value]) => ({
                name: this.categories.find(c => c.id === id)?.name || id,
                value
            }))
            .sort((a, b) => b.value - a.value);
    }

    /**
     * Calculate global statistics (Total Income, Total Expense, Balance).
     */
    getGlobalStats(targetTransactions: Transaction[]): GlobalStats {
        const totalIncome = targetTransactions
            .filter(t => t.type === 'INCOME')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalExpense = targetTransactions
            .filter(t => t.type === 'EXPENSE')
            .reduce((sum, t) => sum + t.amount, 0);

        return {
            totalIncome,
            totalExpense,
            balance: totalIncome - totalExpense
        };
    }
    /**
     * Helper: Calculate Fiscal Year for a given date
     */
    getFiscalYear(date: string, startMonth: number): number {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = d.getMonth() + 1; // 1-12
        return month < startMonth ? year - 1 : year;
    }

    /**
     * Get list of available fiscal years from transactions
     */
    getAvailableFiscalYears(startMonth: number): number[] {
        const years = new Set<number>();
        this.transactions.forEach(t => {
            years.add(this.getFiscalYear(t.date, startMonth));
        });
        return Array.from(years).sort((a, b) => b - a); // Descending
    }

    /**
     * Get monthly trends for a specific fiscal year.
     * Returns 12 months data starting from startMonth.
     * @param targetTransactions Optional filtered transactions. If not provided, uses all transactions.
     */
    getMonthlyTrendsForFiscalYear(fiscalYear: number, startMonth: number, targetTransactions?: Transaction[]): MonthlyData[] {
        const source = targetTransactions || this.transactions;
        const result: MonthlyData[] = [];
        const map = new Map<string, MonthlyData>();

        // 1. Initialize 12 months
        for (let i = 0; i < 12; i++) {
            let year = fiscalYear;
            let month = startMonth + i;
            if (month > 12) {
                month -= 12;
                year += 1;
            }
            const yyyy = year.toString();
            const mm = month.toString().padStart(2, '0');
            const key = `${yyyy}-${mm}`;
            map.set(key, { month: key, income: 0, expense: 0 });
            result.push(map.get(key)!);
        }

        // 2. Aggregate data
        source.forEach(t => {
            const tYear = this.getFiscalYear(t.date, startMonth);
            if (tYear === fiscalYear) {
                const monthKey = t.date.slice(0, 7);
                const entry = map.get(monthKey);
                // Note: Entry might be undefined if transaction date is somehow out of calculated range (should not happen if logic is correct)
                if (entry) {
                    if (t.type === 'INCOME') entry.income += t.amount;
                    else entry.expense += t.amount;
                }
            }
        });

        return result;
    }

    // Keep existing methods but they might need to be aware of fiscal year context if filtering globally
}
