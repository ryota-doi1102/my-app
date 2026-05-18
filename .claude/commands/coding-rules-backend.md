# backend コーディング規約（共通）

backend 実装時に共通して参照するルール。

詳細は `docs/rules/coding/backend-coding-rules.md` を参照。

---

## TypeScript 共通ルール

- `strict` モードを使用する
- `any` は使用禁止（`unknown` を使う）
- 型定義は `interface` より `type` を優先する
- 関数の引数・戻り値には必ず型を明示する
- 非 null アサーション（`!`）は使用禁止

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

## 関連規約

| 規約 | コマンド |
|---|---|
| API 実装 | `/coding-rules-backend-api` |
| DB 実装 | `/coding-rules-backend-db` |
| Unit テスト | `/coding-rules-backend-unit-test` |
| コメント・ロギング | `/coding-rules-comment-logging` |
| バリデーション | `/coding-rules-validation` |
