import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Sheet, type SheetHandle } from '@/components/Sheet';
import { SectionLabel } from '@/components/ui';
import { useHabits, type NewHabit } from '@/store/habits';
import { requestPermission, syncHabitNotifications } from '@/lib/notifications';
import { WEEKDAYS_SHORT } from '@/lib/date';
import type { Habit, HabitType, TimeOfDay } from '@/types/habit';
import { fonts, habitColors, onHabitColor, type Palette } from '@/theme/tokens';
import { usePalette, useThemedStyles } from '@/theme/useTheme';

type IconName = React.ComponentProps<typeof Feather>['name'];

const TYPES: { key: HabitType; label: string; icon: IconName; hint: string; unit: string }[] = [
  { key: 'check', label: 'Галочка', icon: 'check', hint: 'сделал — или нет', unit: '' },
  { key: 'count', label: 'Количество', icon: 'hash', hint: 'отжимания, вода…', unit: 'раз' },
  { key: 'duration', label: 'Время', icon: 'clock', hint: 'чтение, английский…', unit: 'мин' },
  { key: 'measure', label: 'Своя единица', icon: 'tag', hint: 'страницы, км, литры…', unit: 'стр' },
];

const TIME_OPTIONS: { key: TimeOfDay; label: string }[] = [
  { key: 'morning', label: 'Утро' },
  { key: 'afternoon', label: 'День' },
  { key: 'evening', label: 'Вечер' },
  { key: 'anytime', label: 'В любое время' },
];

const DEADLINE_PRESETS = ['07:00', '09:00', '12:00', '18:00', '21:00'];
const UNIT_SUGGESTIONS = ['раз', 'мин', 'стр', 'км', 'л', 'подхода'];

const DEFAULTS = {
  title: '',
  type: 'check' as HabitType,
  target: '',
  unit: '',
  days: [] as number[],
  timeOfDay: 'anytime' as TimeOfDay,
  deadline: '',
  windowStart: '',
  reminder: false,
  reminderTime: '09:00',
  manifesto: '',
};

const TIME_RE = /^\d{1,2}:\d{2}$/;

type Props = {
  sheetRef: React.RefObject<SheetHandle | null>;
  editing: Habit | null;
};

export function HabitFormSheet({ sheetRef, editing }: Props) {
  const p = usePalette();
  const s = useThemedStyles(makeStyles);
  const addHabit = useHabits((st) => st.addHabit);
  const updateHabit = useHabits((st) => st.updateHabit);
  const [title, setTitle] = useState(DEFAULTS.title);
  const [type, setType] = useState<HabitType>(DEFAULTS.type);
  const [target, setTarget] = useState(DEFAULTS.target);
  const [unit, setUnit] = useState(DEFAULTS.unit);
  const [days, setDays] = useState<number[]>(DEFAULTS.days);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(DEFAULTS.timeOfDay);
  const [deadline, setDeadline] = useState(DEFAULTS.deadline);
  const [windowStart, setWindowStart] = useState(DEFAULTS.windowStart);
  const [reminder, setReminder] = useState(DEFAULTS.reminder);
  const [reminderTime, setReminderTime] = useState(DEFAULTS.reminderTime);
  const [colorIndex, setColorIndex] = useState(() => Math.floor(Math.random() * habitColors.length));
  const [manifesto, setManifesto] = useState(DEFAULTS.manifesto);

  useEffect(() => {
    if (editing) {
      setTitle(editing.title);
      setType(editing.type);
      setTarget(editing.type === 'check' ? '' : String(editing.target));
      setUnit(editing.unit);
      setDays(editing.days);
      setTimeOfDay(editing.timeOfDay);
      setDeadline(editing.deadline ?? '');
      setWindowStart(editing.windowStart ?? '');
      setReminder(!!editing.reminder);
      setReminderTime(editing.reminderTime ?? '09:00');
      setColorIndex(editing.colorIndex);
      setManifesto(editing.manifesto ?? '');
    } else {
      setTitle(DEFAULTS.title);
      setType(DEFAULTS.type);
      setTarget(DEFAULTS.target);
      setUnit(DEFAULTS.unit);
      setDays(DEFAULTS.days);
      setTimeOfDay(DEFAULTS.timeOfDay);
      setDeadline(DEFAULTS.deadline);
      setWindowStart(DEFAULTS.windowStart);
      setReminder(DEFAULTS.reminder);
      setReminderTime(DEFAULTS.reminderTime);
      setManifesto(DEFAULTS.manifesto);
      setColorIndex(Math.floor(Math.random() * habitColors.length));
    }
  }, [editing]);

  const activeType = TYPES.find((t) => t.key === type)!;

  const toggleDay = (d: number) =>
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  const enableReminder = () => {
    setReminder(true);
    requestPermission().then((granted) => {
      if (!granted) {
        Alert.alert(
          'Нет доступа к уведомлениям',
          'Разреши уведомления для «Дисциплины» в настройках телефона — иначе напоминания не придут.',
        );
      }
    });
  };

  const save = async () => {
    if (!title.trim()) {
      Alert.alert('Название', 'Дай привычке название — коротко и по делу.');
      return;
    }
    const t = type === 'check' ? 1 : Math.round(Number(target.replace(',', '.')));
    if (type !== 'check' && (!Number.isFinite(t) || t <= 0)) {
      Alert.alert('Цель', 'Укажи, сколько нужно делать за день.');
      return;
    }
    const reminderTimeVal = reminder
      ? TIME_RE.test(reminderTime.trim())
        ? reminderTime.trim()
        : '09:00'
      : null;
    const permissionOk = reminderTimeVal ? await requestPermission() : true;

    const data: NewHabit = {
      title: title.trim(),
      type,
      target: t,
      unit: type === 'duration' ? 'мин' : unit.trim() || activeType.unit || 'раз',
      colorIndex,
      days: [...days].sort((a, b) => a - b),
      timeOfDay,
      deadline: TIME_RE.test(deadline.trim()) ? deadline.trim() : null,
      windowStart: TIME_RE.test(windowStart.trim()) ? windowStart.trim() : null,
      reminder: !!reminderTimeVal,
      reminderTime: reminderTimeVal,
      manifesto: manifesto.trim() || null,
    };

    const saved = editing ? updateHabit(editing.id, data) : addHabit(data);
    if (saved) void syncHabitNotifications(saved);
    if (reminderTimeVal && !permissionOk) {
      Alert.alert(
        'Напоминания не разрешены',
        'Привычка сохранена, но уведомления выключены в системе. Включи их в настройках телефона.',
      );
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    sheetRef.current?.close();
    setTitle(DEFAULTS.title);
    setType(DEFAULTS.type);
    setTarget(DEFAULTS.target);
    setUnit(DEFAULTS.unit);
    setDays(DEFAULTS.days);
    setTimeOfDay(DEFAULTS.timeOfDay);
    setDeadline(DEFAULTS.deadline);
    setWindowStart(DEFAULTS.windowStart);
    setReminder(DEFAULTS.reminder);
    setReminderTime(DEFAULTS.reminderTime);
    setManifesto(DEFAULTS.manifesto);
  };

  return (
    <Sheet sheetRef={sheetRef} maxHeightFactor={0.92}>
      <Text style={s.h1}>{editing ? 'Изменить привычку' : 'Новая привычка'}</Text>
      <Text style={s.hint}>
        {editing
          ? 'Подстрой её под себя — история сохранится'
          : 'Маленький шаг, который ты сделаешь каждый день'}
      </Text>

      <SectionLabel style={{ marginTop: 22 }}>Название</SectionLabel>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Например: Отжимания"
        placeholderTextColor={p.muted}
        style={s.input}
      />

      <SectionLabel>Тип</SectionLabel>
      <View style={s.typeGrid}>
        {TYPES.map((t) => {
          const active = t.key === type;
          return (
            <Pressable
              key={t.key}
              onPress={() => {
                setType(t.key);
                if (!unit.trim()) setUnit(t.unit);
              }}
              style={[
                s.typeCard,
                {
                  borderColor: active ? p.accent : p.line,
                  backgroundColor: active ? p.accentSoft : 'transparent',
                },
              ]}
            >
              <View style={[s.typeIcon, { backgroundColor: active ? p.accent : p.elevated }]}>
                <Feather name={t.icon} size={17} color={active ? p.onAccent : p.muted} />
              </View>
              <Text style={s.typeTitle}>{t.label}</Text>
              <Text style={s.typeHint}>{t.hint}</Text>
            </Pressable>
          );
        })}
      </View>

      {type !== 'check' && (
        <>
          <SectionLabel>Цель на день</SectionLabel>
          <View style={s.row}>
            <TextInput
              value={target}
              onChangeText={setTarget}
              placeholder={type === 'duration' ? '30' : '50'}
              placeholderTextColor={p.muted}
              keyboardType="numeric"
              style={[s.input, { flex: 1 }]}
            />
            {type === 'duration' ? (
              <View style={[s.input, s.unitStatic]}>
                <Text style={{ fontFamily: fonts.semibold, fontSize: 15, color: p.muted }}>мин</Text>
              </View>
            ) : (
              <TextInput
                value={unit}
                onChangeText={setUnit}
                placeholder="ед."
                placeholderTextColor={p.muted}
                style={[s.input, { width: 100 }]}
              />
            )}
          </View>
          {type === 'measure' && (
            <View style={[s.row, { flexWrap: 'wrap', marginTop: -2 }]}>
              {UNIT_SUGGESTIONS.map((u) => (
                <Pressable
                  key={u}
                  onPress={() => setUnit(u)}
                  style={[s.suggest, { backgroundColor: unit === u ? p.accentSoft : 'transparent' }]}
                >
                  <Text
                    style={{
                      fontFamily: fonts.medium,
                      fontSize: 13,
                      color: unit === u ? p.accentDeep : p.muted,
                    }}
                  >
                    {u}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </>
      )}

      <SectionLabel>Дни недели</SectionLabel>
      <View style={s.daysRow}>
        {WEEKDAYS_SHORT.map((label, i) => {
          const active = days.length === 0 || days.includes(i);
          return (
            <Pressable
              key={`${label}${i}`}
              onPress={() => toggleDay(i)}
              style={[
                s.dayChip,
                {
                  backgroundColor: active ? p.accentSoft : 'transparent',
                  borderColor: active ? p.accent : p.line,
                },
              ]}
            >
              <Text
                style={{
                  fontFamily: fonts.semibold,
                  fontSize: 13,
                  color: active ? p.accentDeep : p.muted,
                }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={s.daysHint}>
        {days.length === 0
          ? 'Не выбрано ни одного дня — значит, каждый день'
          : `Выбрано дней: ${days.length}`}
      </Text>

      <SectionLabel>Время дня</SectionLabel>
      <View style={s.row}>
        {TIME_OPTIONS.map((t) => {
          const active = t.key === timeOfDay;
          return (
            <Pressable
              key={t.key}
              onPress={() => setTimeOfDay(t.key)}
              style={[
                s.chip,
                {
                  backgroundColor: active ? p.ink : 'transparent',
                  borderColor: active ? p.ink : p.line,
                },
              ]}
            >
              <Text
                style={{
                  fontFamily: fonts.semibold,
                  fontSize: 13,
                  color: active ? p.bg : p.ink,
                }}
              >
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <SectionLabel>Дедлайн и окно (необязательно)</SectionLabel>
      <View style={s.row}>
        {DEADLINE_PRESETS.map((t) => (
          <Pressable
            key={t}
            onPress={() => setDeadline(deadline === t ? '' : t)}
            style={[
              s.chip,
              {
                backgroundColor: deadline === t ? p.accent : 'transparent',
                borderColor: deadline === t ? p.accent : p.line,
              },
            ]}
          >
            <Text
              style={{
                fontFamily: fonts.semibold,
                fontSize: 13,
                color: deadline === t ? p.onAccent : p.ink,
              }}
            >
              {t}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={[s.row, { marginTop: 4 }]}>
        <TextInput
          value={deadline}
          onChangeText={setDeadline}
          placeholder="до скольки, ЧЧ:ММ"
          placeholderTextColor={p.muted}
          keyboardType="numbers-and-punctuation"
          style={[s.input, { flex: 1 }]}
        />
        {deadline !== '' && (
          <Pressable onPress={() => setDeadline('')} style={s.clearBtn}>
            <Feather name="x" size={18} color={p.muted} />
          </Pressable>
        )}
      </View>
      <View style={[s.row, { marginTop: 8 }]}>
        <TextInput
          value={windowStart}
          onChangeText={setWindowStart}
          placeholder="окно начала, ЧЧ:ММ"
          placeholderTextColor={p.muted}
          keyboardType="numbers-and-punctuation"
          style={[s.input, { flex: 1 }]}
        />
        {windowStart !== '' && (
          <Pressable onPress={() => setWindowStart('')} style={s.clearBtn}>
            <Feather name="x" size={18} color={p.muted} />
          </Pressable>
        )}
      </View>
      <Text style={s.daysHint}>
        Дедлайн — после него привычка считается просроченной. Окно начала — раньше него ещё рано
        делать
      </Text>

      <SectionLabel>Напоминание</SectionLabel>
      <View style={s.row}>
        <Pressable
          onPress={() => setReminder(false)}
          style={[
            s.chip,
            {
              backgroundColor: !reminder ? p.ink : 'transparent',
              borderColor: !reminder ? p.ink : p.line,
            },
          ]}
        >
          <Text
            style={{ fontFamily: fonts.semibold, fontSize: 13, color: !reminder ? p.bg : p.ink }}
          >
            Выкл
          </Text>
        </Pressable>
        <Pressable
          onPress={enableReminder}
          style={[
            s.chip,
            {
              backgroundColor: reminder ? p.accent : 'transparent',
              borderColor: reminder ? p.accent : p.line,
            },
          ]}
        >
          <Text
            style={{ fontFamily: fonts.semibold, fontSize: 13, color: reminder ? p.onAccent : p.ink }}
          >
            Вкл
          </Text>
        </Pressable>
      </View>
      {reminder && (
        <>
          <View style={s.row}>
            {DEADLINE_PRESETS.map((t) => (
              <Pressable
                key={`r${t}`}
                onPress={() => setReminderTime(t)}
                style={[
                  s.chip,
                  {
                    backgroundColor: reminderTime === t ? p.accent : 'transparent',
                    borderColor: reminderTime === t ? p.accent : p.line,
                  },
                ]}
              >
                <Text
                  style={{
                    fontFamily: fonts.semibold,
                    fontSize: 13,
                    color: reminderTime === t ? p.onAccent : p.ink,
                  }}
                >
                  {t}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={[s.row, { marginTop: 4 }]}>
            <TextInput
              value={reminderTime}
              onChangeText={setReminderTime}
              placeholder="время, ЧЧ:ММ"
              placeholderTextColor={p.muted}
              keyboardType="numbers-and-punctuation"
              style={[s.input, { flex: 1 }]}
            />
          </View>
          <Text style={s.daysHint}>Придёт в дни привычки — даже если приложение закрыто</Text>
        </>
      )}

      <SectionLabel>Цвет</SectionLabel>
      <View style={s.row}>
        {habitColors.map((c, i) => (
          <Pressable
            key={c}
            onPress={() => setColorIndex(i)}
            style={[s.swatch, { backgroundColor: c, borderColor: colorIndex === i ? p.ink : 'transparent' }]}
          >
            {colorIndex === i && <Feather name="check" size={15} color={onHabitColor} />}
          </Pressable>
        ))}
      </View>

      <SectionLabel>Зачем тебе это?</SectionLabel>
      <TextInput
        value={manifesto}
        onChangeText={setManifesto}
        placeholder="Напиши свою причину. Ты увидишь её в момент, когда захочется сдаться"
        placeholderTextColor={p.muted}
        multiline
        style={[s.input, { minHeight: 90, textAlignVertical: 'top', paddingTop: 14 }]}
      />

      <Pressable onPress={save} style={s.saveBtn}>
        <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: p.onAccent }}>
          {editing ? 'Сохранить' : 'Создать привычку'}
        </Text>
      </Pressable>
    </Sheet>
  );
}

const makeStyles = (p: Palette) =>
  StyleSheet.create({
    h1: { fontFamily: fonts.displayBold, fontSize: 26, color: p.ink },
    hint: { fontFamily: fonts.medium, fontSize: 14, color: p.muted, marginTop: 4 },
    input: {
      fontFamily: fonts.medium,
      fontSize: 15,
      color: p.ink,
      backgroundColor: p.bg,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: p.line,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    unitStatic: { width: 100, alignItems: 'center', justifyContent: 'center' },
    row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
    // gap вместо внешних отступов: с шириной в процентах плюс marginRight два
    // блока не влезали в строку и каждый уезжал на свою. flexGrow растягивает
    // пару на всю ширину, поэтому строка заполняется ровно.
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    typeCard: {
      flexGrow: 1,
      flexBasis: '47%',
      borderRadius: 18,
      borderWidth: 1,
      padding: 14,
    },
    typeIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    typeTitle: { fontFamily: fonts.bold, fontSize: 15, color: p.ink, marginTop: 10 },
    typeHint: { fontFamily: fonts.medium, fontSize: 12, color: p.muted, marginTop: 2 },
    suggest: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: p.line,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginRight: 6,
      marginBottom: 6,
    },
    daysRow: { flexDirection: 'row', justifyContent: 'space-between' },
    dayChip: {
      width: 42,
      height: 42,
      borderRadius: 21,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    daysHint: { fontFamily: fonts.medium, fontSize: 12, color: p.muted, marginTop: 8 },
    chip: {
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 14,
      paddingVertical: 9,
      marginRight: 8,
      marginBottom: 8,
    },
    clearBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    swatch: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
      marginBottom: 8,
    },
    saveBtn: {
      backgroundColor: p.accent,
      borderRadius: 18,
      alignItems: 'center',
      paddingVertical: 16,
      marginTop: 26,
      marginBottom: 8,
    },
  });
