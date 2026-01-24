import { useState, useMemo } from 'react';
import { TransactionAnalyzer } from '../domain/TransactionAnalyzer';
import { Transaction } from '@marumie/shared';

export const useTransactionFilter = (
    analyzer: TransactionAnalyzer | null,
    selectedFiscalYear: number | 'ALL',
    fiscalYearStartMonth: number
) => {
    // Filter State
    const [keyword, setKeyword] = useState('');
    const [filterMonth, setFilterMonth] = useState(''); // YYYY-MM
    const [filterCategory, setFilterCategory] = useState('');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    // Reset page when filters change
    const setKeywordWithReset = (val: string) => { setKeyword(val); setCurrentPage(1); };
    const setFilterMonthWithReset = (val: string) => { setFilterMonth(val); setCurrentPage(1); };
    const setFilterCategoryWithReset = (val: string) => { setFilterCategory(val); setCurrentPage(1); };

    // 0. Base Filter (Keyword & Category only) - used for Charts logic
    const baseFilteredTransactions = useMemo(() => {
        if (!analyzer) return [];
        return analyzer.filter({
            keyword,
            month: '', // Ignore month here
            categoryId: filterCategory
        });
    }, [analyzer, keyword, filterCategory]);

    // 1. Final Filtered Transactions (including Time logic: Month OR Fiscal Year)
    const filteredTransactions = useMemo(() => {
        if (!analyzer) return [];
        return baseFilteredTransactions.filter(t => {
            // If explicit month filter is set, use it
            if (filterMonth) {
                return t.date.startsWith(filterMonth);
            }
            // If 'ALL', skip fiscal year filter
            if (selectedFiscalYear === 'ALL') {
                return true;
            }
            // Otherwise, strictly filter by Selected Fiscal Year
            return analyzer.getFiscalYear(t.date, fiscalYearStartMonth) === selectedFiscalYear;
        });
    }, [analyzer, baseFilteredTransactions, filterMonth, selectedFiscalYear, fiscalYearStartMonth]);

    // 2. Pagination
    const paginatedTransactions = useMemo(() => {
        if (!analyzer) return [];
        return analyzer.paginate(filteredTransactions, currentPage, itemsPerPage);
    }, [analyzer, filteredTransactions, currentPage]);

    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

    return {
        keyword, setKeyword: setKeywordWithReset,
        filterMonth, setFilterMonth: setFilterMonthWithReset,
        filterCategory, setFilterCategory: setFilterCategoryWithReset,
        currentPage, setCurrentPage,
        baseFilteredTransactions,
        filteredTransactions,
        paginatedTransactions,
        totalPages,
        itemsPerPage
    };
};
