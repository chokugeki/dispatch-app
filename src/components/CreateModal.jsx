import React, { useState, useEffect } from 'react';
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
