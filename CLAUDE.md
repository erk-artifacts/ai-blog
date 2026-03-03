# GenNews Post - AI ニュースブログ自動生成

AI関連ニュースを収集し、GitHub Pages ブログ (erk-artifacts/ai-blog) に日本語の記事を自動投稿するプロジェクト。

## プロジェクト構成
- `.claude/skills/generate-news-post/` - Claude Code手動実行用スキル
- `scripts/generate-post.mjs` - GitHub Actions自動実行用Node.jsスクリプト
- `scripts/rss-feeds.json` - RSS フィードURL一覧

## ワークフロー
1. RSSフィードからAI関連ニュースを取得
2. Claude API (Haiku 4.5) で日本語ブログ記事を生成
3. ai-blogリポジトリの `posts/index.js` にメタデータを追加、`posts/{slug}.md` に本文を保存
4. GitHub Pagesに自動デプロイ（毎朝9時JST）

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
