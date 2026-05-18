# コミット

すべての変更を確認し、意味の単位でコミット計画を立ててからコミットする。

---

## 手順

### 1. 変更の全体確認

```bash
git status
git diff
```

ステージ済み・未ステージ両方の変更を把握する。

**未ステージの変更がある場合**、ユーザーに提示してコミットに含めるか確認する。含める場合は対象ファイルをステージしてから次に進む。

変更が何もなければユーザーに伝えて終了する。

---

### 2. コミット前チェック

変更されたファイルの範囲に応じて実行する。エラーがあれば修正してから再チェックすること。

#### frontend に変更がある場合

```bash
# TypeScript 型チェック
cd frontend && npx tsc --noEmit

# Lint（エラーは npm run format で自動修正を試みる）
cd frontend && npm run lint
```

#### backend に変更がある場合

```bash
# TypeScript 型チェック
cd backend && npx tsc --noEmit

# テスト
cd backend && npm run test:run
```

#### 共通

```bash
# スペルチェック（ルートで実行）
npm run spellcheck
```

未知の単語がある場合：
- 正しいスペルに修正する
- 技術用語・ライブラリ名 → `.cspell/cspell.json` の `words` に追加
- 個人名・データ起因の固有名詞 → `.cspell/words.txt` に追加

**デバッグコードの確認**（`git diff` の出力を目視確認）：
- `console.log` / `debugger` が残っていればユーザーに確認を取ること
- backend は `getAppLogger` でロギングすること

---

### 3. コミット計画の立案

すべての変更ファイルを分析し、意味の単位でグループ化する。

#### グループ化の基準

- **機能単位**: 同じ API・画面・ドメインに関する変更はまとめる
- **種別単位**: 実装 / テスト / ドキュメント / DB は別コミットにする
- **連動ルール**: DB スキーマ変更とマイグレーションファイルは必ず同一コミットにする

#### prefix 一覧

| prefix | 用途 |
|---|---|
| `feat` | 新機能の追加 |
| `fix` | バグ修正 |
| `docs` | ドキュメントのみの変更 |
| `style` | 動作に影響しない変更（フォーマット等） |
| `refactor` | バグ修正・機能追加を伴わないリファクタリング |
| `test` | テストの追加・修正 |
| `chore` | ビルド・設定ファイルの変更 |
| `db` | DB スキーマ変更・マイグレーション |

#### コミットメッセージのフォーマット

```
<prefix>: <変更内容の要約（日本語・1行）>
```

#### 計画の提示例

```
## コミット計画

コミット 1: feat: ユーザー作成ページを追加
  - frontend/src/pages/users/create/UserCreatePage.tsx
  - frontend/src/pages/users/create/useUserCreateForm.ts

コミット 2: test: ユーザー作成APIのユニットテストを追加
  - backend/src/tests/routes/API-USER-02.test.ts

コミット 3: docs: API仕様書・テスト仕様書を追加
  - docs/api/API-USER-02.md
  - docs/tests/api/API-USER-02.md
```

計画をユーザーに提示し、確認または修正を得てから次に進む。

---

### 4. コミット実行

計画に従って1コミットずつ順番に実行する。

```bash
# 対象ファイルだけをステージ
git add <ファイルパス>...

# コミット
git commit -m "<メッセージ>"
```

各コミット後に次のコミットへ進み、すべて完了したら終了する。
