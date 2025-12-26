# みらいまる見え (GAS版)

[Marumie](https://github.com/team-mirai-volunteer/marumie)の機能をGoogle Apps Script (GAS)で再現するためのプロジェクトです。
一般公開用の「閲覧アプリ」と、管理者用の「管理アプリ」の2つで構成され、共通のスプレッドシートをデータベースとして利用します。

## 構成概要

| アプリケーション | ディレクトリ | 役割 | アクセス権限 |
| :--- | :--- | :--- | :--- |
| **Public App** | `gas-marumie` | データの閲覧・可視化 (ダッシュボード) | 全世界公開 |
| **Admin App** | `gas-marumie-admin` | データの登録・編集 | 管理者のみ (Google Account認証) |
| **Database** | (Google Spreadsheet) | データ保存 (`Transactions`, `Categories`) | - |

## セットアップ手順

Public App と Admin App はそれぞれ別のGASプロジェクトとしてデプロイします。

### 1. 共通データベース (Spreadsheet) の準備
1.  新規にGoogle Spreadsheetを作成します。
2.  Spreadsheet ID (URLの `/d/` と `/edit` の間の文字列) を控えておきます。
3.  空のシートを作成しておくとスムーズです（アプリ実行時に自動生成もされます）。
    - `Transactions`
    - `Categories`

### 2. Public App (`gas-marumie`) のデプロイ
一般公開用のダッシュボードです。

```bash
cd gas-marumie
npm install
npm run build
```

**GASプロジェクトの作成とPush:**
```bash
npx clasp login
npx clasp create --type standalone --title "Marumie Public" --rootDir dist
npx clasp push
```

**設定:**
1.  GASエディタで [プロジェクトの設定] > [スクリプト プロパティ] を開く。
2.  `SPREADSHEET_ID` に上記で控えたIDを設定。
3.  検証用として `seedData` 関数を実行し、サンプルデータを投入することが可能です。

**公開:**
- [デプロイ] > [新しいデプロイ] > [ウェブアプリ]
- アクセスできるユーザー: **全員**

### 3. Admin App (`gas-marumie-admin`) のデプロイ
データ登録用の管理画面です。

```bash
cd ../gas-marumie-admin
npm install
npm run build
```

**GASプロジェクトの作成とPush:**
```bash
npx clasp create --type standalone --title "Marumie Admin" --rootDir dist
npx clasp push
```

**設定:**
1.  GASエディタで [プロジェクトの設定] > [スクリプト プロパティ] を開く。
2.  `SPREADSHEET_ID` に**Public Appと同じID**を設定。

**公開:**
- [デプロイ] > [新しいデプロイ] > [ウェブアプリ]
- アクセスできるユーザー: **自分のみ** (または Google Workspace内のユーザー)

## 開発ガイド

### ディレクトリ構成
```
/
├── gas-marumie/         # Public App ソースコード
├── gas-marumie-admin/   # Admin App ソースコード
└── ...
```

各ディレクトリ内で以下を実行します。
- `src/client/`: フロントエンド (React)
- `src/server/`: バックエンド (GAS)
- `src/shared/`: 共通ロジック (型定義など) ※手動コピーで同期中

### ビルド
両プロジェクトとも `esbuild` を使用しており、以下のコマンドでクライアント・サーバーが一括ビルドされます。
```bash
npm run build
```
成果物は `dist/` に出力されます。
