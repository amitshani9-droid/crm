import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';

const inputCls = "w-full border-2 border-[#EAE3D9] dark:border-[#2d2b28] bg-white dark:bg-[#1a1917] text-[#333333] dark:text-[#e8e4df] rounded-xl p-3 text-base outline-none focus:border-[#C5A880] focus:ring-2 focus:ring-[#C5A880]/10 transition-all";

const AddClientModal = ({ isOpen, onClose, newClient, setNewClient, onSave, isSaving }) => {
  const { settings } = useSettings();
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 text-right"
          style={{ background: 'rgba(26,26,26,0.5)', backdropFilter: 'blur(8px)' }}
          dir="rtl"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="bg-white dark:bg-[#1a1917] w-full max-w-lg rounded-[24px] shadow-2xl overflow-hidden flex flex-col p-7 border border-[#EAE3D9] dark:border-[#2d2b28]"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[#333333] dark:text-[#e8e4df]">לקוח חדש</h2>
                <p className="text-xs text-[#9BACA4] mt-0.5 font-medium">הוסיפי את הפרטים ונשמור ל-Airtable</p>
              </div>
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 bg-[#F5F2EB] hover:bg-[#EAE3D9] rounded-full text-[#666666] transition-colors"
              >
                <X size={18} />
              </motion.button>
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto pr-0.5 hide-scrollbar" style={{ maxHeight: '65vh' }}>
              {[
                { label: 'שם איש קשר (חובה)', key: 'Name', type: 'text', placeholder: 'לדוגמה: דני פרידמן' },
                { label: 'שם החברה (אופציונלי)', key: 'Company', type: 'text', placeholder: 'לדוגמה: גוגל ישראל' },
                { label: 'טלפון', key: 'Phone', type: 'tel', placeholder: '05X-XXXXXXX', dir: 'ltr' },
                { label: 'דוא"ל', key: 'Email', type: 'email', placeholder: 'name@example.com', dir: 'ltr' },
              ].map(({ label, key, type, placeholder, dir }) => (
                <div key={key}>
                  <label className="block text-xs font-bold text-[#666666] dark:text-[#9BACA4] mb-1.5 uppercase tracking-wide">{label}</label>
                  <input
                    type={type} dir={dir} value={newClient[key]} placeholder={placeholder}
                    onChange={(e) => setNewClient({ ...newClient, [key]: e.target.value })}
                    className={inputCls + (dir ? ' text-right' : '')}
                  />
                </div>
              ))}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#666666] dark:text-[#9BACA4] mb-1.5 uppercase tracking-wide">סוג אירוע</label>
                  <select value={newClient['Event Type']} onChange={(e) => setNewClient({ ...newClient, ['Event Type']: e.target.value })} className={inputCls + ' bg-white'}>
                    <option value="">בחר...</option>
                    {settings.eventTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#666666] dark:text-[#9BACA4] mb-1.5 uppercase tracking-wide">תאריך האירוע</label>
                  <input type="date" value={newClient['Event Date']} onChange={(e) => setNewClient({ ...newClient, ['Event Date']: e.target.value })} className={inputCls} />
                </div>
              </div>

              {/* New Fields: Budget and Participants */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#666666] dark:text-[#9BACA4] mb-1.5 uppercase tracking-wide">תקציב (₪)</label>
                  <input type="number" value={newClient.Budget || ''} placeholder="0" onChange={(e) => setNewClient({ ...newClient, Budget: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#666666] dark:text-[#9BACA4] mb-1.5 uppercase tracking-wide">מספר משתתפים</label>
                  <input type="number" value={newClient.Participants || ''} placeholder="0" onChange={(e) => setNewClient({ ...newClient, Participants: e.target.value })} className={inputCls} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#666666] dark:text-[#9BACA4] mb-1.5 uppercase tracking-wide">הערות ראשוניות</label>
                <textarea
                  value={newClient.Notes}
                  onChange={(e) => setNewClient({ ...newClient, Notes: e.target.value })}
                  className={inputCls + ' resize-none min-h-[90px]'}
                  placeholder="פרטים נוספים, בקשות מיוחדות..."
                />
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-[#EAE3D9]/60">
              <motion.button
                onClick={onSave}
                disabled={isSaving}
                whileHover={!isSaving ? { scale: 1.01, boxShadow: '0 12px 24px rgba(197,168,128,0.3)' } : {}}
                whileTap={!isSaving ? { scale: 0.98 } : {}}
                className="w-full bg-gradient-to-r from-[#C5A880] to-[#b09673] text-white py-4 rounded-xl font-bold text-base shadow-[0_6px_16px_rgba(197,168,128,0.25)] disabled:opacity-60 flex justify-center items-center gap-2"
              >
                {isSaving ? <Loader2 className="animate-spin" size={22} /> : 'שמור לקוח חדש'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddClientModal;
