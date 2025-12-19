import { format, parseISO, differenceInMinutes } from 'date-fns';

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
    const d1 = new Date(`2000-01-01T${start}`);
    const d2 = new Date(`2000-01-01T${end}`);
    const diffMins = differenceInMinutes(d2, d1);
    if (isNaN(diffMins)) return "";
    const h = Math.floor(diffMins / 60);
    const m = diffMins % 60;
    return `${h}:${m.toString().padStart(2, '0')}`;
  } catch (e) { return ""; }
};