# コメント・ロギング共通規約

フロントエンド・バックエンド共通のコメントおよびログ出力に関するルール。

---

## コメント

- 関数には何をする関数かを簡潔に説明するコメントを記載する
- 分岐処理（`if` / `try-catch`）ごとに、その条件・意図を説明するコメントをつける

```ts
// メールアドレスでユーザーを検索し、存在しない場合はエラーをスローする
async function findUserByEmail(email: string): Promise<User> {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  })

  // ユーザーが見つからない場合は 404 エラー
  if (!user) {
    throw new AppError('NOT_FOUND', 'ユーザーが見つかりません', 404)
  }

  return user
}
```

```ts
try {
  // DB にユーザーを新規登録する
  await db.insert(users).values(newUser)
} catch (error) {
  // メールアドレス重複（一意制約違反）の場合は 409 エラー
  if (isUniqueConstraintError(error)) {
    throw new AppError('CONFLICT', 'このメールアドレスはすでに使用されています', 409)
  }
  // その他の DB エラーはそのまま上位に伝播させる
  throw error
}
```

---

## ロギング

- `console.log` は使用禁止
- **LogTape** を使用してログを出力する
- 不具合箇所を特定しやすいよう、処理の要所にログを入れる
- ログレベルの使い分け：
  - `error`: エラーレスポンスを返すとき（例外をスローする直前、または catch でエラーを処理するとき）
  - `warn`: 条件未達で早期 return するとき（正常系だが想定外の状態）
  - `info`: リクエスト受付・主要処理の開始・完了など通常フロー
  - `debug`: 詳細なデバッグ情報（開発時のみ）
- ログの一覧は仕様書（`docs/api/API-XXX-XX.md` 等）の「ログ一覧」に記載する

**ログ出力例：**

```ts
import { getLogger } from '@logtape/logtape'

const logger = getLogger(['app', 'auth', 'signup'])

// リクエスト受付
logger.info('サインアップリクエストを受信', { email })

// 条件未達で早期 return（warn）
if (existingToken) {
  logger.warn('有効なトークンが既に存在するためスキップ', { email })
  return existingToken
}

// エラーレスポンスを返すとき（error）
logger.error('メールアドレスが重複しています', { email })
throw new AppError('CONFLICT', 'このメールアドレスはすでに使用されています', 409)
```

**仕様書のログ一覧フォーマット：**

```markdown
## ログ一覧

| レベル | メッセージ | 出力箇所 | 付加情報 |
|---|---|---|---|
| info  | サインアップリクエストを受信 | signupService.requestSignup | email |
| warn  | 有効なトークンが既に存在するためスキップ | signupService.requestSignup | email |
| error | メールアドレスが重複しています | signupService.requestSignup | email |
```
