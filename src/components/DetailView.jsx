import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { calculateDuration, formatDateShort } from '../utils';
import { Save, Printer, FileText, MapPin } from 'lucide-react';

const SimpleInput = ({ label, val, onChange, ph, type = "text" }) => (
    <div>
        <label className="block text-[10px] text-gray-500">{label}</label>
        <input type={type} className="w-full border rounded p-1 text-sm" value={val} onChange={(e) => onChange(e.target.value)} placeholder={ph} />
    </div>
);

export default function DetailView({ data, onUpdated, onDeleted, onEdit }) {
    const [resultsList, setResultsList] = useState([]);
    const [isDeleting, setIsDeleting] = useState(false);
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
            for (let i = 0; i < diff; i++) {
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
        console.log("handleSave called for ID:", data.id);
        const { error } = await supabase
            .from('requests')
            .update({ search_results: resultsList, progress_status: progressData })
            .eq('id', data.id);

        if (error) {
            console.error("Save error:", error);
            alert('保存エラー: ' + error.message);
        } else {
            console.log("Save successful");
            alert('保存しました');
            onUpdated();
        }
    };

    const handleDelete = async () => {
        console.log("handleDelete executed (Final) for ID:", data.id);
        const { data: deletedData, error } = await supabase
            .from('requests')
            .delete()
            .eq('id', data.id)
            .select();

        console.log("Supabase response:", { deletedData, error });

        if (error) {
            console.error("Delete error details:", error);
            alert(`削除エラーが発生しました。\nCode: ${error.code}\nMessage: ${error.message}`);
        } else if (!deletedData || deletedData.length === 0) {
            alert('削除できませんでした。\n原因：データが見つからないか、権限(RLS)がありません。');
        } else {
            alert('削除しました');
            if (onDeleted) onDeleted();
            else onUpdated();
        }
        setIsDeleting(false);
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
        const line1 = `←${data.facility}${data.facility_ampm || ''}${data.facility_time_type || ''}${data.client_name.substring(0, 2)}${data.client_address}${data.client_type}${data.adl}`;
        const list = [];
        const startDate = formatDateShort(data.start_date);
        resultsList.forEach((res, index) => {
            const weekday = (data.desired_weekdays && data.desired_weekdays[index]) ? data.desired_weekdays[index] : `${index + 1}日目`;
            const p = res.pickup;
            const pickupLine = `${weekday}迎え${p.car}-${p.bin}-${p.order}→家${p.client_arr}→P着${p.fac_arr}（開始日${startDate}）`;
            list.push({ type: '迎え', day: weekday, line1, line2: pickupLine, resIndex: index, section: 'pickup' });
            const d = res.dropoff;
            const dropoffLine = `${weekday}送り${d.car}-${d.bin}-${d.order}→P発${d.fac_dep}→家${d.client_arr}（開始日${startDate}）`;
            list.push({ type: '送り', day: weekday, line1, line2: dropoffLine, resIndex: index, section: 'dropoff' });
        });
        return list;
    };
    const fusainList = getFusainList();

    return (
        <div className="bg-white shadow rounded-lg max-w-5xl mx-auto border border-gray-200 min-h-[600px] flex flex-col">
            {/* 印刷対象外のヘッダー */}
            <div className="grid grid-cols-7 text-xs text-center border-b font-black text-gray-900 select-none no-print">
                {['依頼者', '期限', 'ｻｰﾁｬｰ', '空便報告', '付箋貼付', '利用者確認', 'BOSS登録'].map((label, i) => (
                    <div key={label} className={`p-2 border-r last:border-r-0 ${i < 3 ? 'bg-yellow-300' : 'bg-orange-300'}`}>{label}</div>
                ))}
            </div>

            {/* ★詳細印刷対象エリア (ここから) */}
            <div id="printable-detail-area">
                <div className="grid grid-cols-7 text-xs border-b bg-gray-100 p-2 gap-1 items-center">
                    <div className="text-center font-black text-gray-900">{data.reporter_name}</div>
                    <div className="text-center font-black text-red-700">{formatDateShort(data.deadline)}</div>
                    <div><input className="w-full border-gray-400 border rounded p-1 text-center font-bold" placeholder="ｻｰﾁｬｰ" value={progressData.searcher} onChange={(e) => handleProgressChange('searcher', e.target.value)} /></div>
                    <div><input type="date" className="w-full border-gray-400 border rounded p-1 font-bold" value={progressData.empty_flight_date} onChange={(e) => handleProgressChange('empty_flight_date', e.target.value)} /></div>
                    <div><input type="date" className="w-full border-gray-400 border rounded p-1 font-bold" value={progressData.tag_date} onChange={(e) => handleProgressChange('tag_date', e.target.value)} /></div>
                    <div><input type="date" className="w-full border-gray-400 border rounded p-1 font-bold" value={progressData.user_check_date} onChange={(e) => handleProgressChange('user_check_date', e.target.value)} /></div>
                    <div><input type="date" className="w-full border-gray-400 border rounded p-1 font-bold" value={progressData.boss_date} onChange={(e) => handleProgressChange('boss_date', e.target.value)} /></div>
                </div>

                <div className="p-6">
                    <div className="mb-6 bg-blue-50 p-4 rounded border border-blue-100">
                        <h2 className="text-2xl font-black text-gray-900">{data.client_name} <span className="text-sm font-normal">様</span></h2>
                        <div className="grid grid-cols-2 gap-4 text-base">
                            <div><span className="font-black text-gray-600">施設:</span> <span className="font-bold">{data.facility} {data.facility_ampm} {data.facility_time_type}</span></div>
                            <div>
                                <span className="font-black text-gray-600">住所:</span> <span className="font-bold">{data.client_address}</span>
                                <div className="mt-1 no-print">
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.client_address)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm font-bold"
                                    >
                                        <MapPin size={14} /> Googleマップで見る
                                    </a>
                                </div>
                            </div>
                            <div><span className="font-black text-gray-600">電話:</span> <span className="font-bold">{data.phone_number}</span></div>
                            <div className="invisible"></div> {/* レイアウト調整用の空要素 */}
                            <div className="col-span-2 pt-2 border-t border-blue-100 flex items-center gap-2">
                                <span className="font-black text-gray-600">利用日数:</span> <span className="font-bold">{daysCount}日</span>
                                <span className="text-gray-300 mx-2">|</span>
                                <span className="font-black text-gray-600">開始希望日:</span> <span className="font-bold">{formatDateShort(data.start_date)}</span>
                                <span className="text-gray-300 mx-2">|</span>
                                <span className="font-black text-gray-600">ADL:</span> <span className="font-bold">{data.adl}</span>
                                <span className="text-gray-300 mx-2">|</span>
                                <span className="font-black text-gray-600">種類:</span> <span className="font-bold">{data.client_type}</span>
                            </div>
                            <div className="col-span-2"><span className="font-black text-gray-600">備考:</span> <span className="font-bold">{data.remarks}</span></div>
                        </div>
                    </div>

                    <div className="border rounded-lg overflow-hidden mb-6 bg-white">
                        <div className="bg-gray-200 p-2 font-black text-gray-800 text-base border-b flex justify-between items-center">
                            <span>配車サーチ結果 ({resultsList.length}日分)</span>
                            <div className="flex gap-2 no-print">
                                <button onClick={() => onEdit(data)} className="bg-blue-600 text-white px-3 py-1 text-sm rounded shadow hover:bg-blue-700 flex items-center gap-1 font-bold">
                                    編集
                                </button>
                                <button onClick={() => handlePrint('detail')} className="bg-gray-700 text-white px-3 py-1 text-sm rounded shadow hover:bg-gray-800 flex items-center gap-1 font-bold">
                                    <FileText size={14} /> A4印刷
                                </button>
                                <button onClick={handleSave} className="bg-green-700 text-white px-3 py-1 text-sm rounded shadow hover:bg-green-800 flex items-center gap-1 font-bold">
                                    <Save size={14} /> 保存
                                </button>
                                {isDeleting ? (
                                    <div className="flex gap-1 items-center bg-red-50 p-1 rounded border border-red-200">
                                        <span className="text-xs text-red-600 font-bold px-1 whitespace-nowrap">本当に削除？</span>
                                        <button onClick={handleDelete} className="bg-red-600 text-white px-2 py-0.5 text-xs rounded shadow hover:bg-red-700">はい</button>
                                        <button onClick={() => setIsDeleting(false)} className="bg-gray-400 text-white px-2 py-0.5 text-xs rounded shadow hover:bg-gray-500">いいえ</button>
                                    </div>
                                ) : (
                                    <button onClick={() => setIsDeleting(true)} className="bg-red-600 text-white px-3 py-1 text-sm rounded shadow hover:bg-red-700 flex items-center gap-1 font-bold">
                                        削除
                                    </button>
                                )}
                            </div>
                        </div>
                        {resultsList.map((res, index) => {
                            const weekday = (data.desired_weekdays && data.desired_weekdays[index]) ? data.desired_weekdays[index] : `${index + 1}日目`;
                            const stayTime = calculateDuration(res.pickup.fac_arr, res.dropoff.fac_dep);
                            return (
                                <div key={index} className="p-4 border-b last:border-b-0 break-inside-avoid">
                                    <div className="font-bold text-sm mb-2 bg-gray-200 px-2 py-1 inline-block rounded">{weekday}</div>
                                    <div className="grid grid-cols-1 gap-4 pl-2">
                                        <div className="flex gap-2 items-center">
                                            <span className="text-xs font-bold text-blue-600 w-10">迎え</span>
                                            <div className="grid grid-cols-5 gap-2 flex-1">
                                                <SimpleInput label="車両・便" val={res.pickup.car} onChange={(v) => handleResultChange(index, 'pickup', 'car', v)} ph="タント" />
                                                <SimpleInput label="便数" val={res.pickup.bin} onChange={(v) => handleResultChange(index, 'pickup', 'bin', v)} ph="1便" />
                                                <SimpleInput label="順番" val={res.pickup.order} onChange={(v) => handleResultChange(index, 'pickup', 'order', v)} ph="1" />
                                                <SimpleInput label="利用者着" val={res.pickup.client_arr} onChange={(v) => handleResultChange(index, 'pickup', 'client_arr', v)} ph="09:00" type="time" />
                                                <SimpleInput label="施設着" val={res.pickup.fac_arr} onChange={(v) => handleResultChange(index, 'pickup', 'fac_arr', v)} ph="09:30" type="time" />
                                            </div>
                                        </div>
                                        <div className="flex gap-2 items-center">
                                            <span className="text-xs font-bold text-orange-600 w-10">送り</span>
                                            <div className="grid grid-cols-5 gap-2 flex-1">
                                                <SimpleInput label="車両・便" val={res.dropoff.car} onChange={(v) => handleResultChange(index, 'dropoff', 'car', v)} ph="シエンタ" />
                                                <SimpleInput label="便数" val={res.dropoff.bin} onChange={(v) => handleResultChange(index, 'dropoff', 'bin', v)} ph="2便" />
                                                <SimpleInput label="順番" val={res.dropoff.order} onChange={(v) => handleResultChange(index, 'dropoff', 'order', v)} ph="2" />
                                                <SimpleInput label="施設発" val={res.dropoff.fac_dep} onChange={(v) => handleResultChange(index, 'dropoff', 'fac_dep', v)} ph="16:00" type="time" />
                                                <SimpleInput label="利用者着" val={res.dropoff.client_arr} onChange={(v) => handleResultChange(index, 'dropoff', 'client_arr', v)} ph="16:30" type="time" />
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
                    <Printer size={16} /> 付箋印刷プレビュー (8pt)
                    <button onClick={() => handlePrint('fusain')} className="ml-4 bg-gray-700 text-white px-3 py-1 rounded text-xs hover:bg-black transition-colors">
                        付箋のみ印刷
                    </button>
                </h3>
                <div id="printable-fusain-area" className="flex flex-wrap gap-4">
                    {fusainList.map((f, i) => {
                        const getFacilityBg = (facility) => {
                            if (facility === "わくわく") return "bg-pink-100";
                            if (facility === "花笑み") return "bg-yellow-100";
                            if (facility.includes("いきいき")) return "bg-blue-100";
                            return "bg-white";
                        };
                        return (
                            <div key={i} className={`fusain-card border border-gray-400 shadow-sm p-2 w-[300px] hover:border-blue-600 transition-colors ${getFacilityBg(data.facility)}`}>
                                <div className="text-xxs font-sans leading-tight font-bold text-gray-900">
                                    <div>{f.line1}</div>
                                    <div>{f.line2}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
