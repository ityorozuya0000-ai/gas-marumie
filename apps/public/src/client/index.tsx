import React, { useEffect, useState, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { AppData, Transaction, Category } from '@marumie/shared';
import { DonutChart } from './components/DonutChart';
import { MonthlyBalanceChart } from './components/MonthlyBalanceChart';
import { GasClient } from './services/GasClient';
import { TransactionAnalyzer } from './domain/TransactionAnalyzer';

// --- Mocks ---
const runGoogleScript = (name: string, args: any[] = []): Promise<any> => {
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
                    resolve({ transactions: [], categories: [], lastUpdated: new Date().toISOString() } as AppData);
                } else {
                    resolve({});
                }
            }, 1000);
        }
    });
};

// --- Helper Components ---
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// --- Services ---
const gasClient = new GasClient();

// --- Main App ---
const App = () => {
    const [data, setData] = useState<AppData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter State
    const [keyword, setKeyword] = useState('');
    const [filterMonth, setFilterMonth] = useState(''); // YYYY-MM
    const [filterCategory, setFilterCategory] = useState('');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await gasClient.getInitialData();
                setData(result);
            } catch (e: any) {
                setError(e.message || 'Error fetching data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const analyzer = useMemo(() => {
        if (!data) return null;
        return new TransactionAnalyzer(data.transactions, data.categories);
    }, [data]);

    // --- Computed Data ---

    // 1. Filtered Transactions
    const filteredTransactions = useMemo(() => {
        if (!analyzer) return [];
        return analyzer.filter({
            keyword,
            month: filterMonth,
            categoryId: filterCategory
        });
    }, [analyzer, keyword, filterMonth, filterCategory]);

    // 2. Pagination
    const paginatedTransactions = useMemo(() => {
        if (!analyzer) return [];
        return analyzer.paginate(filteredTransactions, currentPage, itemsPerPage);
    }, [analyzer, filteredTransactions, currentPage]);

    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

    // Helper to assign colors
    const assignColors = (data: { name: string; value: number }[]) => {
        return data.map((d, i) => ({
            ...d,
            color: COLORS[i % COLORS.length]
        }));
    };

    // 3. Chart Data: Income Category Share
    const incomeCategoryData = useMemo(() => {
        if (!analyzer) return [];
        const source = filteredTransactions.length > 0 ? filteredTransactions : (data?.transactions || []);
        return assignColors(analyzer.getCategoryShare(source, 'INCOME'));
    }, [analyzer, filteredTransactions, data]);

    // 4. Chart Data: Expense Category Share
    const expenseCategoryData = useMemo(() => {
        if (!analyzer) return [];
        const source = filteredTransactions.length > 0 ? filteredTransactions : (data?.transactions || []);
        return assignColors(analyzer.getCategoryShare(source, 'EXPENSE'));
    }, [analyzer, filteredTransactions, data]);

    // 5. Chart Data: Monthly Trends
    const monthlyData = useMemo(() => {
        if (!analyzer) return [];
        const source = filteredTransactions.length > 0 ? filteredTransactions : (data?.transactions || []);
        return analyzer.getMonthlyTrends(source);
    }, [analyzer, filteredTransactions, data]);

    // 5. Global Totals (Filtered)
    const stats = useMemo(() => {
        if (!analyzer) return { totalIncome: 0, totalExpense: 0, balance: 0 };
        return analyzer.getGlobalStats(filteredTransactions);
    }, [analyzer, filteredTransactions]);


    if (loading) return <div className="flex justify-center items-center h-screen"><div className="loader"></div></div>;
    if (error) return <div className="p-8 text-red-500">Error: {error}</div>;
    if (!data) return null;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                            みらいまる見え
                        </span>
                        <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 rounded text-slate-500">GAS版</span>
                    </div>
                    <div className="text-xs text-slate-400">
                        データ更新: {data.lastUpdated ? new Date(data.lastUpdated).toLocaleString() : '---'}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* 1. Global Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="text-sm font-medium text-slate-500">対象収入総額</h3>
                        <p className="text-3xl font-bold mt-2 text-slate-800">¥{stats.totalIncome.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="text-sm font-medium text-slate-500">対象支出総額</h3>
                        <p className="text-3xl font-bold mt-2 text-slate-800">¥{stats.totalExpense.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="text-sm font-medium text-slate-500">収支差額</h3>
                        <p className={`text-3xl font-bold mt-2 ${stats.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            ¥{stats.balance.toLocaleString()}
                        </p>
                    </div>
                </div>



                {/* 2. Charts Section (Donut only) */}
                <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Income Donut */}
                        <DonutChart
                            title="収入内訳 (カテゴリ別)"
                            centerLabel="収入"
                            totalAmount={stats.totalIncome}
                            data={incomeCategoryData}
                        />

                        {/* Expense Donut */}
                        <DonutChart
                            title="支出内訳 (カテゴリ別)"
                            centerLabel="支出"
                            totalAmount={stats.totalExpense}
                            data={expenseCategoryData}
                        />
                    </div>
                </div>

                {/* 3. Monthly Trends (Dedicated Card) */}
                <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold mb-6 text-slate-700">📅 月別収支推移</h3>
                    <div className="h-96 w-full relative">
                        <MonthlyBalanceChart data={monthlyData} />
                    </div>
                </div>

                {/* 4. Transaction List & Filters */}
                <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 space-y-4">
                        <div className="flex justify-between items-center flex-wrap gap-4">
                            <h2 className="text-lg font-bold text-slate-700">📄 取引明細</h2>

                            {/* Filters */}
                            <div className="flex gap-2 items-center flex-wrap">
                                <input
                                    type="text"
                                    placeholder="キーワード検索..."
                                    className="border rounded px-3 py-2 text-sm w-48 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={keyword}
                                    onChange={e => { setKeyword(e.target.value); setCurrentPage(1); }}
                                />
                                <input
                                    type="month"
                                    className="border rounded px-3 py-2 text-sm w-40 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={filterMonth}
                                    onChange={e => { setFilterMonth(e.target.value); setCurrentPage(1); }}
                                />
                                <select
                                    className="border rounded px-3 py-2 text-sm w-40 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={filterCategory}
                                    onChange={e => { setFilterCategory(e.target.value); setCurrentPage(1); }}
                                >
                                    <option value="">全てのカテゴリ</option>
                                    {data.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                {(keyword || filterMonth || filterCategory) && (
                                    <button
                                        onClick={() => { setKeyword(''); setFilterMonth(''); setFilterCategory(''); setCurrentPage(1); }}
                                        className="text-sm text-slate-500 hover:text-rose-500 px-2"
                                    >
                                        クリア
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {filteredTransactions.length === 0 ? (
                        <div className="p-16 text-center text-slate-400">
                            条件に一致するデータが見つかりませんでした。
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                                        <tr>
                                            <th className="px-6 py-3 whitespace-nowrap">日付</th>
                                            <th className="px-6 py-3 whitespace-nowrap">種類</th>
                                            <th className="px-6 py-3 whitespace-nowrap">金額</th>
                                            <th className="px-6 py-3 whitespace-nowrap">カテゴリ</th>
                                            <th className="px-6 py-3 min-w-[200px]">摘要</th>
                                            <th className="px-6 py-3 min-w-[150px]">相手方</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {paginatedTransactions.map((t) => (
                                            <tr key={t.id} className="bg-white hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap font-mono text-slate-600">{t.date}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${t.type === 'INCOME' ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
                                                        }`}>
                                                        {t.type === 'INCOME' ? '収入' : '支出'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-700">
                                                    ¥{t.amount.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                                                    {data.categories.find(c => c.id === t.categoryId)?.name || '-'}
                                                </td>
                                                <td className="px-6 py-4 text-slate-600">{t.description}</td>
                                                <td className="px-6 py-4 text-slate-600">{t.counterparty}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                                <div className="text-sm text-slate-500">
                                    全 {filteredTransactions.length} 件中 {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} 件を表示
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(p => p - 1)}
                                        className="px-3 py-1 border rounded bg-white hover:bg-slate-100 disabled:opacity-50 text-sm"
                                    >
                                        前へ
                                    </button>
                                    <div className="flex items-center px-2 text-sm font-medium">
                                        {currentPage} / {totalPages}
                                    </div>
                                    <button
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage(p => p + 1)}
                                        className="px-3 py-1 border rounded bg-white hover:bg-slate-100 disabled:opacity-50 text-sm"
                                    >
                                        次へ
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </section>
            </main >
        </div >
    );
};

// --- Render ---
const container = document.getElementById('root');
if (container) {
    createRoot(container).render(<App />);
}
