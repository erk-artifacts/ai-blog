# 記事構成と再開可能な生成工程の実装計画

**Goal:** 承認済みの監査提案に沿って、要点・事実・影響・未確定事項・出典を分離した記事を安定生成する。

**Architecture:** RSS候補にアプリ側のIDを付け、選定APIで根拠付きの事実を抽出する。執筆APIは選定済みの事実だけを受け取り、構造化データを返す。Markdownはコードで組み立てる。生成済み日本語と成功済み翻訳をJSONチェックポイントに保持する。

**Tech Stack:** Node.js 22、既存のResponses APIラッパー、JSON Schema、Marked、node:test。

## 制約

- 前ターンの未コミット修正を保持する。既存記事本文を一括変更しない。
- 公開日、RSS記事の公開日時、出来事の日付、取得時刻を別々に扱う。
- 出典IDは候補内に限定。根拠は元の見出し／抜粋に含まれる引用を要求する。
- 日付の根拠がない場合はnull。推測を確定事項として表示しない。
- 候補にAIニュースがない場合は記事を作らない。
- 外部入力のHTMLやMarkdownで記事構造や出典を上書きさせない。
- `--dry-run`はチェックポイントも記事も書かない。
- API残高の復旧を必要としない自動テストで検証する。

## 1. 選定・執筆・整形

対象: `scripts/editorial.mjs`、`tests/editorial.test.mjs`。

インターフェース:

```js
await generateDigest(newsItems, { now }); // => { article, provenance } またはnull
renderDigest(plan, draft, sources, publicationDate); // => {title, summary, body}
```

- [x] 正常な二段階生成、空の選定、不明ID、根拠不一致、日付の捏造、項目欠落、出典URLの保持、HTMLの無害化を再現するテストを追加して失敗を確認する。
- [x] 厳密なSchemaとローカル検証、プレーンテキストのエスケープ、固定Markdown構成を実装する。
- [x] `node --test tests/editorial.test.mjs`を実行する。

## 2. 生成スクリプトへの統合

対象: `scripts/generate-post.mjs`、`scripts/rss-feeds.json`、`tests/generation.test.mjs`。

- [x] 公開日をJSTで固定し、RSS取得時刻と出典種別を候補に渡す。
- [x] 既存の`generateBlogPost`を新工程へ接続し、新旧の見出しを検証できるようにする。
- [x] 0件選定時は翻訳・公開しない。公開メタデータの日付と本文の日付を一致させる。
- [x] 既存の回帰テストを二段階応答へ更新し、以前の不具合の検証を維持する。

## 3. チェックポイントと翻訳再開

対象: `scripts/generation-state.mjs`、`scripts/generate-post.mjs`、`tests/generation-state.test.mjs`。

```js
await saveGenerationState(file, state);
await loadGenerationState(file);
await completeTranslations(state, persist); // 成功した言語を保存し、既存の成功分を保持
```

- [x] 一部翻訳失敗→再開、公開済みの再開、壊れたチェックポイントをテストする。
- [x] 日本語生成後と各翻訳成功後にJSONを原子的に保存する。
- [x] `--resume <file>`で日本語生成を省略し、未完了の翻訳を処理する。
- [x] 公開済みのslugがある場合は同じ記事の不足翻訳だけ更新し、重複投稿しない。
- [x] タイムアウトを二段階生成の最大再試行時間に合わせる。

## 4. 最終確認と説明

対象: `README.md`、`docs/editorial-pipeline.md`、`docs/examples/editorial-preview.md`、ワークフロー。

- [x] 構成例は架空のデータと明示して作る。
- [x] 実行・再開方法、API呼び出し回数、機械検証では保証できない事実性を記載する。
- [x] `npm test`、`npm run validate:all`、全mjsの構文確認、`git diff --check`を実行する。
- [x] ローカル実装完了と、API残高不足による実生成の未検証部分を区別して報告する。
