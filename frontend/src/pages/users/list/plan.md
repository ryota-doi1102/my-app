# ユーザー画面 API 繋ぎ込み 実装計画

## 現状サマリー

| 画面 | ファイル | 現状 |
|---|---|---|
| 一覧 | `list/useUserList.ts` | MOCK_USERS を使ったインメモリ処理 |
| 作成 | `create/useUserCreateForm.ts` | `console.log` のみ（API 未接続） |
| 詳細・編集 | `detail/useUserProfile.ts` | MOCK_USER の固定値（API 未接続） |
| サインイン | `auth/SignIn/SignInPage.tsx` | `console.log` のみ（API 未接続） |

---

## 共通作業（前提）

### 1. Vite プロキシ設定（`vite.config.ts`）

`/api` と `/uploads` リクエストをバックエンド（port 3000）に転送する。

```ts
server: {
  proxy: {
    '/api': 'http://localhost:3000',
    '/uploads': 'http://localhost:3000',
  }
}
```

### 2. API クライアント（`src/lib/api/client.ts`）

- JWT Bearer トークン付きの `fetch` ラッパー
- `localStorage` からトークンを読み取る
- `ApiResponse<T>` 型に基づくレスポンス処理
- 401 時の自動サインアウト

### 3. トークン管理（`src/lib/auth.ts`）

- `localStorage` への accessToken の保存・取得・削除

### 4. USER API 関数（`src/lib/api/users.ts`）

| 関数 | メソッド | パス |
|---|---|---|
| `searchUsers` | POST | `/api/v1/users` |
| `createUserProfile` | PUT | `/api/v1/users` |
| `getUserProfile` | GET | `/api/v1/users/:id` |
| `updateUserProfile` | PUT | `/api/v1/users/:id` |
| `deleteUser` | DELETE | `/api/v1/users/:id` |

### 5. サインイン API 接続（`SignInPage.tsx`）

- `POST /api/v1/auth/signin` を呼び出してトークンを localStorage に保存
- ユーザー画面はすべて JWT 認証が必須なため、これが前提条件

---

## 画面別実装計画

### ユーザー一覧（`/users/list`）

| 機能 | 現状 | 実装内容 |
|---|---|---|
| 一覧取得 | MOCK_USERS（インメモリ） | `searchUsers` API 呼び出し |
| 検索 | インメモリ `filter` | サーバーサイドに移行（API パラメータとして送信） |
| ソート | インメモリ `sort` | サーバーサイドに移行 |
| ページング | インメモリ `slice` | API レスポンスの `totalCount` / `totalPages` を使用 |
| 削除 | `deletedIds` 配列のみ（状態管理） | `deleteUser` API × 選択件数分 |
| ローディング表示 | なし | `isLoading` state 追加 |
| エラー表示 | なし | `error` state 追加 |
| CSVエクスポート | 全フィルタ結果を出力 | **現在ページのみ**に変更（全件取得 API なし） |

**変更ファイル：** `list/useUserList.ts`

### ユーザー作成（`/users/create`）

| 機能 | 現状 | 実装内容 |
|---|---|---|
| プロフィール作成 | `console.log` のみ | `createUserProfile` API 呼び出し |
| profileImage 送信 | `File` オブジェクト | `FileReader` で base64 変換後に送信 |
| 作成後の遷移先 | `/users`（存在しないルート） | `/users/:id`（作成したユーザーの ID）に修正 |

**変更ファイル：** `create/useUserCreateForm.ts`

### ユーザー詳細・編集（`/users/:id`）

| 機能 | 現状 | 実装内容 |
|---|---|---|
| プロフィール取得（表示） | MOCK_USER の固定値 | `getUserProfile` API 呼び出し |
| プロフィール更新（編集） | `console.log` のみ | `updateUserProfile` API 呼び出し |
| profileImage 送信 | `File` オブジェクト | `FileReader` で base64 変換後に送信 |
| profileImage の URL 表示 | `/uploads/...` パス | 表示時はそのまま使用（Vite プロキシ経由） |
| ローディング表示 | なし | `isLoading` state 追加 |

**変更ファイル：** `detail/useUserProfile.ts`

---

## TODO（実装不可・保留）

| 項目 | 理由 |
|---|---|
| CSV インポート | バックエンドに `POST /api/v1/users/import` が未実装 |
| CSV エクスポート（全件） | 全件取得 API がない。現在ページのみに変更する |
| `useUserDetail.ts` の整理 | `detail/index.tsx` では `useUserProfile` のみ使用。不要になっている可能性あり |
| `useUserEditForm.ts` の整理 | `detail/index.tsx` では `useUserProfile` のみ使用。不要になっている可能性あり |
| 認証ガード（ルートレベル） | 未認証ユーザーをサインイン画面にリダイレクトする仕組みが未実装 |
| トークンリフレッシュ | `POST /api/v1/auth/refresh` の呼び出しが未実装（accessToken 期限切れ対応） |

---

## 実装順序

1. `vite.config.ts` — プロキシ追加
2. `src/lib/auth.ts` — トークン管理
3. `src/lib/api/client.ts` — API クライアント
4. `src/lib/api/users.ts` — USER API 関数
5. `SignInPage.tsx` — サインイン API 接続（認証トークン取得）
6. `list/useUserList.ts` — 一覧 API 接続
7. `create/useUserCreateForm.ts` — 作成 API 接続
8. `detail/useUserProfile.ts` — 詳細・編集 API 接続