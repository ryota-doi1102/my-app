# バリデーションルール・メッセージ規約

バリデーションスキーマを実装する際に参照する規約。

詳細は `docs/rules/coding/validation-rules.md` を参照。

---

## 基本方針

- バリデーションライブラリ: **zod**
- スキーマ定義場所: `shared/schemas/`
- メッセージ定数・関数: `shared/constants/validationMessages.ts`
- メッセージ関数を必ず使う（生の文字列を直接渡さない）

---

## チェック順序（文字列フィールドの標準）

```ts
z.string({
    required_error: requiredMessage('氏名'),
    invalid_type_error: invalidTypeMessage('文字列'),
})
.min(1, requiredMessage('氏名'))      // 空文字チェック
.max(100, maxMessage('氏名', '100文字'))
.regex(/.../, formatMessage(...))
```

順序: `required_error` → `min(1)` → `max` → `regex(形式)` → `regex(文字種)` → `refine(ビジネスロジック)`

---

## メッセージ関数一覧

| 関数 | 出力形式 |
|---|---|
| `requiredMessage(field)` | `{field}は必須項目です` |
| `invalidTypeMessage(type)` | `入力された値が{type}形式ではありません` |
| `maxMessage(field, max)` | `{field}は{max}以下で入力してください` |
| `minMessage(field, min)` | `{field}は{min}以上で入力してください` |
| `formatMessage(field, format)` | `{field}は{format}形式で入力してください` |
| `allowedCharsMessage(field, chars)` | `{field}は{chars}で入力してください` |
| `forbiddenCharsMessage(field, chars)` | `{field}に{chars}は使用できません` |
| `digitsMessage(field, digits)` | `{field}は{digits}桁で入力してください` |

```ts
import {
    requiredMessage, invalidTypeMessage, maxMessage, minMessage,
    formatMessage, allowedCharsMessage, forbiddenCharsMessage, digitsMessage,
} from '@shared/constants'
```

---

## PUT/POST の任意フィールド

- `.optional()` は付けない（省略 → 422）
- `.nullable()` のみ付ける（null → DB に NULL で保存）
- 例外: PATCH API は `.nullable().optional()` を許可

```ts
// ✓ PUT/POST
phone: z.string({ invalid_type_error: invalidTypeMessage('文字列') }).nullable(),

// ✓ PATCH
phone: z.string({ invalid_type_error: invalidTypeMessage('文字列') }).nullable().optional(),
```

---

## 更新スキーマは作成スキーマを派生させる

```ts
export const userProfileEditSchema = userProfileCreateSchema
    .omit({ password: true, agreedToTerms: true })
    .extend({
        phone: z.string({ invalid_type_error: invalidTypeMessage('文字列') }).nullable().optional(),
    })
```
