import React from 'react';

interface LoadingOverlayProps {
    isVisible: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isVisible }) => {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-50 flex items-center justify-center z-[9999] transition-opacity duration-300">
            <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center animate-bounce-in">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <div className="text-slate-700 font-bold text-lg">処理中...</div>
                <div className="text-slate-500 text-sm">しばらくお待ちください</div>
            </div>
        </div>
    );
};
