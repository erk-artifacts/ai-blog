---
name: Neobrutalism (AI_GEEK blog adaptation)
source: https://github.com/bergside/awesome-design-skills
colors:
  acid-green: "#CCFF00"
  deep-black: "#050505"
  off-white: "#F0F0F0"
  success: "#16A34A"
  warning: "#D97706"
  danger: "#DC2626"
typography:
  display:
    fontFamily: "Syne"
    weights: "400, 700, 800"
  mono:
    fontFamily: "JetBrains Mono"
    weights: "400, 700"
  sourceScale: "13/15/17/21/27/35"
rounded:
  sm: 4px
  md: 8px
spacing:
  sm: 4px
  md: 8px
  sourceScale: "4/8/12/16/24/32"
---

## Overview

ネオブータリズム（太枠・高コントラスト・構造化レイアウト）を、AI_GEEK ブログの既存ブランド
（acid green × 深い黒 × off-white、Syne + JetBrains Mono）に適応させたデザインシステム。

元の neobrutalism は「暖色サーフェス・黄/紫アクセント・Inter フォント」だが、本バリアントでは
**ダークネオン × acid green** に置き換えている。骨格（太い実線ボーダー・高コントラスト・
構造化カード・大胆なタイポグラフィ）は維持。

## 設計の意図と根拠

- **配色の根拠:** 既存 index.html が `#CCFF00` (acid green) × `#050505` (deep-black) × `#F0F0F0` (off-white) を
  確立済み。ブランド一貫性のため、スキルのデフォルト配色を上書きせず、これらを正とする。
- **フォントの根拠:** 既存 Google Fonts 読み込みが Syne (400/700/800) + JetBrains Mono (400/700)。
  ネオブータリズムの「大胆なディスプレイタイポ」は Syne のジオメトリック太字で表現し、
  テック感は JetBrains Mono で補強する。
- **ネオブータリズム要素の維持:** 太い実線ボーダー (2〜4px)、小〜中の角丸 (4/8px)、
  高コントラスト、明確な構造化カード。
- **既存演出との共存:** ノイズオーバーレイ・カスタムカーソル・acid green グロー・マーキーは維持。
  硬いオフセットシャドウを足す場合はグローと混在させない。

## Style Foundations

- **Visual style:** dark, bold, high-contrast, structured cards
- **Typography scale:** 13/15/17/21/27/35
- **Typography fonts:** display=Syne, mono=JetBrains Mono
- **Color palette:** acid green (primary/accent), deep black (surface), off white (foreground), status colors
- **Spacing scale:** 4/8/12/16/24/32

## Colors

- **acid-green (#CCFF00):** プライマリアクセント。黒背景上のボタン・リンク・強調・グロー。⚠️ 白背景上ではテキスト色に使わない（低コントラスト）。
- **deep-black (#050505):** サーフェス/背景。ベースキャンバス。
- **off-white (#F0F0F0):** フォアグラウンド/テキスト/ボーダー。
- **success (#16A34A):** 成功状態。
- **warning (#D97706):** 警告状態。
- **danger (#DC2626):** エラー/危険状態。

## Maintenance Notes

- 配色・フォントを変更する場合は、必ず `index.html` の `tailwind.config.theme.extend` と Google Fonts 読み込みを
  同期させること（セマンテックトークン `acid-green` / `deep-black` / `off-white` を経由する）。
- 新コンポーネントを追加する際は、このスキルの `SKILL.md` の Rules / Component Rule Expectations に従う。
- 元の typeui.sh neobrutalism トークン (primary #FDC800 等) には戻さないこと。本ブログのブランドが優先。
