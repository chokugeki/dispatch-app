import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- ファイル内容の定義 ---

// src/components/CreateModal.jsx (入力バグ修正 & required調整)
const srcCreateModal = `import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { FACILITIES, ADL_LIST, CLIENT_TYPES, WEEKDAYS, IKIIKI_TIME_TYPES, IKIIKI_AMPM, generateReferenceTitle } from '../constants';
import { Save, X } from 'lucide-react';

export default function CreateModal({ onClose, onSaved }) {
  const [formData, setFormData] = useState({
    reporter_name: '', deadline: new Date().toISOString().slice(0,10),
    client_name: '', client_address: '', phone_number: '', remarks: '',
    facility: '', facility_time_type: '', facility_ampm: '',
    use_days_count: '', desired_weekdays: [], 
    adl: '', start_date: new Date().toISOString().slice(0,10), client_type: ''
  });

  useEffect(() => {
    const count = parseInt(formData.use_days_count) || 0;
    if (count > 0) {
      setFormData(prev => {
        const current = [...prev.desired_weekdays];
        if (current.length < count) return { ...prev, desired_weekdays: [...current, ...Array(count - current.length).fill('指定なし')] };
        else if (current.length > count) return { ...prev, desired_weekdays: current.slice(0, count) };
        return prev;
      });
    } else { setFormData(prev => ({ ...prev, desired_weekdays: [] })); }
  }, [formData.use_days_count]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? (value ? parseInt(value) : '') : value }));
  };
  
  const handleWeekdayChange = (index, value) => {
    const newWeekdays = [...formData.desired_weekdays];
    newWeekdays[index] = value;
    setFormData({ ...formData, desired_weekdays: newWeekdays });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.reporter_name) return alert("あなたの名前を入力してください。");
    if (!formData.deadline) return alert("返答期限を入力してください。");
    if (!formData.client_name) return alert("利用者氏名を入力してください。");
    if (!formData.client_address) return alert("利用者住所を入力してください。");
    if (!formData.facility) return alert("利用施設を選択してください。");
    if (!formData.use_days_count || isNaN(formData.use_days_count)) return alert("利用日数は数値を入力してください。");
    if (!formData.adl) return alert("ＡＤＬを選択してください。");
    if (!formData.start_date) return alert("利用開始希望日を入力してください。");
    if (!formData.client_type) return alert("利用者種類を選択してください。");

    const reference_title = generateReferenceTitle(formData);

    const { error } = await supabase.from('requests').insert([
      { ...formData, reference_title }
    ]);

    if(error) alert('保存エラー: ' + error.message);
    else { alert('保存しました！'); onSaved(); }
  };

  const Input = ({ label, name, type="text", val, onChange, full, placeholder, required=true }) => (
    <div className={full ? "col-span-2" : ""}>
      <label className="block text-xs font-bold text-gray-600 mb-1">{label}</label>
      <input type={type} name={name} value={val} onChange={onChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-200 outline-none" placeholder={placeholder} required={required} />
    </div>
  );
  const Select = ({ label, name, val, onChange, options, required=true }) => (
    <div>
      <label className="block text-xs font-bold text-gray-600 mb-1">{label}</label>
      <select name={name} value={val} onChange={onChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-200 outline-none bg-white" required={required}>
        <option value="">選択</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-blue-600 text-white p-3 px-6 font-bold flex justify-between items-center"><span>新規依頼登録</span><button onClick={onClose}><X size={20}/></button></div>
        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-2 gap-4 overflow-y-auto flex-1">
          <Input label="あなたの名前" name="reporter_name" val={formData.reporter_name} onChange={handleChange} />
          <Input label="返答期限" name="deadline" type="date" val={formData.deadline} onChange={handleChange} />
          <div className="col-span-2 border-t my-1"></div>
          <Input label="利用者氏名" name="client_name" val={formData.client_name} onChange={handleChange} />
          <Input label="電話番号" name="phone_number" val={formData.phone_number} onChange={handleChange} required={false} />
          <Input label="住所" name="client_address" val={formData.client_address} onChange={handleChange} full />
          <div className="col-span-2 border-t my-1"></div>
          <Select label="利用施設" name="facility" val={formData.facility} onChange={handleChange} options={FACILITIES} />
          {formData.facility === "いきいき▼" && (
            <div className="col-span-2 grid grid-cols-2 gap-4 bg-yellow-50 p-2 rounded">
               <Select label="利用時間タイプ" name="facility_time_type" val={formData.facility_time_type} onChange={handleChange} options={IKIIKI_TIME_TYPES} />
               <Select label="AM/PM" name="facility_ampm" val={formData.facility_ampm} onChange={handleChange} options={IKIIKI_AMPM} />
            </div>
          )}
          <Input label="利用日数 (半角数字)" name="use_days_count" type="number" val={formData.use_days_count} onChange={handleChange} placeholder="例: 3" />
          <div className="col-span-2">
            <label className="block text-xs font-bold text-gray-600 mb-1">曜日指定 ({formData.desired_weekdays.length}日分)</label>
            <div className="flex flex-wrap gap-2">
                {formData.desired_weekdays.map((w, i) => (
                    <select key={i} value={w} onChange={(e) => handleWeekdayChange(i, e.target.value)} className="border rounded p-1 text-sm bg-gray-50">
                        {WEEKDAYS.map(wd => <option key={wd} value={wd}>{wd}</option>)}
                    </select>
                ))}
            </div>
          </div>
          <div className="col-span-2 border-t my-1"></div>
          <Select label="ADL" name="adl" val={formData.adl} onChange={handleChange} options={ADL_LIST} />
          <Select label="利用者種類" name="client_type" val={formData.client_type} onChange={handleChange} options={CLIENT_TYPES} />
          <Input label="利用開始希望日" name="start_date" type="date" val={formData.start_date} onChange={handleChange} />
          <div className="col-span-2"><label className="block text-xs font-bold text-gray-600 mb-1">備考</label><textarea name="remarks" value={formData.remarks} onChange={handleChange} className="w-full border rounded p-2 h-20 text-sm" required={false}></textarea></div>
          <div className="col-span-2 pt-4 border-t flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">キャンセル</button>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2 font-bold"><Save size={18}/> 保存</button>
          </div>
        </form>
      </div>
    </div>
  );
}`;

// src/supabaseClient.js (RLS対策設定はSQLでやるので、ここはシンプルに戻す)
const srcSupabase = `import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://YOUR_PROJECT_ID.supabase.co'
const supabaseKey = 'YOUR_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseKey);`;

// src/App.jsx
const srcApp = `import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Layout, Plus } from 'lucide-react';
import { formatDateShort, maskName } from './utils';
import DetailView from './components/DetailView';
import CreateModal from './components/CreateModal';

export default function App() {
  const [requests, setRequests] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .order('created_at', { ascending: false }); 
    
    if (error) console.error('Error:', error);
    else setRequests(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const selectedData = requests.find(r => r.id === selectedId);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans text-sm">
      <div className="w-80 bg-white border-r flex flex-col shadow-sm z-10">
        <div className="p-3 border-b flex justify-between items-center bg-gray-50">
          <h1 className="font-bold text-gray-700 flex items-center gap-2">
            <Layout size={18} /> 依頼一覧
          </h1>
          <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white p-1.5 rounded hover:bg-blue-700 shadow-sm" title="新規作成">
            <Plus size={18} />
          </button>
        </div>
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
          <div className="flex-1 flex items-center justify-center text-gray-400">左のリストから選択するか、新規作成してください</div>
        )}
      </div>
      {showModal && <CreateModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); fetchRequests(); }} />}
    </div>
  );
}`;

// --- ファイル書き込み処理 ---
const write = (filePath, content) => {
  const fullPath = path.join(__dirname, filePath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n');
  console.log('Modified: ' + filePath);
};

write('src/components/CreateModal.jsx', srcCreateModal);
write('src/supabaseClient.js', srcSupabase);
write('src/App.jsx', srcApp);

console.log('------------------------------------------------');
console.log('すべてのファイルを修正しました！');
console.log('※重要: src/supabaseClient.js を開いて、URLとキーを再設定してください。');
console.log('------------------------------------------------');