---
name: Fantasy × Fiction (AI_GEEK blog — Mystic Codex)
source: https://github.com/bergside/awesome-design-skills
references: [fantasy, fiction]
colors:
  night: "#0B1437"
  night-2: "#0F1A4B"
  gold: "#FDC800"
  azure: "#0250CC"
  parchment: "#FFE9CE"
  ink: "#1A1A1A"
  cream: "#F5E6C8"
  success: "#16A34A"
  warning: "#D97706"
  danger: "#DC2626"
typography:
  display:
    fontFamily: "New Rocker"
    weights: "Regular (Latin only)"
  body:
    fontFamily: "Cossette Texte"
    weights: "400, 700"
  mono:
    fontFamily: "IBM Plex Mono"
    weights: "400, 500, 700"
  cjk: "Noto Sans JP (400/500/700)"
  sourceScale: "12/14/16/20/24/32"
rounded:
  sm: 8px
  md: 16px
  lg: 24px
spacing:
  sourceScale: "8/16/24/32/48/64 (8pt)"
---

## Overview

bergside/awesome-design-skills の **Fantasy**（ゲーム的・ボールド・没入）と **Fiction**
（絵本・フラット・太枠・丸み）を、「魔法の図書館 / Mystic Codex」という世界観で融合した
AI_GEEK ブログのデザインシステム。夜空レイヤ（Fantasy）に羊皮紙レイヤ（Fiction）を重ね、
2つのメタファーをレイヤ分離で衝突させない。

## 設計の意図と根拠

- **レイヤ分離の根拠:** Fantasy（リッチ・没入）と Fiction（フラット・絵本）を同じ面に混ぜると
  質感が衝突する。夜空を背景レイヤ、羊皮紙をコンテンツレイヤに分離することで両立。
- **配色の根拠:** 夜空 #0B1437 / #0F1A4B（Fantasy 青 #0250CC を濃厚化）、金 #FDC800
  （Fantasy secondary）、羊皮紙 #FFE9CE / 黒 #1A1A1A（Fiction primary/secondary）。
- **フォントの根拠:** New Rocker（ブラックレター系、魔法書感、英字限定）+ Cossette Texte
  （絵本的サンセリフ、英字限定）+ IBM Plex Mono（呪文/コード感）。日本語は Noto Sans JP で fallback。
- **Fiction フラット寄り:** 太枠 3px + 大きな角丸 24px、シャドウは控えめ。ハードオフセット影は廃止。
- **Fantasy アクセント:** 金のグローは hover のみ。星屑・きらめきアニメ。

## Style Foundations

- **Visual style:** immersive fantasy × playful storybook
- **Typography scale:** 12/14/16/20/24/32
- **Fonts:** display=New Rocker, body=Cossette Texte, mono=IBM Plex Mono, CJK=Noto Sans JP
- **Color palette:** 夜空 (night/night-2), 羊皮紙 (parchment/ink/cream), アクセント (gold/azure), status
- **Spacing scale:** 8pt (8/16/24/32/48/64)
- **Rounded:** sm 8px / md 16px / lg 24px

## Colors

- **night (#0B1437):** ベース背景。夜空の深い藍。
- **night-2 (#0F1A4B):** 奥行き・グラデ下層・暗いカード（about card）。
- **gold (#FDC800):** アクセント。CTA・見出し強調・hover グロー・きらめき。⚠️ テキスト色としては夜空/羊皮紙上で低コントラスト。背景塗りか縁のみ。
- **azure (#0250CC):** リンク・選択状態。
- **parchment (#FFE9CE):** コンテンツカード背景（記事本文・記事カード）。
- **ink (#1A1A1A):** 羊皮紙上の本文・太枠。
- **cream (#F5E6C8):** 夜空上のテキスト。
- **success/warning/danger:** #16A34A / #D97706 / #DC2626。

## Maintenance Notes

- 配色・フォント変更時は `index.html` / `admin.html` の `tailwind.config` と Google Fonts を同期。
- :root CSS 変数 (--color-*, --font-*) を経由する。
- 新コンポーネントは SKILL.md の Rules / Component Rule Expectations に従う。
- 旧 neobrutalism スキル (acid green #CCFF00) には戻さない。Mystic Codex が優先。
