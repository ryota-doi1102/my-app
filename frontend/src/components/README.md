# Components

## ディレクトリ構成

複数のUIライブラリを使用することを想定しているため、`components/` 直下にUIライブラリごとのフォルダを作成し、その中でコンポーネントを管理する。

```
src/components/
├── shadcn/
│   ├── original/    # shadcn/ui が生成する原本（直接編集しない）
│   └── custom/      # original に手を加えたカスタムコンポーネント
├── radix/           # Radix UI を直接使用するコンポーネント
├── common/          # ライブラリに依存しない共通コンポーネント
└── README.md        # このファイル
```

## ルール

### 1. UIライブラリごとにフォルダを分ける

| フォルダ | 用途 |
|---|---|
| `shadcn/original/` | shadcn/ui が生成する原本。直接編集しない |
| `shadcn/custom/` | original に手を加えたカスタムコンポーネント |
| `radix/` | shadcn/ui にないコンポーネントを Radix UI で自作する場合 |
| `common/` | UIライブラリに依存しない汎用コンポーネント |

### 2. 各コンポーネントに README.md を作成する

コンポーネントを新規作成する際は、同じディレクトリに `README.md` を作成し、以下の内容を記載すること。

```markdown
# ComponentName

## 概要
このコンポーネントが何をするものかを簡潔に説明する。

## 使い分け基準
どのような場面で使うべきか、他のコンポーネントとの違いを記載する。

## 使用例
\`\`\`tsx
<ComponentName prop="value" />
\`\`\`

## Props
| Prop | 型 | デフォルト | 説明 |
|---|---|---|---|
| prop | string | - | 説明 |
```

### 3. スタイリングは Tailwind CSS を使う

- スタイルは Tailwind のユーティリティクラスで記述する
- クラスの結合には `src/lib/utils.ts` の `cn()` を使う
- インラインスタイルや別途 CSS ファイルの作成は原則禁止

```tsx
import { cn } from "@/lib/utils";

function MyComponent({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      ...
    </div>
  );
}
```
