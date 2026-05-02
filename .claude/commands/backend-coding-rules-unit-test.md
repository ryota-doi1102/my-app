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
