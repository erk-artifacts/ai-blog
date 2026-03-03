---
name: generate-news-post
description: AI関連の最新ニュースを収集し、ai-blogのposts.js形式のブログ記事エントリを生成する。ニュース収集やブログ記事生成を頼まれたときに使用する。
argument-hint: "[トピック] 例: AI最新ニュース, LLM, 生成AI"
disable-model-invocation: true
allowed-tools: WebSearch, WebFetch, Read, Write, Bash(date:*), Bash(node:*)
---

# AI ニュースブログ記事生成

AI関連の最新ニュースを収集し、GitHub Pages ブログ (erk-artifacts/ai-blog) の posts.js に追加できる形式でブログ記事エントリを生成します。

## 手順

### Step 1: ニュース収集

以下の3つの検索クエリを **並列** で実行して、AI関連ニュースを収集してください:

1. `"$ARGUMENTS AI ニュース 2026"` (日本語ソース)
2. `"$ARGUMENTS AI news 2026"` (英語ソース)
3. `"$ARGUMENTS 人工知能 最新"` (追加日本語ソース)

トピックが指定されていない場合は `$ARGUMENTS` を「AI」として検索してください。

### Step 2: ニュース選定

検索結果から **5-8件** を以下の基準で選定:
- 信頼性の高いソース（TechCrunch, The Verge, Reuters, NHK 等）
- 直近24-48時間以内の記事を優先
- カテゴリの多様性（モデルリリース、製品、規制、研究など）
- 初心者にも興味深い内容

### Step 3: ブログ記事生成

選定したニュースから以下の形式でブログ記事エントリを生成してください:

```javascript
{
    title: "今日のAI最前線：○○が話題に",
    category: "AI NEWS",
    date: "YYYY.MM.DD",
    thumbnail: "",
    summary: "100文字以内の日本語サマリー",
    body: `<h2>注目ニュース1のタイトル</h2>
<p>ニュースの解説。<strong>重要なポイント</strong>を強調。専門用語にはLLM（大規模言語モデル）のように括弧で説明を添える。</p>
<p><em>私たちの生活への影響：一文で影響を説明</em></p>
<hr>
<h2>注目ニュース2のタイトル</h2>
<p>...</p>
<hr>
<h2>まとめ</h2>
<p>今日のニュースの総括...</p>`
}
```

#### body の HTML ルール:
- 使用可能タグ: `<h2>`, `<p>`, `<strong>`, `<ul>`, `<li>`, `<blockquote>`, `<hr>`, `<em>`, `<a>`
- 各ニュースは `<h2>` で区切り、間に `<hr>` を入れる
- 専門用語には括弧で簡単な説明を添える
- 各ニュース解説の末尾に元記事リンクを追加: `<p class="source-link"><a href="URL" target="_blank" rel="noopener noreferrer">→ 元記事を読む（ソース名）</a></p>`
- 各ニュースの最後に `<em>` で「私たちの生活への影響」を添える
- 最後に「まとめ」セクションを入れる
- 記事末尾に参考リンクセクションを追加: `<div class="references-section"><h2>参考リンク</h2><ol><li><a href="URL" target="_blank" rel="noopener noreferrer">ソース名: 記事タイトル</a></li></ol></div>`

### Step 4: 出力

生成したエントリを `output/posts-entry.js` に保存してください。
ユーザーにエントリの内容を表示し、ai-blog の posts.js に追加する手順を案内してください。
