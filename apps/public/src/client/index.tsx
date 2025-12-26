import React, { useEffect, useState, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { AppData, Transaction, Category } from '@marumie/shared';
// Remove recharts imports
// import { ... } from 'recharts';

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

/**
 * Simple SVG Bar Chart for Monthly Income/Expense
 */
const SimpleBarChart = ({ data }: { data: { month: string; income: number; expense: number }[] }) => {
    if (!data || data.length === 0) return <div className="h-full flex items-center justify-center text-slate-400">データがありません</div>;

    const height = 300;
    const width = 600;
    const padding = 40;
    const chartHeight = height - padding * 2;
    const chartWidth = width - padding * 2;

    const maxVal = Math.max(...data.map(d => Math.max(d.income, d.expense)), 1000) * 1.1; // 10% buffering
    const barSlotWidth = chartWidth / data.length;
    const barWidth = Math.min(barSlotWidth * 0.35, 30); // Max bar width 30px

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
                const y = height - padding - (chartHeight * tick);
                const val = Math.round(maxVal * tick);
                return (
                    <g key={tick}>
                        <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#e2e8f0" strokeDasharray="4 4" />
                        <text x={padding - 5} y={y + 4} fontSize="10" textAnchor="end" fill="#94a3b8">
                            {val >= 10000 ? `${(val / 10000).toFixed(1)}万` : val}
                        </text>
                    </g>
                );
            })}

            {/* Axis Lines */}
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#cbd5e1" />
            <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#cbd5e1" />

            {/* Bars */}
            {data.map((d, i) => {
                const xIn = padding + (barSlotWidth * i) + (barSlotWidth / 2) - barWidth;
                const xEx = padding + (barSlotWidth * i) + (barSlotWidth / 2);

                const hIn = (d.income / maxVal) * chartHeight;
                const hEx = (d.expense / maxVal) * chartHeight;

                return (
                    <g key={i} className="group">
                        <title>{`${d.month}\n収入: ¥${d.income.toLocaleString()}\n支出: ¥${d.expense.toLocaleString()}`}</title>
                        {/* Income Bar */}
                        <rect x={xIn} y={height - padding - hIn} width={barWidth} height={hIn} fill="#3b82f6" rx="2" />
                        {/* Expense Bar */}
                        <rect x={xEx} y={height - padding - hEx} width={barWidth} height={hEx} fill="#f43f5e" rx="2" />
                        {/* X Label */}
                        <text x={padding + (barSlotWidth * i) + (barSlotWidth / 2)} y={height - padding + 20} fontSize="11" textAnchor="middle" fill="#64748b">
                            {d.month.split('-')[1]}月
                        </text>
                    </g>
                );
            })}
        </svg>
    );
};

/**
 * Simple SVG Pie Chart for Category Share
 */
const SimplePieChart = ({ data }: { data: { name: string; value: number }[] }) => {
    if (!data || data.length === 0) return <div className="h-full flex items-center justify-center text-slate-400">データがありません</div>;

    const total = data.reduce((acc, cur) => acc + cur.value, 0);
    let cumulativeAngle = 0;

    const cx = 100;
    const cy = 100;
    const r = 80;
    const hole = 50; // Donut chart

    const slices = data.map((d, i) => {
        const startAngle = cumulativeAngle;
        const sliceAngle = (d.value / total) * 2 * Math.PI;
        cumulativeAngle += sliceAngle;
        const endAngle = cumulativeAngle;

        // Calculate path
        const x1 = cx + r * Math.cos(startAngle - Math.PI / 2);
        const y1 = cy + r * Math.sin(startAngle - Math.PI / 2);
        const x2 = cx + r * Math.cos(endAngle - Math.PI / 2);
        const y2 = cy + r * Math.sin(endAngle - Math.PI / 2);

        // Inner arc for donut
        const x3 = cx + hole * Math.cos(endAngle - Math.PI / 2);
        const y3 = cy + hole * Math.sin(endAngle - Math.PI / 2);
        const x4 = cx + hole * Math.cos(startAngle - Math.PI / 2);
        const y4 = cy + hole * Math.sin(startAngle - Math.PI / 2);

        const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;

        const pathData = [
            `M ${x1} ${y1}`,
            `A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            `L ${x3} ${y3}`,
            `A ${hole} ${hole} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
            'Z'
        ].join(' ');

        return { pathData, color: COLORS[i % COLORS.length], ...d };
    });

    return (
        <div className="flex items-center justify-center h-full w-full">
            <svg viewBox="0 0 200 200" className="h-full w-auto max-w-full">
                {slices.map((slice, i) => (
                    <path key={i} d={slice.pathData} fill={slice.color} stroke="#fff" strokeWidth="1" className="hover:opacity-90 cursor-pointer">
                        <title>{`${slice.name}: ¥${slice.value.toLocaleString()} (${Math.round(slice.value / total * 100)}%)`}</title>
                    </path>
                ))}
            </svg>
            <div className="ml-4 text-xs space-y-1">
                {data.map((d, i) => (
                    <div key={i} className="flex items-center">
                        <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                        <span className="text-slate-600 truncate max-w-[100px]" title={d.name}>{d.name}</span>
                        <span className="ml-2 font-bold text-slate-700">{Math.round(d.value / total * 100)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

import { GasClient } from './services/GasClient';
import { TransactionAnalyzer } from './domain/TransactionAnalyzer';

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

    // 3. Chart Data: Monthly Trends (Using All data or Filtered data context)
    // Design Choice: Charts reflect the current list (filtered context)
    const monthlyData = useMemo(() => {
        if (!analyzer) return [];
        // Determine source: if filters active, show filtered trends? 
        // Or always show global trends?
        // Let's stick to previous behavior: effectively filtered context mostly, 
        // but if we want Global context we'd pass data.transactions.
        // The previous code did: if filtered > 0 ? filtered : all.
        const source = filteredTransactions.length > 0 ? filteredTransactions : (data?.transactions || []);
        return analyzer.getMonthlyTrends(source);
    }, [analyzer, filteredTransactions, data]);

    // 4. Chart Data: Category Share (Expense)
    const categoryData = useMemo(() => {
        if (!analyzer) return [];
        const source = filteredTransactions.length > 0 ? filteredTransactions : (data?.transactions || []);
        return analyzer.getCategoryShare(source);
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

                {/* 2. Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Monthly Trends */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="text-lg font-bold mb-4 text-slate-700">📅 月別収支推移</h3>
                        <SimpleBarChart data={monthlyData} />
                    </div>

                    {/* Category Share */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="text-lg font-bold mb-4 text-slate-700">🍩 支出内訳 (カテゴリ別)</h3>
                        <div className="h-64">
                            <SimplePieChart data={categoryData} />
                        </div>
                    </div>
                </div>

                {/* 3. Transaction List & Filters */}
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
            </main>
        </div>
    );
};

// --- Render ---
const container = document.getElementById('root');
if (container) {
    createRoot(container).render(<App />);
}
