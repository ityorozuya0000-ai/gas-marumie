import React from 'react';
import { AppData, Transaction } from '@marumie/shared';

interface TransactionListProps {
    transactions: Transaction[];
    categories: AppData['categories'];
    onKeywordChange: (val: string) => void;
    onMonthChange: (val: string) => void;
    onCategoryChange: (val: string) => void;
    onClearFilters: () => void;
    keyword: string;
    filterMonth: string;
    filterCategory: string;
    currentPage: number;
    totalPages: number;
    totalCount: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
    transactions,
    categories,
    keyword,
    filterMonth,
    filterCategory,
    onKeywordChange,
    onMonthChange,
    onCategoryChange,
    onClearFilters,
    currentPage,
    totalPages,
    totalCount,
    itemsPerPage,
    onPageChange
}) => {
    return (
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
                            onChange={e => onKeywordChange(e.target.value)}
                        />
                        <input
                            type="month"
                            className="border rounded px-3 py-2 text-sm w-40 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={filterMonth}
                            onChange={e => onMonthChange(e.target.value)}
                        />
                        <select
                            className="border rounded px-3 py-2 text-sm w-40 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={filterCategory}
                            onChange={e => onCategoryChange(e.target.value)}
                        >
                            <option value="">全てのカテゴリ</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        {(keyword || filterMonth || filterCategory) && (
                            <button
                                onClick={onClearFilters}
                                className="text-sm text-slate-500 hover:text-rose-500 px-2"
                            >
                                クリア
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {transactions.length === 0 ? (
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
                                {transactions.map((t) => (
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
                                            {categories.find(c => c.id === t.categoryId)?.name || '-'}
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
                            全 {totalCount} 件中 {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalCount)} 件を表示
                        </div>
                        <div className="flex gap-2">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => onPageChange(currentPage - 1)}
                                className="px-3 py-1 border rounded bg-white hover:bg-slate-100 disabled:opacity-50 text-sm"
                            >
                                前へ
                            </button>
                            <div className="flex items-center px-2 text-sm font-medium">
                                {currentPage} / {totalPages}
                            </div>
                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => onPageChange(currentPage + 1)}
                                className="px-3 py-1 border rounded bg-white hover:bg-slate-100 disabled:opacity-50 text-sm"
                            >
                                次へ
                            </button>
                        </div>
                    </div>
                </>
            )}
        </section>
    );
};
