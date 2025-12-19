import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 1. DetailView.jsx (印刷ボタンと印刷エリアIDの追加) ---
const srcDetailView = `import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { calculateDuration, formatDateShort } from '../utils';
import { Save, Printer } from 'lucide-react';

const SimpleInput = ({ label, val, onChange, ph, type="text" }) => (
    <div>
        <label className="block text-[10px] text-gray-500">{label}</label>
        <input type={type} className="w-full border rounded p-1 text-sm" value={val} onChange={(e)=>onChange(e.target.value)} placeholder={ph} />
    </div>
);

export default function DetailView({ data, onUpdated }) {
  const [resultsList, setResultsList] = useState([]);
  const [progressData, setProgressData] = useState({
    searcher: '', empty_flight_date: '', tag_date: '', user_check_date: '', boss_date: ''
  });
  
  const daysCount = data.use_days_count || 1;

  useEffect(() => {
    let initialList = [];
    if (Array.isArray(data.search_results) && data.search_results.length > 0) {
        initialList = data.search_results;
    } 
    if (initialList.length < daysCount) {
        const diff = daysCount - initialList.length;
        for(let i=0; i<diff; i++) {
            initialList.push({
                pickup: { car: '', bin: '', order: '', dep_time: '', client_arr: '', fac_arr: '' },
                dropoff: { car: '', bin: '', order: '', fac_dep: '', client_arr: '', fac_arr: '' }
            });
        }
    }
    setResultsList(initialList.slice(0, daysCount));

    if (data.progress_status) {
        setProgressData(prev => ({ ...prev, ...data.progress_status }));
    }
  }, [data.id, daysCount]);

  const handleResultChange = (index, section, field, value) => {
    setResultsList(prev => {
        const newList = [...prev];
        newList[index] = {
            ...newList[index],
            [section]: { ...newList[index][section], [field]: value }
        };
        return newList;
    });
  };

  const handleProgressChange = (field, value) => {
    setProgressData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    const { error } = await supabase
      .from('requests')
      .update({ search_results: resultsList, progress_status: progressData })
      .eq('id', data.id);
    
    if (error) alert('保存エラー: ' + error.message);
    else { alert('保存しました'); onUpdated(); }
  };

  // 印刷ボタンの処理
  const handlePrint = () => {
    window.print();
  };

  // 付箋リスト生成
  const getFusainList = () => {
     const line1 = \`←\${data.facility}\${data.facility_ampm || ''}\${data.facility_time_type || ''}\${data.client_name.substring(0,2)}\${data.client_address}\${data.client_type}\${data.adl}\`;
     const list = [];
     const startDate = formatDateShort(data.start_date);

     resultsList.forEach((res, index) => {
         const weekday = (data.desired_weekdays && data.desired_weekdays[index]) ? data.desired_weekdays[index] : \`\${index+1}日目\`;
         const p = res.pickup;
         const pickupLine = \`\${weekday}迎え\${p.car}-\${p.bin}-\${p.order}→家\${p.client_arr}→P着\${p.fac_arr}（開始日\${startDate}）\`;
         list.push({ type: '迎え', day: weekday, line1, line2: pickupLine });

         const d = res.dropoff;
         const dropoffLine = \`\${weekday}送り\${d.car}-\${d.bin}-\${d.order}→P発\${d.fac_dep}→家\${d.client_arr}（開始日\${startDate}）\`;
         list.push({ type: '送り', day: weekday, line1, line2: dropoffLine });
     });
     
     return list;
  };

  const fusainList = getFusainList();

  return (
    <div className="bg-white shadow rounded-lg max-w-5xl mx-auto border border-gray-200 min-h-[600px] flex flex-col">
      {/* 画面上部の要素（印刷時は消える） */}
      <div className="grid grid-cols-7 text-xs text-center border-b font-bold text-gray-700 select-none no-print">
        {['依頼', '期限', 'サーチャー', '空便報告', '付箋貼付', '利用者確認', 'BOSS登録'].map((label, i) => (
          <div key={label} className={\`p-2 border-r last:border-r-0 \${i<3 ? 'bg-yellow-200' : 'bg-orange-200'}\`}>{label}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 text-xs border-b bg-gray-50 p-2 gap-1 items-center no-print">
         <div className="text-center font-bold text-gray-600">{data.reporter_name}</div>
         <div className="text-center font-bold text-red-600">{formatDateShort(data.deadline)}</div>
         <div><input className="w-full border rounded p-1 text-center" placeholder="入力" value={progressData.searcher} onChange={(e)=>handleProgressChange('searcher', e.target.value)} /></div>
         <div><input type="date" className="w-full border rounded p-1" value={progressData.empty_flight_date} onChange={(e)=>handleProgressChange('empty_flight_date', e.target.value)} /></div>
         <div><input type="date" className="w-full border rounded p-1" value={progressData.tag_date} onChange={(e)=>handleProgressChange('tag_date', e.target.value)} /></div>
         <div><input type="date" className="w-full border rounded p-1" value={progressData.user_check_date} onChange={(e)=>handleProgressChange('user_check_date', e.target.value)} /></div>
         <div><input type="date" className="w-full border rounded p-1" value={progressData.boss_date} onChange={(e)=>handleProgressChange('boss_date', e.target.value)} /></div>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        <div className="mb-6 bg-blue-50 p-4 rounded border border-blue-100 no-print">
            <div className="flex justify-between items-start mb-2">
                <h2 className="text-xl font-bold text-gray-800">{data.client_name} <span className="text-sm font-normal">様</span></h2>
                <div className="text-gray-500 text-sm">利用日数: {daysCount}日</div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="font-bold text-gray-500">施設:</span> {data.facility} {data.facility_ampm} {data.facility_time_type}</div>
                <div><span className="font-bold text-gray-500">住所:</span> {data.client_address}</div>
                <div><span className="font-bold text-gray-500">電話:</span> {data.phone_number}</div>
                <div><span className="font-bold text-gray-500">備考:</span> {data.remarks}</div>
            </div>
        </div>

        <div className="border rounded-lg overflow-hidden mb-6 bg-white no-print">
            <div className="bg-gray-100 p-2 font-bold text-gray-700 text-sm border-b flex justify-between items-center">
                <span>配車サーチ結果入力 ({resultsList.length}日分)</span>
                <button onClick={handleSave} className="bg-green-600 text-white px-3 py-1 text-xs rounded shadow hover:bg-green-700 flex items-center gap-1">
                    <Save size={12} /> 保存
                </button>
            </div>
            {resultsList.map((res, index) => {
                const weekday = (data.desired_weekdays && data.desired_weekdays[index]) ? data.desired_weekdays[index] : \`\${index+1}日目\`;
                const stayTime = calculateDuration(res.pickup.fac_arr, res.dropoff.fac_dep);
                return (
                    <div key={index} className="p-4 border-b last:border-b-0">
                        <div className="font-bold text-sm mb-2 bg-gray-200 px-2 py-1 inline-block rounded">{weekday}</div>
                        <div className="grid grid-cols-1 gap-4 pl-2">
                            <div className="flex gap-2 items-center">
                                <span className="text-xs font-bold text-blue-600 w-10">迎え</span>
                                <div className="grid grid-cols-5 gap-2 flex-1">
                                    <SimpleInput label="車両・便" val={res.pickup.car} onChange={(v)=>handleResultChange(index,'pickup','car',v)} ph="タント" />
                                    <SimpleInput label="便数" val={res.pickup.bin} onChange={(v)=>handleResultChange(index,'pickup','bin',v)} ph="1便" />
                                    <SimpleInput label="順番" val={res.pickup.order} onChange={(v)=>handleResultChange(index,'pickup','order',v)} ph="1" />
                                    <SimpleInput label="利用者着" val={res.pickup.client_arr} onChange={(v)=>handleResultChange(index,'pickup','client_arr',v)} ph="09:00" type="time" />
                                    <SimpleInput label="施設着" val={res.pickup.fac_arr} onChange={(v)=>handleResultChange(index,'pickup','fac_arr',v)} ph="09:30" type="time" />
                                </div>
                            </div>
                            <div className="flex gap-2 items-center">
                                <span className="text-xs font-bold text-orange-600 w-10">送り</span>
                                <div className="grid grid-cols-5 gap-2 flex-1">
                                    <SimpleInput label="車両・便" val={res.dropoff.car} onChange={(v)=>handleResultChange(index,'dropoff','car',v)} ph="シエンタ" />
                                    <SimpleInput label="便数" val={res.dropoff.bin} onChange={(v)=>handleResultChange(index,'dropoff','bin',v)} ph="2便" />
                                    <SimpleInput label="順番" val={res.dropoff.order} onChange={(v)=>handleResultChange(index,'dropoff','order',v)} ph="2" />
                                    <SimpleInput label="施設発" val={res.dropoff.fac_dep} onChange={(v)=>handleResultChange(index,'dropoff','fac_dep',v)} ph="16:00" type="time" />
                                    <SimpleInput label="利用者着" val={res.dropoff.client_arr} onChange={(v)=>handleResultChange(index,'dropoff','client_arr',v)} ph="16:30" type="time" />
                                </div>
                            </div>
                            <div className="flex justify-end items-center gap-2">
                                <span className="text-xs text-gray-500">施設滞在時間:</span>
                                <span className="text-sm font-bold text-gray-800">{stayTime || '--:--'}</span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>

        <div className="border-t pt-4">
            <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2 no-print">
                <Printer size={16}/> 付箋印刷プレビュー (8pt)
                <button onClick={handlePrint} className="ml-4 bg-gray-700 text-white px-3 py-1 rounded text-xs hover:bg-black transition-colors">
                    印刷する
                </button>
            </h3>
            
            {/* ★ここが印刷対象エリア (ID: printable-fusain-area) */}
            <div id="printable-fusain-area" className="flex flex-wrap gap-4">
                {fusainList.map((f, i) => (
                    <div key={i} className="fusain-card border border-gray-300 bg-white shadow-sm p-2 w-[300px] hover:border-blue-400 transition-colors">
                        <div className="text-xxs font-sans leading-tight">
                            <div>{f.line1}</div>
                            <div>{f.line2}</div>
                        </div>
                        <div className="mt-1 border-t pt-1 flex justify-between items-center text-[10px] text-gray-400">
                            <span>{f.day} - {f.type}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
}`;

// --- 2. index.css (印刷用スタイルの追加) ---
const srcIndexCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer utilities {
  .text-xxs {
    font-size: 8pt; /* 付箋印刷用 */
    line-height: 1.1;
  }
}

/* 印刷時のスタイル設定 */
@media print {
  /* 全体を隠す */
  body * {
    visibility: hidden;
  }
  
  /* 印刷対象エリアとその中身だけを表示 */
  #printable-fusain-area, #printable-fusain-area * {
    visibility: visible;
  }

  /* 印刷対象エリアをページの左上に配置 */
  #printable-fusain-area {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    margin: 0;
    padding: 20px;
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
  }

  /* カードのスタイル調整（影などを消す） */
  .fusain-card {
    border: 1px solid #ccc !important;
    box-shadow: none !important;
    break-inside: avoid; /* 途中でページ分割されないように */
  }

  /* no-printクラスが付いているものは確実に消す */
  .no-print {
    display: none !important;
  }
}`;

// --- ファイル書き込み処理 ---
const write = (filePath, content) => {
  const fullPath = path.join(__dirname, filePath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n');
  console.log('Modified: ' + filePath);
};

write('src/components/DetailView.jsx', srcDetailView);
write('src/index.css', srcIndexCss);

console.log('------------------------------------------------');
console.log('印刷ボタン機能と印刷レイアウトを追加しました！');
console.log('------------------------------------------------');