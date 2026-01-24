import React from 'react';

interface LayoutProps {
    currentUser: string;
    currentView: string;
    onViewChange: (view: string) => void;
    onOpenSettings: () => void;
    children: React.ReactNode;
    appTitle?: string;
}

export const Layout: React.FC<LayoutProps> = ({ currentUser, currentView, onViewChange, onOpenSettings, children, appTitle }) => {
    const menuItems = [
        { id: 'transactions', icon: '📝', label: '取引管理' },
        { id: 'categories', icon: '🏷️', label: 'カテゴリ管理' },
        { id: 'reports', icon: '📊', label: 'レポート・出力' },
    ];

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col">
            {/* Top Navigation */}
            <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between py-2 md:h-16 gap-2">
                        {/* Logo & User */}
                        <div className="flex justify-between items-center w-full md:w-auto">
                            <div className="font-bold text-xl tracking-tight flex items-center gap-2">
                                <span>🔵</span>
                                <span>{appTitle || 'Marumie Admin'}</span>
                            </div>
                            <div className="flex items-center gap-3 md:hidden">
                                <div className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded-full truncate max-w-[100px]">
                                    {currentUser}
                                </div>
                                <button
                                    onClick={onOpenSettings}
                                    className="text-slate-400 hover:text-white p-1"
                                >
                                    ⚙️
                                </button>
                            </div>
                        </div>

                        {/* Navigation */}
                        <nav className="flex space-x-1 overflow-x-auto pb-1 md:pb-0 w-full md:w-auto no-scroll-bar">
                            {menuItems.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => onViewChange(item.id)}
                                    className={`px-3 md:px-4 py-2 rounded-md text-sm font-medium transition flex items-center gap-2 whitespace-nowrap flex-1 md:flex-none justify-center ${currentView === item.id
                                        ? 'bg-slate-800 text-white shadow-sm'
                                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                        }`}
                                >
                                    <span>{item.icon}</span>
                                    <span className="md:inline">{item.label}</span>
                                </button>
                            ))}
                        </nav>

                        {/* Desktop User Profile & Settings */}
                        <div className="hidden md:flex items-center gap-4">
                            <div className="text-sm text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
                                👤 {currentUser}
                            </div>
                            <button
                                onClick={onOpenSettings}
                                className="text-slate-400 hover:text-white transition p-2 rounded-full hover:bg-slate-800"
                                title="設定"
                            >
                                ⚙️
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full max-w-6xl mx-auto p-4 md:p-6">
                {children}
            </main>
        </div>
    );
};
