import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';

const STATUS_COLORS = {
  'פניות חדשות': { active: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' },
  'בטיפול':      { active: '#FFFBEB', text: '#D97706', border: '#FDE68A' },
  'סגור':        { active: '#F0FDF4', text: '#16A34A', border: '#BBF7D0' },
};

const Chip = ({ label, active, onClick, colors }) => (
  <motion.button
    onClick={onClick}
    whileTap={{ scale: 0.95 }}
    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${!active ? 'bg-white dark:bg-[#1a1917] text-[#9BACA4] border-[#EAE3D9] dark:border-[#2d2b28]' : ''}`}
    style={active
      ? { background: colors?.active || '#F5F2EB', color: colors?.text || '#333', borderColor: colors?.border || '#C5A880' }
      : undefined
    }
  >
    {label}
    {active && <X size={10} className="ml-0.5" />}
  </motion.button>
);

const FilterBar = ({ filters, setFilters }) => {
  const { settings } = useSettings();
  const STATUS_OPTIONS = ['פניות חדשות', 'בטיפול', 'סגור'];
  const EVENT_OPTIONS = settings.eventTypes;
  const hasActive = filters.status || filters.eventType || filters.quoteSent;

  const toggle = (key, val) => {
    setFilters(prev => ({ ...prev, [key]: prev[key] === val ? '' : val }));
  };

  const clearAll = () => setFilters({ status: '', eventType: '', quoteSent: '' });

  return (
    <div className="flex flex-nowrap overflow-x-auto hide-scrollbar items-center gap-2 py-2">
      {/* Status */}
      {STATUS_OPTIONS.map(s => (
        <Chip key={s} label={s} active={filters.status === s} colors={STATUS_COLORS[s]}
          onClick={() => toggle('status', s)} />
      ))}

      <div className="w-px h-4 bg-[#EAE3D9] dark:bg-[#2d2b28] mx-0.5" />

      {/* Event Type */}
      {EVENT_OPTIONS.map(e => (
        <Chip key={e} label={e} active={filters.eventType === e}
          onClick={() => toggle('eventType', e)} />
      ))}

      <div className="w-px h-4 bg-[#EAE3D9] dark:bg-[#2d2b28] mx-0.5" />

      {/* Quote Sent */}
      <Chip
        label="📄 נשלח הצ״מ"
        active={!!filters.quoteSent}
        colors={{ active: '#F3E8FF', text: '#7C3AED', border: '#DDD6FE' }}
        onClick={() => setFilters(prev => ({ ...prev, quoteSent: prev.quoteSent ? '' : 'true' }))}
      />

      {/* Clear all */}
      <AnimatePresence>
        {hasActive && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={clearAll}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-[#333] text-white border border-[#333] mr-1"
          >
            <X size={10} />
            נקה הכל
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FilterBar;
