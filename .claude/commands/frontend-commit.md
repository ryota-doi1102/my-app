# コミット

ステージされた変更をコミット規約に従ってコミットする。

## 技術スタック

- Vite + React 19 + TypeScript（strict モード）
- Tailwind CSS
- フォーム: React Hook Form + zod
- Linter: Biome

## 手順

以下の順番で実行すること。

### 1. ステージ状態の確認

```bash
git status
git diff --staged
```

ステージされた変更がなければ、ユーザーに伝えて終了する。

### 2. コミット前チェック

`frontend/` ディレクトリで以下を順番に実行し、すべてパスすることを確認する。

#### TypeScript 型チェック

```bash
cd frontend && npx tsc --noEmit
```

エラーがあれば修正してから再チェックすること。

#### Lint チェック

```bash
cd frontend && npm run lint
```

エラーがあれば `npm run format` で自動修正を試み、残ったエラーは手動で修正すること。

#### スペルチェック

```bash
cd frontend && npm run spellcheck
```

未知の単語がある場合は以下のいずれかで対処すること。

- 正しいスペルに修正する
- 技術用語・ライブラリ名であれば `.cspell/cspell.json` の `words` に追加する
- 個人名・データ起因の固有名詞であれば `.cspell/words.txt` に追加する

#### README.md の更新確認

変更したファイルに `README.md` が付属している場合、内容が更新されているか確認すること。

#### デバッグコードの確認

`git diff --staged` の出力に以下が含まれていないか確認する。

- `console.log`
- `console.error`（意図的なエラーハンドリングは除く）
- `debugger`

残っている場合はユーザーに確認を取ること。

### 3. コミットメッセージの生成

`git diff --staged` の内容をもとに、以下のフォーマットでコミットメッセージを生成する。

#### フォーマット

```
<prefix>: <変更内容の要約>
```

- メッセージは **日本語** で記述する
- 要約は簡潔に1行で収める

#### prefix 一覧

| prefix | 用途 |
|---|---|
| `feat` | 新機能の追加 |
| `fix` | バグ修正 |
| `docs` | ドキュメントのみの変更 |
| `style` | 動作に影響しない変更（フォーマット等） |
| `refactor` | バグ修正・機能追加を伴わないリファクタリング |
| `test` | テストの追加・修正 |
| `chore` | ビルドプロセスや補助ツールの変更 |

#### 例

```
feat: ユーザー登録フォームにバリデーションを追加
fix: パスワードリセット時のリダイレクト先を修正
refactor: EmailInput を react-hook-form の Controller でラップ
chore: shadcn UI コンポーネントを一括インストール
```

#### コミットの粒度

- 関心事は1つに絞ること
- 複数ファイルにまたがってよいが、目的が1つであること
- WIP（作業途中）の状態でコミットしないこと

### 4. コミット実行

生成したメッセージをユーザーに提示し、確認を得てからコミットする。

```bash
git commit -m "<生成したメッセージ>"
```
