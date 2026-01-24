import React from 'react';

interface StatsCardsProps {
    filterMonth: string;
    selectedFiscalYear: number | 'ALL';
    stats: { totalIncome: number; totalExpense: number; balance: number };
}

export const StatsCards: React.FC<StatsCardsProps> = ({
    filterMonth,
    selectedFiscalYear,
    stats
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-sm font-medium text-slate-500">
                    {filterMonth ? `${filterMonth}の収入` : (selectedFiscalYear === 'ALL' ? '全期間 収入合計' : `${selectedFiscalYear}年度 収入合計`)}
                </h3>
                <p className="text-3xl font-bold mt-2 text-slate-800">¥{stats.totalIncome.toLocaleString()}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-sm font-medium text-slate-500">
                    {filterMonth ? `${filterMonth}の支出` : (selectedFiscalYear === 'ALL' ? '全期間 支出合計' : `${selectedFiscalYear}年度 支出合計`)}
                </h3>
                <p className="text-3xl font-bold mt-2 text-slate-800">¥{stats.totalExpense.toLocaleString()}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-sm font-medium text-slate-500">
                    {filterMonth ? `${filterMonth}の収支差額` : (selectedFiscalYear === 'ALL' ? '全期間 収支差額' : `${selectedFiscalYear}年度 収支差額`)}
                </h3>
                <p className={`text-3xl font-bold mt-2 ${stats.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    ¥{stats.balance.toLocaleString()}
                </p>
            </div>
        </div>
    );
};
