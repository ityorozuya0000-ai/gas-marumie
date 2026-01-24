import React from 'react';

interface HeaderProps {
    appTitle: string;
    lastUpdated: string;
    selectedFiscalYear: number | 'ALL';
    availableFiscalYears: number[];
    onFiscalYearChange: (year: number | 'ALL') => void;
}

export const Header: React.FC<HeaderProps> = ({
    appTitle,
    lastUpdated,
    selectedFiscalYear,
    availableFiscalYears,
    onFiscalYearChange
}) => {
    return (
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                        {appTitle || 'みらいまる見え'}
                    </span>
                    <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 rounded text-slate-500">GAS版</span>
                </div>
                <div className="flex items-center gap-4">
                    {/* Fiscal Year Selector */}
                    <div className="flex items-center gap-2">
                        <select
                            className="border rounded px-3 py-1 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={selectedFiscalYear}
                            onChange={e => {
                                const val = e.target.value;
                                onFiscalYearChange(val === 'ALL' ? 'ALL' : Number(val));
                            }}
                        >
                            <option value="ALL">全期間</option>
                            {availableFiscalYears.map(y => (
                                <option key={y} value={y}>{y}年度</option>
                            ))}
                        </select>
                    </div>
                    <div className="text-xs text-slate-400 hidden sm:block">
                        データ更新: {lastUpdated ? new Date(lastUpdated).toLocaleString() : '---'}
                    </div>
                </div>
            </div>
        </header>
    );
};
