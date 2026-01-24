
import React, { useState, useEffect } from 'react';

// Mock for runGoogleScript (will be passed from parent or imported if we refactor utilities)
// ideally we should export runGoogleScript from a utility file, but for now we might need to duplicate or accept as prop
// To proceed cleanly, let's assume we pass runGoogleScript helper or it's available globally/imported.
// However, since it's defined in index.tsx currently, I should probably move it to a shared file or just accept it as a prop.
// For simplicity in this step, I'll assume the parent passes the save function or we use a separate utility file later.
// Actually, let's just use the global/window mock approach if needed, but best practice is props.

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    runScript: (name: string, args?: any[]) => Promise<any>;
}

export const SettingsModal = ({ isOpen, onClose, runScript }: SettingsModalProps) => {
    const [loading, setLoading] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const [folderId, setFolderId] = useState('');
    const [spreadsheetId, setSpreadsheetId] = useState('');
    const [appTitle, setAppTitle] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadSettings();
        }
    }, [isOpen]);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const settings = await runScript('getSettings');
            setApiKey(settings.geminiApiKey || '');
            setFolderId(settings.driveFolderId || '');
            setSpreadsheetId(settings.spreadsheetId || '');
            setAppTitle(settings.appTitle || '');
        } catch (e) {
            console.error('Failed to load settings', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await runScript('saveSettings', [{ geminiApiKey: apiKey, driveFolderId: folderId, spreadsheetId: spreadsheetId, appTitle: appTitle }]);
            alert('設定を保存しました');
            onClose();
        } catch (e: any) {
            alert('保存に失敗しました: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-800">⚙️ 環境設定</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        ✖
                    </button>
                </div>

                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Gemini API Key</label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="w-full border rounded p-2"
                            placeholder="AI Studioで取得したキー"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Google AI Studioから取得してください。
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Google Drive Folder ID</label>
                        <input
                            type="text"
                            value={folderId}
                            onChange={(e) => setFolderId(e.target.value)}
                            className="w-full border rounded p-2"
                            placeholder="画像の保存先フォルダID"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            保存先フォルダのURL末尾のID部分です。
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Spreadsheet ID</label>
                        <input
                            type="text"
                            value={spreadsheetId}
                            onChange={(e) => setSpreadsheetId(e.target.value)}
                            className="w-full border rounded p-2"
                            placeholder="データ保存先のスプレッドシートID"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            保存先スプレッドシートのURL末尾のID部分です。
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">アプリタイトル</label>
                        <input
                            type="text"
                            value={appTitle}
                            onChange={(e) => setAppTitle(e.target.value)}
                            className="w-full border rounded p-2"
                            placeholder="管理画面のタイトル"
                        />
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="mr-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded"
                        >
                            キャンセル
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-slate-800 text-white font-bold rounded hover:bg-slate-900 disabled:opacity-50"
                        >
                            {loading ? '保存中...' : '保存する'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
