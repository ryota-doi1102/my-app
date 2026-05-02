# .claude/

Claude Code の設定・規約ファイルを管理するフォルダ。

## フォルダ構成

```
.claude/
├── CLAUDE.md                              # プロジェクト全体のガイドライン（Claude が自動参照）
├── README.md                              # このファイル
└── commands/                              # 規約・手順ドキュメント
    ├── frontend-commit.md                 # /frontend-commit
    ├── frontend-coding-rules.md           # /frontend-coding-rules
    ├── backend-commit.md                  # /backend-commit
    ├── backend-coding-rules-api.md        # /backend-coding-rules-api
    ├── backend-coding-rules-db.md         # /backend-coding-rules-db
    ├── backend-coding-rules-unit-test.md  # /backend-coding-rules-unit-test
    └── e2e-test.md                        # /e2e-test
```

## コマンド一覧

### CLI での使い方

```bash
# プロジェクトルートで Claude Code CLI を起動
claude
```

起動後、以下のコマンドが使えます。

### コミット規約

| コマンド | 説明 |
|---|---|
| `/frontend-commit` | frontend の変更をコミット規約に従ってコミットする |
| `/backend-commit` | backend の変更をコミット規約に従ってコミットする |

### コーディング規約

| コマンド | 説明 |
|---|---|
| `/frontend-coding-rules` | frontend コーディング規約を参照する |
| `/backend-coding-rules-api` | backend API 実装規約を参照する |
| `/backend-coding-rules-db` | backend DB 実装規約を参照する |
| `/backend-coding-rules-unit-test` | backend Unit テスト規約を参照する |

### テスト

| コマンド | 説明 |
|---|---|
| `/e2e-test` | E2E テスト規約を参照する |

## VSCode 拡張機能での使い方

VSCode 拡張機能では `/` コマンドは使えません。チャットで直接依頼すると、Claude が該当するドキュメントを参照して実行します。

```
frontend の変更をコミットしてください
backend の API 実装規約を確認してください
```

## ファイルの追加方法

`commands/` 直下に Markdown ファイルを置くと、CLI で `/ファイル名` として使えます。

```
commands/<name>.md          →  /<name>
commands/<subdir>/<name>.md →  /<subdir>:<name>  （CLI のみ）
```

### サブディレクトリの対応状況

| 環境 | サポート |
|---|---|
| CLI | ✅ `/<subdir>:<name>` で実行可能 |
| VSCode 拡張機能 | ❌ サブディレクトリのコマンドは実行不可 |

VSCode 拡張機能でも使いたいコマンドは `commands/` 直下に配置すること。
