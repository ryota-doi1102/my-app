# レビュー

指定されたドキュメント・実装を以下の4つの観点でレビューする。

## 実行タイミング

`/review` を呼び出す際は、レビュー対象（ファイルパス・ID・機能名など）を引数として指定する。

```
/review docs/api/API-USER-02.md
/review backend/src/routes/users.ts backend/src/services/userService/API-USER-02.ts
/review API-USER-02  # ドキュメント・実装・整合性・影響範囲をまとめてレビュー
```

---

## 観点 1: ドキュメントの不備チェック

対象ドキュメントが規約に準拠しているかを確認する。

### 参照する規約

| ドキュメント種別 | 参照コマンド | 規約ファイル |
|---|---|---|
| API 仕様書 | `/spec-rules-api` | `docs/rules/spec/api-spec-rules.md` |
| API テスト仕様書 | `/spec-rules-api-test` | `docs/rules/spec/api-test-spec-rules.md` |
| DB 仕様書 | `/spec-rules-db` | `docs/rules/spec/db-spec-rules.md` |
| 画面仕様書 | `/spec-rules-screen` | `docs/rules/spec/screen-spec-rules.md` |
| 画面テスト仕様書 | `/spec-rules-screen-test` | `docs/rules/spec/screen-test-spec-rules.md` |

### チェック項目

- [ ] 必須セクションがすべて揃っているか
- [ ] ID・ファイル名・配置パスが規約に準拠しているか
- [ ] テーブルの列定義・記法が規約通りか
- [ ] 一覧ファイル（`_api_list.md` / `_table_list.md` など）に登録されているか
- [ ] TC 番号体系・番号の重複・抜けがないか（テスト仕様書）
- [ ] 処理フロー ID の形式が正しいか（API 仕様書）

---

## 観点 2: 実装の不備チェック

対象実装ファイルがコーディング規約に準拠しているかを確認する。

### 参照する規約

| 実装種別 | 参照コマンド | 規約ファイル |
|---|---|---|
| backend 共通 | `/coding-rules-backend` | `docs/rules/coding/backend-coding-rules.md` |
| backend API (route) | `/coding-rules-backend-api` | `docs/rules/coding/backend-api-rules.md` |
| backend DB (schema/migration) | `/coding-rules-backend-db` | `docs/rules/coding/backend-db-rules.md` |
| backend unit test | `/coding-rules-backend-unit-test` | `docs/rules/testing/api-unit-test-rules.md` |
| コメント・ロギング | `/coding-rules-comment-logging` | `docs/rules/coding/comment-and-logging-rules.md` |
| バリデーション | `/coding-rules-validation` | `docs/rules/coding/validation-rules.md` |
| frontend | `/coding-rules-frontend` | `docs/rules/coding/frontend-coding-rules.md` |

### チェック項目

- [ ] TypeScript strict モード違反（`any` 使用・型省略・非 null アサーション）がないか
- [ ] ディレクトリ構成・ファイル分割が規約通りか
- [ ] route から直接 DB を呼んでいないか（service 経由か）
- [ ] エラーハンドリングが適切か（`AppError` の使用・エラーコードの一致）
- [ ] ログ出力が規約通りか（`getAppLogger` 使用・フォーマット）
- [ ] テストコードの構成（describe/it の粒度・AAA パターン・モックルール）

---

## 観点 3: ドキュメントと実装の整合性チェック

仕様書に記載された内容と実際の実装が一致しているかを確認する。

### チェック対象の組み合わせ

| 仕様書 | 対応する実装 |
|---|---|
| `docs/api/API-XXX-YY.md` | `backend/src/routes/` `backend/src/services/` `shared/schemas/` |
| `docs/tests/api/API-XXX-YY.md` | `backend/src/tests/routes/API-XXX-YY.test.ts` |
| `docs/db/DB-XXX-YY.md` | `backend/src/db/schema/DB-XXX-YY.ts` |
| `docs/screens/SCR-XXX-YY/index.md` | `frontend/src/pages/` `frontend/src/components/` |

### チェック項目

- [ ] レスポンスのステータスコード・フィールド名・型が一致しているか
- [ ] エラーコード・エラーメッセージが一致しているか
- [ ] バリデーションルール（必須・最大長・形式）が一致しているか
- [ ] 処理フローの順序・条件分岐が実装と一致しているか
- [ ] DB カラム定義（型・必須・デフォルト値・制約）が一致しているか
- [ ] TC 番号・テスト内容・期待結果が実装と一致しているか

---

## 観点 4: 影響範囲・反映漏れチェック

変更が加わった場合に、連動して更新すべき箇所が漏れていないかを確認する。

### 変更種別と更新すべき箇所

#### API を追加・変更した場合

- [ ] `docs/api/API-XXX-YY.md`（API 仕様書）
- [ ] `docs/api/_api_list.md`（API 一覧）
- [ ] `docs/tests/api/API-XXX-YY.md`（テスト仕様書）
- [ ] `backend/src/tests/routes/API-XXX-YY.test.ts`（テストコード）
- [ ] `backend/src/routes/`（ルーティング）
- [ ] `backend/src/services/`（サービス）
- [ ] `shared/schemas/`（Zod スキーマ）

#### DB スキーマを追加・変更した場合

- [ ] `docs/db/DB-XXX-YY.md`（DB 仕様書）
- [ ] `docs/db/_table_list.md`（テーブル一覧）
- [ ] `backend/src/db/schema/DB-XXX-YY.ts`（Drizzle スキーマ）
- [ ] マイグレーションファイル（`npm run db:generate` で生成済みか）

#### 画面を追加・変更した場合

- [ ] `docs/screens/SCR-XXX-YY/index.md`（画面仕様書）
- [ ] `frontend/src/pages/` または `frontend/src/components/`（実装）
- [ ] `frontend/src/routes.tsx`（ルーティング）

#### バリデーションスキーマを変更した場合

- [ ] `shared/schemas/`（共有スキーマ）
- [ ] フロントエンドのバリデーション表示
- [ ] API 仕様書のバリデーション欄
- [ ] テスト仕様書の TC（ボディ 300〜399 番台）
- [ ] テストコードの対応 TC

---

## 出力形式

各観点について以下の形式で報告する。

```
## 観点 1: ドキュメントの不備チェック

| 確認項目 | 結果 | 詳細 |
|---|---|---|
| 必須セクション | ✅ | 全セクションあり |
| ID・配置 | ✅ | - |
| 一覧ファイル登録 | ❌ | `_api_list.md` に未記載 |

## 観点 2: 実装の不備チェック
...

## 観点 3: 整合性チェック
...

## 観点 4: 影響範囲チェック
...

## まとめ

- ❌ N 件の問題あり → 修正が必要
- ⚠️ N 件の警告 → 確認を推奨
- ✅ すべて問題なし
```

凡例: `✅` 問題なし / `⚠️` 要確認 / `❌` 問題あり / `-` 対象外
