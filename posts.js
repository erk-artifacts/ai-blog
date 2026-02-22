// 記事データを管理するファイル
const posts = [
  {
    title: "今日のAI最前線：エネルギー問題から倫理的課題まで、AIの新たな焦点が浮上",
    category: "AI NEWS",
    date: "2026.02.22",
    thumbnail: "",
    summary: "OpenAIのAltman氏がAIのエネルギー消費について言及する一方、GoogleはLLMスタートアップの生き残り困難を警告。一方MicrosoftはAIゲームの品質維持を誓約し、インドではSarvamがチャットアプリを展開するなど、AI業界で複数の重要な動きが相次いでいます。",
    body: `<h2>Sam AltmanがAIのエネルギー消費問題を議論</h2><p>OpenAIのSam Altman氏は、AI システムが大量のエネルギーを消費することへの懸念に対して、<strong>人間の育成にも同等のエネルギーが必要だと主張しました</strong>。これは、AI開発における環境負荷についての議論が活発化していることを示しています。</p><p><em>私たちの生活への影響：今後のAI開発は、人間の育成と同じコストフレームで評価される可能性が出てきました。</em></p><hr/><h2>Microsoftのゲーミング部門がAI品質維持を誓約</h2><p>Microsoft新任のゲーミングCEOは、ゲーム業界に<strong>「無限のAI粗悪品」を氾濫させない</strong>ことを約束しました。AIゲーム開発が増加する中、品質維持とユーザー体験のバランスを取ることが重要な課題となっています。</p><p><em>私たちの生活への影響：今後のゲームは、AI技術を活用しながらも高品質な体験を提供する方向へシフトしていくでしょう。</em></p><hr/><h2>GoogleがAI スタートアップの生き残り困難を警告</h2><p>GoogleのバイスプレジデントがLLM（大規模言語モデル）ラッパー企業とAI集約企業に対して、<strong>生存競争が厳しくなると警告しました</strong>。差別化の余地が減少し、利益率が低下する傾向が続いているため、これらのスタートアップは新たなビジネス戦略を迫られています。</p><p><em>私たちの生活への影響：単なるAIラッパー的なアプリケーションから、より高度な独自性を持つAIサービスへのシフトが加速するでしょう。</em></p><hr/><h2>OpenAIがChatGPTでの危険発言を監視</h2><p>OpenAIの監視ツールは、カナダで銃乱射事件を起こした容疑者がChatGPTに銃暴力に関する説明をしていたことを検出しました。OpenAIスタッフはこの情報に基づいて<strong>警察への通報を検討</strong>していたとのことです。</p><p><em>私たちの生活への影響：AIプラットフォームは今後、有害コンテンツの検出と対応で法執行機関との協力がより重要になります。</em></p><hr/><h2>インドのSarvamがIndus AI チャットアプリを展開</h2><p>インドのAI企業Sarvamは、<strong>Indus AIチャットアプリをベータ版で公開しました</strong>。LLM（大規模言語モデル）を搭載したこのアプリは、インド市場でのAI競争の激化を示す事例となっています。</p><p><em>私たちの生活への影響：インド地域でも高度なAIチャットサービスが利用可能になることで、グローバルなAIアクセス格差が縮小していきます。</em></p><hr/><h2>まとめ</h2><blockquote><p>現在のAI業界は、技術革新と実用化のフェーズから、<strong>エネルギー効率、倫理的責任、市場競争</strong>といった、より成熟した段階へ移行しています。大手テック企業は品質維持と責任を重視する方向へ進む一方で、スタートアップには高い差別化が求められるようになってきました。さらに、AIの安全性と社会への影響についても、より具体的で厳格な対応が必要になっていることが明らかになっています。</p></blockquote>`
  },
    {
        title: "記事の書き方",
        category: "HTML",
        date: "2026.02.19",
        thumbnail: "",
        summary: "HTMLタグのテキスト要素について説明しています。まずはこちらを確認してください。",
        body: `
        <h2>h2タグを使っています</h2>
        <p>pタグを使っています</p>
        <strong>strongタグを使っています</strong>
        <em>emタグを使って強調しています</em>
        <hr>
        <blockquote>blockwuoteタグを使っています</blockquote>
        `
    },
    {
        title: "GitHub",
        category: "GitHub",
        date: "2026.02.18",
        thumbnail: "",
        summary: "記事内に画像を挿入するテストです。",
        body: `
            <h2>h2タグを使っています</h2>
            <p>記事の中に画像を挿入するテストです。白黒フィルターがかかり、ホバーするとカラーになるエフェクトを適用しています。</p>
            
            <figure>
                <img 
                    src="./images/article01.jpg" 
                    alt="GitHub infographic"
                >
                <figcaption>/// FIG.01 - CYBER_RENDER_TEST</figcaption>
            </figure>

            <p>画像の下に本文が続きます。</p>
        `
    },
    {
        title: "Claude Codeについて",
        category: "AI AGENT",
        date: "2026.02.17",
        thumbnail: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1000&auto=format&fit=crop",
        summary: "Claude Codeは、現時点で最強のAIエージェントです。私にとって最高のおもちゃになりました。",
        body: `
            <p>Claude Codeは、現時点で最強のAIエージェントです。私にとって最高のおもちゃになりました。</p>
            <p>これまでのAIコーディングツールと一線を画すのは、その<strong>「自律性」</strong>の高さです。単にコードを補完するだけでなく、ターミナルでコマンドを実行し、エラーが出れば自分で修正し、Gitのコミットまでやってのけます。</p>
            
            <h2>なぜ「最強」なのか</h2>
            <ul>
                <li>文脈理解力が圧倒的に高い（Claude 3.7 Sonnetを使用）</li>
                <li>開発環境のファイル構造を深く理解する</li>
                <li>指示待ちではなく、提案型の動きをする</li>
            </ul>

            <blockquote>
                "It's not just a tool, it's a partner."
            </blockquote>

            <p>これからもこのブログ自体の開発をClaude Codeと共に進めていく予定です。次に実装したいのは、WebGLを使った3D背景です。</p>
        `
    }
];
