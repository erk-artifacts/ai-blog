# AI_GEEK ブログ UI/UX 改善（neobrutalism スキル適用）

## Context
設置済みのデザインスキル `.claude/skills/neobrutalism/` に沿って、ブログの UI/UX を改善する。
現状の `index.html`（1341行・SPA式・5言語・88記事）と `admin.html`（104行・JSON生成ツール）は、acid green×黒×Syne/JetBrains Mono の強いブランドを持つが、**WCAG 2.2 AA 非達成（記事本文 #ccc で 3.8:1）、ブラウザ履歴未対応、状態UI が弱い、キーボードで記事が開けない、`prefers-reduced-motion` 未対応**などの UX/アクセシビリティ上の欠陥がある。

本変更は、これらを「ネオブータリズムの太枠・高コントラスト・構造化カード」で**足し算**しつつ解消する。既存の視覚演出（ノイズ・エンバー・カスタムカーソル・グロー・マーキー）は一切壊さない。記事データ（`posts/index.js`、`posts/*/*.md`）と GitHub Actions 自動生成 workflow には触らない。

実装前に行った読み取り専用検証（5エリア並列）で、行番号と現状値を実コードと照合済み。以下の行番号は実測値。

## 検証で判明した前提（技術選定の根拠）
- **ホスティング**: `erk-artifacts/ai-blog`（GitHub Pages、branch=main、path=/）。**hash ルーティング**（`#/`, `#/archive`, `#/about`, `#/post/<slug>`）を採用。pathname の pushState は GitHub Pages プロジェクトパスで 404 になるため使わない。
- **show* 関数**: いずれも引数なし（`showDetail(id)` のみ id 引数）。`pushHistory=true` を既定引数で追加すれば後方互換。
- **`route()` 関数は未存在** → 新設する。`posts/index.js` は `init()` 呼出（1337行）より前（989行）に読込済みで利用可能。
- **showDetail は `post.id` 使用、hash は slug ベース** → `route()` 内で `slug → id` 解決（`posts.find(p=>p.slug===slug)`）。
- ⚠️ **発見事項**: git remote が `ai-blog2` を指しているが、実際の Pages は `ai-blog`。push 先の誤設定の可能性。本タスク範囲外だが、実装後にユーザーへ確認する。

---

## 変更セット

### A. index.html — P0：コントラスト・太枠・状態UI・アクセシビリティ基盤

**スタイル（`<style>` 内、行49〜571）**
- `.brutalist-card`（274-282）: `border:1px solid #333` → `2px solid #333`、`border-radius:8px` を追加。
- `.article-body` の本文色を `#ccc` → `#F0F0F0`(off-white) に: `p`(345)、`ul`(358)、`ol`(518)、`td`(549)。背景 `#050505` 上で約 18:1（AA 達成）。`strong`(350) の `#fff` は維持。
- グローバルフォーカスリングを末尾に追加: `a,button,input,select,[tabindex],textarea:focus-visible{outline:2px solid #CCFF00;outline-offset:2px}`（現状 `:focus-visible` は0件）。
- `@media (prefers-reduced-motion: reduce)` ブロックを新設:
  - `.ember{animation:none;display:none}`、`.noise-overlay{opacity:.03}`
  - **`body{cursor:auto}`** ← 必須。現状 `body{cursor:none}`(53-54) のままでは reduced-motion ユーザーがカーソル消失し操作不能になる。
  - `*{transition-duration:.01ms!important}`

**カード（renderPosts、1035-1094）**
- `<article>`(1069): `border border-[#333]` → `border-2 border-[#333]`。
- **キーボード対応**: `tabindex="0"` を追加し、`keydown` ハンドラ（Enter/Space → `showDetail(id)`）を実装（`onclick` はマウス専用でキーボードで開けない現状を解消）。`role="button"` は付けない（article 内に複数要素があるため ARIA 違反）。
- 要約(1085)・date(1076) の `text-gray-400` → `text-gray-300`（可読性向上）。
- サムネ `<img>`(1062) に `onerror="this.parentElement.style.display='none'"` 追加（親は `absolute inset-0` の div なので非表示化してもレイアウト崩れなし）。

**状態UI**
- ローディング(1187): `animate-pulse` テキスト → 太枠(acid green)ローディングブロック。文言 `t('loading')` 維持。
- エラー(1233): `border-2 border-red-500` 枠 + **再試行ボタン** `<button onclick="showDetail(window.currentPostId)">RETRY</button>`。`showDetail` 先頭で `window.currentPostId = post.id` を保存（現状 `window.currentPostSlug`(1172) のみ）。
- 検索0件(740-744): 「SYSTEM ERROR: DATA NOT FOUND」に **クリアボタン** `<button onclick="clearArchiveSearch()">CLEAR</button>` を追加（`clearArchiveSearch` は入力クリア＋再描画）。

### B. index.html — P1：ブラウザ履歴・ナビ・セマンティック・ARIA

**hash ルータ（新設）**
- `route()` 関数を定義: `location.hash` を解析 → `#/archive`→`showArchive(false)`、`#/about`→`showAbout(false)`、`#/post/<slug>`→slug→id 解決→`showDetail(id,false)`、それ以外→`showList(false)`。
- `window.addEventListener('hashchange', route)`。
- `init()` 末尾（1337手前）で `route()` を呼び初回復元。
- 各 `show*` に `pushHistory=true`（既定）を追加。`true` のみ `location.hash` を設定。**無限ループ防止**: `hashchange → route() → showX(false)` の一方向フロー。

**ナビ hash 化**
- デスクトップナビ(605-609)・モバイルナビ(635-648)・ロゴ(599-602): `href="#"` → `href="#/"`,`#/archive`,`#/about`。onclick は route 経由に集約（フォールバック残置可）。
- `goBack`(1313-1316): `history.back()` 優先、直リン経由時は `previousView` フォールバック。

**セマンティック構造**
- `view-detail`(751)・`view-about`(792): **`<div>` を `<main>` に置換**（`id`、`hidden-view`、`min-h-screen pt-32 pb-20 px-6 max-w-7xl mx-auto` の全クラスを main に保持）。クラスを移動させないと padding/min-height が消えて崩れる。`view-archive`(704) は既に `<main>`。

**ARIA・キーボード**
- モバイルメニューボタン(622-626): `aria-expanded="false"`,`aria-controls="mobile-menu-overlay"` 追加。
- モバイルオーバーレイ(629): `role="dialog" aria-modal="true" aria-label="ナビゲーションメニュー"`。閉じるボタン(631): `aria-label="メニューを閉じる"`。
- モバイルメニュー開閉 JS(1127-1130): `aria-expanded` を true/false で切替（現状ロジックなし）。
- `lang-switcher`(611-619): `aria-label="Language"` 追加。
- カーソル `:has(:hover)`(94-103) に `:focus-visible` を OR 追加（キーボードでもカーソル拡大）。

### C. index.html — P2：暫定（実URL不明のため後回し）
- about の SNS リンク(827-834) `href="#"`: 実URLは不明なので、暫定で `<span>` 化（非インタラクティブ）し、キーボードユーザーの混乱を防止。実URL判明後にリンク化。

### D. admin.html — P1：ブランド統一（ロジック非破壊）
- Google Fonts(8): 行全体を `Syne:wght@400;700;800` + `JetBrains Mono` の link に置換（preconnect 含む）。
- `tailwind.config` を行7の後に追加（`colors.acid-green/deep-black/off-white`、`fontFamily.display:Syne/mono:JetBrains Mono`）。現状 config なしで `text-acid-green` 等が未定義。
- `<style>`(10-16) の input/textarea(11) `border:1px`→`2px`、button(14) `border:none`→`2px solid #050505`、#output(16) `border:1px`→`2px`。**既存CSSを維持して border 太さのみ変更**（Tailwind クラスへの全面移行は競合リスクがあるため最小限）。
- ヘッダー: `h1`(21) に `font-display` を追加。`border-b-2 border-acid-green` は h1 でなくヘッダーコンテナに適用（h1 への border は構造的に不自然）。
- `COPIED` メッセージ(57): `aria-live="polite"` 追加。
- `:focus-visible` 共通スタイル追加。
- **`generateCode`(68-92)/`copyToClipboard`(94-101) は触らない**。
- admin にはノイズ/エンバー/カスタムカーソルを入れない（ツール画面は可読性優先＝スキルの Don't「目的のない装飾」）。

---

## 実装戦略（plan 承認後）
単一ファイルへの多数編集（index.html 約35箇所、admin.html 約8箇所）のため、**1ファイルずつ順次 Edit** で確実に適用する（並列化は同じファイル競合を生むため不可）。完了後:
1. ローカル HTTP サーバで各ビュー・各言語・キーボード・reduced-motion・モバイル幅を手動検証。
2. **Workflow で adversarial 検証**（実装後）：コントラスト/キーボード/hash ルータ/reduced-motion/モバイルの各観点を並列エージェントで検証し、見つかった問題を修正。

## リスクと安全策
- **hash ルータの無限ループ/二重実行**: `pushHistory` フラグで hash 設定を1箇所に集約、`route()` は常に `showX(false)` で呼ぶ。
- **`<main>` 化によるレイアウト崩れ**: div→main の**置換**（クラスごと移動）、ラッパ追加ではない。
- **reduced-motion でカーソル消失**: `cursor:auto` への切替を必ず入れる（最も見落としやすい致命リスク）。
- **カード onclick + 内部リンク**: 今回カード内に `<a>` はないが、将来のために `e.stopPropagation()` を念のため。
- **i18n 再描画(1136-1156) と hash の干渉**: `applyLanguage` 内の detail 再描画(1151)は `showDetail(id)` 呼出（`pushHistory=false` 相当、hash 変更しない）。hash と `currentPostSlug` の二重管理を避けるため、hash を正とし `currentPostSlug` は hash 復元時に再設定。

## 検証手順（手動）
1. リポジトリルートで HTTP サーバ起動（`python -m http.server 8000`）— `file://` だと MD fetch が CORS で失敗するため必須。
2. `/#/` → list、カードクリック → detail、ブラウザ戻る → list 復元。
3. 直リン `/#/archive`, `/#/post/<slug>`, `/#/about` が各ビューを開く。
4. 5言語切替 → ナビ・カード・本文が切替、detail 中の切替で同記事再描画、未訳は ja フォールバック。
5. キーボード Tab → フォーカスリング(acid green)可視、カード Enter で detail 開く。
6. DevTools Rendering で `prefers-reduced-motion:reduce` → エンバー停止・ノイズ薄化・**通常カーソル復帰**・遷移瞬時。
7. DevTools Lighthouse Accessibility → コントラスト・landmark(main)・alt チェック通過。
8. 幅 375px → ハンバーガー `aria-expanded` 連動、メニュー内遷移、ボタン 44px+。
9. ネットワーク切断で detail → エラー＋再試行ボタン。検索で存在しない語 → 0件＋クリアボタン。
10. `admin.html` → 太枠/Syne ヘッダー、Generate/Copy 動作維持。
11. push 後 `https://erk-artifacts.github.io/ai-blog/` で直リン再確認（**git remote が ai-blog2 指している点を先に確認/修正**）。

## 影響しないもの
- `posts/index.js`、`posts/*/*.md`、`.github/workflows/*`、`.claude/skills/*` — 一切編集しない。
- 既存の視覚演出（ノイズ・エンバー・カスタムカーソル・グロー・マーキー）— 维持。
