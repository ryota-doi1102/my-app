# React Toy Box

React フロントエンド開発の備忘録プロジェクトです。

よく使うコンポーネントや実装パターンをここにまとめておき、開発時に参照することで実装効率の向上を目的としています。

## スタック

- **React 19** + **TypeScript**
- **Vite** — ビルド・開発サーバー
- **Biome** — Lint / フォーマット

## セットアップ

```bash
npm install
cp .env.example .env
```

`.env` に Anthropic の API キーを設定します。

```dotenv
ANTHROPIC_API_KEY=your_anthropic_api_key
```

## 開発コマンド

```bash
npm run dev        # 開発サーバー起動
npm run build      # プロダクションビルド
npm run lint       # Lint + フォーマットチェック
npm run format     # 自動フォーマット
npm run preview    # ビルド成果物のプレビュー
```

## Claude Code の使い方

`.env` の `ANTHROPIC_API_KEY` を読み込んで Claude Code を起動できます。

```bash
npm run claude
npm run claude -- --help
```

## 注意点

- `.env` は git 管理対象外です。
- `ANTHROPIC_API_KEY` をブラウザ側に露出しないでください。Vite でブラウザに公開される環境変数は `VITE_` プレフィックスが付いたものだけです。
