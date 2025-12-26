import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AppData, Transaction, Category } from '@marumie/shared';

// --- Mocks & Utilities ---
const runGoogleScript = (name: string, args: any[] = []): Promise<any> => {
    return new Promise((resolve, reject) => {
        if ((window as any).google && (window as any).google.script) {
            (window as any).google.script.run
                .withSuccessHandler(resolve)
                .withFailureHandler(reject)
            [name](...args);
        } else {
            console.warn(`GAS Mock: Calling ${name} with`, args);
            setTimeout(() => {
                resolve({ transactions: [], categories: [], lastUpdated: new Date().toISOString() } as AppData);
            }, 800);
        }
    });
};

// --- Components ---

const Layout = ({ currentUser, currentView, onViewChange, children }: any) => {
    const menuItems = [
        { id: 'transactions', icon: '📝', label: '取引管理' },
        { id: 'categories', icon: '🏷️', label: 'カテゴリ管理' },
        { id: 'reports', icon: '📊', label: 'レポート・出力' },
    ];

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col">
            {/* Top Navigation */}
            <header className="bg-slate-900 text-white shadow-md">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <div className="font-bold text-xl tracking-tight flex items-center gap-2">
                            <span>🔵</span>
                            <span>Marumie Admin</span>
                        </div>

                        {/* Navigation */}
                        <nav className="flex space-x-1">
                            {menuItems.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => onViewChange(item.id)}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition flex items-center gap-2 ${currentView === item.id
                                        ? 'bg-slate-800 text-white shadow-sm'
                                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                        }`}
                                >
                                    <span>{item.icon}</span>
                                    <span>{item.label}</span>
                                </button>
                            ))}
                        </nav>

                        {/* User Profile */}
                        <div className="text-sm text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
                            👤 {currentUser}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full max-w-6xl mx-auto p-6">
                {children}
            </main>
        </div>
    );
};

const TransactionView = ({ data, refreshData, setLoading }: any) => {
    // Form State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
    const [categoryId, setCategoryId] = useState('');
    const [description, setDescription] = useState('');
    const [counterparty, setCounterparty] = useState('');
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

    // Filter State
    const [keyword, setKeyword] = useState('');
    const [filterMonth, setFilterMonth] = useState(''); // YYYY-MM
    const [filterCategory, setFilterCategory] = useState('');

    useEffect(() => {
        if (data?.categories.length > 0 && !categoryId) {
            setCategoryId(data.categories[0].id);
        }
    }, [data]);

    const handleEdit = (t: Transaction) => {
        setEditingId(t.id);
        setDate(t.date);
        setAmount(String(t.amount));
        setType(t.type);
        setCategoryId(t.categoryId);
        setDescription(t.description);
        setCounterparty(t.counterparty);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancel = () => {
        setEditingId(null);
        setAmount('');
        setDescription('');
        setCounterparty('');
        setDate(new Date().toISOString().slice(0, 10));
    };

    const handleDelete = async (id: string) => {
        if (confirm('本当に削除しますか？')) {
            setLoading(true);
            try {
                await runGoogleScript('deleteTransaction', [id]);
                alert('削除しました');
                refreshData();
            } catch (err: any) {
                alert('エラー: ' + err.message);
                setLoading(false);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!categoryId) return;

        const transaction: Transaction = {
            id: editingId || 'tr_' + Date.now(),
            date,
            amount: Number(amount),
            type,
            categoryId,
            description,
            counterparty
        };

        const message = editingId ? '更新しますか？' : '登録しますか？';
        const method = editingId ? 'updateTransaction' : 'addTransaction';

        if (confirm(message)) {
            setLoading(true);
            try {
                await runGoogleScript(method, [transaction]);
                handleCancel();
                alert(editingId ? '更新しました' : '登録しました');
                refreshData();
            } catch (err: any) {
                alert('エラー: ' + err.message);
                setLoading(false);
            }
        }
    };

    // Filter Logic
    const filteredTransactions = data?.transactions.filter((t: Transaction) => {
        // Month Filter
        if (filterMonth && !t.date.startsWith(filterMonth)) return false;

        // Category Filter
        if (filterCategory && t.categoryId !== filterCategory) return false;

        // Keyword Filter
        if (keyword) {
            const lowerKeyword = keyword.toLowerCase();
            const matchDesc = t.description.toLowerCase().includes(lowerKeyword);
            const matchCounter = t.counterparty.toLowerCase().includes(lowerKeyword);
            if (!matchDesc && !matchCounter) return false;
        }

        return true;
    }) || [];

    // Helper for category name
    const getCategoryName = (id: string) => {
        return data?.categories.find((c: Category) => c.id === id)?.name || id;
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className={`bg-white rounded-lg shadow p-6 mb-8 border-l-4 ${editingId ? 'border-amber-500' : 'border-blue-500'}`}>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <span>{editingId ? '✏️' : '📝'}</span> {editingId ? '取引を編集' : '新規取引登録'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">日付</label>
                            <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full border rounded p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">種類</label>
                            <div className="flex gap-4 mt-2">
                                <label className="flex items-center gap-2">
                                    <input type="radio" checked={type === 'INCOME'} onChange={() => setType('INCOME')} /> 収入
                                </label>
                                <label className="flex items-center gap-2">
                                    <input type="radio" checked={type === 'EXPENSE'} onChange={() => setType('EXPENSE')} /> 支出
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">金額</label>
                            <input type="number" required value={amount} onChange={e => setAmount(e.target.value)} className="w-full border rounded p-2" placeholder="¥0" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">費目</label>
                            <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full border rounded p-2">
                                {data?.categories.filter((c: Category) => c.type === type).map((c: Category) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">摘要</label>
                        <input type="text" required value={description} onChange={e => setDescription(e.target.value)} className="w-full border rounded p-2" placeholder="例: 事務用品購入" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">相手方</label>
                        <input type="text" required value={counterparty} onChange={e => setCounterparty(e.target.value)} className="w-full border rounded p-2" placeholder="例: 株式会社〇〇" />
                    </div>

                    <div className="pt-4 flex gap-4">
                        <button type="submit" className={`flex-1 text-white font-bold py-3 rounded-lg shadow transition ${editingId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                            {editingId ? '更新する' : '登録する'}
                        </button>
                        {editingId && (
                            <button type="button" onClick={handleCancel} className="px-6 bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold rounded-lg shadow transition">
                                キャンセル
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b bg-slate-50 border-slate-200 flex justify-between items-center flex-wrap gap-4">
                    <h3 className="font-bold text-slate-600">登録データ一覧 <span className="text-xs font-normal text-slate-400">({filteredTransactions.length}件)</span></h3>

                    {/* Filter Controls */}
                    <div className="flex gap-2 items-center text-sm">
                        <input
                            type="search"
                            value={keyword}
                            onChange={e => setKeyword(e.target.value)}
                            placeholder="キーワード検索..."
                            className="border rounded px-2 py-1 w-40"
                        />
                        <input
                            type="month"
                            value={filterMonth}
                            onChange={e => setFilterMonth(e.target.value)}
                            className="border rounded px-2 py-1 w-32"
                        />
                        <select
                            value={filterCategory}
                            onChange={e => setFilterCategory(e.target.value)}
                            className="border rounded px-2 py-1 w-32 whitespace-nowrap overflow-hidden text-ellipsis"
                        >
                            <option value="">全てのカテゴリ</option>
                            {data?.categories.map((c: Category) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        {(keyword || filterMonth || filterCategory) && (
                            <button onClick={() => { setKeyword(''); setFilterMonth(''); setFilterCategory(''); }} className="text-slate-400 hover:text-slate-600 px-1">
                                ✖
                            </button>
                        )}
                    </div>
                </div>
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                        <tr>
                            <th className="px-4 py-2 text-left">日付</th>
                            <th className="px-4 py-2 text-left">種別</th>
                            <th className="px-4 py-2 text-left">費目</th>
                            <th className="px-4 py-2 text-left">内容</th>
                            <th className="px-4 py-2 text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTransactions.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                                    該当するデータがありません
                                </td>
                            </tr>
                        ) : (
                            filteredTransactions.map((t: Transaction) => (
                                <tr key={t.id} className="border-t hover:bg-slate-50">
                                    <td className="px-4 py-3">{t.date}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded text-xs ${t.type === 'INCOME' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                                            {t.type === 'INCOME' ? '収入' : '支出'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs">
                                            {getCategoryName(t.categoryId)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">
                                        <div className="font-medium text-slate-900">¥{t.amount.toLocaleString()}</div>
                                        <div className="text-xs">{t.description} ({t.counterparty})</div>
                                    </td>
                                    <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                                        <button onClick={() => handleEdit(t)} className="text-blue-600 hover:text-blue-800 text-xs border border-blue-200 bg-blue-50 px-2 py-1 rounded">編集</button>
                                        <button onClick={() => handleDelete(t.id)} className="text-rose-600 hover:text-rose-800 text-xs border border-rose-200 bg-rose-50 px-2 py-1 rounded">削除</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const CategoryView = ({ data, refreshData, setLoading }: any) => {
    const [name, setName] = useState('');
    const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');

    const handleDelete = async (id: string) => {
        if (confirm('カテゴリを削除しますか？\n※このカテゴリを使用している取引がある場合、表示がおかしくなる可能性があります。')) {
            setLoading(true);
            try {
                await runGoogleScript('deleteCategory', [id]);
                refreshData();
            } catch (e: any) {
                alert('エラー: ' + e.message);
                setLoading(false);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const category: Category = {
            id: 'cat_' + Date.now(),
            name,
            type
        };
        setLoading(true);
        try {
            await runGoogleScript('addCategory', [category]);
            setName('');
            refreshData();
        } catch (e: any) {
            alert('エラー: ' + e.message);
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h2 className="text-xl font-bold mb-6">🏷️ カテゴリ管理</h2>
                <form onSubmit={handleSubmit} className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-700 mb-1">カテゴリ名</label>
                        <input type="text" required value={name} onChange={e => setName(e.target.value)}
                            className="w-full border rounded p-2" placeholder="例: 交通費" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">種別</label>
                        <select value={type} onChange={e => setType(e.target.value as any)} className="border rounded p-2 w-32">
                            <option value="INCOME">収入</option>
                            <option value="EXPENSE">支出</option>
                        </select>
                    </div>
                    <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2 rounded shadow">
                        追加
                    </button>
                </form>
            </div>

            <div className="grid grid-cols-2 gap-8">
                {/* Income Categories */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="p-3 bg-blue-50 border-b border-blue-100 font-bold text-blue-800">収入カテゴリ</div>
                    <ul className="divide-y">
                        {data?.categories.filter((c: Category) => c.type === 'INCOME').map((c: Category) => (
                            <li key={c.id} className="p-3 flex justify-between items-center hover:bg-slate-50">
                                <span>{c.name}</span>
                                <button onClick={() => handleDelete(c.id)} className="text-slate-400 hover:text-rose-500">🗑️</button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Expense Categories */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="p-3 bg-red-50 border-b border-red-100 font-bold text-red-800">支出カテゴリ</div>
                    <ul className="divide-y">
                        {data?.categories.filter((c: Category) => c.type === 'EXPENSE').map((c: Category) => (
                            <li key={c.id} className="p-3 flex justify-between items-center hover:bg-slate-50">
                                <span>{c.name}</span>
                                <button onClick={() => handleDelete(c.id)} className="text-slate-400 hover:text-rose-500">🗑️</button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

const ReportView = ({ data }: any) => {
    const downloadCSV = () => {
        if (!data?.transactions) return;

        // BOM for Excel
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);

        // Header
        let csvContent = "ID,日付,種別,金額,カテゴリID,摘要,相手方\n";

        // Rows
        data.transactions.forEach((t: Transaction) => {
            const row = [
                t.id,
                t.date,
                t.type,
                t.amount,
                t.categoryId,
                `"${t.description.replace(/"/g, '""')}"`, // Escape quotes
                `"${t.counterparty.replace(/"/g, '""')}"`
            ];
            csvContent += row.join(",") + "\n";
        });

        const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `marumie_export_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">📊 レポート・出力</h2>

            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="font-bold text-lg mb-4">データエクスポート</h3>
                <p className="text-slate-600 mb-4">
                    現在登録されている全ての取引データをCSV形式でダウンロードします。<br />
                    Excel等の表計算ソフトで開くことができます。
                </p>
                <button onClick={downloadCSV} className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-6 rounded-lg shadow flex items-center gap-2">
                    <span>⬇️</span> CSVダウンロード
                </button>
            </div>

            <div className="bg-slate-50 rounded-lg border-2 border-dashed border-slate-300 p-8 text-center text-slate-400">
                <div className="text-4xl mb-2">📄</div>
                <div className="font-bold">収支報告書出力</div>
                <div className="text-sm">Coming Soon...</div>
            </div>
        </div>
    );
};

// --- App Container ---

const App = () => {
    const [data, setData] = useState<AppData | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<string>('');
    const [currentView, setCurrentView] = useState('transactions');

    useEffect(() => {
        setCurrentUser((window as any).currentUserEmail || 'Dev User');
        refreshData();
    }, []);

    const refreshData = async () => {
        setLoading(true);
        try {
            const result = await runGoogleScript('getInitialData');
            setData(result);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100">
                <div className="text-xl font-bold text-slate-500 animate-pulse">Loading...</div>
            </div>
        );
    }

    return (
        <Layout currentUser={currentUser} currentView={currentView} onViewChange={setCurrentView}>
            {currentView === 'transactions' && (
                <TransactionView data={data} refreshData={refreshData} setLoading={setLoading} />
            )}
            {currentView === 'categories' && (
                <CategoryView data={data} refreshData={refreshData} setLoading={setLoading} />
            )}
            {currentView === 'reports' && (
                <ReportView data={data} />
            )}
        </Layout>
    );
};

const container = document.getElementById('root');
if (container) {
    createRoot(container).render(<App />);
}
