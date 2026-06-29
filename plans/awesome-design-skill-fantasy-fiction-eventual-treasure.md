# AI_GEEK UI 再設計 — フェーズ2 本実装（モックA「図書館メタファー」）

## Context

フェーズ1で3つの比較モックを作成し、ユーザーが**モックA（図書館メタファー / Mystic Codex）**を選択。フェーズ2では、この方向で `index.html` を全面再構築する。

モックA（`mocks/mock-library.html`）が設計のブループリット。今回はそれを**既存の制約（hashルーティング / i18n / marked.js / posts/index.js 不変 / cursor / reading-progress / reduced-motion）に統合**して本番化する。

**解決する課題**: 前回の色替えは構造不変だったため「何も変わっていない・ダサい」。今回は構造自体を「魔法の図書館」に変え、検索性（検索+シリーズ/月別フィルタ+ソート）・発見性（月別本棚・シリーズ導線・前後の巻）・毎日見たくなる仕掛け（本日の一品・司書の日誌タイムライン・統計）を盛り込む。

### データ実態（posts/index.js、不変）
- 69件。AI NEWS 65件 / For Beginner 4件。**シリーズ軸**（daily/beginner）で整理。
- サムネイル92%空 → タイポグラフィ主導カード。
- ほぼ毎日更新 → 日付軸・タイムラインが強み。slug=YYYY-MM-DD。

---

## 設計: モックAの構造を index.html へ統合

### A. CSS（`<style>` に追加、既存トークン・article-body・cursor/ember/progress/focus/reduced-motion は維持）
モックAの装飾クラスを移植: `parchment-tex`, `date-stamp`(+`.on-parchment`), `book-cover`(+`.corner.tl/tr/bl/br`), `wax-seal`, `timeline`(+`.tl-node`, `.tl-node.daily`), `shelf-tab`(+`.active`), `open-book`, `ribbon`, `ink-card`。これらは既存 `.brutalist-card` / `.article-body` と共存。

### B. HTML 再構築（行714-973 を差し替え）
- **header**: ロゴを `📖 MYSTIC CODEX`（星SVG + New Rocker + サブ「魔法の図書館·司書の記録」）に。nav は「司書の案内 / 書架 / 書斎」+「🔍 探す」ボタン（→showArchive）+ 既存 `lang-switcher` + モバイルメニューbtn。`mix-blend-difference` は維持。
- **view-list（HOME）**: 
  - 司書の案内ヒーロー（日付スタンプ + `司書の案内`h1 + 歓迎文 + 統計バッジ 69巻/75日/2シリーズ/5言語）
  - **本日の一品** `#todays-codex`（book-cover、JS描画・最新1件）
  - **司書の日誌** `#timeline-list`（タイムライン、JS描画・最新6件）
  - **書架を探す**（月別本棚タブ `#shelf-tabs` + シリーズカード2つ）。月タブクリック→`showArchive()`＋月フィルタ。既存 BROWSE ALL は「書架をすべて見る」に。
- **view-archive**: 書架の目次ヒーロー + 既存 `archive-search-input`（スタイル更新）+ **フィルタチップ**（全巻/AI NEWS/初心者 + 月別 + ソート新着/古い）+ 月別グループ `#archive-grid`（JS描画）+ 既存 `archive-no-results`。
- **view-detail**: `open-book`（parchment+太枠+`ribbon`しおり）に表紙ヘッダー（日付スタンプ+シリーズバッジ+巻数 `#detail-meta`）+ `#detail-title` + `#detail-content`（article-body維持）+ **前後の巻** `#detail-prev-next`（JS描画）。既存 END OF TRANSMISSION/CLOSE FILE は「巻の終わり/書架に戻る」風に。
- **view-about**: 既存（WHO AM I / AI_ERIKA / bio / skills / SNS）を図書館装飾で再スタイル（司書の書斎）。
- **footer**: 図書館風（MYSTIC CODEX + TOKYO JAPAN）。

### C. JS 拡張（行975-1543 を編集、既存 route/show*/marked/cursor/progress は維持）
**ヘルパー（新規）**:
- `seriesOf(post)` → `'daily'` or `'beginner'`（`category==='For Beginner'` で判定）
- `monthOf(post)` → `post.date.slice(0,7)`（'2026.05'）
- `monthLabel(ym, lang)` → '2026年5月' 等のi18n
- 事前計算: `init` で各 post に `_vol`（seriesごとの連番、最新が最大）・`_series` を付与
- `getStats()` → { total, streak（最新から遡る連続日数）, series:2, langs:5 }

**レンダリング（新規 + renderPosts更新）**:
- `renderTodaysCodex(lang)` → `#todays-codex` に最新1件の book-cover
- `renderTimeline(lang)` → `#timeline-list` に最新6件の縦タイムライン
- `renderShelves(lang)` → `#shelf-tabs` に月別タブ（件数付き）＋シリーズカード（件数）
- `renderArchiveGrouped(filtered, lang)` → `#archive-grid` を月別グループ（月見出し＋ink-cardグリッド）で描画。`renderPosts` の ARCHIVE 用テンプレートを ink-card 形式に更新して流用。
- `renderDetailPrevNext(post, lang)` → `#detail-prev-next` に前後の巻（同シリーズ優先、なければ隣接）

**showDetail 拡張**: 既存 title/category/date/fetch-markdown に加え、`#detail-meta`（シリーズバッジ＋巻数）と `renderDetailPrevNext` をセット。

**検索+フィルタ（拡張）**: 状態 `archiveFilter = {series:'all', month:'all', sort:'new'}` を導入。`archive-search-input` の input ハンドラ＋フィルタチップ click ハンドラで「検索語 AND series AND month」絞り込み→`renderArchiveGrouped`。ソート切替も。

**applyLanguage ラップ（拡張）**: 既存ラップ内で HOME（renderTodaysCodex/renderTimeline/renderShelves）・ARCHIVE（renderArchiveGrouped）・DETAIL（前後の巻）を再描画。

**init（拡張）**: ソート（既存）→ `_vol`/`_series` 付与 → renderTodaysCodex/renderTimeline/renderShelves → 検索/フィルタハンドラ → モバイルメニュー（既存）→ applyLanguage ラップ（拡張）→ hashchange+route（既存）。

### D. i18n 拡張（TRANSLATIONS に新キー + 5言語）
新キー: 司書の案内ヒーロー系（`codex-name`/`codex-sub`/`librarian-welcome`/`stat-*`）、本日の一品（`todays-pick`）、司書の日誌（`librarian-journal`）、書架（`find-shelves`/`monthly-shelf`/`series-daily-*`/`series-beginner-*`）、書架の目次（`archive-title`）、フィルタ（`filter-all/ai-news/beginner`/`sort-*`）、巻数（`vol-prefix/suffix`）、詳細（`prev-vol/next-vol/open-volume/back-to-stacks`）。固有名詞（MYSTIC CODEX/AI NEWS）は共通、月ラベルは関数生成。

---

## 実装ステップ（タスクリスト）

1. **CSS移植**: モックA装飾クラスを `<style>` に追加
2. **HTML再構築**: header / view-list / view-archive / view-detail / view-about / footer（行714-973）
3. **JS拡張**: ヘルパー + 新レンダリング5関数 + showDetail前後 + 検索フィルタ統合 + init/applyLanguage ラップ拡張
4. **i18n拡張**: TRANSLATIONS 新キー + 5言語訳
5. **検証**: ローカル(8000)で全ビュー・多言語・検索フィルタ・Markdown・reduced-motion・375px

## 維持する既存機能（壊さない）
hash ルーティング（`#/`,`#/archive`,`#/about`,`#/post/<slug>`）、`show*`/`goBack`/`route`、`marked.js` renderer（target=_blank, source-link, references-section）、`applyLanguage`/`data-i18n*`、cursor追従、reading-progress、`prefers-reduced-motion`、モバイルメニュー、`posts/index.js`（不変）。

## 検証
- ローカル `http://localhost:8000/`（サーバー稼働中）
- HOME: 本日の一品・タイムライン・書架が描画されるか、統計が正しいか
- ARCHIVE: 検索＋シリーズ/月別フィルタ＋ソートが連動するか、月別グループ表示
- DETAIL: 表紙ヘッダー・前後の巻・Markdown描画・言語切替で再描画
- 5言語切替で全テキスト切替、未訳slugはjaフォールバック
- reduced-motion でカーソル通常化・星屑停止、375px/768px/デスクトップ

## Critical Files
- `index.html`（全面再構築。HTML行714-973 / CSS `<style>` / JS行975-1543 / TRANSLATIONS）
- 参照: `mocks/mock-library.html`（設計ブループリント・装飾CSS・レイアウト構造を流用）、`posts/index.js`（実データ・不変）
- 既存JS（`route`/`show*`/`renderPosts`/`applyLanguage`/`marked.js` renderer）は拡張再利用
