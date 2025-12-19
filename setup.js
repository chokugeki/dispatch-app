import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 1. ファイル内容の定義 ---

// tailwind.config.js (v3互換)
const tailwindConfig = `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`;

// postcss.config.js
const postcssConfig = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;

// vite.config.js (GitHub Pages用設定入り)
const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', 
})`;

// src/constants.js
const srcConstants = `export const FACILITIES = ["花笑み", "わくわく", "いきいき▼", "その他"];
export const ADL_LIST = ["独歩", "杖歩行", "手押車", "車椅子", "ストレッチャー"];
export const CLIENT_TYPES = ["新規", "臨時", "利用日追加", "復活", "曜日変更"];
export const WEEKDAYS = ["月", "火", "水", "木", "金", "土", "指定なし"];
export const IKIIKI_TIME_TYPES = ["3時間", "1.5時間"];
export const IKIIKI_AMPM = ["AM", "PM"];

export const generateReferenceTitle = (data) => {
  const dateStr = new Date().toISOString().slice(0,10).replace(/-/g, '');
  const startStr = data.start_date ? data.start_date.replace(/-/g, '') : '';
  let name = \`\${dateStr}_\${data.client_name}_\${data.client_type}_\${data.facility}_\${startStr}_\${data.reporter_name}\`;
  return name.replace(/[\\\\/:*?"<>|]/g, "_");
};`;

// src/utils.js
const srcUtils = `import { format, parseISO, differenceInMinutes } from 'date-fns';

export const formatDateShort = (dateStr) => {
  if(!dateStr) return "";
  try {
    const d = parseISO(dateStr);
    return format(d, 'MM/dd');
  } catch (e) { return dateStr; }
};

export const maskName = (name) => {
  if (!name) return "";
  if (name.length <= 2) return name;
  return name.substring(0, 2) + "*".repeat(name.length - 2); 
};

export const calculateDuration = (start, end) => {
  if (!start || !end) return "";
  try {
    const d1 = new Date(\`2000-01-01T\${start}\`);
    const d2 = new Date(\`2000-01-01T\${end}\`);
    const diffMins = differenceInMinutes(d2, d1);
    if (isNaN(diffMins)) return "";
    const h = Math.floor(diffMins / 60);
    const m = diffMins % 60;
    return \`\${h}:\${m.toString().padStart(2, '0')}\`;
  } catch (e) { return ""; }
};`;

// src/supabaseClient.js
const srcSupabase = `import { createClient } from '@supabase/supabase-js'

// ★ここにSupabaseのURLとAnon Keyを貼り付けてください
const supabaseUrl = 'https://YOUR_PROJECT_ID.supabase.co'
const supabaseKey = 'YOUR_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseKey)`;

// src/App.jsx (降順表示に対応済み)
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
      .order('created_at', { ascending: false }); // 新しい順
    
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

// src/components/CreateModal.jsx
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

  const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});
  const handleWeekdayChange = (index, value) => {
    const newWeekdays = [...formData.desired_weekdays];
    newWeekdays[index] = value;
    setFormData({ ...formData, desired_weekdays: newWeekdays });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!formData.reporter_name || !formData.client_name) return alert('必須項目を入力してください');
    const reference_title = generateReferenceTitle(formData);
    const { error } = await supabase.from('requests').insert([{ ...formData, reference_title }]);
    if(error) alert('エラー: ' + error.message);
    else { alert('保存しました！'); onSaved(); }
  };

  const Input = ({ label, name, type="text", val, onChange, full, placeholder }) => (
    <div className={full ? "col-span-2" : ""}>
      <label className="block text-xs font-bold text-gray-600 mb-1">{label}</label>
      <input type={type} name={name} value={val} onChange={onChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-200 outline-none" placeholder={placeholder} required={type!=="number"} />
    </div>
  );
  const Select = ({ label, name, val, onChange, options }) => (
    <div>
      <label className="block text-xs font-bold text-gray-600 mb-1">{label}</label>
      <select name={name} value={val} onChange={onChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-200 outline-none bg-white">
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
          <Input label="電話番号" name="phone_number" val={formData.phone_number} onChange={handleChange} />
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
          <div className="col-span-2"><label className="block text-xs font-bold text-gray-600 mb-1">備考</label><textarea name="remarks" value={formData.remarks} onChange={handleChange} className="w-full border rounded p-2 h-20 text-sm"></textarea></div>
          <div className="col-span-2 pt-4 border-t flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">キャンセル</button>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2 font-bold"><Save size={18}/> 保存</button>
          </div>
        </form>
      </div>
    </div>
  );
}`;

// src/components/DetailView.jsx
const srcDetailView = `import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { calculateDuration, formatDateShort } from '../utils';
import { Save, Printer } from 'lucide-react';

export default function DetailView({ data, onUpdated }) {
  const [results, setResults] = useState({
     pickup: { car: '', bin: '', order: '', dep_time: '', client_arr: '', fac_arr: '' },
     dropoff: { car: '', bin: '', order: '', fac_dep: '', client_arr: '', fac_arr: '' },
     conditions: ''
  });
  
  useEffect(() => {
    if (data.search_results) {
        setResults({
            pickup: { ...results.pickup, ...data.search_results.pickup },
            dropoff: { ...results.dropoff, ...data.search_results.dropoff },
            conditions: data.search_results.conditions || ''
        });
    } else {
        setResults({
            pickup: { car: '', bin: '', order: '', dep_time: '', client_arr: '', fac_arr: '' },
            dropoff: { car: '', bin: '', order: '', fac_dep: '', client_arr: '', fac_arr: '' },
            conditions: ''
        });
    }
  }, [data.id]);

  const handleChange = (section, field, value) => {
    setResults(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
  };

  const handleSave = async () => {
    const { error } = await supabase.from('requests').update({ search_results: results }).eq('id', data.id);
    if (error) alert('保存エラー: ' + error.message); else { alert('配車結果を保存しました'); onUpdated(); }
  };

  const stayTime = calculateDuration(results.pickup.fac_arr, results.dropoff.fac_dep);
  const getFusainText = () => {
     const line1 = \`←\${data.facility}\${data.facility_ampm || ''}\${data.facility_time_type || ''}\${data.client_name.substring(0,2)}\${data.client_address}\${data.client_type}\${data.adl}\`;
     const weekdays = data.desired_weekdays ? data.desired_weekdays.join('') : '';
     const p = results.pickup;
     const line2 = \`\${weekdays}迎え\${p.car}-\${p.bin}-\${p.order}→家\${p.client_arr}→P着\${p.fac_arr}（開始日\${formatDateShort(data.start_date)}）\`;
     return { line1, line2 };
  };
  const fusain = getFusainText();
  const SimpleInput = ({ label, val, onChange, ph, type="text" }) => (
    <div><label className="block text-[10px] text-gray-500">{label}</label><input type={type} className="w-full border rounded p-1 text-sm" value={val} onChange={(e)=>onChange(e.target.value)} placeholder={ph} /></div>
  );

  return (
    <div className="bg-white shadow rounded-lg max-w-5xl mx-auto border border-gray-200 min-h-[600px] flex flex-col">
      <div className="grid grid-cols-7 text-xs text-center border-b font-bold text-gray-700 select-none">
        {['依頼', '期限', 'サーチャー', '空便報告', '付箋貼付', '利用者確認', 'BOSS登録'].map((label, i) => (
          <div key={label} className={\`p-2 border-r last:border-r-0 cursor-pointer hover:opacity-80 \${i<3 ? 'bg-yellow-200' : 'bg-orange-200'}\`}>{label}</div>
        ))}
      </div>
      <div className="p-6 flex-1 overflow-y-auto">
        <div className="mb-6 bg-blue-50 p-4 rounded border border-blue-100">
            <div className="flex justify-between items-start mb-2"><h2 className="text-xl font-bold text-gray-800">{data.client_name} <span className="text-sm font-normal">様</span></h2><div className="text-red-600 font-bold">期限: {data.deadline}</div></div>
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="font-bold text-gray-500">施設:</span> {data.facility} {data.facility_ampm} {data.facility_time_type}</div>
                <div><span className="font-bold text-gray-500">住所:</span> {data.client_address}</div>
                <div><span className="font-bold text-gray-500">電話:</span> {data.phone_number}</div>
                <div><span className="font-bold text-gray-500">備考:</span> {data.remarks}</div>
                <div><span className="font-bold text-gray-500">曜日:</span> {data.desired_weekdays && data.desired_weekdays.join(', ')}</div>
            </div>
        </div>
        <div className="border rounded-lg overflow-hidden mb-6">
            <div className="bg-gray-100 p-2 font-bold text-gray-700 text-sm border-b">配車サーチ結果入力</div>
            <div className="p-4 grid grid-cols-1 gap-6">
                <div>
                    <div className="text-xs font-bold text-blue-600 mb-1">【迎え】</div>
                    <div className="grid grid-cols-5 gap-2">
                        <SimpleInput label="車両・便" val={results.pickup.car} onChange={(v)=>handleChange('pickup','car',v)} ph="タント" />
                        <SimpleInput label="便数" val={results.pickup.bin} onChange={(v)=>handleChange('pickup','bin',v)} ph="1便" />
                        <SimpleInput label="順番" val={results.pickup.order} onChange={(v)=>handleChange('pickup','order',v)} ph="1" />
                        <SimpleInput label="利用者着" val={results.pickup.client_arr} onChange={(v)=>handleChange('pickup','client_arr',v)} ph="09:00" type="time" />
                        <SimpleInput label="施設着" val={results.pickup.fac_arr} onChange={(v)=>handleChange('pickup','fac_arr',v)} ph="09:30" type="time" />
                    </div>
                </div>
                <div>
                    <div className="text-xs font-bold text-orange-600 mb-1">【送り】</div>
                    <div className="grid grid-cols-5 gap-2">
                        <SimpleInput label="車両・便" val={results.dropoff.car} onChange={(v)=>handleChange('dropoff','car',v)} ph="シエンタ" />
                        <SimpleInput label="便数" val={results.dropoff.bin} onChange={(v)=>handleChange('dropoff','bin',v)} ph="2便" />
                        <SimpleInput label="順番" val={results.dropoff.order} onChange={(v)=>handleChange('dropoff','order',v)} ph="2" />
                        <SimpleInput label="施設発" val={results.dropoff.fac_dep} onChange={(v)=>handleChange('dropoff','fac_dep',v)} ph="16:00" type="time" />
                        <SimpleInput label="利用者着" val={results.dropoff.client_arr} onChange={(v)=>handleChange('dropoff','client_arr',v)} ph="16:30" type="time" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                     <div className="bg-gray-50 p-2 rounded border text-center"><div className="text-xs text-gray-500">施設滞在時間</div><div className="text-xl font-bold text-gray-800 h-8">{stayTime || '--:--'}</div></div>
                     <div><label className="text-xs font-bold text-gray-600">成立条件</label><input className="w-full border p-2 rounded text-sm" value={results.conditions} onChange={(e)=>setResults({...results, conditions: e.target.value})} placeholder="条件を入力" /></div>
                </div>
                <div className="text-right"><button onClick={handleSave} className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 flex items-center gap-2 ml-auto"><Save size={16} /> 保存する</button></div>
            </div>
        </div>
        <div className="border-t pt-4">
            <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2"><Printer size={16}/> 付箋印刷プレビュー (8pt)</h3>
            <div className="border border-gray-300 p-2 bg-white w-[300px]">
                <div className="text-xxs font-sans leading-tight">{fusain.line1}<br/>{fusain.line2}</div>
            </div>
            <p className="text-xs text-gray-400 mt-1">※このエリアをコピーして印刷用ソフトに貼り付けてください</p>
        </div>
      </div>
    </div>
  );
}`;

// github workflow
const githubWorkflow = `name: Deploy static content to Pages
on:
  push:
    branches: ["main"]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: "pages"
  cancel-in-progress: false
jobs:
  deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Setup Pages
        uses: actions/configure-pages@v5
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'
      - name: Deploy to GitHub Pages
        uses: actions/deploy-pages@v4
`;

// --- 2. ファイル書き込み処理 ---

const write = (filePath, content) => {
  const fullPath = path.join(__dirname, filePath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content.trim());
  console.log('Created: ' + filePath);
};

write('tailwind.config.js', tailwindConfig);
write('postcss.config.js', postcssConfig);
write('vite.config.js', viteConfig);
write('src/constants.js', srcConstants);
write('src/utils.js', srcUtils);
write('src/supabaseClient.js', srcSupabase);
write('src/App.jsx', srcApp);
write('src/components/CreateModal.jsx', srcCreateModal);
write('src/components/DetailView.jsx', srcDetailView);
write('.github/workflows/static.yml', githubWorkflow);

console.log('------------------------------------------------');
console.log('すべてのファイルを再作成しました！');
console.log('※重要: src/supabaseClient.js を開いて、URLとキーを再設定してください。');
console.log('------------------------------------------------');