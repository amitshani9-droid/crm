import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Phone as PhoneIcon, Mail, Calendar, X, Bell, CalendarPlus } from 'lucide-react';
import ContactCard from './ContactCard';

const openGoogleCalendar = (e, lead) => {
  e.stopPropagation();
  const rawDate = lead._rawDate || lead['Event Date'];
  if (!rawDate) return;
  let d;
  if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
    d = new Date(rawDate);
  } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(rawDate)) {
    const [day, month, year] = rawDate.split('/');
    d = new Date(`${year}-${month}-${day}`);
  } else {
    d = new Date(rawDate);
  }
  if (isNaN(d.getTime())) return;
  const fmt = (n) => String(n).padStart(2, '0');
  const dateStr = `${d.getFullYear()}${fmt(d.getMonth() + 1)}${fmt(d.getDate())}`;
  const title = encodeURIComponent(`אירוע - ${lead.Name || lead.Company || 'לקוח'}`);
  const details = encodeURIComponent([
    lead.Name    ? `שם: ${lead.Name}` : '',
    lead.Company ? `חברה: ${lead.Company}` : '',
    lead.Phone   ? `טלפון: ${lead.Phone}` : '',
    lead.Budget  ? `תקציב: ₪${Number(lead.Budget).toLocaleString()}` : '',
  ].filter(Boolean).join('\n'));
  window.open(
    `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateStr}/${dateStr}&details=${details}`,
    '_blank'
  );
};

const MOVE_BUTTONS = {
  'פניות חדשות': [
    { id: 'בטיפול', label: 'בטיפול →', color: 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100' },
    { id: 'סגור',   label: 'סגור →',   color: 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100' },
  ],
  'בטיפול': [
    { id: 'פניות חדשות', label: '← חדש',  color: 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100' },
    { id: 'סגור',        label: 'סגור →', color: 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100' },
  ],
  'סגור': [
    { id: 'פניות חדשות', label: '← חדש',    color: 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100' },
    { id: 'בטיפול',      label: '← בטיפול', color: 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100' },
  ],
};

const LeadTable = ({ inquiries, onDelete, onStatusChange, onUpdate }) => {
  const [selectedLead, setSelectedLead] = useState(null);

  const reminders = useMemo(() => {
    const map = {};
    for (const lead of inquiries) {
      try {
        const r = JSON.parse(localStorage.getItem(`crm_reminder_${lead.id}`));
        if (r?.text) map[lead.id] = r;
      } catch {}
    }
    return map;
  }, [inquiries]);

  // When a card is edited inside the modal, update selectedLead so the open modal shows fresh data
  const handleUpdate = (id, updatedData) => {
    setSelectedLead(updatedData);
    if (onUpdate) onUpdate(id, updatedData);
  };

  const openWhatsApp = (e, lead) => {
    e.stopPropagation();
    if (!lead.Phone) return;
    const digits = lead.Phone.replace(/\D/g, '');
    const waNumber = digits.startsWith('0') ? `972${digits.substring(1)}` : `972${digits}`;
    const msg = `היי ${lead.Name || ''}, זאת טל שני הפקת אירועים. מוזמנים ליצור קשר בכל שאלה! 💫`;
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (inquiries.length === 0) {
    return (
      <div className="text-center text-[#9BACA4] py-12 text-sm font-medium">
        אין לקוחות בקטגוריה זו
      </div>
    );
  }

  return (
    <>
      {/* Table */}
      <div className="w-full overflow-x-auto rounded-2xl border border-[#EAE3D9] dark:border-white/5 shadow-sm bg-white/60 dark:bg-[#1c1b1b]/80 backdrop-blur-md">
        <table className="w-full text-right" dir="rtl">
          <thead>
            <tr className="border-b border-[#EAE3D9] dark:border-white/5 bg-[#FDFBF7] dark:bg-[#131313]">
              <th className="px-4 py-3 text-[11px] font-bold text-[#9BACA4] uppercase tracking-wide">שם</th>
              <th className="px-4 py-3 text-[11px] font-bold text-[#9BACA4] uppercase tracking-wide hidden sm:table-cell">חברה</th>
              <th className="px-4 py-3 text-[11px] font-bold text-[#9BACA4] uppercase tracking-wide">טלפון</th>
              <th className="px-4 py-3 text-[11px] font-bold text-[#9BACA4] uppercase tracking-wide hidden md:table-cell">תאריך</th>
              <th className="px-4 py-3 text-[11px] font-bold text-[#9BACA4] uppercase tracking-wide hidden md:table-cell">תקציב</th>
              <th className="px-4 py-3 text-[11px] font-bold text-[#9BACA4] uppercase tracking-wide hidden sm:table-cell">הצ"מ</th>
              <th className="px-4 py-3 text-[11px] font-bold text-[#9BACA4] uppercase tracking-wide">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {inquiries.map((lead, idx) => (
              <motion.tr
                key={lead.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03, type: 'spring', stiffness: 400, damping: 30 }}
                onClick={() => setSelectedLead(lead)}
                className={`border-b border-[#EAE3D9]/50 dark:border-white/5 cursor-pointer transition-colors group ${
                  reminders[lead.id]
                    ? 'bg-amber-50/60 dark:bg-amber-900/10 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                    : 'hover:bg-[#F5F2EB]/60 dark:hover:bg-[#20201f]/80'
                }`}
              >
                {/* Name */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="relative flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#EAE3D9] to-[#C5A880] flex items-center justify-center text-white font-bold text-sm">
                        {(lead.Name || lead.Company || '?').charAt(0).toUpperCase()}
                      </div>
                      {reminders[lead.id] && (
                        <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center shadow-sm">
                          <Bell size={9} className="text-white" />
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-[#333333] dark:text-[#e8e4df] text-sm leading-tight">
                        {lead.Name || 'ללא שם'}
                      </span>
                      {reminders[lead.id] && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium truncate max-w-[120px]" title={reminders[lead.id].text}>
                          {reminders[lead.id].date ? `${reminders[lead.id].date} — ` : ''}{reminders[lead.id].text}
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                {/* Company */}
                <td className="px-4 py-3 text-sm text-[#666666] dark:text-[#9BACA4] hidden sm:table-cell">
                  {lead.Company || '—'}
                </td>

                {/* Phone */}
                <td className="px-4 py-3">
                  <span className="text-sm text-[#333333] dark:text-[#e8e4df] font-medium" dir="ltr">
                    {lead.Phone || '—'}
                  </span>
                </td>

                {/* Date */}
                <td className="px-4 py-3 hidden md:table-cell">
                  {lead['Event Date'] ? (
                    <div className="flex items-center gap-1.5 text-sm text-[#666666] dark:text-[#9BACA4]">
                      <Calendar size={13} className="text-[#C5A880] flex-shrink-0" />
                      <span>{lead['Event Date']}</span>
                    </div>
                  ) : (
                    <span className="text-[#9BACA4] text-sm">—</span>
                  )}
                </td>

                {/* Budget */}
                <td className="px-4 py-3 hidden md:table-cell">
                  {lead.Budget ? (
                    <span className="text-sm font-bold text-[#C5A880]">
                      ₪{Number(lead.Budget).toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-[#9BACA4] text-sm">—</span>
                  )}
                </td>

                {/* Quote Sent */}
                <td className="px-4 py-3 hidden sm:table-cell">
                  {lead['Quote Sent'] ? (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                      ✓ נשלח
                    </span>
                  ) : (
                    <span className="text-xs text-[#9BACA4]">—</span>
                  )}
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 flex-wrap" onClick={e => e.stopPropagation()}>
                    {lead.Phone && (
                      <button
                        onClick={(e) => openWhatsApp(e, lead)}
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-[#25D366] text-white hover:bg-[#128C7E] transition-colors shadow-sm"
                        title="שלח וואטסאפ"
                      >
                        <MessageCircle size={13} />
                      </button>
                    )}
                    {lead.Phone && (
                      <a
                        href={`tel:${lead.Phone}`}
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-[#F5F2EB] dark:bg-[#252320] text-[#C5A880] hover:bg-[#EAE3D9] transition-colors"
                        title="חיוג"
                      >
                        <PhoneIcon size={13} />
                      </a>
                    )}
                    {lead.Email && (
                      <a
                        href={`mailto:${lead.Email}`}
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-[#F5F2EB] dark:bg-[#252320] text-[#9BACA4] hover:text-[#2C8A99] hover:bg-[#EAE3D9] transition-colors"
                        title="שלח מייל"
                      >
                        <Mail size={13} />
                      </a>
                    )}
                    {(lead._rawDate || lead['Event Date']) && (
                      <button
                        onClick={(e) => openGoogleCalendar(e, lead)}
                        title="הוסף ליומן גוגל"
                        className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors shadow-sm ${
                          lead.Status === 'סגור'
                            ? 'bg-green-500 hover:bg-green-600 text-white'
                            : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200'
                        }`}
                      >
                        <CalendarPlus size={13} />
                      </button>
                    )}
                    {onStatusChange && (MOVE_BUTTONS[lead.Status || 'פניות חדשות'] || []).map(btn => (
                      <button
                        key={btn.id}
                        onClick={(e) => { e.stopPropagation(); onStatusChange(lead.id, btn.id); }}
                        className={`text-[11px] font-bold px-2 py-1 rounded-full border transition-all active:scale-95 whitespace-nowrap ${btn.color}`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Lead Detail Modal */}
      <AnimatePresence>
        {selectedLead && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setSelectedLead(null); }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="fixed inset-x-4 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[480px] max-h-[90vh] overflow-y-auto z-50 rounded-t-3xl md:rounded-3xl bg-[#FDFBF7] dark:bg-[#1a1917] shadow-2xl"
              dir="rtl"
            >
              {/* Close button */}
              <div className="sticky top-0 flex justify-between items-center px-5 pt-4 pb-2 bg-[#FDFBF7]/90 dark:bg-[#1a1917]/90 backdrop-blur-sm rounded-t-3xl z-10 border-b border-[#EAE3D9]/50 dark:border-[#2d2b28]/50">
                <span className="text-sm font-bold text-[#333333] dark:text-[#e8e4df]">
                  {selectedLead.Name || selectedLead.Company || 'פרטי לקוח'}
                </span>
                <button
                  onClick={() => { setSelectedLead(null); }}
                  className="p-1.5 rounded-full text-[#9BACA4] hover:text-[#333] hover:bg-[#EAE3D9] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* ContactCard inside modal */}
              <div className="p-4">
                <ContactCard
                  data={selectedLead}
                  onDelete={(id, data) => {
                    if (onDelete) onDelete(id, data);
                    setSelectedLead(null);
                  }}
                  onStatusChange={onStatusChange}
                  onUpdate={handleUpdate}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default LeadTable;
