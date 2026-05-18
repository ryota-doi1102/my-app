# テーブル一覧

## ルール
- IDは廃止しても再利用しない（永久欠番）
- 新規追加は末尾に追加する
- 関連テーブルの派生はサブID（DB-AUTH-01-1）で対応する

## 認証（AUTH）

| ID | テーブル名 | 状態 | ファイル | 説明 |
|---|---|---|---|---|
| DB-AUTH-01 | users | 有効 | docs/db/DB-AUTH-01.md | ユーザー |
| DB-AUTH-02 | signup_tokens | 有効 | docs/db/DB-AUTH-02.md | サインアップトークン |
| DB-AUTH-03 | refresh_tokens | 有効 | docs/db/DB-AUTH-03.md | リフレッシュトークン |
| DB-AUTH-04 | password_reset_tokens | 有効 | docs/db/DB-AUTH-04.md | パスワードリセットトークン |

## マスタ（MASTER）

| ID | テーブル名 | 状態 | ファイル | 説明 |
|---|---|---|---|---|
| DB-MASTER-01 | genders | 有効 | docs/db/DB-MASTER-01.md | 性別マスタ |
| DB-MASTER-02 | work_types | 有効 | docs/db/DB-MASTER-02.md | 希望勤務形態マスタ |

## ユーザー（USER）

| ID | テーブル名 | 状態 | ファイル | 説明 |
|---|---|---|---|---|
| DB-USER-01 | user_profiles | 有効 | docs/db/DB-USER-01.md | ユーザープロフィール |
| DB-USER-02 | user_work_types | 有効 | docs/db/DB-USER-02.md | ユーザー希望勤務形態（中間テーブル） |
| DB-USER-03 | user_qualifications | 有効 | docs/db/DB-USER-03.md | ユーザー資格 |
| DB-USER-04 | user_work_histories | 有効 | docs/db/DB-USER-04.md | ユーザー職歴 |
| DB-USER-05 | import_jobs | 有効 | docs/db/DB-USER-05.md | インポートジョブ |
| DB-USER-06 | export_jobs | 有効 | docs/db/DB-USER-06.md | エクスポートジョブ |
