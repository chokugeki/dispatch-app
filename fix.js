import fs from 'fs';

// 1. src/index.css (Tailwindの読み込み設定)
const indexCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer utilities {
  .text-xxs {
    font-size: 8pt; /* 付箋印刷用 */
    line-height: 1.1;
  }
}`;

// 2. src/main.jsx (CSSファイルの読み込み)
const mainJsx = `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`;

// ファイル書き込み
try {
    fs.writeFileSync('src/index.css', indexCss);
    console.log('✅ src/index.css を修正しました');

    fs.writeFileSync('src/main.jsx', mainJsx);
    console.log('✅ src/main.jsx を修正しました');
    
    console.log('-----------------------------------');
    console.log('修正完了です。npm run dev で画面を確認してください。');
} catch (e) {
    console.error('エラーが発生しました:', e);
}