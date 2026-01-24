import React from 'react';
import { DonutChart } from './DonutChart';
import { MonthlyBalanceChart } from './MonthlyBalanceChart';

interface DashboardChartsProps {
    stats: { totalIncome: number; totalExpense: number };
    incomeCategoryData: any[];
    expenseCategoryData: any[];
    monthlyData: any[];
    comparisonMonthlyData?: any[];
    selectedFiscalYear: number | 'ALL';
    showComparison: boolean;
    setShowComparison: (show: boolean) => void;
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({
    stats,
    incomeCategoryData,
    expenseCategoryData,
    monthlyData,
    comparisonMonthlyData,
    selectedFiscalYear,
    showComparison,
    setShowComparison
}) => {
    return (
        <>
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
                <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                    <h3 className="text-lg font-bold text-slate-700">
                        📅 月別収支推移 ({selectedFiscalYear === 'ALL' ? '全期間' : `${selectedFiscalYear}年度`})
                    </h3>

                    {/* Comparison Toggle */}
                    {selectedFiscalYear !== 'ALL' && (
                        <label className="flex items-center cursor-pointer">
                            <div className="relative">
                                <input type="checkbox" className="sr-only" checked={showComparison} onChange={e => setShowComparison(e.target.checked)} />
                                <div className={`block w-10 h-6 rounded-full ${showComparison ? 'bg-blue-600' : 'bg-slate-300'}`}></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${showComparison ? 'transform translate-x-4' : ''}`}></div>
                            </div>
                            <div className="ml-3 text-sm font-medium text-slate-600">
                                前年度と比較
                            </div>
                        </label>
                    )}
                </div>

                <div className="h-96 w-full relative">
                    <MonthlyBalanceChart data={monthlyData} comparisonData={comparisonMonthlyData} />
                </div>
            </div>
        </>
    );
};
