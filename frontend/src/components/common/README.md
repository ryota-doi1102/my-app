# common

## 概要

UIライブラリに依存しない共通レイアウトコンポーネント群。

## ファイル構成

| ファイル | コンポーネント | 役割 |
|----------|---------------|------|
| `AppLayout.tsx` | `AppLayout` | ヘッダー・サイドメニュー・フッターを含む共通レイアウト |
| `Header.tsx` | `Header` | 画面上部のヘッダー |
| `SideMenu.tsx` | `SideMenu` | 左側のナビゲーションメニュー |
| `Footer.tsx` | `Footer` | 画面下部のフッター |

## レイアウト構造

```
┌──────────────────────────────────────┐
│  Header                              │
├────────────┬─────────────────────────┤
│            │                         │
│  SideMenu  │   <Outlet />            │
│            │   （各ページコンテンツ） │
│            │                         │
├────────────┴─────────────────────────┤
│  Footer                              │
└──────────────────────────────────────┘
```

## 適用対象

`routes.tsx` で `AppLayout` を親ルートに設定し、認証画面以外のすべてのページに適用する。

```tsx
// 認証画面（レイアウトなし）
{ path: "/sign-in", element: <SignInPage /> }

// アプリ画面（レイアウトあり）
{
  element: <AppLayout />,
  children: [
    { path: "/", element: <HomePage /> },
    { path: "/users/create", element: <UserCreatePage /> },
  ],
}
```

## SideMenu のナビゲーション項目

| ラベル | リンク先 |
|--------|----------|
| ユーザー一覧 | `/users` |
| ユーザー作成 | `/users/create` |