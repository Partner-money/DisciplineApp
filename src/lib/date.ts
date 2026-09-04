export const MONTHS_NOM = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

export const MONTHS_GEN = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

export const WEEKDAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export const WEEKDAYS_FULL = [
  'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье',
];

export const MONTHS_SHORT = [
  'янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
];

export const pad2 = (n: number) => (n < 10 ? `0${n}` : String(n));

export const toDateKey = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

export const fromKey = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const mondayIndex = (d: Date) => (d.getDay() + 6) % 7;

export const isSameDay = (a: Date, b: Date) => toDateKey(a) === toDateKey(b);

export const monthTitle = (d: Date) => `${MONTHS_NOM[d.getMonth()]} ${d.getFullYear()}`;

export const dayShort = (d: Date) => `${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`;

export const dayLong = (d: Date) =>
  `${WEEKDAYS_FULL[mondayIndex(d)]}, ${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`;

export const weekdayFull = (d: Date) => WEEKDAYS_FULL[mondayIndex(d)];

export const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();

export const timeNowMinutes = () => {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
};

export const deadlineToMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
};
