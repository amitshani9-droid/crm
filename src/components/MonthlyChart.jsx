import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

const MONTH_NAMES_HE = ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יונ', 'יול', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ'];

const MonthlyChart = ({ inquiries }) => {
  const bars = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ year: d.getFullYear(), month: d.getMonth(), label: MONTH_NAMES_HE[d.getMonth()], count: 0 });
    }

    inquiries.forEach(inq => {
      if (!inq._rawDate) return;
      const d = new Date(inq._rawDate);
      if (isNaN(d)) return;
      const slot = months.find(m => m.year === d.getFullYear() && m.month === d.getMonth());
      if (slot) slot.count++;
    });

    return months;
  }, [inquiries]);

  const maxCount = Math.max(...bars.map(b => b.count), 1);

  return (
    <div className="bg-white dark:bg-[#1a1917] rounded-[20px] p-5 border border-[#EAE3D9] dark:border-[#2d2b28] shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#C5A880]/10 flex items-center justify-center">
            <TrendingUp size={16} className="text-[#C5A880]" />
          </div>
          <h3 className="text-sm font-bold text-[#333333] dark:text-[#e8e4df]">פניות לפי חודש</h3>
        </div>
        <span className="text-xs text-[#9BACA4] dark:text-[#6b7c77] font-medium">6 חודשים אחרונים</span>
      </div>

      <div className="flex items-end gap-2 h-28">
        {bars.map((bar, i) => {
          const pct = maxCount > 0 ? (bar.count / maxCount) * 100 : 0;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <span className="text-[10px] font-bold text-[#333333] dark:text-[#e8e4df]">{bar.count > 0 ? bar.count : ''}</span>
              <div className="w-full relative flex items-end" style={{ height: '72px' }}>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(pct, bar.count > 0 ? 8 : 0)}%` }}
                  transition={{ delay: i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="w-full rounded-t-lg absolute bottom-0"
                  style={{
                    background: bar.count > 0
                      ? 'linear-gradient(180deg, #C5A880 0%, #b09673 100%)'
                      : 'var(--color-border)',
                  }}
                />
              </div>
              <span className="text-[10px] text-[#9BACA4] dark:text-[#6b7c77] font-medium">{bar.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthlyChart;
