import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Briefcase, CalendarDays, TrendingUp, BarChart3 } from 'lucide-react';

// Premium stat card icon wrapper
const StatIcon = ({ children, color = '#C5A880' }) => (
  <div
    className="w-12 h-12 rounded-[18px] flex items-center justify-center flex-shrink-0 relative overflow-hidden"
    style={{
      background: `linear-gradient(135deg, ${color}1A, ${color}0D)`,
      boxShadow: `inset 0 1px 0 ${color}26, 0 2px 8px ${color}12`
    }}
  >
    <div style={{ color }} className="relative z-10">{children}</div>
  </div>
);

const statsContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } }
};

const statCardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 280, damping: 28 } }
};

const StatsGrid = ({ loading, stats }) => {
  const {
    animNewLeads,
    animInProgress,
    animEvents,
    animConversion,
    closedCount,
    totalLeads,
    newPct,
    inProgressPct,
    closedPct,
    newLeadsCount,
    inProgressCount
  } = stats;

  return (
    <div id="stats-grid" className="flex flex-col gap-4 shrink-0">
      <motion.div
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
        variants={statsContainerVariants}
        initial="hidden"
        animate={loading ? 'hidden' : 'visible'}
      >
        {/* New Leads */}
        <motion.div variants={statCardVariants}
          whileHover={{ y: -4, boxShadow: '0 20px 40px -8px rgba(197,168,128,0.15)', borderColor: 'rgba(197,168,128,0.4)' }}
          className="bg-white/70 dark:bg-[#121212]/80 backdrop-blur-xl rounded-3xl p-5 border border-black/5 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center gap-4 transition-colors"
        >
          <StatIcon><Users size={22} /></StatIcon>
          <div>
            <p className="text-xs font-semibold text-[#9BACA4] dark:text-[#6b7c77] uppercase tracking-wide mb-0.5">לידים חדשים</p>
            {loading
              ? <div className="h-9 w-14 skeleton-shimmer rounded-lg mt-1" />
              : <h2 className="text-4xl font-bold text-[#333333] stat-number leading-none">{animNewLeads}</h2>}
          </div>
        </motion.div>

        {/* In Progress */}
        <motion.div variants={statCardVariants}
          whileHover={{ y: -4, boxShadow: '0 20px 40px -8px rgba(155,172,164,0.15)', borderColor: 'rgba(155,172,164,0.4)' }}
          className="bg-white/70 dark:bg-[#121212]/80 backdrop-blur-xl rounded-3xl p-5 border border-black/5 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center gap-4 transition-colors"
        >
          <StatIcon color="#9BACA4"><Briefcase size={22} /></StatIcon>
          <div>
            <p className="text-xs font-semibold text-[#9BACA4] uppercase tracking-wide mb-0.5">בטיפול</p>
            {loading
              ? <div className="h-9 w-14 skeleton-shimmer rounded-lg mt-1" />
              : <h2 className="text-4xl font-bold text-[#333333] leading-none">{animInProgress}</h2>}
          </div>
        </motion.div>

        {/* Events This Week */}
        <motion.div variants={statCardVariants}
          whileHover={{ y: -4, boxShadow: '0 20px 40px -8px rgba(44,138,153,0.15)', borderColor: 'rgba(44,138,153,0.4)' }}
          className="bg-white/70 dark:bg-[#121212]/80 backdrop-blur-xl rounded-3xl p-5 border border-black/5 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center gap-4 transition-colors"
        >
          <StatIcon color="#2C8A99"><CalendarDays size={22} /></StatIcon>
          <div>
            <p className="text-xs font-semibold text-[#9BACA4] uppercase tracking-wide mb-0.5">אירועים השבוע</p>
            {loading
              ? <div className="h-9 w-14 skeleton-shimmer rounded-lg mt-1" />
              : <h2 className="text-4xl font-bold text-[#333333] leading-none">{animEvents}</h2>}
          </div>
        </motion.div>

        {/* Conversion Rate */}
        <motion.div variants={statCardVariants}
          whileHover={{ y: -4, boxShadow: '0 24px 48px -12px rgba(0,0,0,0.3), 0 0 0 1px rgba(197,168,128,0.4)' }}
          className="rounded-3xl p-5 border border-[#333333] shadow-2xl flex items-center justify-between relative overflow-hidden transition-all"
          style={{ background: 'linear-gradient(135deg, #1A1A1A 0%, #0A0A0A 100%)' }}
        >
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'radial-gradient(ellipse 100% 100% at 20% 100%, rgba(197,168,128,0.15), transparent)'
          }} />
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-[#C5A880] uppercase tracking-widest mb-1">יחס המרה</p>
            {loading
              ? <div className="h-10 w-20 bg-[#3a3a3a] rounded-lg animate-pulse" />
              : (
                <div className="flex items-end gap-2">
                  <h2 className="text-5xl font-black text-white leading-none">{animConversion}<span className="text-3xl font-bold text-[#C5A880]">%</span></h2>
                </div>
              )}
            <p className="text-[#9BACA4] text-xs mt-1 font-medium">{closedCount} סגורים מתוך {totalLeads}</p>
          </div>
          <div className="relative z-10 w-14 h-14 rounded-[18px] flex items-center justify-center text-[#C5A880] shadow-inner"
            style={{ background: 'linear-gradient(135deg, rgba(197,168,128,0.15), rgba(197,168,128,0.05))', border: '1px solid rgba(197,168,128,0.2)' }}>
            <TrendingUp size={26} strokeWidth={2.5} />
          </div>
        </motion.div>
      </motion.div>

      {/* Status Distribution Bar */}
      <AnimatePresence>
        {!loading && totalLeads > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="bg-white/70 dark:bg-[#121212]/80 backdrop-blur-xl rounded-3xl p-5 border border-black/5 dark:border-white/5 shadow-[0_4px_24px_rgb(0,0,0,0.02)] flex flex-col gap-3"
          >
            <div className="flex justify-between text-xs font-semibold text-[#9BACA4] px-0.5">
              <span>התפלגות פניות</span>
              <span className="text-[#666666]">סה״כ: {totalLeads}</span>
            </div>
            <div className="h-2 w-full bg-[#F5F2EB] dark:bg-[#2a2826] rounded-full overflow-hidden flex">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${newPct}%` }}
                transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="bg-[#C5A880] h-full"
                title={`פניות חדשות: ${Math.round(newPct)}%`}
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${inProgressPct}%` }}
                transition={{ duration: 1, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="bg-[#9BACA4] h-full"
                title={`בטיפול: ${Math.round(inProgressPct)}%`}
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${closedPct}%` }}
                transition={{ duration: 1, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="bg-[#333333] h-full"
                title={`סגור: ${Math.round(closedPct)}%`}
              />
            </div>
            <div className="flex gap-5 text-xs mt-0.5">
              {[
                { color: '#C5A880', label: 'חדשים', count: newLeadsCount },
                { color: '#9BACA4', label: 'בטיפול', count: inProgressCount },
                { color: '#333333', label: 'סגורים', count: closedCount },
              ].map(({ color, label, count }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                  <span className="text-[#666666] font-medium">{label} ({count})</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StatsGrid;
