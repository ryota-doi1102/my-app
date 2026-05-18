# backend Unit テスト規約

Vitest を使用した単体テストのコーディング規約。

---

## 基本方針

- テストフレームワークは Vitest を使用する
- テストファイルは `src/tests/` 配下にまとめて配置する
  （例：`src/services/usersService.ts` → `src/tests/services/usersService.test.ts`）
  （例：`src/routes/users.ts` → `src/tests/routes/users.test.ts`）
- テストのカバレッジ目標：`services/` は 80% 以上

---

## テスト構成

- `describe` でリソース・機能単位にグループ化する
- `it` / `test` の説明は日本語で記述する
- Arrange / Act / Assert（AAA）パターンに従う

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usersService } from '../../services/usersService'
import { db } from '../../db'

vi.mock('../db')

describe('usersService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('findAll', () => {
    it('ユーザー一覧を返すこと', async () => {
      // Arrange
      const mockUsers = [{ id: '1', name: '山田太郎', email: 'yamada@example.com' }]
      vi.mocked(db.select).mockResolvedValue(mockUsers)

      // Act
      const result = await usersService.findAll()

      // Assert
      expect(result).toEqual(mockUsers)
    })

    it('DBエラー時に例外をスローすること', async () => {
      // Arrange
      vi.mocked(db.select).mockRejectedValue(new Error('DB Error'))

      // Act & Assert
      await expect(usersService.findAll()).rejects.toThrow('DB Error')
    })
  })
})
```

---

## モックルール

- 外部依存（DB・外部 API）は必ずモックする
- `vi.mock()` はファイルの先頭で宣言する
- テスト間でモックの状態が汚染されないよう `beforeEach` で `vi.clearAllMocks()` を呼ぶ

---

## テスト実行

- 単体テスト（watch モード）: `npm run test`
- CI 用（1回実行）: `npm run test:run`
- カバレッジ確認: `npm run test:coverage`

---

## テスト用 DB

- テストでは実 DB に接続しない
- DB アクセスは必ずモックする
- 環境変数は `vitest.config.ts` の `env` で上書きする

---

## API ルートテスト（src/tests/routes/）

API ルートのテストには追加のルールがある。詳細は `docs/rules/testing/api-unit-test-rules.md` を参照。

### テスト仕様書との対応

- テスト仕様書は `docs/tests/api/API-XXX-XX.md` で管理する
- TC 番号（001〜099: 認証 / 100〜199: クエリ / 200〜299: パラム / 300〜399: ボディ / 400〜499: 分岐 / 500〜599: エラー）
- 仕様書と実装のメッセージ・ステータス・TC 数は常に同期を保つ

### JWT トークン生成

- `sign` from `hono/jwt` を使う（`jsonwebtoken` は使わない）
- `vi.stubEnv("JWT_SECRET", ...)` で環境変数を注入する
- `beforeAll` で `validToken` と `expiredToken` を生成する

### モック・環境変数

- `beforeEach` でサービスのデフォルト戻り値を設定する
- TC-501: `new Error(...)` (plain Error) を使い、メッセージはアサートしない
- TC-502: `new AppError(...)` を使い、メッセージをアサートする
- TC-503: `vi.unstubAllEnvs()` 後に `vi.stubEnv("JWT_SECRET", JWT_SECRET)` で再設定する

### null / undefined 判定

任意フィールドは `|| null` を使い、空文字・undefined を NULL に変換する（`?? null` は使用禁止）。
