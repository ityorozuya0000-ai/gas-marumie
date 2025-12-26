import { AppData, Category, Transaction, TransactionType, DatabaseService } from '@marumie/shared';

export function activeSeed(db: DatabaseService) {
    const categories: Category[] = [
        { id: 'cat_01', name: '寄附', type: 'INCOME' },
        { id: 'cat_02', name: '党費・会費', type: 'INCOME' },
        { id: 'cat_03', name: '事業収入', type: 'INCOME' },
        { id: 'cat_11', name: '人件費', type: 'EXPENSE' },
        { id: 'cat_12', name: '光熱水費', type: 'EXPENSE' },
        { id: 'cat_13', name: '備品・消耗品費', type: 'EXPENSE' },
        { id: 'cat_14', name: '事務所費', type: 'EXPENSE' },
        { id: 'cat_15', name: '政治活動費', type: 'EXPENSE' }
    ];

    const transactions: Transaction[] = [];
    const now = new Date();

    // Helper to random date in last year
    const getRandomDate = () => {
        const start = new Date(now.getFullYear() - 1, 0, 1);
        const end = new Date();
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    };

    const formatDate = (date: Date) => Utilities.formatDate(date, 'Asia/Tokyo', 'yyyy-MM-dd');

    // Generate 20 Income records
    for (let i = 0; i < 20; i++) {
        const cat = categories.filter(c => c.type === 'INCOME')[Math.floor(Math.random() * 3)];
        transactions.push({
            id: `tr_in_${i}`,
            date: formatDate(getRandomDate()),
            amount: Math.floor(Math.random() * 50) * 1000 + 1000,
            type: 'INCOME',
            categoryId: cat.id,
            description: `${cat.name}受入`,
            counterparty: '支援者' + String.fromCharCode(65 + i)
        });
    }

    // Generate 30 Expense records
    for (let i = 0; i < 30; i++) {
        const cat = categories.filter(c => c.type === 'EXPENSE')[Math.floor(Math.random() * 5)];
        transactions.push({
            id: `tr_ex_${i}`,
            date: formatDate(getRandomDate()),
            amount: Math.floor(Math.random() * 20) * 1000 + 500,
            type: 'EXPENSE',
            categoryId: cat.id,
            description: `${cat.name}支払い`,
            counterparty: '株式会社' + String.fromCharCode(65 + i)
        });
    }

    // Sort by date desc
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Execute Seed
    db.seed(categories, transactions);
    return { categories, transactions };
}
