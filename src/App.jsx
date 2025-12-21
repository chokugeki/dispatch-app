import React, { useState, useEffect } from 'react';
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
                  className={`px-2 py-3 border-b cursor-pointer hover:bg-blue-50 transition-colors grid grid-cols-4 items-center gap-1 ${selectedId === req.id ? 'bg-blue-100 border-l-4 border-l-blue-600' : ''}`}>
                  <div className="col-span-1 font-bold text-gray-800 truncate" title={req.client_name}>{maskName(req.client_name)}</div>
                  <div className="col-span-1 truncate text-xs text-gray-600">{req.facility}{req.use_days_count ? `(${req.use_days_count}日)` : ''}</div>
                  <div className="col-span-1 text-center text-xs">{formatDateShort(req.start_date)}</div>
                  <div className="col-span-1 text-center">
                    <div className="font-bold text-red-600 text-xs">{formatDateShort(req.deadline)}</div>
                    <div className="flex justify-center gap-2 mt-1">
                      {(() => {
                        const hasEmpty = !!(req.progress_status && req.progress_status.empty_flight_date);
                        const hasUser = !!(req.progress_status && req.progress_status.user_check_date);
                        const hasBoss = !!(req.progress_status && req.progress_status.boss_date);
                        return (
                          <>
                            <span title="空瓶報告" className={`w-3 h-3 rounded-full ${hasEmpty ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <span title="利用者確認" className={`w-3 h-3 rounded-full ${hasUser ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <span title="BOSS登録" className={`w-3 h-3 rounded-full ${hasBoss ? 'bg-green-500' : 'bg-gray-300'}`} />
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="col-span-4 text-[10px] text-gray-400 mt-1 truncate pl-1">{req.client_address}</div>
                </div>
              ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedData ? (
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            <DetailView
              data={selectedData}
              onUpdated={() => {
                console.log("App: onUpdated called");
                fetchRequests();
              }}
              onDeleted={() => {
                console.log("App: onDeleted called, clearing selectedId");
                setSelectedId(null);
                fetchRequests();
              }}
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            左のリストから選択するか、新規作成してください。<br />
            <span className="text-xs mt-2">ログイン中: {session.user.email}</span>
          </div>
        )}
      </div>
      {showModal && <CreateModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); fetchRequests(); }} />}
    </div>
  );
}
