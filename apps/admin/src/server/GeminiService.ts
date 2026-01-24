
/**
 * GeminiService.ts
 * Gemini APIとの連携機能を提供します。
 */

export class GeminiService {
    private static readonly API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

    /**
     * レシート画像を解析します。
     * @param base64Data 画像のBase64データ
     * @param mimeType 画像のMIMEタイプ
     * @param apiKey Gemini API Key
     * @returns 解析結果のJSONオブジェクト
     */
    static analyzeReceipt(base64Data: string, mimeType: string, apiKey: string): any {
        const payload = {
            contents: [
                {
                    parts: [
                        {
                            text: `このレシート画像を解析し、以下の情報をJSON形式で抽出してください。
- date (YYYY-MM-DD形式,string)
- shopName (店舗名, string)
- totalAmount (合計金額, number)
- items (品目リスト: [{name: 商品名, price: 単価(number), category: 推測されるカテゴリ名(string)}])

日付が読み取れない場合は今日の日付を入れてください。
JSONのみを出力してください。Markdownのコードブロックは含めないでください。`
                        },
                        {
                            inline_data: {
                                mime_type: mimeType,
                                data: base64Data
                            }
                        }
                    ]
                }
            ],
            generationConfig: {
                response_mime_type: "application/json", // JSONモードを強制
            }
        };

        const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
            method: 'post',
            contentType: 'application/json',
            payload: JSON.stringify(payload),
            muteHttpExceptions: true
        };

        try {
            const response = UrlFetchApp.fetch(`${this.API_ENDPOINT}?key=${apiKey}`, options);
            const code = response.getResponseCode();
            const content = response.getContentText();

            if (code !== 200) {
                throw new Error(`Gemini API Error (${code}): ${content}`);
            }

            const json = JSON.parse(content);
            if (!json.candidates || json.candidates.length === 0 || !json.candidates[0].content) {
                throw new Error('No content generated from Gemini.');
            }

            const text = json.candidates[0].content.parts[0].text;

            // JSONパース（念のためMarkdownブロックの除去などを考慮）
            const cleanedText = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            return JSON.parse(cleanedText);

        } catch (e: any) {
            console.error('Gemini API Error:', e);
            throw new Error(`Gemini Analysis Failed: ${e.message}`);
        }
    }
}
