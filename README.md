# モンスター図鑑 (Next.js + Go + SQLite)

Python (Flask) で実装されていたモンスター図鑑アプリケーションを、**Next.js (App Router)** と **Go言語 (Chi + sqlc + SQLite)** のモダンなフルスタック構成にリファクタリング・移植したプロジェクトです。

---

## 🛠 技術スタック

| 分野 | 技術 |
| :--- | :--- |
| **フロントエンド** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 |
| **バックエンド** | Go (1.27.3), Chi (`go-chi/chi/v5`), `go-chi/cors` |
| **データベース** | SQLite (`modernc.org/sqlite` - Windows Cgo 不要) |
| **DB クエリ/型生成** | `sqlc` |
| **認証方式** | HttpOnly Cookie セッション管理 (Cookie: `monster_session`) |

---

## 📁 ディレクトリ構成

```text
go-training/
├── backend/
│   ├── cmd/
│   │   └── api/
│   │       └── main.go           # サーバーエントリーポイント (ポート: 8080)
│   ├── data/
│   │   ├── app.db                # SQLite データベースファイル
│   │   └── initial_monsters.json # 初期シードデータ
│   ├── db/
│   │   ├── queries/              # sqlc 用 SQL クエリ
│   │   └── schema/               # DB スキーマ定義 (schema.sql)
│   ├── internal/
│   │   ├── db/                   # sqlc 生成コード
│   │   ├── handler/              # HTTP ハンドラー (auth, monster)
│   │   ├── middleware/           # 認証ミドルウェア
│   │   ├── model/                # ドメインモデル・レスポンス型
│   │   ├── repository/           # DB アクセス・動的クエリ層
│   │   ├── service/              # ビジネスロジック・初期化層
│   │   └── session/              # セッションストア管理
│   ├── sqlc.yaml                 # sqlc 設定ファイル
│   └── go.mod
├── frontend/
│   ├── app/
│   │   ├── login/                # ログイン画面 (/login)
│   │   ├── monsters/             # モンスター一覧画面 (/monsters)
│   │   │   ├── new/              # 新規登録画面 (/monsters/new)
│   │   │   └── [id]/edit/        # 編集画面 (/monsters/[id]/edit)
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx              # トップ (/ -> 認証状態に応じてリダイレクト)
│   ├── components/               # 共通コンポーネント (Header, MonsterForm 等)
│   ├── lib/                      # API クライアント, 認証 Context, 型定義
│   └── package.json
├── run_backend.bat               # バックエンド起動バッチ
├── run_frontend.bat              # フロントエンド起動バッチ
```

---

## 🚀 起動方法

### 1. バックエンドの起動 (ポート 8080)
`run_backend.bat` をダブルクリックするか、ターミナルで以下を実行します：
```powershell
cd backend
go run ./cmd/api
```
起動時に自動的に SQLite データベース (`backend/data/app.db`) のマイグレーションおよび初期データ投入（管理者アカウントと初期モンスター95件）が行われます。

### 2. フロントエンドの起動 (ポート 3000)
`run_frontend.bat` をダブルクリックするか、ターミナルで以下を実行します：
```powershell
cd frontend
npm run dev
```

ブラウザで `http://localhost:3000` を開きます。

---

## 🔐 ログイン情報

| 項目 | 値 |
| :--- | :--- |
| **ユーザーID** | `admin` |
| **パスワード** | `password123` |

---

## ✨ 実装済み機能

- **認証機能**: ログイン・ログアウト・セッション状態検証（未認証アクセス時のリダイレクト制御）
- **モンスター一覧**:
  - キーワード検索（部分一致）
  - 属性フィルター（炎・水・風・光・闇）
  - レア度フィルター（★★★ 〜 ★★★★★）
  - 出現地域フィルター（草原・洞窟・魔王城）
  - 各カラムごとの昇順/降順ソート
  - ページネーション（10件/ページ）
  - 説明文ツールチップ表示
- **モンスター新規登録**: バリデーション付き作成フォーム
- **モンスター編集**: 既存データの更新（説明文編集モーダル付き）
- **モンスター削除**: 確認アラート後の削除
- **データ初期化**: ワンクリックで初期モンスターデータへリセット

