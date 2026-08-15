---
name: pastel-news
description: AI_GEEK ブログ (index.html / admin.html) の UI・デザインを作成・編集する際の**現行**デザインガイドライン。The Verge (2022+ Storystream) 由来のフィード型ニュース構造を、ネオンではなく目に優しいパステルで再構成した「やわらかいニュースマシン」。やわらかいチャコール #20202A × サクラ #F2C6D8 × ラベンダー #C8BEF2 × ミント #B5E8D2、Noto Sans JP 900/700/500 + IBM Plex Mono + Anton。影・グラデーション・ネオン・金/羊皮紙（旧テーマ）は使わない。
license: MIT
metadata:
  author: AI_GEEK blog design renewal (2026-08-15)
  inspiration: The Verge Storystream redesign (2022+)
  supersedes: [fantasy-fiction, neobrutalism]
  references: design-proposals/option-b-final.html, design-proposals/palette-board.html
---

# pastel-news Design System Skill — AI_GEEK ブログ版（やわらかいニュースマシン）

## Mission
あなたは AI_GEEK ブログのデザインガイドラインの専門家です。
実装可能で一貫したガイダンスを作成し、エンジニアがそのまま使える形で提供してください。

このスキルは **現行の唯一のアクティブなデザインガイドライン** です。
`.claude/skills/fantasy-fiction/`（魔法の図書館 / Mystic Codex）と
`.claude/skills/neobrutalism/`（acid green）は **履歴保持のアーカイブ** であり、
新規のデザイン作業で参照してはいけません。

## Concept
**「やわらかいニュースマシン」**

The Verge (2022+ Storystream) 由来の **フィード型ニュース構造**
— 巨大見出し・色面ブロッキング・タイムスタンプ付きストリーム —
を、ネオンの「安全塗装（safety paint）」ではなく **目に優しいパステル** で再構成する。

設計の芯は一つ。**装飾ではなく情報構造でリズムを作る。**

- リズムを作るのは「色面の大きさ」「文字サイズの落差」「ヘアラインの区切り」であって、
  枠線・影・グラデーション・アニメーションではない。
- 毎日1本・画像なしという本ブログの実態に、テキストファーストのニュース構造が合致する。
- ダーク地だが「黒」ではない。パステルだが「蛍光」ではない。どちらも目の負担を下げる方向に振る。

## Style Foundations
- **Visual style:** dark pastel news product（色面ブロッキング × ヘアライン × モノスペースのメタ情報）
- **Typography scale:** 10/11/12/15/16/18/34/40-64（＋ Anton の巨大数字 44/58/150）
- **Fonts:** jp/display = Noto Sans JP (900/700/500) / mono = IBM Plex Mono (400/500/600) / latin-display = Anton
- **Color palette:** bg 3段（#20202A / #2A2A35 / #33333F）+ text 3段（paper/muted/faint）+ pastel 3色（sakura/lavender/mint）
- **Spacing:** ガター 20px 基準（`--gap`）、セクション間 72px
- **Borders:** 1px ヘアライン（rgba white .10 / .18）のみ。太枠は使わない。
- **Radius:** 基本フラット（0-4px）。pill（999px）は「押せるもの」のみ。
- **Shadows:** **なし。** 奥行きは面の段階（bg → bg-2 → bg-3）と 1px ヘアラインで作る。

## Color Tokens

そのまま `:root` に貼れる正規トークン。**この名前を使うこと。**

```css
:root {
  /* ---- surfaces ---- */
  --bg:        #20202A;  /* ベース。やわらかいチャコール。純黒 #000 は使わない */
  --bg-2:      #2A2A35;  /* カード・タイル等、一段上の面 */
  --bg-3:      #33333F;  /* ホバー・チップ */

  /* ---- text ---- */
  --paper:     #ECEAF2;  /* 主要テキスト。純白 #fff は使わない */
  --muted:     #A8A6B5;  /* 副次テキスト（メタ情報・要約） */
  --faint:     #7C7A8A;  /* 三次テキスト。装飾的用途のみ */

  /* ---- pastel accents ---- */
  --sakura:    #F2C6D8;  /* 第一アクセント：ヒーロー色面、タイムスタンプ、見出しマーク */
  --lavender:  #C8BEF2;  /* 第二アクセント：特集タイル、ティッカー、リンク、クローム */
  --mint:      #B5E8D2;  /* 第三アクセント：タグ、補助的な強調 */

  /* ---- on-pastel ---- */
  --ink:       #20202A;  /* パステル色面の上に載せる文字色（= --bg と同値） */

  /* ---- hairlines ---- */
  --hair:      rgba(255,255,255,.10);  /* 1px ヘアライン */
  --hair-2:    rgba(255,255,255,.18);  /* 強調ヘアライン */

  /* ---- layout / type ---- */
  --gap:       20px;
  --mono:      'IBM Plex Mono', 'Noto Sans JP', monospace;
  --jp:        'Noto Sans JP', sans-serif;
  --display:   'Anton', sans-serif;
}
```

### Color Rules
- **影は使わない。** 奥行きは `--bg` → `--bg-2` → `--bg-3` の面の段階と 1px ヘアラインで作る。
- **グラデーション禁止。** 単色の面のみ。
- **パステルは「大きな面」で使う。** 細い縁取りやチマチマした装飾に散らさない。
  ヒーロー全幅、特集タイル1枚、ティッカー帯 — この規模で使ってこそ効く。
- **パステル色面の上のテキストは必ず `--ink`。** `--paper` や白を載せない（消える）。
- **アクセントは1画面につき主役1色。** サクラを主役にした画面でラベンダーを同格に使わない。
  従は「タグ1個」「線1本」程度に留める。
- `--faint` は装飾的テキスト専用（後述のコントラスト表を参照）。

## Typography

### 'Noto Sans JP' — 日本語すべて
| 用途 | weight | size | line-height | 備考 |
|---|---|---|---|---|
| ヒーロー見出し | **900** | 40-64px | 1.2 | letter-spacing 0 |
| セクション/特集見出し | **900** | 34px | 1.25 | |
| カード見出し | **700** | 16-18px | 1.5-1.55 | |
| 本文 | **500** | 16px | **1.9** | |

- 見出しには必ず `font-feature-settings: "palt";` と `word-break: auto-phrase;` を付ける。
- **本文は 500。** ダーク地の日本語で 300/400 は細すぎて可読性が落ちる。ここは譲らない。
- `letter-spacing` は日本語見出しでは 0（`palt` が詰めるので二重に詰めない）。

### 'IBM Plex Mono' — メタ情報すべて
日付・ラベル・カテゴリ・タイムスタンプ・インデックス番号・コピーライト。

```css
font-family: var(--mono);
font-size: 11px;          /* 10-12px の範囲 */
font-weight: 500;         /* 強調時 600 */
letter-spacing: .08em;
text-transform: uppercase; /* 英字の場合のみ */
color: var(--muted);       /* または var(--sakura) */
```

### 'Anton' — ラテン装飾
ワードマーク、セクションラベル（`STORYSTREAM` / `ARCHIVE`）、巨大な日付数字（`08.15`）。
**常に大文字。** 日本語には絶対に使わない（グリフが無い）。

### 絶対規則
- 純白テキスト `#fff` を使わない → `--paper`。
- 純黒背景 `#000` を使わない → `--bg`。

## Layout Patterns

### 1. ヒーロー（本日の記事）
全幅の **サクラ色面**。`background: var(--sakura); color: var(--ink);`
- mono の eyebrow：`TODAY` チップ（`--ink` 地 × `--lavender` 文字）＋ `2026.08.15 FRI — LATEST DIGEST`
- Noto Sans JP **900** の特大見出し（62px 前後、max-width 880px）
- 要約（16px / weight 500 / max-width 660px）
- `--ink` 地の pill ボタン（`読む ↗`、border-radius 999px）
- 右端に **Anton の巨大日付数字**（150px、`small` で曜日 44px）
- グリッド：`grid-template-columns: 1fr auto;`

### 2. 二段レーン
`grid-template-columns: 62fr 38fr; gap: var(--gap);`

**メイン 62%** — 特集タイル 2 枚を縦積み（`grid-template-rows: 1fr 1fr`）
- 1枚目：**ラベンダー色面**（`--lavender` 地 × `--ink` 文字）
- 2枚目：**暗タイル**（`--bg-2` 地 × `--paper` 見出し × `--muted` 本文、eyebrow は `--lavender`）
- 各タイルの下端に `margin-top: auto` の foot 行：`続きを読む ↗`（下線 2px）＋ `DIGEST NO.153`

**右レーン 38%** — `STORYSTREAM`
- Anton のラベル ＋ 直下に太めのアクセントバー（高さ 8px、`--lavender`）
- フィード項目：**サクラ色の mono タイムスタンプ**（`08.12 09:00`）＋ Noto Sans JP **700** のタイトル
- 項目間は `border-bottom: 1px solid var(--hair)` のみ。逆時系列。
- 末尾に `アーカイブへ →` の pill

### 3. ティッカー
ラベンダーの細い全幅帯。`background: var(--lavender);` に `--ink` 色の mono 大文字。
`overflow: hidden; white-space: nowrap;` で横流し。

### 4. アーカイブ
- `--bg-2` のコンパクトタイル（3カラムグリッド）
- または日付列で揃えた **ヘアライン区切りのリスト**（記事数が増えたらこちら）
- 見出しは Anton（`ARCHIVE`）＋ mono のカウント（`147 OLDER POSTS — 2025.09 → 2026.08`）

### 5. 寸法
- ガター **20px**（`--gap`）
- コンテナ最大幅 **1440px 前後**
- **記事本文の測度 680-760px**（これを超えると日本語は読みにくい）
- セクション間 72px

### 6. 角丸
- 基本 **フラット（0-4px）**
- **pill（999px）は「押せるもの」だけ** — ナビ、チップ、ボタン、タグ。
  情報を表示するだけのカード・タイル・色面には使わない。

## Interaction / Accessibility

- **フォーカスリング：** `outline: 2px solid var(--lavender); outline-offset: 2px;`
  全てのインタラクティブ要素に `:focus-visible` で必ず適用。
- **`prefers-reduced-motion: reduce` でアニメーションを抑制**（ティッカーの横流しを含む）。
- **カスタムカーソル（`cursor: none`）は使わない。** 旧テーマの負債として廃止。
  `.cursor-dot` / `.cursor-outline` / `.clickable` の仕組みごと削除する。
- **ホバーは色の変化 ＋ わずかな面の明度変化**（`--bg-2` → `--bg-3`）で表現。
  大きな移動（`translate`）やスケールはしない。
- タッチターゲットは 44px 以上。

### コントラスト実測値（`--bg` #20202A 上）
| 前景 | 比率 | 判定 |
|---|---|---|
| `--paper` #ECEAF2 | 13.5:1 | AAA |
| `--muted` #A8A6B5 | 6.7:1 | AA（本文可） |
| `--faint` #7C7A8A | 3.8:1 | **大きな文字/装飾のみ** |

### コントラスト実測値（パステル色面上の `--ink` #20202A）
| 背景 | 比率 | 判定 |
|---|---|---|
| `--sakura` #F2C6D8 | 10.5:1 | AAA |
| `--lavender` #C8BEF2 | 9.3:1 | AAA |
| `--mint` #B5E8D2 | 11.8:1 | AAA |

`--bg-2` #2A2A35 上では `--paper` 11.5:1 / `--muted` 5.8:1 / `--faint` 3.3:1（装飾のみ）。

## やってはいけないこと

1. **純黒 `#000` の背景 / 純白 `#fff` のテキスト** — `--bg` と `--paper` を使う。
2. **影（box-shadow / text-shadow）** — 面の段階とヘアラインで奥行きを作る。
3. **グラデーション** — 単色の面のみ。
4. **ネオン・蛍光色**（acid green #CCFF00、電光ミント/バイオレット等） — パステルの意味が消える。
5. **細字の日本語**（weight 300/400 の本文） — ダーク地では 500 以上。
6. **旧テーマの残骸** — 金 #FDC800、羊皮紙 #FFE9CE、夜空 #0B1437、New Rocker、Cossette Texte、
   星屑 `.ember`、ノイズ `.noise-overlay`、金グロー、「魔法の図書館 / 司書 / 書架 / 巻」の語彙。
7. **装飾的な枠線の多用** — 3px 太枠は neobrutalism / fantasy-fiction の遺物。1px ヘアラインのみ。
8. **カスタムカーソル** — 廃止済み。
9. **パステルを細い線や小さな点に散らす** — 大きな面で使う。
10. **1画面に3色のパステルを同格で並べる** — 主役1色。

## Component Rule Expectations

| コンポーネント | 仕様 |
|---|---|
| トップバー | `position: sticky; top: 0;` `--bg` 地 ＋ `border-bottom: 1px solid var(--hair)`、高さ 60px。ワードマークは Anton ＋ ラベンダーのスラッシュ（`skewX(-18deg)` の矩形）。 |
| pill（ナビ/ボタン） | `border-radius: 999px;` mono 12px/600、`border: 1px solid rgba(255,255,255,.28)`。hover でボーダーと文字が `--lavender`。塗り版は `--lavender` 地 × `--ink` 文字。 |
| 言語スイッチ | mono 10px の小 pill。選択中は `--bg-2` 地 × `--lavender` 文字 ＋ ラベンダー半透明ボーダー。 |
| 色面タイル | `--sakura` / `--lavender` 地、文字は全て `--ink`。padding 48px 前後。角丸なし。 |
| 暗タイル | `--bg-2` 地、見出し `--paper`、本文 `--muted`、eyebrow `--lavender`。hover で見出しが `--sakura`。 |
| ストリーム項目 | mono タイムスタンプ（`--sakura`）＋ 700 タイトル（`--paper`）、`border-bottom: 1px solid var(--hair)`。hover で `--lavender`。 |
| タグ | `--mint` 地 × `--ink` 文字、mono 10px、pill。 |
| 記事本文 | `--bg` 地に `--paper` 本文（16px / 500 / line-height 1.9）、測度 680-760px。見出しは 900。引用・コードは `--bg-2` 面 ＋ 左に `--sakura` の 2-3px ライン。リンクは `--lavender` ＋ 下線。 |
| フッター | `border-top: 2px solid var(--lavender)`。Anton のワードマーク、mono のリンク列。 |
| 状態 | default / hover / focus-visible / active / disabled / loading / error を必ず定義。空状態・検索0件も。 |

## リファレンスモックアップ

`design-proposals/` に自己完結の静的モックがある（各 `.html` はブラウザで直接開ける。`.png` は 1440px 幅 2x のフルページ）。

- **`design-proposals/option-b-final.html` — 承認済みの方向性。実装時の第一参照。**
- `design-proposals/palette-board.html` — 配色候補6案の比較ボード（採用は「03 サクラ×ラベンダー」）。
- `design-proposals/README.md` — 調査の要点と決定の経緯。
- `option-a` (文芸誌 / ライト)、`option-c` (AIプロダクト / 静謐) は不採用。`option-b` / `b2` / `b3` は中間案。

### ⚠️ モックアップの変数名は正規名と一致しない
`option-b-final.html` は探索中のファイルなので、CSS 変数名が実際の色と食い違っている。
**実装時は上記の正規トークン名に読み替えること。**

| モックの変数 | 実際の色 | 正規トークン |
|---|---|---|
| `--ink` | #20202A | `--bg`（および `--ink`。同値だが役割が別） |
| `--mint` | #C8BEF2 | **`--lavender`** |
| `--violet` | #F2C6D8 | **`--sakura`** |
| `--pink` | #B5E8D2 | **`--mint`** |
| `--tile` | #2A2A35 | `--bg-2` |

`--bg-3` #33333F / `--faint` #7C7A8A / `--hair-2` はモックには存在しない（本スキルで新規定義）。

## AI_GEEK 実装メモ（index.html / admin.html との整合）

### 現状（旧テーマ）からの移行で触るもの
- `index.html` は Tailwind CDN ＋ `tailwind.config.theme.extend` で旧トークン
  (`night` / `gold` / `parchment` / `ink` / `cream` / `azure`) を定義している。
  → `bg` / `bg-2` / `bg-3` / `paper` / `muted` / `faint` / `sakura` / `lavender` / `mint` / `hair` に置換。
- Google Fonts の読み込みを差し替える。現状は New Rocker + Cossette Texte + IBM Plex Mono +
  Noto Sans JP(400,500,700)。**Noto Sans JP に 900 が無く、Anton も未読込なので必ず追加すること。**
  ```
  https://fonts.googleapis.com/css2?family=Anton&family=IBM+Plex+Mono:wght@400;500;600&family=Noto+Sans+JP:wght@500;700;900&display=swap
  ```
- 削除する旧演出：`.noise-overlay`、`.digital-embers` / `.ember`、`.cursor-dot` / `.cursor-outline`
  ＋ `cursor: none`、`.clickable`、金グロー `shadow-gold-glow`、`.text-outline`。
- `shadow-card` 等の影ユーティリティは全廃。

### 触ってはいけないもの（JS の契約）
デザイン変更でクラス名・ID を変えると JS が壊れる。以下は**構造契約**として維持する。

- **ビュー ID：** `view-list` / `view-archive` / `view-detail` / `view-about`、`.hidden-view`
- **描画ターゲット ID：** `todays-codex` / `timeline-list` / `shelf-tabs` / `series-cards` /
  `archive-grid` / `archive-search-input` / `archive-no-results` / `archive-count` / `filter-chips` /
  `detail-title` / `detail-meta` / `detail-content` / `detail-prev-next` /
  `hero-date` / `stat-volumes` / `stat-streak` / `stat-series` / `stat-langs` / `lang-switcher`
- **多言語：** `data-i18n` 属性と `TRANSLATIONS` 辞書、`applyLanguage()`、`langTitle()` / `langSummary()`。
  ラベル文言を旧テーマ語彙（司書 / 書架 / 巻 / 魔法の図書館）からニュース語彙
  （ホーム / アーカイブ / ABOUT / 記事）へ変える場合は **5言語すべて** を更新する。
- **ルーティング：** hash ルーティング（`#/`、`#/archive`、`#/about`、`#/post/${slug}`）。
- **Markdown：** marked.js のカスタム renderer（リンクに `target="_blank" rel="noopener noreferrer"` を付与）。
- `renderPosts` 系関数はテンプレート文字列で HTML を生成するため、
  新クラス名を使う場合は **JS 側の文字列も同時に更新**する。

### 記事詳細のスタイル対象
marked.js が生成する `#detail-content` 配下の `h2 / h3 / p / ul / ol / blockquote / code / pre / a / hr / strong / em`
に対して、上記 Typography / Component ルールでスタイルを当てる。

## Writing Tone
concise, confident, helpful。記事本文は初心者にもわかりやすい表現（CLAUDE.md 規約）。
UI ラベルは**ニュースプロダクトの語彙**（ホーム / アーカイブ / 記事 / 更新）。
旧テーマのロールプレイ語彙（司書・書架・巻・魔法）は使わない。

## Quality Gates
- ルールをトークン・閾値・例に紐付ける（曖昧な形容詞のみに依存しない）。
- コントラストは実装で検証可能であること（上記の実測表を基準にする）。
- 影・グラデーション・ネオン・純黒/純白が 1 箇所も無いことを確認する。
- 日本語本文の weight が 500 以上であることを確認する。
- システム一貫性を局所最適化より優先。
- 美観とアクセシビリティの衝突時はアクセシビリティ優先。
