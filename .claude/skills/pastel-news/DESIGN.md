---
name: Pastel News (AI_GEEK blog — やわらかいニュースマシン)
inspiration: The Verge Storystream redesign (2022+)
references: design-proposals/option-b-final.html, design-proposals/palette-board.html
colors:
  bg: "#20202A"
  bg-2: "#2A2A35"
  bg-3: "#33333F"
  paper: "#ECEAF2"
  muted: "#A8A6B5"
  faint: "#7C7A8A"
  sakura: "#F2C6D8"
  lavender: "#C8BEF2"
  mint: "#B5E8D2"
  ink: "#20202A"
  hair: "rgba(255,255,255,.10)"
  hair-2: "rgba(255,255,255,.18)"
typography:
  jp:
    fontFamily: "Noto Sans JP"
    weights: "500 (body), 700 (card headings), 900 (display headings)"
  mono:
    fontFamily: "IBM Plex Mono"
    weights: "400, 500, 600"
  latinDisplay:
    fontFamily: "Anton"
    weights: "Regular (uppercase only, Latin only)"
  sourceScale: "10/11/12/15/16/18/34/40-64"
  bigNumerals: "Anton 44 / 58 / 150"
rounded:
  flat: "0-4px (default)"
  pill: "999px (interactive only)"
spacing:
  gutter: "20px (--gap)"
  section: "72px"
  containerMax: "1440px"
  measure: "680-760px"
shadows: "none"
gradients: "none"
---

## Overview

The Verge (2022+ Storystream) 由来の **フィード型ニュース構造** — 巨大見出し・色面ブロッキング・
タイムスタンプ付きストリーム — を、ネオンの「安全塗装」ではなく **目に優しいパステル** で
再構成した AI_GEEK ブログのデザインシステム。コードネーム **「やわらかいニュースマシン」**。

旧テーマ「魔法の図書館 / Mystic Codex」（夜空 #0B1437 × 金 #FDC800 × 羊皮紙 #FFE9CE）を
全面的に置き換える。`fantasy-fiction` / `neobrutalism` はアーカイブとして残るのみ。

## 設計の意図と根拠

- **なぜ The Verge 型か:** 本ブログは毎日1本・サムネイル画像なし。
  「日付＋見出し＋一行要約」を主役に据えるフィード構造が実態と噛み合う。
  巨大見出しと色面ブロッキングが、画像の不在を情報の階層で埋める。
- **なぜネオンをやめたか:** The Verge のネオン（蛍光ミント/バイオレット）は雑誌的な瞬発力を持つが、
  毎日読む常用メディアでは眼精疲労が大きい。**明度を上げ彩度を落としたパステル**に置換することで、
  色面ブロッキングの構造的効果を保ったまま常用に耐えるようにした。
- **なぜ純黒/純白を避けるか:** ダーク UI で `#000` × `#fff` はコントラストが過剰でハレーションを起こす。
  `#20202A` × `#ECEAF2` で 13.5:1 を確保しつつ、目の負担を下げる。
- **なぜ影を捨てたか:** 影とパステル色面は質感が衝突する（色面が濁る）。
  奥行きは **面の明度段階（#20202A → #2A2A35 → #33333F）と 1px ヘアライン**で作る方が、
  フラットな色面ブロッキングと整合する。
- **なぜ本文 500 か:** ダーク地では文字が細く見える（光学的に痩せる）。
  Noto Sans JP 300/400 はダーク背景で可読性が落ちるため、本文の下限を 500 とする。
- **なぜ3書体か:** 役割が排他的だから。日本語は Noto Sans JP、メタ情報は IBM Plex Mono、
  ラテン装飾（ワードマーク・セクションラベル・巨大日付）は Anton。混用しない。
- **配色の決定経緯:** 6案の比較ボード（`palette-board.html`）から
  「03 サクラ×ラベンダー」を採用。サクラを第一アクセント（ヒーロー・タイムスタンプ）、
  ラベンダーを第二（特集タイル・ティッカー・クローム）、ミントを第三（タグ）に固定した。

## Style Foundations

- **Visual style:** dark pastel news product
- **Typography scale:** 10/11/12/15/16/18/34/40-64（＋ Anton 44/58/150）
- **Fonts:** jp=Noto Sans JP (500/700/900), mono=IBM Plex Mono (400/500/600), latin-display=Anton
- **Color palette:** surfaces 3段 / text 3段 / pastel 3色 / hairline 2段
- **Spacing:** gutter 20px, section 72px, container 1440px, measure 680-760px
- **Rounded:** flat 0-4px（pill 999px は押せるものだけ）
- **Shadows / Gradients:** なし

## Colors

- **bg (#20202A):** ベース背景。やわらかいチャコール。純黒は使わない。
- **bg-2 (#2A2A35):** カード・タイル等、一段上の面。暗タイル・アーカイブタイル。
- **bg-3 (#33333F):** ホバー面・チップ。
- **paper (#ECEAF2):** 主要テキスト。純白は使わない。bg 上で 13.5:1。
- **muted (#A8A6B5):** 副次テキスト（要約・メタ）。bg 上で 6.7:1（AA）。
- **faint (#7C7A8A):** 三次テキスト。bg 上で 3.8:1 → **大きな文字・装飾のみ**。
- **sakura (#F2C6D8):** 第一アクセント。ヒーロー色面、STORYSTREAM タイムスタンプ、見出しマーク。
- **lavender (#C8BEF2):** 第二アクセント。特集タイル、ティッカー、リンク、フォーカスリング、クローム。
- **mint (#B5E8D2):** 第三アクセント。タグ、補助的な強調。
- **ink (#20202A):** パステル色面の上に載せる文字色。bg と同値だが役割が別。
  ⚠️ パステル色面に `paper` や白を載せない。
- **hair / hair-2:** 1px 罫線。境界は線1本で足りる。太枠は使わない。

## Maintenance Notes

- 配色・フォント変更時は `index.html` / `admin.html` の `tailwind.config` と Google Fonts を同期。
- `:root` CSS 変数（`--bg` / `--paper` / `--sakura` / `--mono` 等）を経由する。生の hex を直書きしない。
- 新コンポーネントは `SKILL.md` の Rules / Component Rule Expectations に従う。
- **旧テーマ（fantasy-fiction の金 #FDC800 / 羊皮紙 #FFE9CE / New Rocker、
  neobrutalism の acid green #CCFF00）には戻さない。pastel-news が優先。**
- `design-proposals/option-b-final.html` は探索段階のファイルで **CSS 変数名が正規名と食い違う**
  （`--mint`→lavender、`--violet`→sakura、`--pink`→mint、`--tile`→bg-2）。
  参照する際は `SKILL.md` の対応表で読み替えること。
- JS の構造契約（ビュー ID、描画ターゲット ID、`data-i18n`、hash ルーティング、marked.js renderer）は
  デザイン変更で壊さない。詳細は `SKILL.md` の「AI_GEEK 実装メモ」。
