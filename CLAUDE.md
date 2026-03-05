# GenNews Post - AI ニュースブログ自動生成

AI関連ニュースを収集し、GitHub Pages ブログ (erk-artifacts/ai-blog) に日本語の記事を自動投稿するプロジェクト。

## プロジェクト構成
- `.claude/skills/generate-news-post/` - Claude Code手動実行用スキル
- `scripts/generate-post.mjs` - GitHub Actions自動実行用Node.jsスクリプト
- `scripts/rss-feeds.json` - RSS フィードURL一覧

## ワークフロー
1. RSSフィードからAI関連ニュースを取得
2. Claude API (Haiku 4.5) で日本語ブログ記事を生成
3. ai-blogリポジトリの `posts/index.js` にメタデータを追加、`posts/{lang}/{slug}.md` に本文を保存
4. GitHub Pagesに自動デプロイ（毎朝9時JST）

## 既存記事の翻訳
### すべての記事を翻訳する場合：
```bash
npm run translate:existing
```

### 単一のファイルを翻訳する場合：
```bash
npm run translate:single -- <slug>
```

例:
```bash
npm run translate:single -- 2026-03-04-2
```

- `posts/ja/${slug}.md` から記事を読み込み
- 英語、中国語（繁体/簡体）、韓国語に並列翻訳
- 各言語のファイルを `posts/${lang}/${slug}.md` に保存
- `posts/index.js` の各エントリに `title_*`、`summary_*` フィールドを追加

## 記事の構成
- `posts/index.js` - 全記事のメタデータ（title, category, date, thumbnail, summary, slug）
- `posts/{slug}.md` - 各記事の本文（Markdown形式）
- ブラウザ側で `marked.js` を使い Markdown→HTML 変換して表示

## 規約
- ブログ記事は日本語で執筆する
- 初心者にもわかりやすい表現を使う
- `posts/index.js` の既存エントリは保持し、新規エントリを先頭に追加する
- 日付フォーマット: YYYY.MM.DD
- 本文はMarkdown形式: ## 見出し, **太字**, *斜体*, ---, > 引用, - リスト, [テキスト](URL)
- リンクは marked.js のカスタムrendererで自動的に target="_blank" rel="noopener noreferrer" を付与
