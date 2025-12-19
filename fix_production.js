import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 1. Login.jsx (新規作成: ログイン画面) ---
const srcLogin = `import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { LogIn } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6 flex justify-center items-center gap-2">
           送迎依頼管理システム
        </h1>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">メールアドレス</label>
            <input
              type="email"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">パスワード</label>
            <input
              type="password"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? '処理中...' : 'ログイン'}
          </button>
        </form>
        <div className="mt-4 text-xs text-center text-gray-500">
           ※アカウントをお持ちでない場合は管理者にご連絡ください
        </div>
      </div>
    </div>
  );
}`;

// --- 2. App.jsx (ログイン判定を追加) ---
const srcApp = `import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Layout, Plus, LogOut } from 'lucide-react';
import { formatDateShort, maskName } from './utils';
import DetailView from './components/DetailView';
import CreateModal from './components/CreateModal';
import Login from './components/Login';

export default function App() {
  const [session, setSession] = useState(null);
  const [requests, setRequests] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // セッション監視
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // データ読み込み (セッションがある場合のみ)
  const fetchRequests = async () => {
    if (!session) return;
    setLoading(true);
    
    // RLSが有効になるため、user_idのフィルタは自動的に適用されますが、
    // 明示的に書くなら .eq('user_id', session.user.id) となります。
    // ここではRLSに任せます。
    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) console.error('Error:', error);
    else setRequests(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (session) fetchRequests();
  }, [session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // ログインしていない場合はログイン画面を表示
  if (!session) {
    return <Login />;
  }

  const selectedData = requests.find(r => r.id === selectedId);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans text-sm">
      <div className="w-80 bg-white border-r flex flex-col shadow-sm z-10">
        <div className="p-3 border-b flex justify-between items-center bg-gray-50">
          <h1 className="font-bold text-gray-700 flex items-center gap-2">
            <Layout size={18} /> 依頼一覧
          </h1>
          <div className="flex gap-2">
            <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white p-1.5 rounded hover:bg-blue-700 shadow-sm" title="新規作成">
                <Plus size={18} />
            </button>
            <button onClick={handleLogout} className="bg-gray-400 text-white p-1.5 rounded hover:bg-gray-500 shadow-sm" title="ログアウト">
                <LogOut size={18} />
            </button>
          </div>
        </div>
        
        {/* ヘッダー行 */}
        <div className="grid grid-cols-4 px-2 py-1 bg-gray-200 text-xs font-bold text-gray-600 border-b">
          <div className="col-span-1">氏名</div>
          <div className="col-span-1">施設</div>
          <div className="col-span-1 text-center">開始</div>
          <div className="col-span-1 text-center">期限</div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? <p className="p-4 text-gray-500">Loading...</p> : 
           requests.length === 0 ? <p className="p-4 text-gray-400">データなし</p> :
           requests.map(req => (
            <div key={req.id} onClick={() => setSelectedId(req.id)}
              className={\`px-2 py-3 border-b cursor-pointer hover:bg-blue-50 transition-colors grid grid-cols-4 items-center gap-1 \${selectedId === req.id ? 'bg-blue-100 border-l-4 border-l-blue-600' : ''}\`}>
              <div className="col-span-1 font-bold text-gray-800 truncate" title={req.client_name}>{maskName(req.client_name)}</div>
              <div className="col-span-1 truncate text-xs text-gray-600">{req.facility}{req.use_days_count ? \`(\${req.use_days_count}日)\` : ''}</div>
              <div className="col-span-1 text-center text-xs">{formatDateShort(req.start_date)}</div>
              <div className="col-span-1 text-center font-bold text-red-600 text-xs">{formatDateShort(req.deadline)}</div>
              <div className="col-span-4 text-[10px] text-gray-400 mt-1 truncate pl-1">{req.client_address}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedData ? (
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            <DetailView data={selectedData} onUpdated={fetchRequests} />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
             左のリストから選択するか、新規作成してください。<br/>
             <span className="text-xs mt-2">ログイン中: {session.user.email}</span>
          </div>
        )}
      </div>
      {showModal && <CreateModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); fetchRequests(); }} />}
    </div>
  );
}`;

// --- 3. supabaseClient.js (RLS回避設定の削除) ---
const srcSupabase = `import { createClient } from '@supabase/supabase-js'

// ★URLとKeyはご自身のものが入っている前提です（上書き時に消えないよう注意してください）
// setup.js等で設定した内容は維持されませんが、手動で書き換えるか、
// もし以前の値を知りたい場合は今のファイルを確認してから実行してください。
const supabaseUrl = 'https://YOUR_PROJECT_ID.supabase.co'
const supabaseKey = 'YOUR_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseKey);`;

// --- ファイル書き込み処理 ---
const write = (filePath, content) => {
  const fullPath = path.join(__dirname, filePath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n');
  console.log('Modified: ' + filePath);
};

write('src/components/Login.jsx', srcLogin);
write('src/App.jsx', srcApp);
// write('src/supabaseClient.js', srcSupabase); // ★注意: 既にKeyを設定済みの場合はここをコメントアウトして実行してください！

console.log('------------------------------------------------');
console.log('ログイン機能を追加しました！');
console.log('supabaseClient.js のKeyがリセットされるのを防ぐため、');
console.log('今回はクライアントファイルの書き換えをスキップしています。');
console.log('もし persistSession: false の設定が残っている場合は、手動で削除してください。');
console.log('------------------------------------------------');