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
  const PRIORITY_OPTIONS = settings.priorities.map(p => p.id);
  const EVENT_OPTIONS = settings.eventTypes;
  const PRIORITY_COLORS = Object.fromEntries(
    settings.priorities.map(p => [p.id, { active: p.bg, text: p.text, border: p.border }])
  );
  const hasActive = filters.status || filters.priority || filters.eventType;

  const toggle = (key, val) => {
    setFilters(prev => ({ ...prev, [key]: prev[key] === val ? '' : val }));
  };

  const clearAll = () => setFilters({ status: '', priority: '', eventType: '' });

  return (
    <div className="flex flex-nowrap overflow-x-auto hide-scrollbar items-center gap-2 py-2">
      {/* Status */}
      {STATUS_OPTIONS.map(s => (
        <Chip key={s} label={s} active={filters.status === s} colors={STATUS_COLORS[s]}
          onClick={() => toggle('status', s)} />
      ))}

      <div className="w-px h-4 bg-[#EAE3D9] dark:bg-[#2d2b28] mx-0.5" />

      {/* Priority */}
      {PRIORITY_OPTIONS.map(p => {
        const pObj = settings.priorities.find(pr => pr.id === p);
        return (
          <Chip key={p} label={`${pObj?.emoji || ''} ${pObj?.label || p}`}
            active={filters.priority === p} colors={PRIORITY_COLORS[p]}
            onClick={() => toggle('priority', p)} />
        );
      })}

      <div className="w-px h-4 bg-[#EAE3D9] dark:bg-[#2d2b28] mx-0.5" />

      {/* Event Type */}
      {EVENT_OPTIONS.map(e => (
        <Chip key={e} label={e} active={filters.eventType === e}
          onClick={() => toggle('eventType', e)} />
      ))}

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
