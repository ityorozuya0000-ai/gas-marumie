# GAS版 みらいまる見え - 設計と実現可能性

## 概要
本プロジェクトは、[みらいまる見え (Marumie)](https://github.com/team-mirai-volunteer/marumie) のコア機能を Google Apps Script (GAS) を用いて再現することを目的としています。
「みらいまる見え」は政治資金の流れを透明化するためのプラットフォームです。

## 再現するコア機能
1.  **データの可視化**: 収入と支出を表示するダッシュボード。
2.  **データ管理**: データを入力・インポートするための管理画面。
3.  **報告書作成**: 公的な報告書に適した形式 (XML) でデータをエクスポートする機能。

## アーキテクチャの対比

| コンポーネント | オリジナル (Next.js/Supabase) | GAS版 |
| :--- | :--- | :--- |
| **フロントエンド** | Next.js (React) | GAS HtmlService (React/Preact 等を用いたSPA) |
| **バックエンド** | Next.js API Routes | GAS `doGet` / `google.script.run` |
| **データベース** | PostgreSQL (Supabase) | Google Spreadsheets (リレーショナルDBとして利用) |
| **認証** | Supabase Auth | Google Workspace アカウント (実行ユーザー) |
| **ホスティング** | Vercel | Google Drive / Apps Script Runner |

## システム構成 (System Composition)
2つの独立したGASプロジェクトを作成し、1つのスプレッドシートを共有する構成とします。

1.  **Public App (`gas-marumie`)**:
    - 一般公開用。
    - データの閲覧（可視化）のみ。
    - 原則としてスプレッドシートへの書き込み権限を持たない（または制限する）。
2.  **Admin App (`gas-marumie-admin`)**:
    - 管理者用。
    - データの登録、編集、インポート、XML出力。
    - **認証**: `doGet` 実行時に `Session.getActiveUser().getEmail()` でユーザーを識別し、許可されたユーザー（自分）のみアクセス可能にする。
3.  **Database (Shared Spreadsheet)**:
    - `Transactions` と `Categories` シートを持つ共通のデータソース。

## 実現可能性の評価
- **実現可能 (Feasible)**:
    - トランザクションデータをスプレッドシートに保存する。
    - `HtmlService` 内でフロントエンドライブラリ (Chart.js/Recharts/Recharts) を使用してダッシュボードを作成する。
    - CSV/Excel からのデータインポート (GASの標準機能)。
    - XMLの生成 (GAS `XmlService` または文字列操作)。
- **課題 (Challenges) と対策**:
    - **パフォーマンス**:
        - **[対策]**: スプレッドシートのデータをJSON形式で書き出し、それをキャッシュとして利用する構成を採用します。読み取り時はスプレッドシートへのアクセスを避け、キャッシュ（Drive上のJSONファイル等）を参照することで高速化を図ります。更新時のみスプレッドシートとキャッシュの両方を更新します。
    - **UI/UX**:
        - **[対策]**: 当初の計画通り、Reactを用いたSPA (Single Page Application) 構成を徹底します。ページ遷移を伴わず、JavascriptによるDOM書き換えで画面遷移を実現することで、ネイティブアプリに近い操作性を提供します。
    - **リレーションの整合性**:
        - **[対策]**: アプリケーション層（Service/Repository層）で整合性を担保します。データの保存・更新時には必ず参照先のIDが存在するかをチェックするロジックを実装し、不整合なデータの混入を防ぎます。

## 提案するデータ構造 (Google Sheets)
以下のシートを作成してDBとして利用します。

1.  **`Transactions` (取引明細)**: id, date (日付), amount (金額), type (収入/支出), category_id, description (摘要), counterparty (取引先).
2.  **`Categories` (費目)**: id, name, type.
3.  **`Settings` (設定)**: アプリケーション設定情報。

## 実装ロードマップ
1.  **セットアップ**: TypeScript/Clasp 環境の構築。
2.  **バックエンドコア**: 型定義に基づく `Transactions` シートの読み書きを行うサービス層の実装。
3.  **API層**: アプリを配信する `doGet` と、サーバーサイド関数を公開する `google.script.run` (global) の実装。
4.  **フロントエンド**: `index.html` にバンドルされるシングルページアプリケーション (React) の構築。

## 次のステップ
- プロジェクトディレクトリの初期化 (完了)。
- サーバー (GAS) とクライアント (React) 両方のコードをバンドルするための `esbuild` 設定 (完了)。
