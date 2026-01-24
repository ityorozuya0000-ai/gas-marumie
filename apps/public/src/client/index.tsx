import React, { useEffect, useState, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { AppData } from '@marumie/shared';
import { GasClient } from './services/GasClient';
import { TransactionAnalyzer } from './domain/TransactionAnalyzer';
import { useFiscalYear } from './hooks/useFiscalYear';
import { useTransactionFilter } from './hooks/useTransactionFilter';
import { Header } from './components/Header';
import { StatsCards } from './components/StatsCards';
import { DashboardCharts } from './components/DashboardCharts';
import { TransactionList } from './components/TransactionList';

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
    const [showComparison, setShowComparison] = useState(false);

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

    // Fiscal Year Hook
    const {
        selectedFiscalYear,
        setSelectedFiscalYear,
        availableFiscalYears,
        fiscalYearStartMonth
    } = useFiscalYear(data, analyzer);

    // Filter Hook
    const {
        keyword, setKeyword,
        filterMonth, setFilterMonth,
        filterCategory, setFilterCategory,
        currentPage, setCurrentPage,
        baseFilteredTransactions,
        filteredTransactions,
        paginatedTransactions,
        totalPages,
        itemsPerPage
    } = useTransactionFilter(
        analyzer,
        selectedFiscalYear,
        fiscalYearStartMonth
    );

    // --- Computed Chart Data ---

    // Helper to assign colors
    const assignColors = (d: { name: string; value: number }[]) => {
        return d.map((item, i) => ({
            ...item,
            color: COLORS[i % COLORS.length]
        }));
    };

    const incomeCategoryData = useMemo(() => {
        if (!analyzer) return [];
        return assignColors(analyzer.getCategoryShare(filteredTransactions, 'INCOME'));
    }, [analyzer, filteredTransactions]);

    const expenseCategoryData = useMemo(() => {
        if (!analyzer) return [];
        return assignColors(analyzer.getCategoryShare(filteredTransactions, 'EXPENSE'));
    }, [analyzer, filteredTransactions]);

    const monthlyData = useMemo(() => {
        if (!analyzer) return [];
        if (selectedFiscalYear === 'ALL') {
            return analyzer.getMonthlyTrends(baseFilteredTransactions);
        }
        return analyzer.getMonthlyTrendsForFiscalYear(selectedFiscalYear, fiscalYearStartMonth, baseFilteredTransactions);
    }, [analyzer, selectedFiscalYear, baseFilteredTransactions, fiscalYearStartMonth]);

    const comparisonMonthlyData = useMemo(() => {
        if (!analyzer || !showComparison || selectedFiscalYear === 'ALL') return undefined;
        return analyzer.getMonthlyTrendsForFiscalYear((selectedFiscalYear as number) - 1, fiscalYearStartMonth, baseFilteredTransactions);
    }, [analyzer, showComparison, selectedFiscalYear, baseFilteredTransactions, fiscalYearStartMonth]);

    const stats = useMemo(() => {
        if (!analyzer) return { totalIncome: 0, totalExpense: 0, balance: 0 };
        return analyzer.getGlobalStats(filteredTransactions);
    }, [analyzer, filteredTransactions]);


    if (loading) return <div className="flex justify-center items-center h-screen"><div className="loader"></div></div>;
    if (error) return <div className="p-8 text-red-500">Error: {error}</div>;
    if (!data) return null;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
            <Header
                appTitle={data.appTitle || 'みらいまる見え'}
                lastUpdated={data.lastUpdated}
                selectedFiscalYear={selectedFiscalYear}
                availableFiscalYears={availableFiscalYears}
                onFiscalYearChange={(y) => {
                    setSelectedFiscalYear(y);
                    setFilterMonth('');
                    setCurrentPage(1);
                }}
            />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                <StatsCards
                    filterMonth={filterMonth}
                    selectedFiscalYear={selectedFiscalYear}
                    stats={stats}
                />

                <DashboardCharts
                    stats={stats}
                    incomeCategoryData={incomeCategoryData}
                    expenseCategoryData={expenseCategoryData}
                    monthlyData={monthlyData}
                    comparisonMonthlyData={comparisonMonthlyData}
                    selectedFiscalYear={selectedFiscalYear}
                    showComparison={showComparison}
                    setShowComparison={setShowComparison}
                />

                <TransactionList
                    transactions={paginatedTransactions}
                    categories={data.categories}
                    keyword={keyword}
                    filterMonth={filterMonth}
                    filterCategory={filterCategory}
                    onKeywordChange={setKeyword}
                    onMonthChange={setFilterMonth}
                    onCategoryChange={setFilterCategory}
                    onClearFilters={() => {
                        setKeyword('');
                        setFilterMonth('');
                        setFilterCategory('');
                    }}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalCount={filteredTransactions.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                />
            </main>
        </div>
    );
};

// --- Render ---
const container = document.getElementById('root');
if (container) {
    createRoot(container).render(<App />);
}
