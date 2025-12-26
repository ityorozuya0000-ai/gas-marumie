export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Category {
    id: string;
    name: string;
    type: TransactionType;
}

export interface Transaction {
    id: string;
    date: string; // ISO 8601 YYYY-MM-DD
    amount: number;
    type: TransactionType;
    categoryId: string;
    description: string;
    counterparty: string; // 相手方
}

export interface AppData {
    transactions: Transaction[];
    categories: Category[];
    lastUpdated: string;
}
