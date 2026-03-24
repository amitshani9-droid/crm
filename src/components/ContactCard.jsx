import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Mail, Phone as PhoneIcon, Calendar, Edit2, Check, Plus, Paperclip, Upload, File as FileIcon, Trash2, Bell, BellOff, X, CalendarPlus } from 'lucide-react';
import { updateAirtableRecord, uploadFileToRecord, isValidIsraeliPhone } from '../airtable';
import toast from 'react-hot-toast';
import { useSettings } from '../hooks/useSettings';

const STATUSES = [
  { id: 'פניות חדשות', label: 'חדש', color: 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100' },
  { id: 'בטיפול',      label: 'בטיפול', color: 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100' },
  { id: 'סגור',        label: 'סגור', color: 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100' },
];

const ContactCard = ({ data, onDelete, onStatusChange, onUpdate }) => {
  const { settings } = useSettings();
  const PRIORITY_CONFIG = useMemo(() =>
    Object.fromEntries(settings.priorities.map(p => [p.id, { bg: p.bg, text: p.text, border: p.border, emoji: p.emoji }])),
    [settings.priorities]
  );
  const [localData, setLocalData] = useState(data);
  const { 
    id,
    Name, 
    Phone, 
    Email,
    ['Event Type']: EventType, 
    ['Event Date']: EventDate,
    Notes,
    Attachments = [],
    Budget,
    Participants,
    createdTime,
    Status
  } = localData || {};

  const Company  = localData?.Company;
  const Priority = localData?.Priority;
  const quoteSent = localData?.['Quote Sent'] || false;

  // Calculate "Waiting" status: > 7 days in "בטיפול" 
  const isWaiting = useMemo(() => {
    if (Status !== 'בטיפול' || !createdTime) return false;
    const created = new Date(createdTime);
    const diffDays = (new Date() - created) / (1000 * 60 * 60 * 24);
    return diffDays > 7;
  }, [Status, createdTime]);

  const [localAttachments, setLocalAttachments] = useState(Attachments);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [editedNote, setEditedNote] = useState('');
  
  // Card Edit State
  const [isEditingCard, setIsEditingCard] = useState(false);
  const [editForm, setEditForm] = useState({
    Name: Name || '',
    Company: Company || '',
    Phone: Phone || '',
    Email: Email || '',
    'Event Type': EventType || '',
    'Event Date': localData?._rawDate || '',
    Priority: localData?.Priority || '',
    Budget: Budget || '',
    Participants: Participants || ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const fileInputRef = useRef(null);

  // Reminder state (persisted in localStorage)
  const REMINDER_KEY = `crm_reminder_${id}`;
  const [reminder, setReminder] = useState(() => {
    try { return JSON.parse(localStorage.getItem(REMINDER_KEY)) || null; } catch { return null; }
  });
  const [showReminderPanel, setShowReminderPanel] = useState(false);
  const [reminderDraft, setReminderDraft] = useState({ text: reminder?.text || '', date: reminder?.date || '' });

  const saveReminder = (e) => {
    e.stopPropagation();
    if (!reminderDraft.text.trim()) {
      localStorage.removeItem(REMINDER_KEY);
      setReminder(null);
    } else {
      const r = { text: reminderDraft.text.trim(), date: reminderDraft.date };
      localStorage.setItem(REMINDER_KEY, JSON.stringify(r));
      setReminder(r);
    }
    setShowReminderPanel(false);
    toast.success(reminderDraft.text.trim() ? 'תזכורת נשמרה' : 'תזכורת נמחקה');
  };

  const clearReminder = (e) => {
    e.stopPropagation();
    localStorage.removeItem(REMINDER_KEY);
    setReminder(null);
    setReminderDraft({ text: '', date: '' });
    toast.success('תזכורת נמחקה');
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) {
      setIsDeleting(true);
      onDelete(id, localData);
      // Note: isDeleting stays true intentionally — the component will unmount after deletion
    }
  };

  const handleToggleQuote = async (e) => {
    e.stopPropagation();
    const newVal = !quoteSent;
    setLocalData(prev => ({ ...prev, 'Quote Sent': newVal }));
    const success = await updateAirtableRecord(id, { 'Quote Sent': newVal });
    if (!success) {
      setLocalData(prev => ({ ...prev, 'Quote Sent': !newVal }));
      toast.error('שגיאה בעדכון');
    } else {
      toast.success(newVal ? 'הצעת מחיר סומנה כנשלחה ✓' : 'סימון הוסר');
    }
  };

  const handleAddToCalendar = (e) => {
    e.stopPropagation();
    const rawDate = localData?._rawDate || localData?.['Event Date'];
    if (!rawDate) { toast.error('אין תאריך אירוע'); return; }
    // Parse YYYY-MM-DD or Israeli DD/MM/YYYY
    let d;
    if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
      d = new Date(rawDate);
    } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(rawDate)) {
      const [day, month, year] = rawDate.split('/');
      d = new Date(`${year}-${month}-${day}`);
    } else {
      d = new Date(rawDate);
    }
    if (isNaN(d.getTime())) { toast.error('תאריך לא תקין'); return; }
    const fmt = (n) => String(n).padStart(2, '0');
    const dateStr = `${d.getFullYear()}${fmt(d.getMonth() + 1)}${fmt(d.getDate())}`;
    const title = encodeURIComponent(`אירוע - ${Name || Company || 'לקוח'}`);
    const details = encodeURIComponent([
      Name ? `שם: ${Name}` : '',
      Company ? `חברה: ${Company}` : '',
      Phone ? `טלפון: ${Phone}` : '',
      Budget ? `תקציב: ₪${Number(Budget).toLocaleString()}` : '',
      Participants ? `משתתפים: ${Participants}` : '',
      EventType ? `סוג אירוע: ${EventType}` : '',
    ].filter(Boolean).join('\n'));
    window.open(
      `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateStr}/${dateStr}&details=${details}`,
      '_blank'
    );
  };

  const getInitials = (nameStr) => {
    if (!nameStr) return '?';
    // Take first letter of the first two words if available
    const parts = nameStr.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return nameStr.charAt(0).toUpperCase();
  };

  const handleEmail = (e) => {
    e.stopPropagation();
    if (Email) {
      const subject = encodeURIComponent(`טל שני הפקת אירועים — ${Name || 'לקוח'}`);
      window.open(`mailto:${Email}?subject=${subject}`, '_blank');
    } else {
      toast.error('חסר כתובת דוא"ל');
    }
  };

  const handleSaveNote = async (e) => {
    e.stopPropagation();
    
    // If the input is empty, just close it
    if (!editedNote.trim()) {
      setIsEditingNote(false);
      return;
    }

    setIsSaving(true);
    
    // Format the timestamp
    const now = new Date();
    const timestamp = `[${now.toLocaleDateString('he-IL')} ${now.toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'})}]`;
    
    // Append the new note to the existing notes
    const appendedNote = Notes ? `${Notes}\n${timestamp} - ${editedNote}` : `${timestamp} - ${editedNote}`;

    const success = await updateAirtableRecord(id, { Notes: appendedNote });
    setIsSaving(false);
    
    if (success) {
      toast.success('הערה נשמרה בהצלחה');
      setLocalData(prev => ({ ...prev, Notes: appendedNote }));
      setEditedNote(''); // Clear the input field for the next entry
      setIsEditingNote(false);
    } else {
      toast.error('שגיאה בשמירת הערה');
    }
  };

  const handleSaveCard = async (e) => {
    e.stopPropagation();
    if (!editForm.Name.trim()) {
      toast.error('חובה להזין את שם איש הקשר');
      return;
    }
    if (editForm.Phone && !isValidIsraeliPhone(editForm.Phone)) {
      toast.error('מספר הטלפון אינו תקין');
      return;
    }
    setIsSaving(true);
    
    let parsedDisplayDate = editForm['Event Date'];
    if (parsedDisplayDate) {
      const d = new Date(parsedDisplayDate);
      if (!isNaN(d.getTime())) {
        parsedDisplayDate = d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
      }
    }

    const payload = {
      Name: editForm.Name,
      Company: editForm.Company,
      Phone: editForm.Phone,
      Email: editForm.Email,
      'Event Type': editForm['Event Type'],
      'Event Date': editForm['Event Date'],
      Priority: editForm.Priority,
      Budget: editForm.Budget,
      Participants: editForm.Participants
    };

    const success = await updateAirtableRecord(id, payload);
    setIsSaving(false);
    
    if (success) {
      toast.success('פרטי לקוח עודכנו בהצלחה!');
      setIsEditingCard(false);
      const updatedData = {
        ...localData,
        ...payload,
        ['Event Date']: parsedDisplayDate,
        _rawDate: editForm['Event Date']
      };
      setLocalData(updatedData);
      // Notify parent so the table row updates immediately without a full refresh
      if (onUpdate) onUpdate(id, updatedData);
    } else {
      toast.error('שגיאה בעדכון הלקוח');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const toastId = toast.loading('מעלה קובץ...');
    
    // Use the real upload function
    const newAttachment = await uploadFileToRecord(id, file, localAttachments);
    
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
    
    if (newAttachment) {
      setLocalAttachments(prev => [...prev, newAttachment]);
      toast.success('הקובץ נשמר בתיק הלקוח! 📁', { id: toastId });
    } else {
      toast.error('שגיאה בהעלאת הקובץ', { id: toastId });
    }
  };

  const handleDeleteAttachment = async (indexToRemove) => {
    const updatedAttachments = localAttachments.filter((_, i) => i !== indexToRemove);
    const success = await updateAirtableRecord(id, { Attachments: updatedAttachments });
    if (success) {
      setLocalAttachments(updatedAttachments);
      toast.success('הקובץ הוסר');
    } else {
      toast.error('שגיאה בהסרת הקובץ');
    }
  };

  const whatsappTemplates = [
    { label: '👋 הודעה ראשונית', message: `היי ${Name || ''}, זאת טל שני הפקת אירועים. מוזמנים ליצור קשר בכל שאלה! 💫` },
    { label: '🔁 מעקב', message: `היי ${Name || ''}, רציתי לבדוק אם יש שאלות על ההצעה שלנו 😊` },
    { label: '📅 לפני האירוע', message: `היי ${Name || ''}, מתרגשת לקראת האירוע שלכם! יש עוד פרטים לתאם? ✨` },
    { label: '🥂 אחרי האירוע', message: `היי ${Name || ''}, תודה שבחרתם בטל שני הפקת אירועים! 🥂` },
  ];

  const openWhatsAppWithTemplate = (message) => {
    if (!Phone) { toast.error('חסר מספר טלפון'); return; }
    const digits = Phone.replace(/\D/g, '');
    const waNumber = digits.startsWith('0') ? `972${digits.substring(1)}` : `972${digits}`;
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, '_blank');
    setShowTemplates(false);
  };

  const priorityCfg = Priority ? PRIORITY_CONFIG[Priority] : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={`bg-white dark:bg-[#1a1917] p-5 rounded-[16px] border ${isWaiting ? 'border-amber-400 border-2 shadow-[0_0_15px_rgba(251,191,36,0.2)]' : 'border-[#EAE3D9] dark:border-[#2d2b28]'} shadow-[0_4px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_20px_rgba(197,168,128,0.1)] hover:-translate-y-[2px] transition-all duration-300 flex flex-col gap-3 relative overflow-hidden`}
      style={priorityCfg ? { borderColor: priorityCfg.border } : undefined}
    >
      {isWaiting && (
        <div className="absolute top-0 right-0 bg-amber-400 text-amber-900 text-[10px] font-bold px-3 py-1 rounded-bl-xl z-20 shadow-sm">
          ⏳ ממתין זמן
        </div>
      )}
      {isEditingCard ? (
        <div className="flex flex-col gap-3 p-3 bg-[#FDFBF7] dark:bg-[#141311] rounded-xl border border-[#C5A880]/30 shadow-inner mb-2 cursor-default">
          <div>
             <label className="block text-xs font-semibold text-[#666666] mb-1">שם חברה (אופציונלי)</label>
             <input type="text" value={editForm.Company} onChange={e => setEditForm({...editForm, Company: e.target.value})} className="w-full text-base p-2 border border-[#EAE3D9] dark:border-[#2d2b28] bg-white dark:bg-[#1a1917] text-[#333333] dark:text-[#e8e4df] rounded-lg focus:border-[#C5A880] outline-none transition-colors" placeholder="שם חברה / ארגון" onClick={e => e.stopPropagation()} />
          </div>
          <div>
             <label className="block text-xs font-semibold text-[#666666] mb-1">שם איש קשר (חובה)</label>
             <input type="text" value={editForm.Name} onChange={e => setEditForm({...editForm, Name: e.target.value})} className="w-full text-base p-2 border border-[#EAE3D9] dark:border-[#2d2b28] bg-white dark:bg-[#1a1917] text-[#333333] dark:text-[#e8e4df] rounded-lg focus:border-[#C5A880] outline-none transition-colors" placeholder="איש קשר" onClick={e => e.stopPropagation()} />
          </div>
          <div>
             <label className="block text-xs font-semibold text-[#666666] mb-1">טלפון</label>
             <input type="tel" dir="ltr" value={editForm.Phone} onChange={e => setEditForm({...editForm, Phone: e.target.value})} className="w-full text-base p-2 border border-[#EAE3D9] dark:border-[#2d2b28] bg-white dark:bg-[#1a1917] text-[#333333] dark:text-[#e8e4df] rounded-lg focus:border-[#C5A880] outline-none text-right transition-colors" placeholder="05X-XXXXXXX" onClick={e => e.stopPropagation()} />
          </div>
          <div>
             <label className="block text-xs font-semibold text-[#666666] mb-1">דוא"ל</label>
             <input type="email" dir="ltr" value={editForm.Email} onChange={e => setEditForm({...editForm, Email: e.target.value})} className="w-full text-base p-2 border border-[#EAE3D9] dark:border-[#2d2b28] bg-white dark:bg-[#1a1917] text-[#333333] dark:text-[#e8e4df] rounded-lg focus:border-[#C5A880] outline-none text-right transition-colors" placeholder="name@example.com" onClick={e => e.stopPropagation()} />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
               <label className="block text-xs font-semibold text-[#666666] mb-1">סוג אירוע</label>
               <select value={editForm['Event Type']} onChange={e => setEditForm({...editForm, 'Event Type': e.target.value})} className="w-full text-base p-2 border border-[#EAE3D9] dark:border-[#2d2b28] rounded-lg focus:border-[#C5A880] outline-none bg-white dark:bg-[#1a1917] text-[#333333] dark:text-[#e8e4df] transition-colors" onClick={e => e.stopPropagation()}>
                 <option value="">- ללא שיוך -</option>
                 {settings.eventTypes.map(t => <option key={t} value={t}>{t}</option>)}
               </select>
            </div>
            <div className="flex-1">
               <label className="block text-xs font-semibold text-[#666666] mb-1">תאריך</label>
               <input type="date" value={editForm['Event Date']} onChange={e => setEditForm({...editForm, 'Event Date': e.target.value})} className="w-full text-base p-2 border border-[#EAE3D9] dark:border-[#2d2b28] bg-white dark:bg-[#1a1917] text-[#333333] dark:text-[#e8e4df] rounded-lg focus:border-[#C5A880] outline-none transition-colors" onClick={e => e.stopPropagation()} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
               <label className="block text-xs font-semibold text-[#666666] mb-1">תקציב (₪)</label>
               <input type="number" value={editForm.Budget} onChange={e => setEditForm({...editForm, Budget: e.target.value})} className="w-full text-base p-2 border border-[#EAE3D9] dark:border-[#2d2b28] bg-white dark:bg-[#1a1917] text-[#333333] dark:text-[#e8e4df] rounded-lg focus:border-[#C5A880] outline-none transition-colors" placeholder="0" onClick={e => e.stopPropagation()} />
            </div>
            <div>
               <label className="block text-xs font-semibold text-[#666666] mb-1">משתתפים</label>
               <input type="number" value={editForm.Participants} onChange={e => setEditForm({...editForm, Participants: e.target.value})} className="w-full text-base p-2 border border-[#EAE3D9] dark:border-[#2d2b28] bg-white dark:bg-[#1a1917] text-[#333333] dark:text-[#e8e4df] rounded-lg focus:border-[#C5A880] outline-none transition-colors" placeholder="0" onClick={e => e.stopPropagation()} />
            </div>
          </div>
<div className="mt-4 flex gap-2">
            <button disabled={isSaving || isDeleting} onClick={handleSaveCard} className="flex-1 bg-[#C5A880] text-white py-2 rounded-lg font-bold shadow-md hover:bg-[#b09673] flex items-center justify-center gap-1 active:scale-95 transition-all"><Check size={18}/> שמור שינויים</button>
            <button disabled={isSaving || isDeleting} onClick={(e) => { e.stopPropagation(); setIsEditingCard(false); }} className="px-5 bg-white border border-[#EAE3D9] text-[#666666] rounded-lg font-bold hover:bg-[#FDFBF7] transition-all">ביטול</button>
            <button disabled={isSaving || isDeleting} onClick={handleDelete} className="p-2.5 text-red-500 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100 transition-all active:scale-95" title="מחק לקוח">
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      ) : (
        <>
<div className="flex justify-between items-start gap-3">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#EAE3D9] to-[#C5A880] rounded-full flex items-center justify-center text-white font-bold text-xl shadow-inner">
                {getInitials(Name || Company)}
              </div>
              <div className="flex flex-col flex-1">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-semibold text-[#9BACA4] uppercase tracking-wide">שם</span>
                  <h3 className="text-xl font-bold text-[#333333] dark:text-[#e8e4df] leading-tight">
                    {Name || 'ללא שם'}
                  </h3>
                </div>
                {Company && (
                  <div className="flex flex-col gap-0.5 mt-2">
                    <span className="text-[10px] font-semibold text-[#9BACA4] uppercase tracking-wide">חברה</span>
                    <span className="text-base text-[#666666] dark:text-[#9BACA4] leading-tight">{Company}</span>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  {Budget && (
                    <span className="bg-[#C5A880]/15 text-[#C5A880] text-sm px-3 py-1.5 rounded-lg font-bold whitespace-nowrap">
                      ₪{Number(Budget).toLocaleString()}
                    </span>
                  )}
                  {Participants && (
                    <span className="bg-[#333333]/10 text-[#333333] text-sm px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap">
                      {Participants} משתתפים
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-1">
              <button
                disabled={isDeleting}
                onClick={handleDelete}
                className="flex-shrink-0 text-[#9BACA4] hover:text-red-500 transition-colors p-2 bg-[#FDFBF7] hover:bg-white rounded-full border border-transparent hover:border-red-100 shadow-sm"
              >
                <Trash2 size={16} />
              </button>
              {Email && (
                <button
                  onClick={handleEmail}
                  className="flex-shrink-0 text-[#9BACA4] hover:text-[#2C8A99] transition-colors p-2 bg-[#FDFBF7] hover:bg-white rounded-full border border-transparent hover:border-[#2C8A99]/20 shadow-sm"
                  title={`שלח מייל ל-${Email}`}
                >
                  <Mail size={16} />
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); setReminderDraft({ text: reminder?.text || '', date: reminder?.date || '' }); setShowReminderPanel(p => !p); }}
                className={`flex-shrink-0 transition-colors p-2 rounded-full border shadow-sm ${reminder ? 'text-amber-500 bg-amber-50 border-amber-200 hover:bg-amber-100' : 'text-[#9BACA4] hover:text-amber-500 bg-[#FDFBF7] hover:bg-white border-transparent hover:border-amber-100'}`}
                title="תזכורת"
              >
                <Bell size={16} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setIsEditingCard(true); }}
                className="flex-shrink-0 text-[#9BACA4] hover:text-[#C5A880] transition-colors p-2 bg-[#FDFBF7] hover:bg-white rounded-full border border-transparent hover:border-[#EAE3D9] shadow-sm"
              >
                <Edit2 size={16} />
              </button>
            </div>
          </div>
          
        <div className="flex flex-col gap-2 text-base text-[#666666]">
            {Phone && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-semibold text-[#9BACA4] uppercase tracking-wide">טלפון</span>
                <div className="flex items-center gap-2">
                  <PhoneIcon size={16} className="text-[#C5A880]" />
                  <span>{Phone}</span>
                </div>
              </div>
            )}
            {Email && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-semibold text-[#9BACA4] uppercase tracking-wide">דוא"ל</span>
                <div className="flex items-center gap-2 break-all">
                  <Mail size={16} className="text-[#C5A880]" />
                  <span>{Email}</span>
                </div>
              </div>
            )}
            {EventDate && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-semibold text-[#9BACA4] uppercase tracking-wide">תאריך אירוע</span>
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-[#C5A880]" />
                  <span>{EventDate}</span>
                  <button
                    onClick={handleAddToCalendar}
                    className="mr-1 flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-all active:scale-95"
                    title="הוסף ליומן גוגל"
                  >
                    <CalendarPlus size={11} />
                    יומן
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <div className="mt-2 flex flex-col gap-2">
        <div className="flex justify-between items-center text-sm text-[#9BACA4] font-semibold px-1">
          <span>היסטוריית קשר מול לקוח</span>
          {!isEditingNote && (
            <button 
              onClick={(e) => { e.stopPropagation(); setIsEditingNote(true); }}
              className="text-[#C5A880] hover:text-[#9b825f] transition-colors p-2 bg-[#FDFBF7] rounded-lg border border-[#EAE3D9] flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Plus size={16} /> <span className="text-sm font-bold block">הוסף הערה</span>
            </button>
          )}
        </div>
        
        {/* Render Conversation History */}
        {Notes && (
          <div className="text-base text-[#666666] dark:text-[#9BACA4] bg-[#FDFBF7] dark:bg-[#141311] p-4 rounded-xl border border-[#EAE3D9] dark:border-[#2d2b28] shadow-inner max-h-[120px] overflow-y-auto hide-scrollbar whitespace-pre-wrap leading-relaxed">
            {Notes}
          </div>
        )}
        
        {/* New Note Entry Field */}
        {isEditingNote && (
          <div className="relative mt-2">
            <textarea
              autoFocus
              value={editedNote}
              onChange={(e) => setEditedNote(e.target.value)}
              className="w-full bg-white dark:bg-[#1a1917] text-[#333333] dark:text-[#e8e4df] text-base p-4 rounded-xl border-2 border-[#C5A880]/50 focus:border-[#C5A880] outline-none resize-none min-h-[80px] shadow-sm transition-colors"
              placeholder="הקלד כאן הערה או סטטוס חדש..."
              onClick={(e) => e.stopPropagation()}
            />
            <button 
              onClick={handleSaveNote}
              disabled={isSaving}
              className="absolute left-3 bottom-0 top-0 my-auto h-12 w-12 flex items-center justify-center bg-[#C5A880] text-white rounded-xl shadow-md hover:bg-[#b09673] hover:-translate-y-0.5 transition-all"
            >
              <Check size={24} />
            </button>
          </div>
        )}
        
        {!Notes && !isEditingNote && (
           <button 
             onClick={(e) => { e.stopPropagation(); setIsEditingNote(true); }}
             className="text-[#9BACA4] hover:text-[#C5A880] italic text-sm text-right px-1 w-full transition-colors"
           >
             לחצי להוספת הערה...
           </button>
        )}
      </div>

      {/* Attachments Section */}
      <div className="mt-3 flex flex-col gap-3">
        <div className="flex justify-between items-center text-sm text-[#9BACA4] font-semibold px-1 border-t border-[#EAE3D9]/60 pt-4">
          <div className="flex items-center gap-2">
            <Paperclip size={18} />
            <span>קבצים מקושרים ({localAttachments?.length || 0})</span>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
            disabled={isUploading}
            className="text-[#C5A880] bg-[#FDFBF7] hover:bg-white border border-[#EAE3D9] transition-all p-2 rounded-lg flex items-center gap-2 shadow-sm active:scale-95 disabled:opacity-50"
          >
            {isUploading ? (
               <div className="animate-spin w-4 h-4 border-2 border-[#C5A880] border-t-transparent rounded-full" />
            ) : (
               <><Upload size={16} /> <span className="text-sm font-bold block">העלאה</span></>
            )}
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept="image/*,.pdf,.doc,.docx"
          />
        </div>
        
        {localAttachments && localAttachments.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {localAttachments.map((file, index) => (
              <a 
                key={file.id || index} 
                href={file.url} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex-shrink-0 relative group rounded-lg overflow-hidden border border-[#EAE3D9] bg-[#FDFBF7] h-12 w-16 hover:border-[#C5A880] transition-colors flex items-center justify-center cursor-pointer"
                title={file.filename}
              >
                {file.type && file.type.startsWith('image/') ? (
                   <img src={file.thumbnails?.small?.url || file.url} alt={file.filename} className="w-full h-full object-cover" />
                ) : (
                   <FileIcon size={20} className="text-[#9BACA4] group-hover:text-[#C5A880] transition-colors" />
                )}
                
                {/* Tooltip Overlay with delete */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
                  <span className="text-[0.6rem] text-white text-center leading-tight truncate w-full px-0.5" dir="ltr">
                    {file.filename?.substring(0, 10)}{file.filename?.length > 10 ? '...' : ''}
                  </span>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteAttachment(index); }}
                    className="text-red-400 hover:text-red-300 transition-colors"
                    title="מחק קובץ"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                  </button>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Active reminder banner */}
      <AnimatePresence>
        {reminder && !showReminderPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-start gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium"
          >
            <Bell size={13} className="text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-bold truncate">{reminder.text}</p>
              {reminder.date && <p className="text-amber-600 mt-0.5">{new Date(reminder.date).toLocaleDateString('he-IL')}</p>}
            </div>
            <button onClick={clearReminder} className="text-amber-400 hover:text-amber-700 flex-shrink-0 p-0.5">
              <X size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reminder panel */}
      <AnimatePresence>
        {showReminderPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs font-bold text-amber-800 flex items-center gap-1.5"><Bell size={12} /> הוסיפי תזכורת</p>
            <input
              type="text"
              value={reminderDraft.text}
              onChange={(e) => setReminderDraft(p => ({ ...p, text: e.target.value }))}
              placeholder="מה לזכור? (לדוגמה: לחזור אחרי שבועיים)"
              className="w-full text-sm p-2 rounded-lg border border-amber-200 dark:border-amber-700 bg-white dark:bg-[#1a1917] dark:text-[#e8e4df] outline-none focus:border-amber-400 transition-colors"
            />
            <input
              type="date"
              value={reminderDraft.date}
              onChange={(e) => setReminderDraft(p => ({ ...p, date: e.target.value }))}
              className="w-full text-sm p-2 rounded-lg border border-amber-200 dark:border-amber-700 bg-white dark:bg-[#1a1917] dark:text-[#e8e4df] outline-none focus:border-amber-400 transition-colors"
            />
            <div className="flex gap-2">
              <button onClick={saveReminder} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold py-2 rounded-lg transition-colors">שמור</button>
              {reminder && (
                <button onClick={clearReminder} className="px-3 bg-white border border-amber-200 text-amber-600 text-sm font-bold py-2 rounded-lg hover:bg-amber-50 transition-colors flex items-center gap-1">
                  <BellOff size={13} /> מחק
                </button>
              )}
              <button onClick={(e) => { e.stopPropagation(); setShowReminderPanel(false); }} className="px-3 bg-white border border-[#EAE3D9] text-[#9BACA4] text-sm font-bold py-2 rounded-lg">ביטול</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quote Sent Toggle */}
      <div className="mt-3 pt-3 border-t border-[#EAE3D9]/60 flex items-center justify-between">
        <span className="text-[10px] font-semibold text-[#9BACA4]">הצעת מחיר</span>
        <button
          onClick={handleToggleQuote}
          className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-all active:scale-95 ${
            quoteSent
              ? 'bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200'
              : 'bg-white text-[#9BACA4] border-[#EAE3D9] hover:border-purple-300 hover:text-purple-600'
          }`}
        >
          {quoteSent ? '✓ נשלחה הצעת מחיר' : '+ סמן כנשלח'}
        </button>
      </div>

      {onStatusChange && (
        <div className="mt-3 pt-3 border-t border-[#EAE3D9]/60 flex items-center gap-2">
          <span className="text-[10px] font-semibold text-[#9BACA4] whitespace-nowrap">העבר ל:</span>
          <div className="flex gap-1.5 flex-wrap">
            {STATUSES.filter(s => s.id !== Status).map(s => (
              <button
                key={s.id}
                onClick={(e) => { e.stopPropagation(); setLocalData(prev => ({ ...prev, Status: s.id })); onStatusChange(id, s.id); }}
                className={`text-xs font-bold px-3 py-1 rounded-full border transition-all active:scale-95 ${s.color}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-[#EAE3D9]/60 relative">
        {showTemplates && (
          <div className="absolute bottom-full mb-2 left-0 right-0 bg-white dark:bg-[#1e1c1a] border border-[#EAE3D9] dark:border-[#2d2b28] rounded-xl shadow-lg z-10 overflow-hidden">
            {whatsappTemplates.map((t, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); openWhatsAppWithTemplate(t.message); }}
                className="w-full text-right px-4 py-3 text-sm font-semibold text-[#333333] hover:bg-[#FDFBF7] border-b border-[#EAE3D9]/50 last:border-0 transition-colors"
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); setShowTemplates(prev => !prev); }}
          className="w-full flex justify-center items-center gap-3 bg-[#25D366] hover:bg-[#128C7E] text-white px-4 py-3.5 rounded-xl text-base font-bold transition-all shadow-md active:scale-95"
        >
          <MessageCircle size={20} />
          <span>שלח וואטסאפ ללקוח</span>
        </button>
      </div>
    </motion.div>
  );
};

export default ContactCard;
