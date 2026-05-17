import { Solar, Lunar } from 'lunar-typescript';

export type Gender = 'male' | 'female';
export type Calendar = 'solar' | 'lunar';

export interface BirthInput {
  calendar: Calendar;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  gender: Gender;
  isLeapMonth?: boolean;
  longitudeDeg?: number;
  useTrueSolarTime?: boolean;
  lateZiSwitchDay?: boolean;
}

export interface Pillar {
  gan: string;
  zhi: string;
  ganZhi: string;
  hideGan: string[];
  wuXing: string;
  naYin: string;
  shiShenGan: string;
  shiShenZhi: string[];
  diShi: string;
  xunKong: string;
}

export interface DaYunItem {
  index: number;
  startYear: number;
  endYear: number;
  startAge: number;
  endAge: number;
  ganZhi: string;
  xunKong: string;
}

export interface BaziChart {
  input: BirthInput;
  solarString: string;
  lunarString: string;
  ganZhiYMD: string;
  pillars: {
    year: Pillar;
    month: Pillar;
    day: Pillar;
    hour: Pillar;
  };
  dayMaster: {
    gan: string;
    wuXing: string;
  };
  wuXingCount: Record<string, number>;
  taiYuan: string;
  taiYuanNaYin: string;
  mingGong: string;
  shenGong: string;
  yun: {
    forward: boolean;
    startAgeYears: number;
    startAgeMonths: number;
    startAgeDays: number;
    startSolarDate: string;
  };
  daYun: DaYunItem[];
}

const WU_XING_OF_GAN: Record<string, string> = {
  甲: '木', 乙: '木',
  丙: '火', 丁: '火',
  戊: '土', 己: '土',
  庚: '金', 辛: '金',
  壬: '水', 癸: '水',
};

const WU_XING_OF_ZHI: Record<string, string> = {
  寅: '木', 卯: '木',
  巳: '火', 午: '火',
  辰: '土', 戌: '土', 丑: '土', 未: '土',
  申: '金', 酉: '金',
  亥: '水', 子: '水',
};

// 地支藏干（用于统计五行强弱时的副气）
const HIDE_GAN: Record<string, string[]> = {
  子: ['癸'],
  丑: ['己', '癸', '辛'],
  寅: ['甲', '丙', '戊'],
  卯: ['乙'],
  辰: ['戊', '乙', '癸'],
  巳: ['丙', '戊', '庚'],
  午: ['丁', '己'],
  未: ['己', '丁', '乙'],
  申: ['庚', '壬', '戊'],
  酉: ['辛'],
  戌: ['戊', '辛', '丁'],
  亥: ['壬', '甲'],
};

/**
 * 计算真太阳时校正后的"分钟偏移"。
 * 以东经 120 度为基准（北京时间所在子午线），每偏离 1 度 ±4 分钟。
 * 例如出生地经度 116.4（北京）→ (116.4-120)*4 = -14.4 分钟。
 */
function trueSolarTimeOffsetMinutes(longitudeDeg: number): number {
  return (longitudeDeg - 120) * 4;
}

/**
 * 防御性调用：lunar-typescript 在某些边界条件下（例如对空字符串干支调用 getXunKong）
 * 会因为内部 LunarUtil.find() 返回 null 而抛 "Cannot read properties of null"。
 * 此处包一层 try/catch，单个字段失败时降级到 fallback，避免整盘起不来。
 */
function safeCall<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

function addMinutes(
  y: number, m: number, d: number, h: number, mi: number, deltaMin: number
): { y: number; m: number; d: number; h: number; mi: number } {
  const date = new Date(y, m - 1, d, h, mi, 0, 0);
  date.setMinutes(date.getMinutes() + deltaMin);
  return {
    y: date.getFullYear(),
    m: date.getMonth() + 1,
    d: date.getDate(),
    h: date.getHours(),
    mi: date.getMinutes(),
  };
}

/**
 * 将 EightChar 中的单柱抽出标准结构。
 */
function buildPillar(
  gan: string,
  zhi: string,
  wuXing: string,
  naYin: string,
  shiShenGan: string,
  shiShenZhi: string[],
  diShi: string,
  xunKong: string
): Pillar {
  return {
    gan,
    zhi,
    ganZhi: gan + zhi,
    hideGan: HIDE_GAN[zhi] ?? [],
    wuXing,
    naYin,
    shiShenGan,
    shiShenZhi,
    diShi,
    xunKong,
  };
}

/**
 * 统计四柱八字的五行个数（含地支藏干，按主气 1.0、中气 0.5、余气 0.3 加权后取整粗略统计）。
 * 仅用于展示五行强弱直观比例，非严格旺衰判定。
 */
function countWuXing(pillarStrs: string[]): Record<string, number> {
  const counts: Record<string, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  for (const gz of pillarStrs) {
    const gan = gz[0];
    const zhi = gz[1];
    const ganWX = WU_XING_OF_GAN[gan];
    if (ganWX) counts[ganWX] += 1;
    const hide = HIDE_GAN[zhi] ?? [];
    // 主气 1.0、中气 0.5、余气 0.3
    const weights = [1.0, 0.5, 0.3];
    hide.forEach((h, i) => {
      const wx = WU_XING_OF_GAN[h];
      if (wx) counts[wx] += weights[i] ?? 0.3;
    });
  }
  for (const k of Object.keys(counts)) {
    counts[k] = Math.round(counts[k] * 10) / 10;
  }
  return counts;
}

export function computeBazi(input: BirthInput): BaziChart {
  let { year: y, month: m, day: d, hour: h, minute: mi } = input;

  if (input.useTrueSolarTime && typeof input.longitudeDeg === 'number') {
    const delta = trueSolarTimeOffsetMinutes(input.longitudeDeg);
    const t = addMinutes(y, m, d, h, mi, delta);
    y = t.y; m = t.m; d = t.d; h = t.h; mi = t.mi;
  }

  let solar: Solar;
  if (input.calendar === 'solar') {
    solar = Solar.fromYmdHms(y, m, d, h, mi, 0);
  } else {
    const lunarMonth = input.isLeapMonth ? -Math.abs(m) : m;
    const lunarForSolar = Lunar.fromYmdHms(y, lunarMonth, d, h, mi, 0);
    solar = lunarForSolar.getSolar();
  }

  const lunar = solar.getLunar();
  const ec = lunar.getEightChar();
  // sect=2 为以子时换日（晚子时计入次日）；sect=1 为不换日。
  ec.setSect(input.lateZiSwitchDay === false ? 1 : 2);

  const yearP = buildPillar(
    ec.getYearGan(),
    ec.getYearZhi(),
    ec.getYearWuXing(),
    ec.getYearNaYin(),
    ec.getYearShiShenGan(),
    ec.getYearShiShenZhi(),
    ec.getYearDiShi(),
    ec.getYearXunKong()
  );
  const monthP = buildPillar(
    ec.getMonthGan(),
    ec.getMonthZhi(),
    ec.getMonthWuXing(),
    ec.getMonthNaYin(),
    ec.getMonthShiShenGan(),
    ec.getMonthShiShenZhi(),
    ec.getMonthDiShi(),
    ec.getMonthXunKong()
  );
  const dayP = buildPillar(
    ec.getDayGan(),
    ec.getDayZhi(),
    ec.getDayWuXing(),
    ec.getDayNaYin(),
    ec.getDayShiShenGan(),
    ec.getDayShiShenZhi(),
    ec.getDayDiShi(),
    ec.getDayXunKong()
  );
  const hourP = buildPillar(
    ec.getTimeGan(),
    ec.getTimeZhi(),
    ec.getTimeWuXing(),
    ec.getTimeNaYin(),
    ec.getTimeShiShenGan(),
    ec.getTimeShiShenZhi(),
    ec.getTimeDiShi(),
    ec.getTimeXunKong()
  );

  const genderCode = input.gender === 'male' ? 1 : 0;
  const yun = ec.getYun(genderCode, 2);
  // 多取一条 (11) ：lunar-typescript 的 getDaYun 第 0 项是「未起运/童年」段，
  // 干支为空，调用 getXunKong() 时库内部 find() 返回 null 会抛
  // "Cannot read properties of null (reading 'index')"，因此我们过滤掉 index < 1
  // 后仍保留完整的 10 步实际大运。
  const daYunList = yun.getDaYun(11);
  const daYun: DaYunItem[] = daYunList
    .filter((item) => item.getIndex() >= 1)
    .map((item) => ({
      index: item.getIndex(),
      startYear: item.getStartYear(),
      endYear: item.getEndYear(),
      startAge: item.getStartAge(),
      endAge: item.getEndAge(),
      ganZhi: item.getGanZhi(),
      // 防御：万一库里其它边界情况也踩到 find()→null，整盘不至于全废
      xunKong: safeCall(() => item.getXunKong(), ''),
    }));

  const pillarStrs = [
    yearP.ganZhi,
    monthP.ganZhi,
    dayP.ganZhi,
    hourP.ganZhi,
  ];

  return {
    input,
    solarString: solar.toYmdHms(),
    lunarString: lunar.toString(),
    ganZhiYMD: ec.toString(),
    pillars: { year: yearP, month: monthP, day: dayP, hour: hourP },
    dayMaster: {
      gan: dayP.gan,
      wuXing: WU_XING_OF_GAN[dayP.gan] ?? '',
    },
    wuXingCount: countWuXing(pillarStrs),
    taiYuan: safeCall(() => ec.getTaiYuan(), ''),
    taiYuanNaYin: safeCall(() => ec.getTaiYuanNaYin(), ''),
    mingGong: safeCall(() => ec.getMingGong(), ''),
    shenGong: safeCall(() => ec.getShenGong(), ''),
    yun: {
      forward: yun.isForward(),
      startAgeYears: yun.getStartYear(),
      startAgeMonths: yun.getStartMonth(),
      startAgeDays: yun.getStartDay(),
      startSolarDate: yun.getStartSolar().toYmd(),
    },
    daYun,
  };
}

export const SHICHEN_OPTIONS: { label: string; hour: number }[] = [
  { label: '子时 (23:00-00:59)', hour: 0 },
  { label: '丑时 (01:00-02:59)', hour: 1 },
  { label: '寅时 (03:00-04:59)', hour: 3 },
  { label: '卯时 (05:00-06:59)', hour: 5 },
  { label: '辰时 (07:00-08:59)', hour: 7 },
  { label: '巳时 (09:00-10:59)', hour: 9 },
  { label: '午时 (11:00-12:59)', hour: 11 },
  { label: '未时 (13:00-14:59)', hour: 13 },
  { label: '申时 (15:00-16:59)', hour: 15 },
  { label: '酉时 (17:00-18:59)', hour: 17 },
  { label: '戌时 (19:00-20:59)', hour: 19 },
  { label: '亥时 (21:00-22:59)', hour: 21 },
];

export const WU_XING_COLORS: Record<string, string> = {
  木: '#2e8b57',
  火: '#c93225',
  土: '#b87333',
  金: '#b8860b',
  水: '#1e6091',
};

export { WU_XING_OF_GAN, WU_XING_OF_ZHI };
