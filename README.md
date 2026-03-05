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
2. Claude APIで日本語ブログ記事を生成
3. 各言語に翻訳（英語、中国語繁体/簡体、韓国語）
4. ファイル保存とGitHubへプッシュ

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
ANTHROPIC_API_KEY=your-api-key-here
```

`.env` ファイルは `.gitignore` に含まれているため、リポジトリにプッシュされません。

### GitHub Actions

GitHub Actionsで使用する環境変数はリポジトリの「Settings → Secrets and variables → Actions」で設定してください：

- `ANTHROPIC_API_KEY` - Anthropic APIキー

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
  "@anthropic-ai/sdk": "^0.61.0",
  "rss-parser": "^3.13.0",
  "dotenv": "^17.3.1"
}
```

インストール：
```bash
npm install
```

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
