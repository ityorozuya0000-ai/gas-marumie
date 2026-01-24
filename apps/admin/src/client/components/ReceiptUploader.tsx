
import React, { useState, useRef } from 'react';

interface ReceiptUploaderProps {
    runScript: (name: string, args?: any[]) => Promise<any>;
    onAnalysisComplete: (data: any) => void;
}

export const ReceiptUploader = ({ runScript, onAnalysisComplete }: ReceiptUploaderProps) => {
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        setLoading(true);

        try {
            // Convert to Base64
            const reader = new FileReader();
            reader.onload = async (event) => {
                const base64Content = (event.target?.result as string).split(',')[1];
                const mimeType = file.type;

                try {
                    const result = await runScript('processReceiptImage', [base64Content, mimeType]);
                    onAnalysisComplete(result);
                } catch (apiError: any) {
                    alert('解析エラー: ' + apiError.message + '\n設定画面でAPIキー等が正しく設定されているか確認してください。');
                } finally {
                    setLoading(false);
                    // Reset input
                    if (fileInputRef.current) fileInputRef.current.value = '';
                }
            };
            reader.readAsDataURL(file);
        } catch (err: any) {
            alert('ファイル読み込みエラー: ' + err.message);
            setLoading(false);
        }
    };

    const triggerUpload = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="mb-4">
            <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
            />
            <button
                type="button"
                onClick={triggerUpload}
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg shadow flex items-center justify-center gap-2 transition"
            >
                {loading ? (
                    <>
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>解析中...</span>
                    </>
                ) : (
                    <>
                        <span>📷</span>
                        <span>レシートを撮影/アップロードして自動入力</span>
                    </>
                )}
            </button>
            <p className="text-xs text-center text-slate-500 mt-2">
                Gemini AIが画像を読み取り、日付・金額・品目を自動抽出します。
            </p>
        </div>
    );
};
