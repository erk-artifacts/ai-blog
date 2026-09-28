# AI News Blog

AI関連ニュースを自動収集し、日本語でブログ記事を生成するプロジェクトです。多言語対応（英語、中国語、韓国語）済み。

## プロジェクト構成

```
ai-blog/
├── posts/              # 記事データと翻訳ファイル
│   ├── index.js       # 記事メタデータ
│   ├── ja/            # 日本語記事
│   ├── en/            # 英語翻訳
│   ├── zh-tw/         # 中国語（繁体）翻訳
│   ├── zh-cn/         # 中国語（簡体）翻訳
│   └── ko/            # 韓国語翻訳
├── scripts/          # 自動生成スクリプト
├── .github/workflows/ # GitHub Actions設定
├── index.html         # フロントエンド（GitHub Pagesで表示）
└── README.md          # このファイル
```

## 機能

### 自動生成（GitHub Actions）
毎日朝9時JST（00:00 UTC）に実行され、以下を行います：
1. RSSフィードからAI関連ニュースを収集
2. OpenAI APIで根拠付きのニュース選定を行い、別の呼び出しで執筆。固定のMarkdown構成に整形
3. OpenAI APIで各言語に翻訳（英語、中国語繁体/簡体、韓国語）
4. ファイル保存とGitHubへプッシュ

生成結果はJSON Schemaと保存前検証で確認し、未完了の応答は再試行します。記事は「今日の要点 → 主要ニュースの事実・重要性・影響・未確定事項 → 今日の見取り図 → 出典と時点」の順に整形します。ニュースが少ない日は1件から掲載し、AIニュースが0件なら公開を省略します。

日本語の記事と根拠、成功した翻訳は`output/generation/`に保存します。翻訳失敗時は`npm run generate -- --resume "保存先.json"`で不足する言語から再開できます。通常は選定1回・執筆1回・翻訳4回の計6回のAPI呼び出しです。[記事構成と再開手順](docs/editorial-pipeline.md)を参照してください。

### 手動実行

#### ニュース記事の生成
```bash
npm run generate
```

#### 既存記事の翻訳（すべて）
```bash
npm run translate:existing
```

#### 単一記事の翻訳
```bash
npm run translate:single -- <slug>
```

例：
```bash
npm run translate:single -- 2026-03-04-2
```

## 環境設定

### 環境変数

`.env` ファイルを作成してAPIキーを設定：

```env
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=gpt-6-luna
```

`.env` ファイルは `.gitignore` に含まれているため、リポジトリにプッシュされません。

### GitHub Actions

GitHub Actionsで使用する環境変数はリポジトリの「Settings → Secrets and variables → Actions」で設定してください：

- `OPENAI_API_KEY` - OpenAI APIキー（記事生成用）
- `OPENAI_MODEL` - 記事生成・翻訳モデル（任意、デフォルト `gpt-6-luna`）

`OPENAI_API_KEY`はSecretsに、`OPENAI_MODEL`はVariablesに設定します。キーが未設定、またはAPIのクレジット残高不足の場合は原因を表示して終了します。`credit_balance_exhausted` / `insufficient_quota`は請求・残高の確認が必要で、再試行では解消しません。

## ファイル構造

### 記事ファイル構造

```
posts/
├── index.js               # 記事メタデータ
├── ja/{slug}.md         # 日本語記事
├── en/{slug}.md         # 英語翻訳
├── zh-tw/{slug}.md      # 中国語（繁体）翻訳
├── zh-cn/{slug}.md      # 中国語（簡体）翻訳
└── ko/{slug}.md         # 韓国語翻訳
```

### posts/index.js の構造

```javascript
const posts = [
  {
    "title": "日本語タイトル",
    "title_en": "English Title",
    "title_zh-tw": "繁體中文標題",
    "title_zh-cn": "简体中文标题",
    "title_ko": "한국어 제목",
    "category": "AI NEWS",
    "date": "2026.03.04",
    "thumbnail": "",
    "summary": "日本語サマリー",
    "summary_en": "English summary",
    "summary_zh-tw": "繁體中文摘要",
    "summary_zh-cn": "简体中文摘要",
    "summary_ko": "한국어 요약",
    "slug": "2026-03-04-2"
  },
  // ... 記事が続く
];
```

## 依存パッケージ

```json
{
  "rss-parser": "^3.13.0",
  "dotenv": "^17.3.1",
  "marked": "18.0.14",
  "dompurify": "3.4.16"
}
```

インストール：
```bash
npm install
```

CIと再現性のあるインストールでは`npm ci --ignore-scripts`を使用します。

## 検証・セキュリティ

```bash
npm test                 # APIを呼ばない回帰テスト
npm run validate:all     # 全記事メタデータの検証
npm audit                # 依存パッケージの既知の脆弱性
npm run test:fetch       # RSS取得のみ
npm run test:dry         # 実APIで生成・翻訳を確認（API利用あり、記事保存なし）
```

記事のHTMLはDOMPurifyで無害化してから表示します。MarkedとDOMPurifyは`vendor/`へ同梱しているため、更新時は`npm run vendor:sync`を実行し、lockfileと同梱ファイルを一緒に更新してください。メタデータはJSON形式の配列として扱い、`posts/index.js`へ任意のJavaScriptを追加しないでください。

[2026-09-28の監査結果と記事構成の改善案](docs/security-and-generation-review-2026-09-28.md)

## RSSフィード

以下のフィードからニュースを収集しています：

- TechCrunch AI
- The Verge AI
- Ars Technica AI
- MIT Technology Review
- VentureBeat AI
- ITmedia AI+
- ASCII.jp テクノロジー
- 日経 xTECH

## デプロイ

GitHub Pagesを通じて自動デプロイされます：
- URL: `https://erk-artifacts.github.io/ai-blog/`
- スケジュール：毎日9時JST（00:00 UTC）

## 開発

プロジェクトはMITライセンスの下で公開されています。

## スクリプト

- `scripts/generate-post.mjs` - 自動生成メインスクリプト
- `scripts/translate-existing.mjs` - 既存記事の一括翻訳
- `scripts/translate-single.mjs` - 単一記事の翻訳

## 多言語対応

ブログは以下の5言語に対応しています：

| 言語 | コード | ディレクトリ |
|------|--------|----------|
| 日本語 | `ja` | `posts/ja/` |
| 英語 | `en` | `posts/en/` |
| 中国語（繁体）| `zh-tw` | `posts/zh-tw/` |
| 中国語（簡体）| `zh-cn` | `posts/zh-cn/` |
| 韓国語 | `ko` | `posts/ko/` |
