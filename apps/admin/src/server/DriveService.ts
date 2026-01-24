
/**
 * DriveService.ts
 * Google Drive連携機能を提供します。
 */

export class DriveService {
    /**
     * 画像データをDriveに保存します。
     * @param base64Data 画像のBase64データ
     * @param contentType MIMEタイプ
     * @param folderId 保存先フォルダID
     * @param prefix ファイル名のプレフィックス (デフォルト: receipt)
     * @returns 保存されたファイルのIDとURL
     */
    static saveImage(base64Data: string, contentType: string, folderId: string, prefix: string = 'receipt'): { fileId: string; fileUrl: string; webViewLink: string } {
        try {
            const folder = DriveApp.getFolderById(folderId);
            const decoded = Utilities.base64Decode(base64Data);
            const blob = Utilities.newBlob(decoded, contentType, `${prefix}_${Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyyMMdd_HHmmss')}.jpg`);

            const file = folder.createFile(blob);

            // 権限設定: 必要に応じて変更。ここでは「リンクを知っている全員が閲覧可」にはせず、アクセストークンを持つユーザーのみアクセスとするか、
            // 用途に応じて public にするか検討が必要です。
            // 今回は、Adminユーザー自身がDriveにアクセスできる前提であれば、特別な権限変更は不要です。
            // ただし、<img>タグで表示するためには、ThumbnailLinkやDownloadUrlを活用します。

            // Note: drive.file.getUrl() はプレビュー画面のURL。
            // drive.file.getDownloadUrl() はダウンロードURL（Cookie認証必要）。
            // <img>タグで表示する場合、ThumbnailLink (サイズ指定可) が便利です。

            return {
                fileId: file.getId(),
                fileUrl: file.getUrl(), // ユーザーがクリックして開く用
                webViewLink: file.getUrl() // プレビュー用リンク
            };
        } catch (e) {
            console.error('Error saving to Drive:', e);
            throw new Error(`Failed to save image to Drive: ${e}`);
        }
    }
}
