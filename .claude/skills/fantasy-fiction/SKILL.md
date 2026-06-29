---
name: fantasy-fiction
description: AI_GEEK ブログ (index.html / admin.html) の UI・デザインを作成・編集する際のデザインガイドライン。bergside/awesome-design-skills の Fantasy（ゲーム的・没入）と Fiction（絵本・フラット・太枠）を「魔法の図書館 / Mystic Codex」の世界観で融合。夜空レイヤ（深い藍 #0B1437 × 金 #FDC800）に羊皮紙レイヤ（クリーム #FFE9CE × 黒太枠）を重ねる。New Rocker / Cossette Texte / IBM Plex Mono / Noto Sans JP を組み合わせる。
license: MIT
metadata:
  author: typeui.sh (adapted for AI_GEEK blog)
  source: https://github.com/bergside/awesome-design-skills
  references: [fantasy, fiction]
---

# fantasy-fiction Design System Skill — AI_GEEK ブログ版（Mystic Codex）

## Mission
あなたは AI_GEEK ブログのデザインガイドラインの専門家です。
実装可能で一貫したガイダンスを作成し、エンジニアがそのまま使える形で提供してください。

このスキルは、awesome-design-skills の **Fantasy**（ゲーム的・ボールド・没入）と
**Fiction**（絵本・フラット・太枠・丸み）を「魔法の図書館」という一つの世界観に融合した
オリジナルハイブリッドです。2つのメタファーをレイヤで分離し、衝突させません。

## Brand
**「星空の下で開く古びた魔法の絵本」** — Fantasy の「重厚・神秘的・イマーシブ」を
ベースレイヤ（夜空・背景・ロゴ・ヒーロー）に、Fiction の「温かい・絵本・太枠・フラット」を
コンテンツレイヤ（カード・記事本文・UI）に使います。

- **夜空レイヤ (Fantasy):** 深い藍 #0B1437 / #0F1A4B、金のきらめき #FDC800、New Rocker の見出し。
- **羊皮紙レイヤ (Fiction):** クリーム #FFE9CE、黒の太枠 3px、丸み 24px、Cossette Texte の本文。
- **魔法の輝き:** 金 (#FDC800) = 重要・CTA・見出し強調・hover グロー。
- **手描きの境界:** 黒太枠 (#1A1A1A) = 構造・カード縁。

## Style Foundations
- **Visual style:** immersive fantasy × playful storybook（夜空 × 羊皮紙のレイヤ構造）
- **Typography scale:** 12/14/16/20/24/32 | **Fonts:** display=New Rocker (英字), body=Cossette Texte (英字), mono=IBM Plex Mono | **CJK:** Noto Sans JP (日本語 fallback) | weights: New Rocker=Regular / Cossette=400,700 / IBM Plex Mono=400,500,700 / Noto Sans JP=400,500,700
- **Color palette:** night, parchment, gold, ink, cream, status
  - night=#0B1437（背景）, night-2=#0F1A4B（奥行き・暗いカード）, gold=#FDC800（アクセント）, azure=#0250CC（リンク）
  - parchment=#FFE9CE（カード背景）, ink=#1A1A1A（本文・太枠）, cream=#F5E6C8（夜空上テキスト）
  - success=#16A34A, warning=#D97706, danger=#DC2626
- **Spacing scale:** 8pt (8/16/24/32/48/64)
- **Borders:** 黒の太い実線 (3px)、角丸は大きめ (rounded-2xl=16px / 3xl=24px)。Fiction の「太枠 × 丸み」。
- **Shadows:** 控えめ。カードは `0 2px 8px rgba(0,0,0,0.3)`。金のグロー `0 0 12px rgba(253,200,0,0.4)` は hover アクセントのみ。オフセット影は廃止（フラット寄り）。

## Accessibility
WCAG 2.2 AA、キーボードファースト、可視フォーカス、`prefers-reduced-motion` 対応
（星屑アニメ・カスタムカーソル・きらめきの抑制、カーソル消失防止）、44px 以上のタッチターゲット。

※ コントラストの鉄則:
- **羊皮紙 #FFE9CE × 黒 #1A1A1A** ≈ 15:1（本文、AA 超）。
- **夜空 #0B1437 × クリーム #F5E6C8** ≈ 12:1（夜空上テキスト、AA 超）。
- **金 #FDC800 × 黒 #1A1A1A** ≈ 13:1（金背景塗り上の黒テキスト、AA 超）。
- ⚠️ **金テキストを夜空/羊皮紙背景に置かない**（低コントラスト）。金は「背景塗り」か「アクセント線/縁」のみ。

## Writing Tone
concise, confident, helpful。記事本文は初心者にもわかりやすい表現（CLAUDE.md 規約）。

## Rules: Do
- セマンテックトークンを使う（night/gold/parchment/ink/cream — Tailwind config 定義済み）。
- レイヤを分離: 夜空要素（背景・ロゴ・サイドバー・暗いカード）と羊皮紙要素（記事カード・本文）を混ぜない。
- 大見出し・ロゴ・ヒーローは New Rocker (font-display)。本文は Cossette Texte (font-body)。
- カードは羊皮紙背景 + 黒太枠 3px + 角丸 24px + 控えめシャドウ。
- hover で「金縁 + 金グロー + 左上に浮く」のアクセント。
- 装飾に手描き風 inline SVG（星・三日月・羽毛ペン）を添える（ラスター画像不可）。
- レスポンシブ・空/ローディング/エラー状態を設計する。

## Rules: Don't
- 金テキストを夜空/クリーム背景に置かない（低コントラスト）。
- 羊皮紙カード上に cream 系（明るい）テキストを置かない（見えない）。
- グロー系とオフセットシャドウを混在させない（フラット寄りに統一）。
- New Rocker（装飾過多）を本文・小サイズに使わない（大見出し限定）。
- 8pt グリッドを崩さない。
- 44px 未満のヒットエリアを作らない。

## Component Rule Expectations
- カード (.brutalist-card): 羊皮紙 + 黒太枠 + 角丸 + 控えめシャドウ。hover: 金縁 + 金グロー + 浮く。クラス名は維持（renderPosts が文字列生成のため）。
- ボタン: プライマリ＝金背景 + 黒太枠 + 角丸 + 浮く。セカンダリ＝金縁 + 金テキスト、hover で金塗り。
- 記事本文 (.article-body): 羊皮紙カード（背景 + 太枠 + padding）。本文黒、見出し New Rocker + 金下線、コード/引用は夜空カード。
- 見出し: New Rocker (英字) / Noto Sans JP (日本語 fallback)。
- 状態: default/hover/focus-visible/active/disabled/loading/error を定義。

## AI_GEEK 実装メモ（index.html / admin.html との整合）
- Tailwind CDN。`tailwind.config.theme.extend` に定義:
  - `colors: { night, night-2, gold, azure, parchment, ink, cream, success, warning, danger }`
  - `fontFamily: { display: [New Rocker, Noto Sans JP], body: [Cossette Texte, Noto Sans JP], mono: [IBM Plex Mono, Noto Sans JP] }`
  - `boxShadow: { card, gold-glow }`, `borderRadius: { 2xl:16px, 3xl:24px }`, `animation.twinkle`
- Google Fonts: New Rocker + Cossette Texte + IBM Plex Mono + Noto Sans JP。
- :root CSS 変数 (--color-*, --font-*, --radius-*, --shadow-*, --border-ink) を `<style>` 先頭に定義。
- 既存演出（ノイズ `.noise-overlay` opacity 0.04、カスタムカーソル金、星屑 `.ember` 金、読書プログレス金）は維持。
- JS ロジック（hash ルーティング、多言語、marked.js）は触れない。

## Quality Gates
- ルールをトークン・閾値・例に紐付ける（曖昧な形容詞のみに依存しない）。
- コントラストは実装で検証可能であること。
- システム一貫性を局所最適化より優先。
- 美観とアクセシビリティの衝突時はアクセシビリティ優先。
