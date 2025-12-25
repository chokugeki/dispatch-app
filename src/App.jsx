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
  const [editingData, setEditingData] = useState(null);
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
    <div className="flex h-screen bg-gray-200 overflow-hidden font-sans text-base text-gray-900">
      <div className="w-80 bg-white border-r flex flex-col shadow-sm z-10">
        <div className="p-3 border-b flex justify-between items-center bg-gray-100">
          <h1 className="font-bold text-gray-900 flex items-center gap-2">
            <Layout size={20} /> 依頼一覧
          </h1>
          <div className="flex gap-2">
            <button onClick={() => setShowModal(true)} className="bg-blue-700 text-white px-3 py-2 rounded hover:bg-blue-800 shadow-sm flex items-center gap-1 font-bold text-sm" title="新規作成">
              新規依頼書
            </button>
            <button onClick={handleLogout} className="bg-gray-500 text-white p-2 rounded hover:bg-gray-600 shadow-sm" title="ログアウト">
              <LogOut size={20} />
            </button>
          </div>
        </div>

        {/* ヘッダー行 */}
        <div className="grid grid-cols-4 px-2 py-1 bg-gray-300 text-sm font-black text-gray-800 border-b">
          <div className="col-span-1 border-r border-gray-400 flex flex-col justify-center">
            <div className="border-b border-gray-400 pb-0.5">氏名</div>
            <div className="pt-0.5 truncate">住所</div>
          </div>
          <div className="col-span-1 border-r border-gray-400 flex flex-col justify-center pl-1">
            <div className="border-b border-gray-400 pb-0.5">施設 (日数)</div>
            <div className="pt-0.5">ADL/種類</div>
          </div>
          <div className="col-span-1 border-r border-gray-400 flex flex-col justify-center text-center">
            <div className="border-b border-gray-400 pb-0.5">開始日</div>
            <div className="pt-0.5">進捗</div>
          </div>
          <div className="col-span-1 flex flex-col justify-center text-center text-red-700">
            <div className="border-b border-gray-400 pb-0.5">返答期限</div>
            <div className="pt-0.5">詳細</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? <p className="p-4 text-gray-500">Loading...</p> :
            requests.length === 0 ? <p className="p-4 text-gray-400">データなし</p> :
              requests.map(req => {
                const getFacilityBg = (facility) => {
                  if (!facility) return "bg-white";
                  if (facility.includes("わくわく")) return "bg-pink-100";
                  if (facility.includes("花笑み")) return "bg-yellow-100";
                  if (facility.includes("いきいき")) return "bg-blue-100";
                  return "bg-white";
                };
                return (
                  <div key={req.id} onClick={() => setSelectedId(req.id)}
                    className={`px-2 py-2 border-b cursor-pointer hover:opacity-80 transition-opacity grid grid-cols-4 items-center gap-1 ${getFacilityBg(req.facility)} ${selectedId === req.id ? 'ring-2 ring-blue-600 z-10' : ''}`}>
                    <div className="col-span-1 flex flex-col truncate">
                      <div className="font-black text-gray-900 truncate text-lg" title={req.client_name}>{maskName(req.client_name)}</div>
                      <div className="text-xs text-gray-600 truncate">{req.client_address}</div>
                    </div>
                    <div className="col-span-1 truncate flex flex-col pl-1">
                      <div className="text-sm font-bold text-gray-800 truncate">{req.facility}{req.use_days_count ? `(${req.use_days_count})` : ''}</div>
                      <div className="text-xs text-gray-600 truncate">{req.adl} / {req.client_type}</div>
                    </div>
                    <div className="col-span-1 text-center flex flex-col">
                      <div className="text-sm font-bold text-gray-700">{formatDateShort(req.start_date)}</div>
                      <div className="flex justify-center gap-1 mt-0.5">
                        {(() => {
                          const hasEmpty = !!(req.progress_status && req.progress_status.empty_flight_date);
                          const hasTag = !!(req.progress_status && req.progress_status.tag_date);
                          const hasUser = !!(req.progress_status && req.progress_status.user_check_date);
                          const hasBoss = !!(req.progress_status && req.progress_status.boss_date);
                          return (
                            <>
                              <span title="空便報告" className={`w-2.5 h-2.5 rounded-full ${hasEmpty ? 'bg-green-600' : 'bg-gray-300'}`} />
                              <span title="付箋貼付" className={`w-2.5 h-2.5 rounded-full ${hasTag ? 'bg-green-600' : 'bg-gray-300'}`} />
                              <span title="利用者確認" className={`w-2.5 h-2.5 rounded-full ${hasUser ? 'bg-green-600' : 'bg-gray-300'}`} />
                              <span title="BOSS登録" className={`w-2.5 h-2.5 rounded-full ${hasBoss ? 'bg-green-600' : 'bg-gray-300'}`} />
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    <div className="col-span-1 text-center flex flex-col">
                      <div className="font-black text-red-700 text-sm">{formatDateShort(req.deadline)}</div>
                      <div className="text-xs text-blue-600 font-bold mt-0.5">詳細...</div>
                    </div>
                  </div>
                );
              })}
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
              onEdit={(data) => {
                setEditingData(data);
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
      {editingData && (
        <CreateModal
          initialData={editingData}
          onClose={() => setEditingData(null)}
          onSaved={() => {
            setEditingData(null);
            fetchRequests();
          }}
        />
      )}
    </div>
  );
}
