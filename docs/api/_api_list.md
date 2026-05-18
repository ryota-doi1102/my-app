# API一覧

## ルール
- IDは廃止しても再利用しない（永久欠番）
- 新規追加は末尾に追加する
- 関連APIの派生はサブID（API-AUTH-01-1）で対応する

## 認証（AUTH）

| ID | メソッド | パス | 状態 | ファイル | 説明 |
|---|---|---|---|---|---|
| API-AUTH-01 | POST | /auth/signup/request | 有効 | docs/api/API-AUTH-01.md | サインアップトークン発行 |
| API-AUTH-02 | POST | /auth/signup | 有効 | docs/api/API-AUTH-02.md | サインアップ |
| API-AUTH-03 | POST | /auth/signin | 有効 | docs/api/API-AUTH-03.md | サインイン |
| API-AUTH-04 | POST | /auth/refresh | 有効 | docs/api/API-AUTH-04.md | アクセストークン再発行 |
| API-AUTH-05 | POST | /auth/signout | 有効 | docs/api/API-AUTH-05.md | サインアウト |
| API-AUTH-06 | POST | /auth/password-reset/request | 有効 | docs/api/API-AUTH-06.md | パスワードリセットトークン発行 |
| API-AUTH-07 | POST | /auth/password-reset | 有効 | docs/api/API-AUTH-07.md | パスワードリセット実行 |

## ユーザー（USER）

| ID | メソッド | パス | 状態 | ファイル | 説明 |
|---|---|---|---|---|---|
| API-USER-01 | POST | /users | 有効 | docs/api/API-USER-01.md | ユーザープロフィール一覧検索 |
| API-USER-02 | PUT | /users | 有効 | docs/api/API-USER-02.md | ユーザープロフィール作成 |
| API-USER-03 | GET | /users/:id | 有効 | docs/api/API-USER-03.md | ユーザープロフィール取得 |
| API-USER-04 | PUT | /users/:id | 有効 | docs/api/API-USER-04.md | ユーザープロフィール更新 |
| API-USER-05 | DELETE | /users/:id | 有効 | docs/api/API-USER-05.md | ユーザープロフィール削除 |
| API-USER-06 | DELETE | /users/bulk | 有効 | docs/api/API-USER-06.md | ユーザープロフィール一括削除 |
| API-USER-07 | GET | /users/template | 有効 | docs/api/API-USER-07.md | テンプレートファイルダウンロード |
| API-USER-08 | POST | /users/import | 有効 | docs/api/API-USER-08.md | ユーザープロフィールインポート（ジョブ登録） |
| API-USER-09 | GET | /users/import-jobs/:jobId | 有効 | docs/api/API-USER-09.md | インポートジョブ結果取得 |
| API-USER-10 | POST | /users/export | 有効 | docs/api/API-USER-10.md | ユーザープロフィールエクスポート（ジョブ登録） |
| API-USER-11 | GET | /users/export-jobs/:jobId | 有効 | docs/api/API-USER-11.md | エクスポートジョブ結果取得 |