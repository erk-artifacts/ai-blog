# プラン: Anthropic Claude API → Google Gemini API 移行

## Context

現在、AIニュースブログの自動生成にClaude API（`@anthropic-ai/sdk`）を使用しているが、API料金がかかるため、無料枠のあるGoogle Gemini API（`@google/genai`）に移行する。1日あたりのAPI呼び出しは5回（生成1 + 翻訳4）で、Gemini無料枠内に収まる。

## 変更ファイル一覧

| ファイル | 変更内容 |
|---------|---------|
| `package.json` | `@anthropic-ai/sdk` → `@google/genai` に差し替え |
| `scripts/generate-post.mjs` | API呼び出し・エラーハンドリング・環境変数を全面的に変更 |
| `scripts/translate-existing.mjs` | API呼び出し・環境変数を変更 |
| `scripts/translate-single.mjs` | API呼び出し・環境変数を変更 |
| `.github/workflows/generate-daily-post.yml` | 環境変数名を変更 |
| `CLAUDE.md` | ドキュメント更新 |
| `README.md` | ドキュメント更新 |

## 実装ステップ

### Step 1: `package.json` — 依存関係の変更

```diff
- "@anthropic-ai/sdk": "^0.61.0",
+ "@google/genai": "^1.0.0",
```

変更後に `scripts/` で `npm install` を実行。

---

### Step 2: `scripts/generate-post.mjs` — メインスクリプト（最大の変更）

#### 2a. インポート（1行目）
```diff
- import Anthropic from '@anthropic-ai/sdk';
+ import { GoogleGenAI } from '@google/genai';
```

#### 2b. `generateBlogPost()` — クライアント初期化（〜106行目）
```diff
- const client = new Anthropic({
-   baseURL: process.env.ANTHROPIC_BASE_URL || undefined,
-   timeout: 90_000,
-   maxRetries: 0,
- });
+ const ai = new GoogleGenAI({
+   apiKey: process.env.GEMINI_API_KEY,
+ });
```

#### 2c. `generateBlogPost()` — API呼び出し（〜122-188行目）

Anthropic形式の `requestPayload` を廃止し、Gemini形式に変更:

```javascript
// requestPayload を2つの変数に分解
const systemPrompt = `あなたは日本語テックブロガーです。...`; // 既存のsystemプロンプト
const userPrompt = `以下のニュース一覧から...`; // 既存のuserメッセージ

// API呼び出し
response = await ai.models.generateContent({
  model,
  contents: userPrompt,
  config: {
    systemInstruction: systemPrompt,
    maxOutputTokens: 8000,
    responseMimeType: 'application/json',
  },
});
```

`responseMimeType: 'application/json'` でJSON出力を保証。既存のフォールバック抽出ロジック（コードフェンス→正規表現）は念のため残す。

#### 2d. モデルフォールバック（〜170行目）
```diff
- const preferredModel = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001';
+ const preferredModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  const modelFallbacks = [
    preferredModel,
-   'claude-haiku-4-5-20251001',
-   'claude-sonnet-4-5',
+   'gemini-2.5-flash',
+   'gemini-2.5-flash-lite',
  ].filter((model, index, arr) => model && arr.indexOf(model) === index);
```

#### 2e. エラーハンドリング（〜196-210行目）

エラーコードのマッピング:
```diff
- const isOverloaded = err.status === 529 || ...;
- const isTimeout = err.status === 408 || err.code === 'ECONNABORTED' || ...;
+ const isOverloaded = err.status === 503 || err.status === 500;
+ const isTimeout = err.status === 504 || String(err.message || '').toLowerCase().includes('timeout');
  const isRateLimit = err.status === 429; // 変更なし

- const isFatal = err.status === 401 || err.status === 403 ||
-   String(err.message || '').toLowerCase().includes('credit') ||
-   String(err.message || '').toLowerCase().includes('balance');
+ const isFatal = err.status === 400 || err.status === 401 || err.status === 403;
```

#### 2f. レスポンス解析（〜229-231行目）
```diff
- console.log(`... Usage: ${response.usage.input_tokens} input, ${response.usage.output_tokens} output tokens`);
- const text = response.content[0].text.trim();
+ console.log(`... Usage: ${response.usageMetadata.promptTokenCount} input, ${response.usageMetadata.candidatesTokenCount} output tokens`);
+ const text = response.text.trim();
```

#### 2g. `translateWithClaude()` → `translateWithGemini()`（〜312-370行目）

関数名と内部実装を変更。パターンは2b-2fと同じ:
- クライアント初期化: `new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })`
- API呼び出し: `ai.models.generateContent({ model, contents, config: { systemInstruction, maxOutputTokens: 8192 } })`
- レスポンス: `response.text`
- モデル: `process.env.GEMINI_MODEL || 'gemini-2.5-flash'`
- エラーハンドリング: 2eと同じコードマッピング

#### 2h. 環境変数の参照箇所（全文）

| 行 | 変更 |
|----|------|
| 102-103 | `ANTHROPIC_API_KEY` → `GEMINI_API_KEY` |
| 170 | `ANTHROPIC_MODEL` → `GEMINI_MODEL` |
| 226 | エラーメッセージ "Claude API" → "Gemini API" |
| 269 | エラーメッセージ "Claude API" → "Gemini API" |
| 317 | `baseURL: process.env.ANTHROPIC_BASE_URL` を削除 |
| 323 | `ANTHROPIC_MODEL` → `GEMINI_MODEL` |
| 562-563 | `ANTHROPIC_API_KEY` → `GEMINI_API_KEY` |
| 568 | ログ "Claude API" → "Gemini API" |
| 607 | `ANTHROPIC_API_KEY` → `GEMINI_API_KEY` |

---

### Step 3: `scripts/translate-existing.mjs`（209行）

#### 3a. インポート（1行目）
`@anthropic-ai/sdk` → `@google/genai`

#### 3b. `translateWithClaude()` → `translateWithGemini()`（32-59行目）
generate-post.mjsと同じパターンで変更。現在SDK組み込みの `maxRetries: 2` に依存しているため、独自リトライループ（3回、指数バックオフ）を追加。

#### 3c. 環境変数チェック（75-76行目）
`ANTHROPIC_API_KEY` → `GEMINI_API_KEY`

---

### Step 4: `scripts/translate-single.mjs`（250行）

Step 3と同じ変更。構造がほぼ同一のため同じパターンを適用:
- インポート変更
- `translateWithClaude()` → `translateWithGemini()` + リトライ追加
- 環境変数チェック（78-79行目）変更

---

### Step 5: `.github/workflows/generate-daily-post.yml`（49行）

```diff
  env:
-   ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
+   GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
```

マージ後にGitHubで `GEMINI_API_KEY` シークレットを設定する必要あり。

---

### Step 6: `CLAUDE.md` — ドキュメント更新

主な変更点:
- `Claude API` → `Gemini API`
- `claude-haiku-4-5-20251001` → `gemini-2.5-flash`
- `ANTHROPIC_API_KEY` → `GEMINI_API_KEY`
- `ANTHROPIC_MODEL` → `GEMINI_MODEL`
- `ANTHROPIC_BASE_URL` 行を削除
- エラーコード: 529→503/500, 408→504

---

### Step 7: `README.md` — ドキュメント更新

- 27行目: "Claude APIで" → "Gemini APIで"
- 60行目: `ANTHROPIC_API_KEY` → `GEMINI_API_KEY`
- 69行目: `ANTHROPIC_API_KEY` → `GEMINI_API_KEY`
- 113行目: `@anthropic-ai/sdk` → `@google/genai`

---

## APIパターン対応表

| 概念 | Anthropic SDK | Gemini SDK |
|------|--------------|-----------|
| インポート | `import Anthropic from '@anthropic-ai/sdk'` | `import { GoogleGenAI } from '@google/genai'` |
| クライアント | `new Anthropic({apiKey, baseURL, timeout})` | `new GoogleGenAI({apiKey})` |
| 呼び出し | `client.messages.create({model, system, messages, max_tokens})` | `ai.models.generateContent({model, contents, config})` |
| レスポンス | `response.content[0].text` | `response.text` |
| トークン数 | `response.usage.input_tokens` | `response.usageMetadata.promptTokenCount` |

## エラーコード対応表

| 状態 | Anthropic | Gemini |
|------|----------|--------|
| 過負荷 | 529 | 503, 500 |
| タイムアウト | 408 | 504 |
| レート制限 | 429 | 429 |
| 認証エラー | 401, 403 | 401, 403 |
| 不正リクエスト | — | 400 |

## 検証手順

1. `npm run test:fetch` — RSS取得の動作確認（API呼び出しなし）
2. `npm run test:dry` — Gemini APIで記事生成のテスト（ファイル書き込みなし）
3. 生成結果の目視確認（日本語品質、JSON構造）
4. GitHubで `GEMINI_API_KEY` シークレットを設定
5. `workflow_dispatch` で手動実行し、エンドツーエンドの動作確認

## 注意事項

- **`.env` ファイル**: ローカルの `.env` で `ANTHROPIC_API_KEY` → `GEMINI_API_KEY` に変更が必要
- **Gemini無料枠**: 1日5回の呼び出し（1生成+4翻訳）は十分に収まる。翻訳は並列実行されるが、無料枠のRPM制限内
- **ロールバック**: 問題があれば `@anthropic-ai/sdk` に戻せるよう、変更はコミット単位で管理
