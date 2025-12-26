# みらいまる見え (GAS版) Monorepo

[Marumie](https://github.com/team-mirai-volunteer/marumie)の機能をGoogle Apps Script (GAS)で再現するためのプロジェクトです。
一般公開用の「閲覧アプリ（ダッシュボード）」と、管理者用の「管理アプリ」をモノレポ構成で管理しています。

## 構成概要

| アプリケーション | ディレクトリ | 役割 | アクセス権限 |
| :--- | :--- | :--- | :--- |
| **Public App** (ダッシュボード) | `apps/public` | データの閲覧・可視化 | 全世界公開 |
| **Admin App** (管理画面) | `apps/admin` | データの登録・編集 | 管理者のみ (Google Account認証) |
| **Database** | (Google Spreadsheet) | データ保存 (`Transactions`, `Categories`) | - |
| **Shared** | `packages/shared` | 共通ロジック・型定義 | - |

## アプリケーション機能と使い方

### 📊 Public App (ダッシュボード)
一般公開を想定した、収支データの閲覧専用アプリです。

**主な機能:**
- **データの可視化**: 月ごとの収支推移（棒グラフ）や、支出のカテゴリ別割合（円グラフ）を直感的に表示します。
- **検索・フィルタリング**: キーワード、対象月、カテゴリによる絞り込みが可能です。
- **一覧表示**: 取引データをリスト形式で表示し、ページネーションで快適に閲覧できます。

**使い方:**
1.  発行されたWebアプリURLにアクセスします。
2.  画面上部のフィルタを使用して、見たい情報を絞り込みます。
3.  グラフやリストが自動的に更新されます。

### 🛠 Admin App (管理画面)
データの登録・編集・削除を行うための管理者専用アプリです。

**主な機能:**
- **取引データの管理**: 日付、金額、カテゴリ、摘要などを入力して新しい取引を登録します。既存データの編集や削除も可能です。
- **カテゴリ管理**: 収支の分類（カテゴリ）を自由にカスタマイズできます。
- **権限管理**: Googleアカウントによる認証を行い、許可されたユーザーのみがアクセスできます。

**使い方:**
1.  発行されたWebアプリURLにアクセスします（Googleアカウントのログインが必要です）。
2.  **新規登録**: 画面上部のフォームに必要な情報を入力し、「追加」ボタンを押します。
3.  **編集・削除**: リスト内の各行にある「編集」「削除」ボタンから操作を行います。

## セットアップ手順

Public App と Admin App は、コードベースは同じリポジトリにありますが、**それぞれ別のGASプロジェクト**としてデプロイする必要があります。

### 1. 共通データベース (Spreadsheet) の準備
1.  新規にGoogle Spreadsheetを作成します。
2.  Spreadsheet ID (URLの `/d/` と `/edit` の間の文字列) を控えておきます。
    - 例: `https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID/edit` -> `YOUR_SPREADSHEET_ID`
3.  （任意）空のシートを作成しておきます（アプリ実行時に自動生成もされます）。
    - `Transactions`
    - `Categories`

### 2. 環境構築 (ローカル)
このリポジトリのルートで依存関係をインストールします。

```bash
# ルートディレクトリで実行
npm install
```

---

### 3. ダッシュボード画面 (Public App/GAS) の設定

一般公開用の閲覧専用アプリです。

1.  **ディレクトリ移動**
    ```bash
    cd apps/public
    ```

2.  **GASプロジェクトの作成（初回のみ）**
    ```bash
    npx clasp login
    npx clasp create --type standalone --title "Marumie Public (Dashboard)" --rootDir dist
    ```
    ※ 既に `.clasp.json` がある場合はスキップしてください。

3.  **ビルド & プッシュ**
    ```bash
    # 親ディレクトリ(ルート)から実行する場合
    npm run build:public
    npm run push:public

    # または apps/public 内で
    npm run build
    npx clasp push
    ```

4.  **GAS側の設定**
    1.  `clasp open` またはブラウザでGASエディタを開きます。
    2.  [プロジェクトの設定] (歯車アイコン) > [スクリプト プロパティ] を開きます。
    3.  プロパティを追加します:
        - プロパティ: `SPREADSHEET_ID`
        - 値: *(手順1で控えたSpreadsheet ID)*

5.  **デプロイ (公開)**
    1.  [デプロイ] > [新しいデプロイ] を選択。
    2.  種類の選択: **ウェブアプリ**
    3.  次のユーザーとして実行: **自分**
    4.  アクセスできるユーザー: **全員** (ここが重要です)
    5.  [デプロイ] をクリックして発行されたURLにアクセスし、動作を確認します。

---

### 4. 管理画面 (Admin App/GAS) の設定

データ登録・編集用の管理者専用アプリです。

1.  **ディレクトリ移動**
    ```bash
    cd apps/admin
    ```

2.  **GASプロジェクトの作成（初回のみ）**
    ```bash
    npx clasp create --type standalone --title "Marumie Admin" --rootDir dist
    ```
    ※ 既に `.clasp.json` がある場合はスキップしてください。

3.  **ビルド & プッシュ**
    ```bash
    # 親ディレクトリ(ルート)から実行する場合
    npm run build:admin
    npm run push:admin

    # または apps/admin 内で
    npm run build
    npx clasp push
    ```

4.  **GAS側の設定**
    1.  `clasp open` またはブラウザでGASエディタを開きます。
    2.  [プロジェクトの設定] (歯車アイコン) > [スクリプト プロパティ] を開きます。
    3.  プロパティを追加します:
        - プロパティ: `SPREADSHEET_ID`
        - 値: *(**Public Appと同じID**を設定してください)*

5.  **デプロイ (公開)**
    1.  [デプロイ] > [新しいデプロイ] を選択。
    2.  種類の選択: **ウェブアプリ**
    3.  次のユーザーとして実行: **自分**
    4.  アクセスできるユーザー: **自分のみ** (または Google Workspace内のユーザー)
    5.  [デプロイ] をクリックして発行されたURLにアクセスし、動作を確認します。

## 開発ガイド

### ビルドコマンド (ルート)
モノレポのルートディレクトリから以下のコマンドが使用できます。

- `npm run build:public` : Public Appのビルド
- `npm run build:admin`  : Admin Appのビルド
- `npm run push:public`  : Public AppのGASへのプッシュ
- `npm run push:admin`   : Admin AppのGASへのプッシュ
