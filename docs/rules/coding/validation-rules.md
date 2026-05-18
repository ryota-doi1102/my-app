# バリデーションルール・メッセージ規約

## 概要

- バリデーションライブラリ: **zod**
- スキーマ定義場所: `shared/schemas/`
- メッセージ定数・関数: `shared/constants/validationMessages.ts`

---

## データ型ごとの確認項目

各データ型に応じて、以下の項目を必要に応じて実装する。
◎ = 原則必須、○ = 該当する場合に実装、— = 対象外

### 文字列（string）

| # | 区分 | 確認項目 | zod | メッセージ関数 |
|---|---|---|---|---|
| 1 | ◎ | データ形式チェック（文字列であること） | `invalid_type_error` | `invalidTypeMessage('文字列')` |
| 2 | ○ | 必須チェック（undefined でないこと） | `required_error` | `requiredMessage(field)` |
| 3 | ○ | 最小文字数チェック（空文字チェックを兼ねる） | `.min(1)` | `requiredMessage(field)` |
| 4 | ○ | 最大文字数チェック | `.max(n)` | `maxMessage(field, '{n}文字')` |
| 5 | ○ | 桁数チェック（桁数指定のある場合） | `.regex()` | `digitsMessage(field, n)` |
| 6 | ○ | 形式チェック（YYYY-MM-DD など） | `.regex()` | `formatMessage(field, format)` |
| 7 | ○ | 使用可能文字チェック | `.regex()` | `allowedCharsMessage(field, chars)` |
| 8 | ○ | 使用禁止文字チェック | `.regex()` | `forbiddenCharsMessage(field, chars)` |

> チェックの順序は上記の番号順で実装する。  
> 任意項目の場合は 2・3 を省略し、`.optional()` を末尾に付ける。  
> 5〜8 が複数ある場合は、ユーザーが最初に気づくべきエラーを先に記述する。

### 数値（number）

| # | 区分 | 確認項目 | zod | メッセージ関数 |
|---|---|---|---|---|
| 1 | ◎ | データ形式チェック（数値であること） | `invalid_type_error` | `invalidTypeMessage('数値')` |
| 2 | ○ | 必須チェック（undefined でないこと） | `required_error` | `requiredMessage(field)` |
| 3 | ○ | 最小値チェック | `.min(n)` | `minMessage(field, n)` |
| 4 | ○ | 最大値チェック | `.max(n)` | `maxMessage(field, n)` |

### boolean

| # | 区分 | 確認項目 | zod | メッセージ関数 |
|---|---|---|---|---|
| 1 | ◎ | データ形式チェック（boolean であること） | `invalid_type_error` | `invalidTypeMessage('boolean')` |
| 2 | ○ | 必須チェック（undefined でないこと） | `required_error` | `requiredMessage(field)` |

### 配列（array）

| # | 区分 | 確認項目 | zod | メッセージ関数 |
|---|---|---|---|---|
| 1 | ◎ | データ形式チェック（指定された形式の配列であること） | `z.array(itemSchema)` | — |
| 2 | ○ | 必須チェック（undefined でないこと） | `required_error` | `requiredMessage(field)` |

> 配列の各要素のバリデーションは `itemSchema` 側で定義する。

### ファイル（File）

| # | 区分 | 確認項目 | zod | メッセージ |
|---|---|---|---|---|
| 1 | ○ | ファイル形式チェック（許可する MIME タイプであること） | `.refine()` | フィールド固有のメッセージを直接記述 |
| 2 | ○ | 最小サイズチェック（1B 以上・空ファイル不可） | `.refine()` | フィールド固有のメッセージを直接記述 |
| 3 | ○ | 最大サイズチェック | `.refine()` | フィールド固有のメッセージを直接記述 |

> `z.custom()` を使用する。値が `null / undefined / string`（既存ファイルの URL）の場合はチェックをスキップする。  
> フロントエンドでは拡張子と実際のファイル内容の一致検証は行わない（バックエンドで magic bytes を検証する）。

```ts
z.custom<{ type: string; size: number } | string | null | undefined>()
    .refine(
        (val) => !val || typeof val === 'string' || ['image/jpeg', 'image/png', 'image/webp'].includes((val as { type: string }).type),
        '対応していないファイル形式です',
    )
    .refine(
        (val) => !val || typeof val === 'string' || (val as { size: number }).size > 0,
        'ファイルが空です',
    )
    .refine(
        (val) => !val || typeof val === 'string' || (val as { size: number }).size <= 5 * 1024 * 1024,
        'ファイルサイズが上限を超えています',
    )
    .nullable()
    .optional()
```

---

## メッセージ関数一覧

| 関数 / 定数 | 出力形式 | 使用する zod メソッド |
|---|---|---|
| `requiredMessage(field)` | `{field}は必須項目です` | `required_error` / `.min(1)` |
| `invalidTypeMessage(type)` | `入力された値が{type}形式ではありません` | `invalid_type_error` |
| `maxMessage(field, max)` | `{field}は{max}以下で入力してください` | `.max()` |
| `minMessage(field, min)` | `{field}は{min}以上で入力してください` | `.min(n)` ※ n > 1 |
| `formatMessage(field, format)` | `{field}は{format}形式で入力してください` | `.regex()` |
| `allowedCharsMessage(field, chars)` | `{field}は{chars}で入力してください` | `.regex()` |
| `forbiddenCharsMessage(field, chars, example?)` | `{field}に{chars}は使用できません`（`example` 指定時は末尾に `（例: {example}）`） | `.regex()` |
| `digitsMessage(field, digits)` | `{field}は{digits}桁で入力してください` | `.regex()` |

---

## ルール種別とメッセージの対応

### 必須チェック

```ts
z.string({
    required_error: requiredMessage('氏名'),        // undefined のとき
    invalid_type_error: invalidTypeMessage('文字列'),
}).min(1, requiredMessage('氏名'))                  // 空文字のとき
```

| トリガー | メッセージ |
|---|---|
| 値が `undefined` | `氏名は必須項目です` |
| 値が `""` （空文字） | `氏名は必須項目です` |
| 値が `null` など型違い | `入力された値が文字列形式ではありません` |

### 文字数制限

```ts
z.string()
    .max(100, maxMessage('氏名', '100文字'))   // → '氏名は100文字以下で入力してください'
    .min(8, minMessage('パスワード', '8文字')) // → 'パスワードは8文字以上で入力してください'
```

> `maxMessage` / `minMessage` の第2引数は `number | string`。単位を含める場合は文字列で渡す（例: `'100文字'`）。

### 形式チェック（日付・月など）

```ts
z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, formatMessage('生年月日', 'YYYY-MM-DD'))
    // → '生年月日はYYYY-MM-DD形式で入力してください'
```

### 使用可能文字チェック

```ts
z.string()
    .regex(/^[0-9]*$/, allowedCharsMessage('電話番号', '半角数字'))
    // → '電話番号は半角数字で入力してください'
```

### 禁止文字チェック

```ts
z.string()
    .regex(/^[^-]*$/, forbiddenCharsMessage('電話番号', 'ハイフン'))
    // → '電話番号にハイフンは使用できません'

z.string()
    .regex(/^[^-]*$/, forbiddenCharsMessage('電話番号', 'ハイフン', '09012345678'))
    // → '電話番号にハイフンは使用できません（例: 09012345678）'
```

### 桁数チェック

```ts
z.string()
    .regex(/^(\d{7})?$/, digitsMessage('郵便番号', 7))
    // → '郵便番号は7桁で入力してください'

z.string()
    .regex(/^(\d{10,11})?$/, digitsMessage('電話番号', '10〜11'))
    // → '電話番号は10〜11桁で入力してください'
```

### ビジネスロジック（refine）

定数・関数では表現できないドメイン固有のルールは `.refine()` でフィールド固有のメッセージを直接記述する。

```ts
z.string()
    .refine((val) => calcAge(val) >= 18, '18歳未満の方は登録できません')
    .refine((val) => calcAge(val) < 60,  '60歳以上の方は登録できません')
```

---

## インポート方法

```ts
import {
    invalidTypeMessage,
    requiredMessage,
    maxMessage,
    minMessage,
    formatMessage,
    allowedCharsMessage,
    forbiddenCharsMessage,
    digitsMessage,
} from '@shared/constants'
```

---

## 定義ファイル

| 種別 | パス |
|---|---|
| メッセージ定数・関数 | `shared/constants/validationMessages.ts` |
| ユーザー系スキーマ | `shared/schemas/user.ts` |
