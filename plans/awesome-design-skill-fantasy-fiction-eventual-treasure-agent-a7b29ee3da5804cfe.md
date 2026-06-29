# AI_GEEK リデザイン: Fantasy × Fiction ハイブリッド

## Context

AI ニュースブログ AI_GEEK（GitHub Pages: erk-artifacts/ai-blog）の現在のデザインは
ネオブータリズム × ダークネオン（acid green #CCFF00 × deep-black #050505 × Syne/JetBrains Mono）。
これを、bergside/awesome-design-skills の **Fantasy**（ゲーム的・青×金・New Rocker・イマーシブ）と
**Fiction**（絵本・黒×クリーム・Cossette Texte・太枠丸み・フラット）を「かけ合わせた」オリジナル
ハイブリッドへ大胆にリデザインする。ホスティングは Tailwind CDN + インライン CSS 構成を維持
（ビルド不要）。記事データ構造（posts/index.js, posts/*/*.md）と JS ロジック
（hash ルーティング、多言語切替、marked.js レンダラ、カーソル追従、読書プログレスバー）は**変更しない**。
data-i18n 属性と全 UI 文字列の翻訳キーも維持。

### 技術的前提（読み取り専用検証で確認済み）
- **index.html**（1480 行）: Tailwind CDN + `<style>` 行57-628 + SPA。`tailwind.config.theme.extend`
  に acid-green/deep-black/off-white、fontFamily.display=Syne/mono=JetBrains Mono、
  boxShadow.brutal*、animation.marquee を定義。`<body class="font-display">`。
- 主要セクション: ヘッダー固定ナビ(654-684) + モバイルメニュー(686-728)、ヒーロー(730-737)、
  LATEST ARTICLES グリッド(739-757)、アーカイブ(760-807)、記事詳細(809-848)、
  アバウト(850-896)、フッター(898-907)。
- 装飾: `.noise-overlay`(66-76)、カスタムカーソル(78-116, 650-651)、`.digital-embers` 浮遊粒子
  (119-266, 633-649)、読書プログレスバー(576-585, 652)。
- カード `.brutalist-card`(287-345): border 3px, radius 8px, shadow 6px 6px 0 0 #1a1a1a,
  hover で acid-green 縁取り + translate(-3px,-3px) + 影 9px。
- 記事本文 `.article-body`(346-570): Markdown スタイル（h1-h4 が acid green、pre は暗緑背景）。
- **admin.html**（136 行）: 同じトークン + Syne/JetBrains Mono。ノイズ/カーソル/embers なし。
- **posts/index.js**: 記事配列（title, title_*, category, date, thumbnail, summary*, slug）。
  本文は posts/{lang}/{slug}.md を fetch。レイアウトタイプ type は big/tall/normal を
  renderPosts()(1093) で自動割当。
- 画像アセット images/: 8 枚（article01.jpg, hallucination.png 等）。fonts/, assets/ なし。
- **フォント可用性（検証済み）**: New Rocker（Google Fonts, 単一 weight Regular, Latin）、
  Cossette Texte（Google Fonts, 2 weights）、Cossette Titre（display 版, Google Fonts）、
  IBM Plex Mono（Google Fonts, 複数 weight）、JetBrains Mono（既存読込済み）。すべて利用可能。

---

## 1. デザインコンセプト

### 推奨ビジョン: 魔法の図書館 / Mystic Codex

**Fantasy の「重厚・神秘的・イマーシブ」と Fiction の「温かい・絵本・フラット・太枠」を、
「星空の下で開く古びた魔法の絵本」という一つの世界観に統合する。**

- **質感の統合ルール**: Fantasy のリッチな「夜空・深い青・金の光」を**ベースレイヤ（背景・
  雰囲気・ロゴ）**に使い、Fiction の「羊皮紙クリーム・太い黒枠・丸み・フラット」を
  **コンテンツレイヤ（カード・記事・UI）**に使う。つまり**「夜空（Fantasy）の中に、
  羊皮紙のページ（Fiction）が浮かんでいる」**構造。2 つのメタファーをレイヤで分離することで
  混在の不整合を防ぐ（現行スキルの「グロー系とオフセットシャドウを混ぜない」原則の延長）。
- **アクセントの使い分け**: 金（#FDC800）= Fantasy 的「魔法の輝き・重要・CTA・見出し強調」。
  黒の太枠（#1A1A1A）= Fiction 的「境界・構造・手描き感」。青（#0250CC）= 選択状態・
  リンク・インタラクティブの active。
- **装飾の方向**: 各セクション見出しに**手描き風の SVG 装飾**（星・三日月・羽毛ペン・巻物・火花）を
  Fiction 的タッチで添える。星空背景は Fantasy 的だが、星は角丸で絵本風に。

### 具体的値

| 項目 | 値 | 由来 |
|------|----|----|
| 背景ベース（夜空） | #0B1437（深い藍、Fantasy primary を暗くした没入感のある夜空色） | Fantasy 青をベースレイヤ向けに濃厚化 |
| 背景・奥行き | #0F1A4B（やや明るい藍、グラデ下層） | Fantasy primary #0250CC のトーン |
| コンテンツサーフェス（羊皮紙カード） | #FFE9CE（Fiction secondary クリーム） | Fiction の温かさをそのまま継承 |
| テキスト（本文） | #1A1A1A（Fiction 黒） | クリーム上で高コントラスト（約 15:1） |
| テキスト（夜空上） | #F5E6C8（温かいオフホワイト、純白より羊皮紙感） | Fantasy×Fiction 融合 |
| プライマリ アクセント（金） | #FDC800（Fantasy secondary） | CTA・見出し・重要要素 |
| セカンダリ（青） | #0250CC（Fantasy primary） | リンク・選択・アクティブ |
| 成功 / 警告 / 危険 | #16A34A / #D97706 / #DC2626 | 共通 |
| 枠線・境界 | #1A1A1A（Fiction 黒、太め 2-4px） | Fiction 太枠 |
| ディスプレイフォント | New Rocker（Fantasy） | 唯一のブラックレター系で「魔法書」感 |
| 本文・UI フォント | Cossette Texte（Fiction） | 絵本的・温かい・読みやすいサンセリフ |
| 等幅フォント | IBM Plex Mono（Fantasy） | ニュースメディア向き・呪文感 |
| 角丸 | rounded-2xl(16px) / rounded-3xl(24px) | Fiction「大きく丸み」 |
| シャドウ | 控えめ。カードは黒枠のみ。夜空要素に極薄 0 2px 8px rgba(0,0,0,.3) | Fiction フラット + Fantasy 最小融合 |
| スペーシング | 8pt ベース（8/16/24/32/48/64） | Fantasy 8pt + Fiction ゆとり |

### 検討した代替案と採用理由

1. **魔法書/絵本風ファンタジー（採用）**: レイヤ分離でメタファー衝突を回避。AI ニュースに冒険心を
   添えつつ、本文可読性（クリーム×黒 15:1）とブランド差別化を両立。
2. **ダンジョン探索ゲーム UI を絵本タッチ**: HP バーやインベントリ風 UI がニュースブログと不一致。却下。
3. **星空と羊皮紙（シンプル融合）**: 採用案のサブセットだが装飾が弱く Fantasy のプレミアム感不足。
4. **純粋に色を混ぜるだけ**: コンセプト不在の「ごちゃ混ぜ」。世界観統合の採用案が優れる。

---

## 2. デザイントークン表

### :root CSS 変数（`<style>` 内に新設）

```css
:root {
  /* 配色 - 夜空レイヤ (Fantasy) */
  --color-night: #0B1437;
  --color-night-2: #0F1A4B;
  --color-gold: #FDC800;
  --color-azure: #0250CC;
  /* 配色 - 羊皮紙レイヤ (Fiction) */
  --color-parchment: #FFE9CE;
  --color-ink: #1A1A1A;
  --color-cream: #F5E6C8;
  /* ステータス */
  --color-success: #16A34A;
  --color-warning: #D97706;
  --color-danger: #DC2626;
  /* タイポグラフィ */
  --font-display: 'New Rocker', cursive;
  --font-body: 'Cossette Texte', sans-serif;
  --font-mono: 'IBM Plex Mono', monospace;
  /* スペーシング (8pt) */
  --space-1: 8px; --space-2: 16px; --space-3: 24px;
  --space-4: 32px; --space-5: 48px; --space-6: 64px;
  /* 角丸 */
  --radius-sm: 8px; --radius-md: 16px; --radius-lg: 24px; --radius-pill: 9999px;
  /* シャドウ */
  --shadow-card: 0 2px 8px rgba(0, 0, 0, 0.3);
  --shadow-gold-glow: 0 0 12px rgba(253, 200, 0, 0.4);
  /* ボーダー */
  --border-ink: 3px solid #1A1A1A;
  --border-ink-thin: 2px solid #1A1A1A;
}
```

### tailwind.config.theme.extend（置換）

```js
tailwind.config = {
  theme: { extend: {
    fontFamily: {
      display: ['New Rocker', 'cursive'],
      body: ['Cossette Texte', 'sans-serif'],
      mono: ['IBM Plex Mono', 'monospace'],
    },
    colors: {
      'night': '#0B1437', 'night-2': '#0F1A4B',
      'gold': '#FDC800', 'azure': '#0250CC',
      'parchment': '#FFE9CE', 'ink': '#1A1A1A', 'cream': '#F5E6C8',
      'success': '#16A34A', 'warning': '#D97706', 'danger': '#DC2626',
    },
    borderRadius: { '2xl': '16px', '3xl': '24px' },
    boxShadow: {
      'card': '0 2px 8px rgba(0, 0, 0, 0.3)',
      'gold-glow': '0 0 12px rgba(253, 200, 0, 0.4)',
    },
    borderWidth: { '3': '3px', '4': '4px' },
    animation: { 'twinkle': 'twinkle 4s ease-in-out infinite', 'marquee': 'marquee 25s linear infinite' },
    keyframes: {
      twinkle: { '0%,100%': { opacity: '0.3' }, '50%': { opacity: '1' } },
      marquee: { '0%': { transform: 'translateX(0%)' }, '100%': { transform: 'translateX(-100%)' } },
    },
  }},
};
```

### Google Fonts 読込（置換）

```html
<link href="https://fonts.googleapis.com/css2?family=New+Rocker&family=Cossette+Texte:wght@400;700&family=IBM+Plex+Mono:wght@400;500;700&display=swap" rel="stylesheet">
```

注意: New Rocker は単一 weight のみ。見出しの太さは font-size / letter-spacing、
必要に応じて `-webkit-text-stroke: 1px var(--color-gold)` で補う。

---

## 3. 変更ファイル一覧

### A. index.html（メイン）
- **`<head>` 内 Google Fonts `<link>`（行20-22）**: Syne/JetBrains Mono → New Rocker/Cossette Texte/IBM Plex Mono に置換。
- **`tailwind.config`（行24-55）**: 上記トークン表で全面置換。boxShadow.brutal* → card/gold-glow。
  fontFamily.display/mono 変更、body 追加。
- **`<body>` クラス（行631）**: `font-display` → `font-body`（本文は Cossette Texte 既定）。
- **`body` ベーススタイル（行58-63）**: `background-color:#0B1437`、`color:#F5E6C8`。
  夜空グラデを `background: radial-gradient(ellipse at top, #0F1A4B, #0B1437 60%) fixed` で追加。
  `cursor:none` は維持（カスタムカーソル残す場合）。reduced-motion で `cursor:auto` も維持。
- **`.noise-overlay`（行66-76）**: 残すが opacity を 0.04 に下げ、羊皮紙の「古びた質感」として
  夜空上のみに効かせる（pointer-events:none なので z-index 調整でコンテンツ下）。
- **カスタムカーソル（行78-116, 650-651）**: **残す**。色を acid green → gold に変更。
  `.cursor-dot` background #FDC800、`.cursor-outline` border 1px solid #FDC800、
  hover 時の background-color rgba(253,200,0,.1)。`backdrop-filter:invert(1)` は維持。
- **`.digital-embers`（行119-266, 633-649）**: **「星屑（starlight）」に変換して残す**。
  `.ember` の background:#CCFF00 → #FDC800、box-shadow の glow も金に。
  クラス名は JS 未参照（純装飾）なのでリネーム可能だが、HTML の15個の `<div class="ember">` を
  一括置換すればよい。アニメーション rise は上昇→消失だが、星の「きらめき」には twinkle
  （opacity 変化）の方が適合。ただし既存 rise を流用し粒子の色だけ金に変えるのが最小変更。
- **`.text-outline`（行275-284）**: `-webkit-text-stroke:1px #F5E6C8`、hover で `color:#FDC800`。
- **`.brutalist-card`（行287-345）→ codex-card にリネーム検討**:
  - **構造**: background:#FFE9CE（羊皮紙）、border:3px solid #1A1A1A、
    border-radius:24px（大きく丸み）、box-shadow: 0 2px 8px rgba(0,0,0,.3)（控えめ）。
  - **::before オーバーレイ**: acid green フラッド → **金の微光** background:#FDC800; opacity:0。
    hover で opacity:0.08（塗りつぶしではなく光の差し込み）。
  - **hover**: border-color:#FDC800、transform:translate(-3px,-3px) 維持、
    box-shadow: var(--shadow-gold-glow)（金グロー、オフセット影は廃止して Fiction フラット寄り）。
  - **hover テキスト色**: #1A1A1A を維持（クリーム上の黒のまま）。現行の「画像上なので白」
    ロジック(331-338)は、サムネイル濃度を下げて黒字を維持できるか要検証。濃い画像がある場合は
    グラデオーバーレイを強めて可読性確保。
  - ⚠️ `renderPosts()`(1128) が `class="... brutalist-card ..."` を文字列で生成しているため、
    クラス名を変える場合は JS 内の文字列も同期。**安全策: クラス名は brutalist-card のまま残し、
    スタイル定義だけ差し替える**（影響範囲最小）。
- **`.article-body`（行346-570）**: 全面再スタイル。
  - h1-h4: font-family: var(--font-display)（New Rocker）。本文背景が羊皮紙なので黒系＋金アクセント
    が読みやすい。推奨: color:#1A1A1A; border-bottom:3px solid #FDC800; padding-bottom:8px。
  - p: font-family: var(--font-body)（Cossette Texte）、color:#1A1A1A、line-height:1.8。
  - strong: color:#0B1437（夜空色で重み）または #0250CC。
  - a: color:#0250CC、border-bottom:2px solid #FDC800、hover で background:#FDC800; color:#1A1A1A。
  - blockquote: background:#0B1437（夜空）、color:#F5E6C8、border-left:4px solid #FDC800、
    border-radius:0 16px 16px 0。引用は「魔法の巻物」風に夜空カードで際立たせる。
  - pre: background:#0B1437、border:2px solid #FDC800、border-radius:16px、
    color:#FDC800（コードは金）。box-shadow:none（フラット）。
  - code（inline）: background:rgba(253,200,0,.15)、color:#1A1A1A、border-radius:6px。
  - img: border:3px solid #1A1A1A、border-radius:16px、filter:grayscale(0)（既定カラー）。
    hover で box-shadow: var(--shadow-gold-glow)。
  - table th: background:#0B1437、color:#FDC800、border:2px solid #1A1A1A。
  - table td: background:#FFE9CE、color:#1A1A1A。
  - hr: border-top:2px dashed #1A1A1A（手描き風の破線）。
- **ヘッダー（行654-684）**: mix-blend-difference は夜空背景で効くので維持。
  ロゴ AI_GEEK. の . を text-gold に。ナビリンク hover を text-gold + 下線（絵本風）。
  lang-switcher の border を border-cream、focus border-gold。
- **モバイルメニュー（行686-728）**: 背景 bg-night、リンク text-cream hover text-gold。
- **ヒーロー（行730-737）**: DEV/LOG → コンセプトに合わせて CODEX / ARCANE LOG 等の
  ディスプレイ（New Rocker で大袈裟に）。mix-blend-exclusion 維持。星 SVG 装飾を追加可。
  ※ テキスト変更は data-i18n キー調整が必要。**安全策: 既存 DEV/LOG を維持してスタイルのみ変更**。
- **LATEST ARTICLES 見出し（行740-743）**: border-b border-gray-800 → border-b-2 border-ink。
  見出し横に手描き風 星/羽毛ペン SVG を1つ添える（Fiction の装飾）。
- **#blog-grid / #archive-grid（行745, 804）**: クラス不変。カードスタイルが自動反映。
- **「BROWSE ALL」ボタン（行749-755）**: border-gold text-gold hover bg-gold text-ink。
  scale-x ワイプは金で維持。rounded-full か rounded-2xl に。
- **アーカイブ（行760-807）**: ALL LOGS 見出し、検索入力、バックボタンを新トークンへ。
  検索入力 bg-night border-2 border-cream text-gold focus:border-gold。
- **記事詳細（行809-848）**: サイドバーの border-t border-acid-green → border-gold。
  カテゴリ text-gold、ステータス dot bg-gold。
- **アバウト（行850-896）**: text-acid-green → text-gold 全置換。スキルバッジは太枠黒 + クリーム背景 +
  金 hover。コーナーマーク(859-860)は border-gold。
- **フッター（行898-907）**: bg-black → bg-night、グラデ from-gray-700 to-black → from-night-2 to-night。
  text-gray-400 → text-cream/70。
- **i18n 辞書（行911-1017）**: **変更不要**（スタイル変更のみでテキスト維持）。ただし
  data-i18n-html の archive-heading / about-heading に含まれる `<span class="text-acid-green">` を
  text-gold に置換する必要あり（5言語分、各 *-heading と about-bio の CURRENT STATUS スパン）。
- **focus-visible（行587-596）**: outline:2px solid #FDC800 に。
- **prefers-reduced-motion（行600-627）**: cursor:auto、.ember 非表示、noise-overlay opacity 下げ、
  カーソル要素非表示、transition/animation 抑制。**全維持**。

### B. admin.html（整合性）
- **tailwind.config（行9-23）**: index.html と同一トークンに置換。
- **Google Fonts `<link>`（行27）**: New Rocker/Cossette Texte/IBM Plex Mono に。
- **body/input/textarea/button スタイル（行29-35）**:
  - body: background:#0B1437; color:#F5E6C8; font-family:'IBM Plex Mono',monospace。
    （admin はフォーム中心なので body は mono のままでも可）
  - input,textarea: background:#FFE9CE; border:2px solid #1A1A1A; color:#1A1A1A; border-radius:12px;
    font-family:'Cossette Texte',sans-serif。
  - input:focus,textarea:focus: border-color:#FDC800; box-shadow:0 0 0 3px rgba(253,200,0,.3)。
  - button: background:#FDC800; color:#1A1A1A; border:3px solid #1A1A1A; border-radius:12px;
    box-shadow:0 2px 8px rgba(0,0,0,.3)。hover transform:translate(-2px,-2px)。
  - #output: background:#0B1437; border:2px solid #FDC800; color:#F5E6C8; border-radius:12px。
  - .label: color:#F5E6C8; opacity:0.7。
- **`<h1>`（行53）**: text-acid-green → text-gold、border-acid-green → border-gold、
  font-display（New Rocker になる）で POST_DATA_GENERATOR を見出し風に。
- **focus-visible（行37-40）**: outline:2px solid #FDC800。
- **prefers-reduced-motion（行42-48）**: 維持。
- **#copy-msg（行89）**: text-acid-green → text-gold。

### C. .claude/skills/fantasy-fiction/（新設）
- **SKILL.md**: 現行 neobrutalism/SKILL.md を雛形に、「Mystic Codex」ハイブリッドの
  ガイドラインを作成。Brand / Style Foundations / Accessibility / Rules / Component Expectations /
  AI_GEEK 実装メモ（新トークンとの整合）を記載。
- **DESIGN.md**: フロントマター（colors/typography/rounded/spacing）と Overview /
  設計意図 / Style Foundations / Colors / Maintenance Notes を新トークンで記載。
- **neobrutalism/ の扱い**: リデザイン後は旧スキル。**削除せず残す**（履歴保持）が、
  CLAUDE.md の参照（行11）を新スキルに更新。新設の方が「かけ合わせ」の意図が明確。

### D. CLAUDE.md（行11）
- .claude/skills/neobrutalism/ の記述を .claude/skills/fantasy-fiction/ に更新。

---

## 4. コンポーネント別スタイリング指針

### カード（.brutalist-card、名称維持）
- 羊皮紙 #FFE9CE ベース、黒太枠 3px、角丸 24px、控えめシャドウ。
- ホバー: 金の縁 + 金グロー + 左上に浮く。Fiction のフラット感を保ちつつ Fantasy の輝き。
- サムネイル: border-radius:24px 24px 0 0、濃度 opacity:0.9、hover でカラー化 + scale。
- メタタグ .meta-tag: 黒枠 pill、hover で金背景。

### ボタン
- **プライマリ**: 金背景 #FDC800、黒テキスト、黒太枠 3px、角丸 12-16px。hover で左上浮く + 金グロー。
- **セカンダリ（アウトライン）**: クリーム/夜空背景、金の太枠 + 金テキスト。hover で金塗りつぶし。
- **タッチターゲット >= 44px** 維持。

### バッジ（スキルタグ、カテゴリ）
- クリーム背景、黒太枠 2px、角丸 pill（rounded-full）、Cossette Texte。
- hover で金背景 + 黒テキスト。

### 見出し
- **大見出し（h1, ヒーロー, ロゴ）**: New Rocker。-webkit-text-stroke で金の縁取り可。
- **セクション見出し（h2）**: New Rocker または Cossette Texte Bold。黒 + 金の下線（手描き風）。
- **小見出し**: Cossette Texte Bold。

### 記事本文（.article-body）
- 上記 A の .article-body 項を参照。羊皮紙×黒を基調、コードと引用は夜空カードでアクセント。

### ヘッダー / フッター
- ヘッダー: 透明 + mix-blend-difference（夜空上で反転）。ロゴの . が金。
- フッター: 夜空背景、GEEK 巨大文字グラデ（夜空→更深）。

### 装飾要素（手描き風 SVG、Fiction のイラスト代替）
- セクション見出し横に inline SVG: **星（5/6 角、角丸）**、**三日月**、**羽毛ペン**、**巻物**、**火花**。
- すべて stroke:#1A1A1A; stroke-width:2.5; fill:none または fill:#FDC800 で手描き風
  （stroke-linecap:round, stroke-linejoin:round）。
- images/ にラスターイラストは追加せず、SVG を inline で各セクションに1-2 個配置（パフォーマンス）。
- ヒーロー背景に薄い星 SVG パターン（opacity:0.15）を `<svg>` または CSS background-image で。

### カーソル / エフェクト
- カスタムカーソル: **残す**、色を金に。reduced-motion で通常カーソルに復帰（既存ロジック維持）。
- ノイズオーバーレイ: **残す**、opacity 0.04。羊皮紙の古びた質感を強調。
- digital-embers → **starlight に色変更して残す**（クラス名は ember のままでも可）。
  色 #FDC800、glow も金。アニメーション rise は上昇消失だが、夜空の「流れ星/昇る光」として許容。
  きらめき重視なら twinkle 追加も可（任意）。
- 読書プログレスバー: **残す**、背景 #FDC800。
- マーキー（未使用だが keyframes 残存）: 維持。

---

## 5. 実装ステップ

> **構成判断**: Tailwind CDN + インライン `<style>` 構成を**維持**する。
> 外部 CSS ファイル化は GitHub Pages で追加 fetch が発生し、CDN 構成の簡素さを損なう。
> 既存の「1 ファイルで完結」利点を保持。`<style>` が長くなるが、トークン化で整理する。

1. **トークン定義**: index.html の tailwind.config（行24-55）と Google Fonts（行20-22）、
   :root 変数ブロックを `<style>` 先頭に新設。
2. **ベーススタイル**: body（行58-63）を夜空グラデに。body クラス（行631）を font-body に。
3. **装飾の色替え**: .noise-overlay、カーソル（78-116）、.ember（130-264）、
   .text-outline（275-284）、#reading-progress（576-585）、focus-visible（587-596）を金基調に。
4. **カード再スタイル**: .brutalist-card（287-345）を羊皮紙 + 黒太枠 + 角丸 + 控えめシャドウに。
   クラス名は維持（renderPosts の文字列との整合）。
5. **記事本文再スタイル**: .article-body（346-570）を全面書き換え（羊皮紙×黒、コード/引用は夜空）。
6. **セクション別**: ヘッダー、ヒーロー、LATEST 見出し、アーカイブ、詳細、アバウト、フッターの
   acid-green / gray-* / black を新トークンに置換（grep で acid-green, #CCFF00, gray-800,
   bg-black, off-white を一括確認）。
7. **i18n HTML クラス修正**: data-i18n-html の archive-heading/about-heading/about-bio
   （5言語分）内の text-acid-green → text-gold。
8. **装飾 SVG 追加**: ヒーロー背景の星パターン、各セクション見出し横の手描き SVG（1-2 個/セクション）。
9. **admin.html**: 同トークンで追随（上記 B）。
10. **スキル新設**: .claude/skills/fantasy-fiction/SKILL.md + DESIGN.md。
11. **CLAUDE.md 更新**: 行11 のスキル参照。

### 影響範囲の最小化確認
- posts/index.js、posts/*/*.md: **触れない**。
- hash ルーティング（route(), show*）: **触れない**。
- 多言語切替（applyLanguage, data-i18n）: **触れない**（HTML クラス名のみ text-gold 化）。
- marked.js renderer: **触れない**。
- カーソル追従 JS、読書プログレス JS: **触れない**（色は CSS 側）。

---

## 6. 検証方法

### ローカル
- Python http.server または Live Server で index.html を開く。
- **ルーティング**: #/, #/archive, #/about, #/post/<slug> の各 hash でビュー切替確認。
  直リン（index.html#/post/...）と hashchange 往復。
- **多言語**: 5 言語（ja/en/zh-tw/zh-cn/ko）切替で、見出し・本文・placeholder が切替わる。
  翻訳ファイルが無い slug は ja にフォールバック（showDetail 1309-1311）。
- **Markdown**: 見出し/太字/リスト/引用/コード/テーブル/hr/画像/リンクが新スタイルで表示。
  target="_blank" 付与（renderer）確認。
- **レスポンシブ**: モバイル（375px）、タブレット（768px）、デスクトップ。
  モバイルメニュー開閉、Esc 閉じる、グリッド col-span 切替（big/tall/normal）。
- **prefers-reduced-motion**: DevTools でエミュレート。カーソル通常化、embers 非表示、
  ノイズ薄化、transition 抑制を確認（カーソル消失バグがないか最重要）。
- **フォント読込**: New Rocker/Cossette Texte/IBM Plex Mono が Network タブで 200。
  フォント未到着時の FOUT/FOIT 挙動。
- **コントラスト**: 羊皮紙 #FFE9CE × 黒 #1A1A1A 約 15:1（AA 超）。夜空 #0B1437 ×
  クリーム #F5E6C8 約 12:1（AA 超）。金 #FDC800 × 黒 #1A1A1A 約 13:1。全て AA 達成。
  ⚠️ 金 #FDC800 テキストを**夜空/クリーム背景に置かない**（低コントラスト）。金は背景塗りor
  アクセント線のみ。

### デプロイ後（GitHub Pages）
- https://<user>.github.io/ai-blog/ と /#/post/<slug> 直リン。
- GitHub Actions の自動記事生成 workflow が新デザインで表示されるか（posts/index.js 変更なしでOK）。
- Lighthouse: Performance（フォント 3 family の読込量に注意）、Accessibility、Best Practices。

---

## 7. リスクと注意点

1. **フォント読込量**: New Rocker（単一 weight）+ Cossette Texte（2 weight）+ IBM Plex Mono
   （3 weight）= 計 6 weight。display=swap で FOUT 許容。IBM Plex Mono の weight を
   400/700 の 2 つに絞る等で削減可。Japanese/CJK 文字はこれらフォントに含まれないため
   **日本語記事本文は fallback（システムフォント）になる**。Cossette Texte は Latin のみ。
   → 本文の日本語は font-family: 'Cossette Texte', 'Hiragino Sans', 'Noto Sans JP', sans-serif
   のように fallback を明示。コード/メタ（英数字）は IBM Plex Mono で効く。
   **許容するか要判断**: 完璧な CJK 対応には Noto Sans JP 追加が必要だがフォント量増。

2. **.ember → starlight リネームのリスク**: HTML の `<div class="ember">` ×15（633-649）と
   CSS（130-264）を同期すれば安全。JS は未参照。**クラス名 ember のまま色だけ変える方が安全**。

3. **カード hover の画像上テキスト**: 現行ロジック（331-338）は hover で画像上に白字を置く。
   羊皮紙カードで黒字を維持する場合、サムネイルのオーバーレイ濃度を上げて黒字を確保するか、
   hover で白字に切替えるか要検証。濃い画像（article01.jpg 等）で確認。

4. **New Rocker の可読性**: ブラックレター系で装飾過多。本文/小サイズには不向き。
   大見出し・ロゴ・ヒーローのみに限定（指針通り）。小見出しは Cossette Texte Bold。

5. **mix-blend-difference/exclusion の挙動**: 夜空背景上では効くが、羊皮紙カードが
   重なった際の混色に注意。ヘッダーは fixed + 透明なので、カードスクロール時の見え方を確認。

6. **画像アセット**: 既存 images/ の8枚は記事サムネイルとして継続利用。新規イラストは
   inline SVG のみ（ラスター追加なし）でパフォーマンス維持。

7. **パフォーマンス**: フォント 3 family + ノイズ SVG + embers ×15 + カスタムカーソル。
   現行からフォントが増える分、初回描画がやや重く。preconnect（既存18-19）維持、
   font-display:swap で体感改善。

8. **既存 neobrutalism スキルとの整合**: 新スキル fantasy-fiction と旧 neobrutalism が
   トークン衝突するため、CLAUDE.md（行11）を新スキル参照に更新しないとエージェントが
   旧ガイドを参照するリスク。

---

## 8. クイックリファレンス: 主な色置換マッピング

| 旧（acid/neon） | 新（codex） | 用途 |
|-----------------|-------------|------|
| acid-green / #CCFF00 | gold / #FDC800 | アクセント全般 |
| deep-black / #050505 | night / #0B1437 | 背景 |
| off-white / #F0F0F0 | cream / #F5E6C8（夜空上）or parchment / #FFE9CE（カード） | テキスト/サーフェス |
| gray-800 / #1a1a1a（影用） | ink / #1A1A1A（枠線用に昇格） | 太枠 |
| #333 / gray-800（薄枠） | ink / #1A1A1A（太枠に統一） | ボーダー |
| bg-black | bg-night | フッター |
| Syne | New Rocker | ディスプレイ |
| JetBrains Mono | IBM Plex Mono | 等幅 |
| （新規） | Cossette Texte | 本文/UI |

---

### Critical Files for Implementation
- C:\Users\erika\ai-workspace\AI Agents\ai-blog\index.html
- C:\Users\erika\ai-workspace\AI Agents\ai-blog\admin.html
- C:\Users\erika\ai-workspace\AI Agents\ai-blog\.claude\skills\neobrutalism\SKILL.md（新設 fantasy-fiction/SKILL.md の雛形）
- C:\Users\erika\ai-workspace\AI Agents\ai-blog\.claude\skills\neobrutalism\DESIGN.md（新設 fantasy-fiction/DESIGN.md の雛形）
- C:\Users\erika\ai-workspace\AI Agents\ai-blog\CLAUDE.md（行11 スキル参照更新）
