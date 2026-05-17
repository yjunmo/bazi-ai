import type { BaziChart, Pillar } from '../lib/bazi';
import { WU_XING_COLORS } from '../lib/bazi';

interface Props {
  chart: BaziChart;
}

function PillarCol({ name, pillar }: { name: string; pillar: Pillar }) {
  const ganColor = ganWuxingColor(pillar.gan);
  const zhiColor = zhiWuxingColor(pillar.zhi);
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-1 text-xs text-mo-500 dark:text-mo-400">{name}</div>
      <div className="font-serif text-2xl font-bold leading-none" style={{ color: ganColor }}>
        {pillar.gan}
      </div>
      <div className="mt-1 font-serif text-2xl font-bold leading-none" style={{ color: zhiColor }}>
        {pillar.zhi}
      </div>
      <div className="mt-2 text-[10px] text-mo-500 dark:text-mo-400">
        {pillar.hideGan.length > 0 ? pillar.hideGan.join('·') : '—'}
      </div>
      <div className="mt-1 text-[11px] text-mo-700 dark:text-mo-200 leading-tight">
        <div>{pillar.shiShenGan}</div>
        <div className="text-mo-500 dark:text-mo-400">
          {pillar.shiShenZhi.join('·') || '—'}
        </div>
      </div>
      <div className="mt-1 text-[10px] text-mo-500 dark:text-mo-400">
        {pillar.naYin}
      </div>
      <div className="text-[10px] text-mo-500 dark:text-mo-400">{pillar.diShi}</div>
    </div>
  );
}

const GAN_WX: Record<string, string> = {
  甲: '木', 乙: '木',
  丙: '火', 丁: '火',
  戊: '土', 己: '土',
  庚: '金', 辛: '金',
  壬: '水', 癸: '水',
};
const ZHI_WX: Record<string, string> = {
  寅: '木', 卯: '木',
  巳: '火', 午: '火',
  辰: '土', 戌: '土', 丑: '土', 未: '土',
  申: '金', 酉: '金',
  亥: '水', 子: '水',
};

function ganWuxingColor(gan: string): string {
  const wx = GAN_WX[gan];
  return WU_XING_COLORS[wx] ?? '#1a1411';
}

function zhiWuxingColor(zhi: string): string {
  const wx = ZHI_WX[zhi];
  return WU_XING_COLORS[wx] ?? '#1a1411';
}

function WuXingBar({ counts }: { counts: Record<string, number> }) {
  const order = ['木', '火', '土', '金', '水'];
  const total = order.reduce((s, k) => s + (counts[k] ?? 0), 0) || 1;
  return (
    <div className="space-y-1.5">
      {order.map((wx) => {
        const v = counts[wx] ?? 0;
        const pct = (v / total) * 100;
        return (
          <div key={wx} className="flex items-center gap-2">
            <span className="w-5 font-serif text-sm" style={{ color: WU_XING_COLORS[wx] }}>
              {wx}
            </span>
            <div className="flex-1 h-2 rounded bg-black/5 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full rounded"
                style={{ width: `${pct}%`, background: WU_XING_COLORS[wx] }}
              />
            </div>
            <span className="w-10 text-right text-xs text-mo-500 dark:text-mo-400 tabular-nums">
              {v.toFixed(1)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function BaziCard({ chart }: Props) {
  const { pillars, daYun } = chart;
  return (
    <div className="card p-4 space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h3 className="font-serif text-lg font-semibold text-zhu-700 dark:text-zhu-300">
            {chart.input.gender === 'male' ? '乾造' : '坤造'} · 八字
          </h3>
          <div className="text-xs text-mo-500 dark:text-mo-400 mt-0.5">
            公历 {chart.solarString}
          </div>
          <div className="text-xs text-mo-500 dark:text-mo-400">
            农历 {chart.lunarString.split(' ').slice(0, 2).join(' ')}
          </div>
        </div>
        <div className="text-right text-xs text-mo-500 dark:text-mo-400">
          日主 <span className="font-semibold text-zhu-700 dark:text-zhu-300">
            {chart.dayMaster.gan}（{chart.dayMaster.wuXing}）
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 rounded-lg bg-mihuang/50 dark:bg-mo-800/40 p-3">
        <PillarCol name="年柱" pillar={pillars.year} />
        <PillarCol name="月柱" pillar={pillars.month} />
        <PillarCol name="日柱" pillar={pillars.day} />
        <PillarCol name="时柱" pillar={pillars.hour} />
      </div>

      <div>
        <div className="text-xs font-semibold text-mo-600 dark:text-mo-300 mb-2">
          五行强弱（含地支藏干加权）
        </div>
        <WuXingBar counts={chart.wuXingCount} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded border border-mo-200 dark:border-mo-700 p-2">
          <div className="text-mo-500 dark:text-mo-400">胎元</div>
          <div className="font-serif font-semibold">{chart.taiYuan}</div>
          <div className="text-[10px] text-mo-500 dark:text-mo-400">{chart.taiYuanNaYin}</div>
        </div>
        <div className="rounded border border-mo-200 dark:border-mo-700 p-2">
          <div className="text-mo-500 dark:text-mo-400">命宫 / 身宫</div>
          <div className="font-serif font-semibold">{chart.mingGong} / {chart.shenGong}</div>
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between mb-2">
          <div className="text-xs font-semibold text-mo-600 dark:text-mo-300">
            大运（{chart.yun.forward ? '顺排' : '逆排'}）
          </div>
          <div className="text-[10px] text-mo-500 dark:text-mo-400">
            起运 {chart.yun.startAgeYears}岁{chart.yun.startAgeMonths}月{chart.yun.startAgeDays}日 · {chart.yun.startSolarDate}
          </div>
        </div>
        <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-mo-500 dark:text-mo-400">
                <th className="text-left py-1 font-normal">年龄</th>
                <th className="text-left py-1 font-normal">年份</th>
                <th className="text-left py-1 font-normal">干支</th>
              </tr>
            </thead>
            <tbody>
              {daYun.slice(1, 10).map((d) => (
                <tr key={d.index} className="border-t border-mo-200 dark:border-mo-700">
                  <td className="py-1 tabular-nums">{d.startAge}-{d.endAge}</td>
                  <td className="py-1 tabular-nums text-mo-500 dark:text-mo-400">
                    {d.startYear}-{d.endYear}
                  </td>
                  <td className="py-1 font-serif">
                    <span style={{ color: ganWuxingColor(d.ganZhi[0]) }}>{d.ganZhi[0]}</span>
                    <span style={{ color: zhiWuxingColor(d.ganZhi[1]) }}>{d.ganZhi[1]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
