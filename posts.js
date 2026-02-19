// 記事データを管理するファイル
const posts = [
    {
        title: "記事の書き方",
        category: "NEW",
        date: "2026.02.19",
        thumbnail: "",
        summary: "HTMLタグのテキスト要素について",
        body: `
        <h1>メインタイトル</h1>
        <p>テキスト</p>
        <strong>重要</strong><br>
        <em>強調</em>
        <hr>
        <blockquote>引用文</blockquote>
        <code>var x = 10;</code>
        <pre>コード ブロック</pre>
        `
    },
    {
        title: "画像表示のテスト",
        category: "TEST",
        date: "2026.02.19",
        thumbnail: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1000&auto=format&fit=crop",
        summary: "記事内に画像を挿入するテストです。",
        body: `
            <p>記事の中に画像を挿入するテストです。白黒フィルターがかかり、ホバーするとカラーになるエフェクトを適用しています。</p>
            
            <figure>
                <img 
                    src="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1000&auto=format&fit=crop" 
                    alt="Cyberpunk City" 
                >
                <figcaption>/// FIG.01 - CYBER_RENDER_TEST</figcaption>
            </figure>

            <p>画像の下に本文が続きます。画像のURLを自分の好きなものに書き換えてください。</p>
        `
    },
    {
        title: "GitHub",
        category: "Images test",
        date: "2026.02.18",
        thumbnail: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1000&auto=format&fit=crop",
        summary: "記事内に画像を挿入するテストです。",
        body: `
            <p>記事の中に画像を挿入するテストです。白黒フィルターがかかり、ホバーするとカラーになるエフェクトを適用しています。</p>
            
            <figure>
                <img 
                    src="./images/article01.jpg" 
                    alt="GitHub infographic"
                >
                <figcaption>/// FIG.01 - CYBER_RENDER_TEST</figcaption>
            </figure>

            <p>画像の下に本文が続きます。画像のURLを自分の好きなものに書き換えてください。</p>
        `
    },
    {
        title: "今日のニュース",
        category: "AI News",
        date: "2026.02.18",
        thumbnail: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1000&auto=format&fit=crop",
        summary: "ByteDanceから出されているSeedreamとSeedanceにとても期待しています。",
        body: `
            <p>ByteDanceから出されているSeedreamとSeedanceにとても期待しています。</p>
            <h2>動画生成の民主化</h2>
            <p>これまで高価なGPUが必要だった動画生成が、より手軽に、かつ高品質に行える時代が来ました。</p>
            <p>特にキャラクターの一貫性（Consistency）を保ったままアニメーションさせる技術は、クリエイターにとって革命的です。</p>
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
