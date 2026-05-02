# LeaveConfirmDialog

## 概要

フォームページから離脱する際に、未保存の入力内容を破棄してよいか確認するダイアログ。

## 使い分け基準

- キャンセルボタン押下時など、ユーザーが意図的に離脱しようとした場合に使用する
- ブラウザの戻る・リロード等のネイティブ操作には使用しない（`beforeunload` の代替ではない）

## 使用例

```tsx
import { LeaveConfirmDialog } from "@/components/shadcn/custom/LeaveConfirmDialog"

const [open, setOpen] = useState(false)

function handleCancel() {
  if (isDirty) {
    setOpen(true)
  } else {
    navigate("/list")
  }
}

<LeaveConfirmDialog
  open={open}
  onOpenChange={setOpen}
  onConfirm={() => navigate("/list")}
/>
```

## Props

| Prop | 型 | 説明 |
|------|----|------|
| `open` | `boolean` | ダイアログの開閉状態 |
| `onOpenChange` | `(open: boolean) => void` | 開閉状態の変更ハンドラー |
| `onConfirm` | `() => void` | 「OK」押下時のコールバック（離脱処理を実行する） |