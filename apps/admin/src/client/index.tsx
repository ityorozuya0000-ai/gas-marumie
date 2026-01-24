import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AppData, Transaction, Category } from '@marumie/shared';
// Components
import { Layout } from './components/Layout';
import { TransactionView } from './components/TransactionView';
import { SettingsModal } from './components/SettingsModal';

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
                const mockResponse = name === 'processReceiptImage' ? {
                    success: true,
                    data: {
                        date: '2023-10-27',
                        shopName: 'Mock Store',
                        totalAmount: 1280,
                        items: [{ name: 'Item A', price: 1000 }, { name: 'Item B', price: 280 }]
                    },
                    driveFileUrl: 'https://example.com/mock-receipt.jpg',
                    driveWebViewLink: 'https://example.com/mock-receipt.jpg'
                } : { transactions: [], categories: [], lastUpdated: new Date().toISOString() };
                resolve(mockResponse);
            }, 800);
        }
    });
};

// --- View Components (Inline for now, consider extracting later if large) ---

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
        let csvContent = "ID,日付,種別,金額,カテゴリID,摘要,相手方,レシートURL\n";

        // Rows
        data.transactions.forEach((t: Transaction & { receiptUrl?: string }) => {
            const row = [
                t.id,
                t.date,
                t.type,
                t.amount,
                t.categoryId,
                `"${t.description.replace(/"/g, '""')}"`, // Escape quotes
                `"${t.counterparty.replace(/"/g, '""')}"`,
                t.receiptUrl ? `"${t.receiptUrl}"` : ""
            ];
            csvContent += row.join(",") + "\n";
        });

        const blob = new Blob([bom, csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4">📊 レポート・データ出力</h2>
                <div className="space-y-4">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center">
                        <div>
                            <div className="font-bold text-slate-700">全データCSVエクスポート</div>
                            <div className="text-sm text-slate-500">登録されているすべての取引データをCSV形式でダウンロードします。</div>
                        </div>
                        <button onClick={downloadCSV} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded shadow">
                            ダウンロード
                        </button>
                    </div>
                </div>
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
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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

    const runScript = (name: string, args: any[] = []) => runGoogleScript(name, args);

    if (loading && !data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100">
                <div className="text-xl font-bold text-slate-500 animate-pulse">Loading...</div>
            </div>
        );
    }

    return (
        <>
            <Layout
                currentUser={currentUser}
                currentView={currentView}
                onViewChange={setCurrentView}
                onOpenSettings={() => setIsSettingsOpen(true)}
                appTitle={data?.appTitle ? `${data.appTitle} [管理画面]` : undefined}
            >
                {currentView === 'transactions' && (
                    <TransactionView
                        data={data}
                        refreshData={refreshData}
                        setLoading={setLoading}
                        runScript={runScript}
                    />
                )}
                {currentView === 'categories' && (
                    <CategoryView data={data} refreshData={refreshData} setLoading={setLoading} />
                )}
                {currentView === 'reports' && (
                    <ReportView data={data} />
                )}
            </Layout>
            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                runScript={runScript}
            />
        </>
    );
};

// --- Render ---
const container = document.getElementById('root');
if (container) {
    createRoot(container).render(<App />);
}
