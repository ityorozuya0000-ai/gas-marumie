import { useState, useMemo } from 'react';
import { TransactionAnalyzer } from '../domain/TransactionAnalyzer';

export const useFiscalYear = (
    result: { fiscalYearStartMonth?: number } | null,
    analyzer: TransactionAnalyzer | null
) => {
    const [selectedFiscalYear, setSelectedFiscalYear] = useState<number | 'ALL'>(new Date().getFullYear());

    // Initialize Fiscal Year
    useMemo(() => {
        if (!result) return;
        if (result.fiscalYearStartMonth) {
            const now = new Date();
            const currentMonth = now.getMonth() + 1;
            const currentYear = now.getFullYear();
            const fy = currentMonth < result.fiscalYearStartMonth ? currentYear - 1 : currentYear;
            // Only set if not already set or logical default
            // But for simple hook, we can rely on initial state or effect.
            // Since this was in useEffect in original, we can return the default FY.
            // However, staying close to original logic:
            setSelectedFiscalYear(fy);
        }
    }, [result]);

    const fiscalYearStartMonth = result?.fiscalYearStartMonth || 4;

    const availableFiscalYears = useMemo(() => {
        if (!analyzer) return [];
        const years = analyzer.getAvailableFiscalYears(fiscalYearStartMonth);
        // Ensure selected year is in list even if check fails (unless it's 'ALL')
        if (typeof selectedFiscalYear === 'number' && !years.includes(selectedFiscalYear)) {
            years.push(selectedFiscalYear);
            years.sort((a, b) => b - a);
        }
        return years;
    }, [analyzer, fiscalYearStartMonth, selectedFiscalYear]);

    return {
        selectedFiscalYear,
        setSelectedFiscalYear,
        availableFiscalYears,
        fiscalYearStartMonth
    };
};
