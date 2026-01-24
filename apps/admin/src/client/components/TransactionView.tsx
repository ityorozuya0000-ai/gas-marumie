import React, { useState, useEffect } from 'react';
import { AppData, Transaction, Category } from '@marumie/shared';
import { ReceiptUploader } from './ReceiptUploader';

interface TransactionViewProps {
    data: AppData | null;
    refreshData: () => void;
    setLoading: (loading: boolean) => void;
    runScript: (name: string, args: any[]) => Promise<any>;
}

export const TransactionView: React.FC<TransactionViewProps> = ({ data, refreshData, setLoading, runScript }) => {
    // Form State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
    const [categoryId, setCategoryId] = useState('');
    const [description, setDescription] = useState('');
    const [counterparty, setCounterparty] = useState('');
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [receiptUrl, setReceiptUrl] = useState('');

    // Filter State
    const [keyword, setKeyword] = useState('');
    const [filterMonth, setFilterMonth] = useState(''); // YYYY-MM
    const [filterCategory, setFilterCategory] = useState('');

    useEffect(() => {
        if (data?.categories && data.categories.length > 0 && !categoryId) {
            setCategoryId(data.categories[0].id);
        }
    }, [data, categoryId]);

    const handleEdit = (t: Transaction) => {
        setEditingId(t.id);
        setDate(t.date);
        setAmount(String(t.amount));
        setType(t.type);
        setCategoryId(t.categoryId);
        setDescription(t.description);
        setCounterparty(t.counterparty);
        // @ts-ignore: receiptUrl property might be dynamic
        setReceiptUrl(t.receiptUrl || '');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancel = () => {
        setEditingId(null);
        setAmount('');
        setDescription('');
        setCounterparty('');
        setReceiptUrl('');
        setDate(new Date().toISOString().slice(0, 10));
    };

    const handleDelete = async (id: string) => {
        if (confirm('本当に削除しますか？')) {
            setLoading(true);
            try {
                await runScript('deleteTransaction', [id]);
                alert('削除しました');
                refreshData();
            } catch (err: any) {
                alert('エラー: ' + err.message);
                setLoading(false);
            }
        }
    };

    const handleReceiptAnalyzed = (result: any) => {
        const { data: receiptData, driveWebViewLink } = result;

        if (receiptData) {
            if (receiptData.date) setDate(receiptData.date);
            if (receiptData.totalAmount) setAmount(String(receiptData.totalAmount));
            if (receiptData.shopName) setCounterparty(receiptData.shopName);

            // Build description from items
            if (receiptData.items && Array.isArray(receiptData.items)) {
                const itemsDesc = receiptData.items.map((i: any) => `${i.name}(${i.price})`).join(', ');
                setDescription(itemsDesc);
            } else {
                setDescription('レシート読取');
            }
        }

        if (driveWebViewLink) {
            setReceiptUrl(driveWebViewLink);
        }

        alert('レシート情報を読み取りました。\n内容を確認して登録してください。');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!categoryId) return;

        const transaction: Transaction & { receiptUrl?: string } = {
            id: editingId || 'tr_' + Date.now(),
            date,
            amount: Number(amount),
            type,
            categoryId,
            description,
            counterparty,
            receiptUrl // Save the URL
        };

        const message = editingId ? '更新しますか？' : '登録しますか？';
        const method = editingId ? 'updateTransaction' : 'addTransaction';

        if (confirm(message)) {
            setLoading(true);
            try {
                await runScript(method, [transaction]);
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

                {/* Receipt Uploader Section */}
                {!editingId && (
                    <div className="mb-6">
                        {data?.hasApiKey ? (
                            <ReceiptUploader
                                runScript={runScript}
                                onAnalysisComplete={handleReceiptAnalyzed}
                            />
                        ) : (
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
                                <p className="text-slate-600 mb-2">Gemini APIキーを設定すると、レシート画像の自動解析が利用できます。</p>
                                <button
                                    onClick={() => (document.querySelector('button[title="設定"]') as HTMLElement)?.click()}
                                    className="text-blue-600 font-bold hover:underline"
                                >
                                    設定を開く
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                    {receiptUrl && (
                        <div className="bg-slate-50 p-2 rounded border text-sm text-slate-600 flex items-center gap-2">
                            <span>📎 レシート画像あり:</span>
                            <a href={receiptUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate max-w-xs">{receiptUrl}</a>
                            {editingId && (
                                <button type="button" onClick={() => setReceiptUrl('')} className="text-rose-500 text-xs ml-auto">削除</button>
                            )}
                        </div>
                    )}

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
            {/* Filter Controls (Shared) */}
            <div className="bg-white rounded-lg shadow p-4 mb-4">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <h3 className="font-bold text-slate-600 self-start md:self-center">
                        登録データ一覧 <span className="text-xs font-normal text-slate-400">({filteredTransactions.length}件)</span>
                    </h3>

                    <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                        <input
                            type="search"
                            value={keyword}
                            onChange={e => setKeyword(e.target.value)}
                            placeholder="キーワード検索..."
                            className="border rounded px-2 py-2 md:py-1 w-full md:w-40"
                        />
                        <div className="flex gap-2 w-full md:w-auto">
                            <input
                                type="month"
                                value={filterMonth}
                                onChange={e => setFilterMonth(e.target.value)}
                                className="border rounded px-2 py-2 md:py-1 w-full md:w-32"
                            />
                            <select
                                value={filterCategory}
                                onChange={e => setFilterCategory(e.target.value)}
                                className="border rounded px-2 py-2 md:py-1 w-full md:w-32 whitespace-nowrap overflow-hidden text-ellipsis"
                            >
                                <option value="">全てのカテゴリ</option>
                                {data?.categories.map((c: Category) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        {(keyword || filterMonth || filterCategory) && (
                            <button
                                onClick={() => { setKeyword(''); setFilterMonth(''); setFilterCategory(''); }}
                                className="text-slate-500 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded text-sm w-full md:w-auto mt-2 md:mt-0"
                            >
                                検索条件をクリア
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {filteredTransactions.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-8 text-center text-slate-400">
                        該当するデータがありません
                    </div>
                ) : (
                    filteredTransactions.map((t: Transaction) => (
                        <div key={t.id} className="bg-white rounded-lg shadow p-4">
                            <div className="flex justify-between items-start mb-2">
                                <div className="text-sm text-slate-500">{t.date}</div>
                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${t.type === 'INCOME' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                                    {t.type === 'INCOME' ? '収入' : '支出'}
                                </span>
                            </div>
                            <div className="flex justify-between items-baseline mb-2">
                                <div className="font-bold text-lg text-slate-800">¥{t.amount.toLocaleString()}</div>
                                <div className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                                    {getCategoryName(t.categoryId)}
                                </div>
                            </div>
                            <div className="text-sm text-slate-700 mb-1">
                                <span className="font-bold mr-2">{t.counterparty}</span>
                            </div>
                            <div className="text-sm text-slate-500 mb-3 line-clamp-2">
                                {t.description}
                            </div>
                            <div className="flex justify-end gap-2 border-t pt-3">
                                {/* @ts-ignore */}
                                {t.receiptUrl && (
                                    <a href={t.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded text-sm">画像</a>
                                )}
                                <button onClick={() => handleEdit(t)} className="text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded text-sm">編集</button>
                                <button onClick={() => handleDelete(t.id)} className="text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded text-sm">削除</button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                        <tr>
                            <th className="px-4 py-2 text-left">日付</th>
                            <th className="px-4 py-2 text-left whitespace-nowrap">種別</th>
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
                                    <td className="px-4 py-3 whitespace-nowrap">
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
                                        <div className="text-xs flex items-center gap-1">
                                            {/* @ts-ignore */}
                                            {t.receiptUrl && <span title="レシートあり">📎</span>}
                                            {t.description} ({t.counterparty})
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                                        {/* @ts-ignore */}
                                        {t.receiptUrl && (
                                            <a href={t.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 text-xs border border-indigo-200 bg-indigo-50 px-2 py-1 rounded">画像</a>
                                        )}
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
