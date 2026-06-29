---
name: neobrutalism
description: AI_GEEK ブログ (index.html / admin.html) の UI・デザインを作成・編集する際のデザインガイドライン。ネオブータリズムの「太枠・高コントラスト・構造化カード」と、既存の配色 (acid green #CCFF00 × deep-black #050505 × off-white #F0F0F0) とフォント (Syne + JetBrains Mono) を融合した指針。ボタン・カード・入力・モーダル・ナビ等のコンポーネント追加や、HTML/CSS/Tailwind のスタイル変更時に参照する。
license: MIT
metadata:
  author: typeui.sh (adapted for AI_GEEK blog)
  source: https://github.com/bergside/awesome-design-skills
---

# neobrutalism Design System Skill — AI_GEEK ブログ版

## Mission
あなたは AI_GEEK ブログのデザインガイドラインの専門家です。
実装可能で一貫したガイダンスを作成し、エンジニアがそのまま使える形で提供してください。

このスキルは、元の neobrutalism スタイル（太枠・高コントラスト・構造化レイアウト）を、
**既存のブログ実装 (index.html / admin.html) に合わせて適応**させたものです。
ネオブータリズムの「暖色サーフェス・黄/紫アクセント」は、本ブログの既存ブランド
（acid green × 黒）で置き換えています。**既存の配色とフォントを壊さないことが最優先**です。

## Brand
AI_GEEK ブログは、テック系の大胆なダーク × ネオン のビジュアルアイデンティティを持つ。
深い黒のキャンバス上に鮮やかな acid green を配し、ジオメトリックな太字ディスプレイフォント (Syne) と
等幅フォント (JetBrains Mono) で「ハッカー/テックメディア」の質感を作る。
ノイズオーバーレイ・カスタムカーソル・マーキー演出が、ネオブータリズムの「太枠・高コントラスト・構造化」
の骨格と組み合わさり、力強く読みやすい情報メディアを実現する。

## Style Foundations
- **Visual style:** dark, bold, high-contrast, structured cards（ネオブータリズム × ダークネオン）
- **Typography scale:** 13/15/17/21/27/35 | **Fonts:** display=Syne, mono=JetBrains Mono | weights: Syne=400,700,800 / JetBrains Mono=400,700
- **Color palette:** acid green, deep black, off white, status | **Tokens:** primary(acid-green)=`#CCFF00`, surface(deep-black)=`#050505`, foreground(off-white)=`#F0F0F0`, success=`#16A34A`, warning=`#D97706`, danger=`#DC2626`
- **Spacing scale:** 4/8/12/16/24/32
- **Borders (neobrutalism の核心):** 実線・太め (2〜4px)、角丸は小〜中 (rounded sm=4px / md=8px)
- **Shadows:** 既存の acid green グロー (`box-shadow: 0 0 10px #CCFF00`) を維持。ネオブータリズム風の「硬いオフセットシャドウ (blur なし)」も可だが、グローと混在させないこと。

## Accessibility
WCAG 2.2 AA、キーボードファースト操作、可視フォーカス状態、セマンティック HTML を ARIA より優先、
スクリーンリーダー対応ラベル、`prefers-reduced-motion` 対応（マーキー/グロー/カーソル演出の抑制）、
44px 以上のタッチターゲット、高コントラスト対応。

※ 注意: acid green `#CCFF00` は黒背景上では高コントラストだが、**白/off-white 背景上では低コントラスト**になる。
acid green をテキスト色にする場合は必ず黒系背景上のみ。逆に off-white テキストを acid green 上に置く場合は十分な太字とサイズを確保すること。

## Writing Tone
concise, confident, helpful（簡潔・自信・親切）。記事本文は初心者にもわかりやすい表現（CLAUDE.md 規約に準拠）。

## Rules: Do
- 生値ではなくセマンテックトークンを使う（`acid-green` / `deep-black` / `off-white` — Tailwind 設定に既存定義あり）
- 視覚的階層を保つ（見出しは Syne 太字、本文は読みやすいサイズ）
- インタラクション状態を明示する（hover / focus-visible / active）
- 太い実線ボーダーで要素を区切る（ネオブータリズムの基本）
- 空 / ローディング / エラー状態を設計する
- レスポンシブをデフォルトにする
- アクセシビリティの根拠をコメントで残す

## Rules: Don't
- コントラスト不足のテキストを使わない（acid green × off-white 背景の組み合わせに注意）
- スペーシングのリズムを崩さない（8pt グリッドを維持）
- 目的のない装飾的なモーションを避ける（グロー/マーキーは意味を持たせる）
- 曖昧なラベルを避ける
- 複数の視覚メタファーを混在させない（グロー系とオフセットシャドー系を混ぜない）
- アクセシブルでないヒットエリアを避ける（44px 未満のクリック範囲）

## Expected Behavior
- まず基盤（トークン・フォント・配色）に従い、次にコンポーネントの一貫性を保つ。
- 不確な場合は、新しさよりもアクセシビリティと明瞭さを優先する。
- 具体的なデフォルトを示し、代替案がある場合はトレードオフを説明する。
- 意見を持ち、簡潔で実装指向のガイダンスにする。

## Guideline Authoring Workflow
1. ルール提案の前に、デザイン意図を一文で再述する。
2. コンポーネントレベルのガイダンスの前に、トークンと基盤の制約を定義する。
3. コンポーネントの構造・状態・バリアント・インタラクション動作を指定する。
4. アクセシビリティの受け入れ基準とライティング期待値を含める。
5. アンチパターンと、既存の不整合 UI への移行ノートを追加する。
6. コードレビューで実行可能な QA チェックリストで締める。

## Required Output Structure
ガイダンス生成時は以下の構造を使う:
- コンテキストと目標
- デザイントークンと基盤
- コンポーネントレベルのルール（構造・バリアント・状態・レスポンシブ）
- アクセシビリティ要件とテスト可能な受け入れ基準
- コンテンツとトーンの基準（例付き）
- アンチパターンと禁止実装
- QA チェックリスト

## Component Rule Expectations
- 必須状態を定義: default, hover, focus-visible, active, disabled, loading, error（該当分）。
- キーボード・ポインタ・タッチのインタラクション動作を記述する。
- スペーシング・タイポグラフィ・カラートークンの使用を明示する。
- レスポンシブ振る舞いとエッジケース（長いラベル・空状態・オーバーフロー）を含める。

## AI_GEEK 実装メモ（既存 index.html との整合）
- Tailwind は CDN 利用。`tailwind.config.theme.extend` に既存定義あり:
  - `colors: { 'acid-green': '#CCFF00', 'deep-black': '#050505', 'off-white': '#F0F0F0' }`
  - `fontFamily: { display: ['Syne'], mono: ['JetBrains Mono'] }`
  - `animation.marquee` / `keyframes.marquee`
- 新要素を追加する際は、上記セマンテックトークンと Syne/JetBrains Mono を使い、太枠 + acid green アクセントで既存の質感に合わせる。
- 既存の演出（ノイズ `.noise-overlay`、カスタムカーソル、acid green グロー）と衝突しないこと。

## Quality Gates
- 曖昧な形容詞だけで依存するルールを作らない。各ルールをトークン・閾値・例に紐付ける。
- すべてのアクセシビリティ記述は実装でテスト可能であること。
- 一回限りの局所最適化よりも、システム全体の一貫性を優先する。
- 美観とアクセシビリティの衝突をフラグし、アクセシビリティを優先する。

## Example Constraint Language
- 交渉不可のルールには "must"、推奨には "should" を使う。
- すべての do ルールに少なくとも1つの具体的な don't 例をペアにする。
- 新パターンを導入する場合は、既存コンポーネントへの移行ガイダンスを含める。
