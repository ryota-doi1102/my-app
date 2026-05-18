# コメント・ロギング規約

フロントエンド・バックエンド共通のコメントおよびログ出力に関するルール。

詳細は `docs/rules/coding/comment-and-logging-rules.md` を参照。

---

## コメント

- 関数には何をする関数かを簡潔に説明するコメントを記載する
- 分岐処理（`if` / `try-catch`）ごとに、その条件・意図を説明するコメントをつける

```ts
// メールアドレスでユーザーを検索し、存在しない場合はエラーをスローする
async function findUserByEmail(email: string): Promise<User> {
  // ユーザーが見つからない場合は 404 エラー
  if (!user) throw new AppError(404, 'NOT_FOUND', 'ユーザーが見つかりません')
}
```

---

## ロギング

- `console.log` は使用禁止
- **LogTape** を使用してログを出力する
- ロガーは `getAppLogger(["services", "resource", "API-XXX-XX"])` で生成する

**ログレベルの使い分け：**

| レベル | 用途 |
|---|---|
| `error` | エラーレスポンスを返すとき（例外をスローする直前） |
| `warn` | 条件未達で早期 return するとき（正常系だが想定外の状態） |
| `info` | リクエスト受付・主要処理の開始・完了など通常フロー |
| `debug` | 詳細なデバッグ情報（開発時のみ） |

```ts
const logger = getAppLogger(["services", "users", "API-USER-04"])

logger.info("ユーザープロフィール更新成功", { userId })
logger.warn("ユーザーが見つからない", { userId })
logger.error("メールアドレスが重複しています", { email })
```

---

## API 仕様書との対応

- ログ出力内容は仕様書（`docs/api/API-XXX-XX.md`）の処理フロー「ログ表示内容」列に記載する
- 実装とドキュメントのログメッセージを常に同期させること
