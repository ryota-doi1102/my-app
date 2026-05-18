# backend コーディング規約（共通）

---

## TypeScript 共通ルール

| ルール | 内容 |
|---|---|
| strict モード | 常に有効 |
| `any` 禁止 | 型が不明な場合は `unknown` を使う |
| 型定義 | `interface` より `type` を優先 |
| 関数の型 | 引数・戻り値に必ず型を明示 |
| 非 null アサーション（`!`） | 使用禁止 |

---

## ディレクトリ構成

```
backend/src/
├── routes/       # ルーティング（リソース単位）
├── services/     # ビジネスロジック（API 単位でファイル分割）
├── middleware/   # 共通ミドルウェア
├── schemas/      # backend 固有のスキーマ拡張
├── db/           # DB接続・スキーマ
└── types/        # backend 固有の型定義
```

- `routes/` にはルーティングのみ記述する
- ビジネスロジックは `services/` に切り出す
- `routes/` から直接 `db` を呼ばない（必ず `services/` 経由）
- サービスは API 単位でファイルを分割し、`index.ts` でまとめてエクスポートする

---

## 環境変数

- 接続情報・シークレットは必ず環境変数で管理する（コードにハードコードしない）
- `.env` は `.gitignore` に含めること
- `.env.example` に変数名と説明を記載すること

---

## Unit テスト（Vitest）

- テストファイルは `backend/src/tests/routes/` に配置する
- `describe` でリソース・機能単位にグループ化する
- `it` / `test` の説明は日本語で記述する
- Arrange / Act / Assert（AAA）パターンに従う
- 外部依存（DB・外部 API）は必ずモックする

```bash
npm run test                  # watch モード
npm run test:run              # 1回実行（CI用）
npm run test:coverage         # カバレッジ確認
```

カバレッジ目標：`services/` は 80% 以上

---

## 関連規約

| 規約 | ファイル |
|---|---|
| API 実装（Hono・ルーティング・レスポンス・認証） | `docs/rules/coding/api-coding-rules.md` |
| DB 実装（Drizzle ORM・スキーマ・クエリ・マイグレーション） | `docs/rules/coding/db-coding-rules.md` |
| コメント・ロギング | `docs/rules/coding/comment-and-logging-rules.md` |
| バリデーション | `docs/rules/coding/validation-rules.md` |
