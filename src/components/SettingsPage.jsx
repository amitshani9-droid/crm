import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Plus, Trash2, GripVertical, RotateCcw, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useSettings, DEFAULT_SETTINGS } from '../hooks/useSettings';

const SectionCard = ({ title, children }) => (
  <div className="bg-white rounded-[20px] border border-[#EAE3D9] shadow-sm overflow-hidden">
    <div className="px-6 py-4 border-b border-[#EAE3D9] bg-[#FDFBF7]">
      <h2 className="text-base font-bold text-[#333333]">{title}</h2>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const SettingsPage = () => {
  const navigate = useNavigate();
  const { settings, updateSettings, resetSettings } = useSettings();

  const [kanbanLabels, setKanbanLabels] = useState({ ...settings.kanbanLabels });
  const [eventTypes, setEventTypes] = useState([...settings.eventTypes]);
  const [priorities, setPriorities] = useState(settings.priorities.map(p => ({ ...p })));

  // Drag state for event types reorder
  const dragIndex = useRef(null);

  const handleSave = () => {
    updateSettings({
      kanbanLabels,
      eventTypes: eventTypes.filter(e => e.trim()),
      priorities: priorities.filter(p => p.label.trim()),
    });
    toast.success('ההגדרות נשמרו! ✨');
  };

  const handleReset = () => {
    if (!window.confirm('לאפס את כל ההגדרות לברירות המחדל?')) return;
    resetSettings();
    setKanbanLabels({ ...DEFAULT_SETTINGS.kanbanLabels });
    setEventTypes([...DEFAULT_SETTINGS.eventTypes]);
    setPriorities(DEFAULT_SETTINGS.priorities.map(p => ({ ...p })));
    toast.success('ההגדרות אופסו');
  };

  // Event types drag-and-drop
  const handleDragStart = (i) => { dragIndex.current = i; };
  const handleDrop = (i) => {
    if (dragIndex.current === null || dragIndex.current === i) return;
    const next = [...eventTypes];
    const [moved] = next.splice(dragIndex.current, 1);
    next.splice(i, 0, moved);
    setEventTypes(next);
    dragIndex.current = null;
  };

  const COLUMN_IDS = ['פניות חדשות', 'בטיפול', 'סגור'];

  return (
    <div className="min-h-screen ambient-bg" dir="rtl">
      {/* Header */}
      <header className="glass-header flex items-center justify-between px-6 py-4 gap-4">
        <div className="flex items-center gap-3">
          <motion.button
            onClick={() => navigate('/')}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="p-2 bg-white border border-[#EAE3D9] rounded-xl text-[#666666] shadow-sm"
          >
            <ArrowRight size={18} />
          </motion.button>
          <div>
            <h1 className="text-lg font-bold text-[#333333]">הגדרות</h1>
            <p className="text-xs text-[#9BACA4]">התאמה אישית של המערכת</p>
          </div>
        </div>
        <div className="flex gap-2">
          <motion.button
            onClick={handleReset}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            className="flex items-center gap-1.5 bg-white text-[#666666] px-4 py-2.5 rounded-xl text-sm font-semibold border border-[#EAE3D9] shadow-sm"
          >
            <RotateCcw size={15} />
            <span>אפס</span>
          </motion.button>
          <motion.button
            onClick={handleSave}
            whileHover={{ scale: 1.02, boxShadow: '0 8px 20px rgba(197,168,128,0.3)' }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-1.5 bg-gradient-to-r from-[#C5A880] to-[#b09673] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md"
          >
            <Save size={15} />
            <span>שמור הגדרות</span>
          </motion.button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-5">

        {/* Kanban Labels */}
        <SectionCard title="תוויות עמודות הקנבן">
          <div className="flex flex-col gap-3">
            {COLUMN_IDS.map(id => (
              <div key={id} className="flex items-center gap-3">
                <span className="text-xs font-semibold text-[#9BACA4] w-28 flex-shrink-0 bg-[#F5F2EB] px-3 py-1.5 rounded-lg text-center">
                  {id}
                </span>
                <span className="text-[#C5A880]">→</span>
                <input
                  type="text"
                  value={kanbanLabels[id] || ''}
                  onChange={e => setKanbanLabels(prev => ({ ...prev, [id]: e.target.value }))}
                  className="flex-1 border border-[#EAE3D9] rounded-xl px-3 py-2 text-sm text-[#333333] outline-none focus:border-[#C5A880] focus:ring-2 focus:ring-[#C5A880]/10 transition-all"
                  placeholder="שם התצוגה..."
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-[#9BACA4] mt-4">הערה: רק השם המוצג משתנה. ערכי הסטטוס ב-Airtable נשארים ללא שינוי.</p>
        </SectionCard>

        {/* Event Types */}
        <SectionCard title="סוגי אירועים">
          <div className="flex flex-col gap-2">
            {eventTypes.map((type, i) => (
              <div
                key={i}
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragOver={e => e.preventDefault()}
                onDrop={() => handleDrop(i)}
                onDragEnd={() => { dragIndex.current = null; }}
                className="flex items-center gap-2 group"
              >
                <GripVertical size={16} className="text-[#C5A880] cursor-grab flex-shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" />
                <input
                  type="text"
                  value={type}
                  onChange={e => {
                    const next = [...eventTypes];
                    next[i] = e.target.value;
                    setEventTypes(next);
                  }}
                  className="flex-1 border border-[#EAE3D9] rounded-xl px-3 py-2 text-sm text-[#333333] outline-none focus:border-[#C5A880] focus:ring-2 focus:ring-[#C5A880]/10 transition-all"
                />
                <button
                  onClick={() => setEventTypes(eventTypes.filter((_, j) => j !== i))}
                  className="p-1.5 text-[#9BACA4] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all flex-shrink-0"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => setEventTypes([...eventTypes, ''])}
            className="mt-3 flex items-center gap-1.5 text-[#C5A880] text-sm font-semibold hover:text-[#b09673] transition-colors"
          >
            <Plus size={16} />
            הוסף סוג אירוע
          </button>
        </SectionCard>

        {/* Priorities */}
        <SectionCard title="עדיפויות">
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
            שינוי שם עדיפות ישפיע רק על לידים חדשים. לידים קיימים ישמרו את הערך הישן.
          </p>
          <div className="flex flex-col gap-3">
            {priorities.map((p, i) => (
              <div key={i} className="flex items-center gap-2 p-3 rounded-xl border border-[#EAE3D9] bg-[#FDFBF7]">
                <input
                  type="text"
                  value={p.emoji}
                  onChange={e => {
                    const next = [...priorities];
                    next[i] = { ...next[i], emoji: e.target.value };
                    setPriorities(next);
                  }}
                  maxLength={2}
                  className="w-12 text-center border border-[#EAE3D9] rounded-lg px-2 py-2 text-base outline-none focus:border-[#C5A880] transition-all"
                />
                <input
                  type="text"
                  value={p.label}
                  onChange={e => {
                    const next = [...priorities];
                    next[i] = { ...next[i], label: e.target.value, id: next[i].id };
                    setPriorities(next);
                  }}
                  className="flex-1 border border-[#EAE3D9] rounded-xl px-3 py-2 text-sm text-[#333333] outline-none focus:border-[#C5A880] focus:ring-2 focus:ring-[#C5A880]/10 transition-all"
                  placeholder="שם העדיפות..."
                />
                <div className="flex items-center gap-1.5">
                  {['bg', 'text', 'border'].map(colorKey => (
                    <div key={colorKey} className="relative group/color">
                      <input
                        type="color"
                        value={p[colorKey]}
                        onChange={e => {
                          const next = [...priorities];
                          next[i] = { ...next[i], [colorKey]: e.target.value };
                          setPriorities(next);
                        }}
                        className="w-7 h-7 rounded-lg border border-[#EAE3D9] cursor-pointer p-0.5"
                        title={colorKey === 'bg' ? 'רקע' : colorKey === 'text' ? 'טקסט' : 'מסגרת'}
                      />
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setPriorities(priorities.filter((_, j) => j !== i))}
                  className="p-1.5 text-[#9BACA4] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all flex-shrink-0"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => setPriorities([...priorities, { id: `custom_${Date.now()}`, label: '', bg: '#F5F2EB', text: '#C5A880', border: '#EAE3D9', emoji: '⭐' }])}
            className="mt-3 flex items-center gap-1.5 text-[#C5A880] text-sm font-semibold hover:text-[#b09673] transition-colors"
          >
            <Plus size={16} />
            הוסף עדיפות
          </button>
        </SectionCard>

      </main>
    </div>
  );
};

export default SettingsPage;
