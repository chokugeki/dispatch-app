import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 1. CreateModal.jsx (利用日数を7日までに制限) ---
const srcCreateModal = `import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { FACILITIES, ADL_LIST, CLIENT_TYPES, WEEKDAYS, IKIIKI_TIME_TYPES, IKIIKI_AMPM, generateReferenceTitle } from '../constants';
import { Save, X } from 'lucide-react';

const Input = ({ label, name, type="text", val, onChange, full, placeholder, required=true, max, min }) => (
  <div className={full ? "col-span-2" : ""}>
    <label className="block text-xs font-bold text-gray-600 mb-1">{label}</label>
    <input 
      type={type} 
      name={name} 
      value={val} 
      onChange={onChange} 
      className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-200 outline-none" 
      placeholder={placeholder} 
      required={required}
      max={max}
      min={min}
    />
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
    let finalValue = value;
    
    // ★利用日数の制限ロジック (最大7)
    if (name === 'use_days_count' && value !== '') {
        const num = parseInt(value);
        if (num > 7) {
            alert('利用日数は最大7日までです。');
            finalValue = 7;
        } else if (num < 1) {
            finalValue = 1;
        }
    }

    setFormData(prev => ({ ...prev, [name]: type === 'number' ? (finalValue ? parseInt(finalValue) : '') : finalValue }));
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
    
    const reference_title = generateReferenceTitle(formData);

    const { error } = await supabase.from('requests').insert([
      { ...formData, reference_title }
    ]);

    if(error) alert('保存エラー: ' + error.message);
    else { alert('保存しました！'); onSaved(); }
  };

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
          <Input label="利用日数 (最大7日)" name="use_days_count" type="number" val={formData.use_days_count} onChange={handleChange} placeholder="例: 3" max={7} min={1} />
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
}
`;

// --- 2. DetailView.jsx (詳細印刷機能の追加) ---
const srcDetailView = `import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { calculateDuration, formatDateShort } from '../utils';
import { Save, Printer, FileText } from 'lucide-react';

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

  // ★印刷処理 (target: 'fusain' or 'detail')
  const handlePrint = (target) => {
    // bodyに印刷モードのクラスを付与
    document.body.classList.add('printing-' + target);
    window.print();
    // 印刷ダイアログが閉じたらクラスを削除 (ダイアログ表示中はJSが止まることが多いが、念のためsetTimeout)
    setTimeout(() => {
        document.body.classList.remove('printing-' + target);
    }, 500);
  };

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
      {/* 印刷対象外のヘッダー */}
      <div className="grid grid-cols-7 text-xs text-center border-b font-bold text-gray-700 select-none no-print">
        {['依頼', '期限', 'サーチャー', '空便報告', '付箋貼付', '利用者確認', 'BOSS登録'].map((label, i) => (
          <div key={label} className={\`p-2 border-r last:border-r-0 \${i<3 ? 'bg-yellow-200' : 'bg-orange-200'}\`}>{label}</div>
        ))}
      </div>

      {/* ★詳細印刷対象エリア (ここから) */}
      <div id="printable-detail-area">
          <div className="grid grid-cols-7 text-xs border-b bg-gray-50 p-2 gap-1 items-center">
             <div className="text-center font-bold text-gray-600">{data.reporter_name}</div>
             <div className="text-center font-bold text-red-600">{formatDateShort(data.deadline)}</div>
             <div><input className="w-full border rounded p-1 text-center" placeholder="サーチャー" value={progressData.searcher} onChange={(e)=>handleProgressChange('searcher', e.target.value)} /></div>
             <div><input type="date" className="w-full border rounded p-1" value={progressData.empty_flight_date} onChange={(e)=>handleProgressChange('empty_flight_date', e.target.value)} /></div>
             <div><input type="date" className="w-full border rounded p-1" value={progressData.tag_date} onChange={(e)=>handleProgressChange('tag_date', e.target.value)} /></div>
             <div><input type="date" className="w-full border rounded p-1" value={progressData.user_check_date} onChange={(e)=>handleProgressChange('user_check_date', e.target.value)} /></div>
             <div><input type="date" className="w-full border rounded p-1" value={progressData.boss_date} onChange={(e)=>handleProgressChange('boss_date', e.target.value)} /></div>
          </div>

          <div className="p-6">
            <div className="mb-6 bg-blue-50 p-4 rounded border border-blue-100">
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

            <div className="border rounded-lg overflow-hidden mb-6 bg-white">
                <div className="bg-gray-100 p-2 font-bold text-gray-700 text-sm border-b flex justify-between items-center">
                    <span>配車サーチ結果 ({resultsList.length}日分)</span>
                    <div className="flex gap-2 no-print">
                        <button onClick={()=>handlePrint('detail')} className="bg-gray-600 text-white px-3 py-1 text-xs rounded shadow hover:bg-gray-700 flex items-center gap-1">
                            <FileText size={12} /> A4詳細印刷
                        </button>
                        <button onClick={handleSave} className="bg-green-600 text-white px-3 py-1 text-xs rounded shadow hover:bg-green-700 flex items-center gap-1">
                            <Save size={12} /> 保存
                        </button>
                    </div>
                </div>
                {resultsList.map((res, index) => {
                    const weekday = (data.desired_weekdays && data.desired_weekdays[index]) ? data.desired_weekdays[index] : \`\${index+1}日目\`;
                    const stayTime = calculateDuration(res.pickup.fac_arr, res.dropoff.fac_dep);
                    return (
                        <div key={index} className="p-4 border-b last:border-b-0 break-inside-avoid">
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
          </div>
      </div>
      {/* ★詳細印刷対象エリア (ここまで) */}

      <div className="p-6 pt-0 border-t">
          <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2 mt-4 no-print">
              <Printer size={16}/> 付箋印刷プレビュー (8pt)
              <button onClick={()=>handlePrint('fusain')} className="ml-4 bg-gray-700 text-white px-3 py-1 rounded text-xs hover:bg-black transition-colors">
                  付箋のみ印刷
              </button>
          </h3>
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
  );
}`;

// --- 3. index.css (2つの印刷モードに対応) ---
const srcIndexCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer utilities {
  .text-xxs {
    font-size: 8pt;
    line-height: 1.1;
  }
}

@media print {
  /* 全要素を非表示 */
  body * {
    visibility: hidden;
  }

  /* --- 付箋印刷モード --- */
  body.printing-fusain #printable-fusain-area, 
  body.printing-fusain #printable-fusain-area * {
    visibility: visible;
  }
  body.printing-fusain #printable-fusain-area {
    position: absolute; left: 0; top: 0; width: 100%;
    margin: 0; padding: 20px;
    display: flex; flex-wrap: wrap; gap: 20px;
  }
  body.printing-fusain .fusain-card {
    border: 1px solid #ccc !important; box-shadow: none !important; break-inside: avoid;
  }

  /* --- 詳細(A4)印刷モード --- */
  body.printing-detail #printable-detail-area,
  body.printing-detail #printable-detail-area * {
    visibility: visible;
  }
  body.printing-detail #printable-detail-area {
    position: absolute; left: 0; top: 0; width: 100%;
    margin: 0; padding: 0;
  }
  body.printing-detail .break-inside-avoid {
    break-inside: avoid;
  }

  /* 印刷除外クラス */
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

write('src/components/CreateModal.jsx', srcCreateModal);
write('src/components/DetailView.jsx', srcDetailView);
write('src/index.css', srcIndexCss);

console.log('------------------------------------------------');
console.log('日数制限(7日)と詳細印刷機能を追加しました！');
console.log('------------------------------------------------');