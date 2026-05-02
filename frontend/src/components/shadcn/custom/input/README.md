# custom/input

## 概要

ラベル・入力欄・エラーメッセージをセットにしたフォームフィールドコンポーネント群。
`shadcn/original/` のプリミティブコンポーネントと `@base-ui/react/field` を組み合わせて、各入力タイプごとに提供する。

## ファイル構成

| ファイル | コンポーネント | 用途 |
|---|---|---|
| `email.tsx` | `EmailInput` / `EmailInputField` | メールアドレス入力 |
| `password.tsx` | `PasswordInput` / `PasswordInputField` | パスワード入力（表示/非表示トグル付き） |
| `text.tsx` | `TextInput` / `TextInputField` | テキスト入力（text / tel / number） |
| `textarea.tsx` | `TextAreaInput` / `TextAreaInputField` | 複数行テキスト入力 |
| `date.tsx` | `DateInput` / `DateInputField` | 日付・年月入力（date / month） |
| `checkbox.tsx` | `InputCheckbox` / `InputCheckboxField` | 単一チェックボックス |
| `checkbox-group.tsx` | `InputCheckboxGroup` / `InputCheckboxGroupField` | 複数チェックボックス |

## コンポーネント構成

各ファイルは **2 つのコンポーネント** をエクスポートする。

| 種別 | 命名規則 | 役割 |
|---|---|---|
| Presentational | `XxxInput` | UI のみ。`value` / `onChange` / `errorMessage` を props で受け取る |
| RHF ラッパー | `XxxInputField` | `Controller` でラップして RHF に接続する |

```tsx
// Presentational: 単体でも使える
<TextInput
  label="氏名"
  value={name}
  onChange={setName}
  errorMessage="氏名を入力してください"
  required
/>

// RHF ラッパー: useForm の control を渡すだけで動く
<TextInputField control={control} name="name" label="氏名" required />
```

## 共通 Props（Presentational）

| Prop | 型 | 説明 |
|---|---|---|
| `label` | `string` | ラベルテキスト |
| `errorMessage` | `string` | エラーメッセージ。指定時にエラー表示 |
| `required` | `boolean` | 必須フラグ（ラベルに * を表示） |
| `disabled` | `boolean` | 無効状態 |
| `className` | `string` | ルート要素への追加クラス |

## 各コンポーネントの固有 Props

### TextInput

| Prop | 型 | デフォルト | 説明 |
|---|---|---|---|
| `value` | `string` | — | 入力値 |
| `onChange` | `(value: string) => void` | — | 値変更コールバック |
| `type` | `"text" \| "tel" \| "number"` | `"text"` | input の type |
| `placeholder` | `string` | — | プレースホルダー |
| `maxLength` | `number` | — | 最大文字数 |

### TextAreaInput

| Prop | 型 | デフォルト | 説明 |
|---|---|---|---|
| `value` | `string` | — | 入力値 |
| `onChange` | `(value: string) => void` | — | 値変更コールバック |
| `rows` | `number` | — | 表示行数 |

### DateInput

| Prop | 型 | デフォルト | 説明 |
|---|---|---|---|
| `value` | `string` | — | 日付文字列（YYYY-MM-DD または YYYY-MM） |
| `onChange` | `(value: string) => void` | — | 値変更コールバック |
| `type` | `"date" \| "month"` | `"date"` | input の type |

### InputCheckbox（単一）

| Prop | 型 | 説明 |
|---|---|---|
| `label` | `React.ReactNode` | ラベル。JSX（リンク等）も渡せる |
| `checked` | `boolean` | チェック状態 |
| `onCheckedChange` | `(checked: boolean) => void` | 変更コールバック |

### InputCheckboxGroup（複数）

| Prop | 型 | デフォルト | 説明 |
|---|---|---|---|
| `options` | `readonly string[]` | — | 選択肢の一覧 |
| `value` | `string[]` | — | 選択中の値の配列 |
| `onChange` | `(value: string[]) => void` | — | 変更コールバック |
| `groupName` | `string` | `"checkbox-group"` | 各チェックボックスの ID プレフィックス |

## RHF ラッパー（*Field）の Props

Presentational の Props から `value` / `onChange` / `errorMessage` を除き、代わりに以下を追加。

| Prop | 型 | 説明 |
|---|---|---|
| `control` | `Control<T>` | `useForm` から取得した control |
| `name` | `Path<T>` | フォームフィールドのパス |