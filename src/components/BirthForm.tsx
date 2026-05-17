import { useState } from 'react';
import { computeBazi, SHICHEN_OPTIONS, type BirthInput, type BaziChart } from '../lib/bazi';

interface Props {
  initial?: Partial<BirthInput>;
  onSubmit: (chart: BaziChart) => void;
}

const defaults: BirthInput = {
  calendar: 'solar',
  year: 1990,
  month: 1,
  day: 1,
  hour: 0,
  minute: 0,
  gender: 'male',
  isLeapMonth: false,
  longitudeDeg: 120,
  useTrueSolarTime: false,
  lateZiSwitchDay: true,
};

export default function BirthForm({ initial, onSubmit }: Props) {
  const [input, setInput] = useState<BirthInput>({ ...defaults, ...initial });
  const [advanced, setAdvanced] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof BirthInput>(key: K, value: BirthInput[K]) {
    setInput((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const chart = computeBazi(input);
      onSubmit(chart);
    } catch (err) {
      setError(err instanceof Error ? err.message : '排盘失败');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-lg font-semibold text-zhu-700 dark:text-zhu-300">
          排盘 · 生辰录入
        </h2>
        <div className="inline-flex rounded-md border border-mo-300 dark:border-mo-700 overflow-hidden text-xs">
          <button
            type="button"
            onClick={() => set('calendar', 'solar')}
            className={
              'px-2.5 py-1 ' +
              (input.calendar === 'solar'
                ? 'bg-zhu-600 text-white'
                : 'text-mo-600 dark:text-mo-300 hover:bg-black/5 dark:hover:bg-white/10')
            }
          >
            公历
          </button>
          <button
            type="button"
            onClick={() => set('calendar', 'lunar')}
            className={
              'px-2.5 py-1 ' +
              (input.calendar === 'lunar'
                ? 'bg-zhu-600 text-white'
                : 'text-mo-600 dark:text-mo-300 hover:bg-black/5 dark:hover:bg-white/10')
            }
          >
            农历
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="label">年</label>
          <input
            type="number"
            className="input"
            value={input.year}
            min={1900}
            max={2100}
            onChange={(e) => set('year', Number(e.target.value))}
          />
        </div>
        <div>
          <label className="label">月{input.calendar === 'lunar' ? '（农历）' : ''}</label>
          <input
            type="number"
            className="input"
            value={input.month}
            min={1}
            max={12}
            onChange={(e) => set('month', Number(e.target.value))}
          />
        </div>
        <div>
          <label className="label">日</label>
          <input
            type="number"
            className="input"
            value={input.day}
            min={1}
            max={31}
            onChange={(e) => set('day', Number(e.target.value))}
          />
        </div>
      </div>

      {input.calendar === 'lunar' && (
        <label className="flex items-center gap-2 text-xs text-mo-600 dark:text-mo-300">
          <input
            type="checkbox"
            checked={!!input.isLeapMonth}
            onChange={(e) => set('isLeapMonth', e.target.checked)}
          />
          闰月（仅当所选月份本身存在闰月时勾选）
        </label>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label">时辰</label>
          <select
            className="input"
            value={input.hour}
            onChange={(e) => {
              const h = Number(e.target.value);
              set('hour', h);
              set('minute', 0);
            }}
          >
            {SHICHEN_OPTIONS.map((o) => (
              <option key={o.hour} value={o.hour}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">性别</label>
          <div className="inline-flex rounded-md border border-mo-300 dark:border-mo-700 overflow-hidden w-full text-sm">
            <button
              type="button"
              onClick={() => set('gender', 'male')}
              className={
                'flex-1 py-2 ' +
                (input.gender === 'male'
                  ? 'bg-zhu-600 text-white'
                  : 'hover:bg-black/5 dark:hover:bg-white/10')
              }
            >
              乾(男)
            </button>
            <button
              type="button"
              onClick={() => set('gender', 'female')}
              className={
                'flex-1 py-2 ' +
                (input.gender === 'female'
                  ? 'bg-zhu-600 text-white'
                  : 'hover:bg-black/5 dark:hover:bg-white/10')
              }
            >
              坤(女)
            </button>
          </div>
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={() => setAdvanced((a) => !a)}
          className="text-xs text-mo-500 hover:text-zhu-600 dark:hover:text-zhu-400"
        >
          {advanced ? '收起高级选项 ▴' : '高级选项 ▾'}
        </button>
      </div>

      {advanced && (
        <div className="space-y-3 rounded-md border border-dashed border-mo-300 dark:border-mo-700 p-3">
          <label className="flex items-center gap-2 text-xs text-mo-700 dark:text-mo-200">
            <input
              type="checkbox"
              checked={!!input.useTrueSolarTime}
              onChange={(e) => set('useTrueSolarTime', e.target.checked)}
            />
            按出生地经度做真太阳时校正
          </label>
          <div>
            <label className="label">出生地经度（东经，默认 120°）</label>
            <input
              type="number"
              step="0.01"
              className="input"
              value={input.longitudeDeg ?? 120}
              onChange={(e) => set('longitudeDeg', Number(e.target.value))}
              disabled={!input.useTrueSolarTime}
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-mo-700 dark:text-mo-200">
            <input
              type="checkbox"
              checked={input.lateZiSwitchDay !== false}
              onChange={(e) => set('lateZiSwitchDay', e.target.checked)}
            />
            晚子时（23:00 后）计入次日（推荐勾选）
          </label>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/30 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <button type="submit" className="btn-primary w-full py-2.5 text-base">
        起盘
      </button>
    </form>
  );
}
