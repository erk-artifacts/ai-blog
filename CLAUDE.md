# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# GenNews Post - AI ニュースブログ自動生成

AI関連ニュースを収集し、GitHub Pages ブログ (erk-artifacts/ai-blog) に日本語の記事を自動投稿するプロジェクト。

## プロジェクト構成
- `.claude/skills/generate-news-post/` - Claude Code手動実行用スキル
- `scripts/generate-post.mjs` - GitHub Actions自動実行用Node.jsスクリプト
- `scripts/translate-existing.mjs` - 既存記事の一括翻訳
- `scripts/translate-single.mjs` - 単一記事の翻訳
- `scripts/rss-feeds.json` - RSS フィードURL一覧

## コマンド

### ニュース記事の生成
```bash
npm run generate          # 完全な生成・翻訳・保存
npm run test:fetch       # RSSフィードの取得のみ
npm run test:dry         # ドライラン（ファイル変更なし）
```

### 記事の翻訳
```bash
npm run translate:existing     # すべての日本語記事を翻訳
npm run translate:single -- <slug>  # 特定の記事を翻訳
```

## アーキテクチャ

### データフロー
1. **RSSフィード取得**: `rss-feeds.json` で定義されたフィードから24〜48時間以内のニュースを取得
2. **記事生成**: Claude API (`claude-haiku-4-5-20251001` デフォルト) で日本語記事をJSON形式で生成
3. **翻訳**: 生成された記事を英語、中国語（繁体/簡体）、韓国語に並列翻訳
4. **保存**: 各言語の `posts/{lang}/{slug}.md` に本文保存、`posts/index.js` にメタデータ追加

### エラーハンドリングとリトライ戦略

**メイン生成 (`generate-post.mjs`)**:
- モデルフォールバック: 優先モデル → Haiku → Sonnet
- 各モデルで最大3回リトライ（指数バックオフ: 1秒 → 2秒 → 4秒、最大10秒）
- 529 (Overloaded)、408 (Timeout)、429 (Rate Limit) はリトライ
- 401/403 および "credit"/"balance" エラーは即時失敗（致命的エラー）
- 翻訳失敗時は日本語のみで継続

**翻訳関数**:
- 各言語で最大3回リトライ
- リトライ不要なエラーはスキップして次の言語へ

### 環境変数
- `ANTHROPIC_API_KEY` (必須): Anthropic APIキー
- `ANTHROPIC_MODEL` (任意): デフォルト `claude-haiku-4-5-20251001`
- `ANTHROPIC_BASE_URL` (任意): カスタムAPIエンドポイント
- `REPO_DIR` (GitHub Actionsで設定): リポジトリのルートパス

### 記事構造

**posts/index.js**:
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
  // ... 記事が続く（新しい順）
];
```

**posts/{lang}/{slug}.md**: Markdown形式の本文

### GitHub Actions
- 実行時間: 毎日 00:00 UTC (09:00 JST)
- タイムアウト: 20分
- `workflow_dispatch` で手動実行可能
- コミットメッセージ: `Add daily AI news post for YYYY.MM.DD`

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

## 規約
- ブログ記事は日本語で執筆する
- 初心者にもわかりやすい表現を使う
- `posts/index.js` の既存エントリは保持し、新規エントリを先頭に追加する
- 日付フォーマット: YYYY.MM.DD
- 本文はMarkdown形式: ## 見出し, **太字**, *斜体*, ---, > 引用, - リスト, [テキスト](URL)
- リンクは marked.js のカスタムrendererで自動的に target="_blank" rel="noopener noreferrer" を付与
