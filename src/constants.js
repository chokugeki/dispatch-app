export const FACILITIES = ["花笑み", "わくわく", "いきいき▼", "その他"];
export const ADL_LIST = ["独歩", "杖歩行", "手押車", "車椅子", "ストレッチャー"];
export const CLIENT_TYPES = ["新規", "臨時", "利用日追加", "復活", "曜日変更"];
export const WEEKDAYS = ["月", "火", "水", "木", "金", "土", "指定なし"];
export const IKIIKI_TIME_TYPES = ["3時間", "1.5時間"];
export const IKIIKI_AMPM = ["AM", "PM"];

export const generateReferenceTitle = (data) => {
  const dateStr = new Date().toISOString().slice(0,10).replace(/-/g, '');
  const startStr = data.start_date ? data.start_date.replace(/-/g, '') : '';
  let name = `${dateStr}_${data.client_name}_${data.client_type}_${data.facility}_${startStr}_${data.reporter_name}`;
  return name.replace(/[\\/:*?"<>|]/g, "_");
};