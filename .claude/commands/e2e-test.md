# E2E テスト規約

Playwright を使用した E2E テストのコーディング規約。

---

## 基本方針

- E2E テストフレームワークは Playwright を使用する
- フロントエンド・バックエンド・DB が全て起動した状態でテストする
- テストファイルは `e2e/` ディレクトリ（プロジェクトルート直下）に配置する

```
project/
└── e2e/
    ├── fixtures/       # テスト用データ
    ├── pages/          # Page Object Model
    └── specs/          # テストファイル（*.spec.ts）
```

---

## テスト構成

- Page Object Model（POM）パターンを使用する
- テストの説明は日本語で記述する
- テストデータは `fixtures/` で管理する

**Page Object 例：**

```ts
// e2e/pages/LoginPage.ts
import type { Page } from '@playwright/test'

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login')
  }

  async login(email: string, password: string) {
    await this.page.fill('[name=email]', email)
    await this.page.fill('[name=password]', password)
    await this.page.click('[type=submit]')
  }
}
```

**テストファイル例：**

```ts
// e2e/specs/auth.spec.ts
import { test, expect } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage'

test.describe('認証', () => {
  test('正しい認証情報でログインできること', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login('test@example.com', 'password123')
    await expect(page).toHaveURL('/dashboard')
  })

  test('誤ったパスワードでログインできないこと', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login('test@example.com', 'wrong-password')
    await expect(page.locator('[data-testid=error-message]')).toBeVisible()
  })
})
```

---

## テスト実行前の準備

1. `docker-compose up -d` で DB を起動する
2. `npm run dev` でフロント・バック両方を起動する
3. テスト用データをシードする（`npm run db:seed --workspace=backend`）

---

## テスト実行コマンド

- 全テスト実行: `npm run e2e`
- UI モードで実行: `npm run e2e:ui`
- 特定ファイルのみ: `npm run e2e -- e2e/specs/auth.spec.ts`

---

## 注意事項

- E2E テストは CI で自動実行する
- テスト後はテストデータをクリーンアップする
- フロントエンド・バックエンド両方の変更が絡む場合に実施する
- Unit テストで担保できる範囲は E2E に含めない（重複させない）
