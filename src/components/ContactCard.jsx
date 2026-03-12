import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Mail, Phone as PhoneIcon, Calendar, Edit2, Check, Plus, Paperclip, Upload, File as FileIcon, Trash2 } from 'lucide-react';
import { updateAirtableRecord, uploadFileToRecord, isValidIsraeliPhone } from '../airtable';
import toast from 'react-hot-toast';

const ContactCard = ({ data, onDelete }) => {
  const [localData, setLocalData] = useState(data);
  const { 
    id,
    Name, 
    Phone, 
    Email,
    ['Event Type']: EventType, 
    ['Event Date']: EventDate,
    Notes,
    Attachments = []
  } = localData || {};

  const Company = localData?.Company;

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
    'Event Date': localData?._rawDate || ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const fileInputRef = useRef(null);

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) onDelete(id, localData);
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

  const handleWhatsApp = (e) => {
    e.stopPropagation();
    if (Phone && Name) {
      // Input is standard 10-digit local format (e.g., 0545773044)
      // Strip non-digits just in case, then remove leading '0' and prepend '972'
      const digits = Phone.replace(/\D/g, '');
      const waNumber = digits.startsWith('0') ? `972${digits.substring(1)}` : `972${digits}`;
      
      const message = encodeURIComponent(`היי ${Name}, זאת טל שני הפקת אירועים. מוזמנים ליצור קשר בכל שאלה! 💫`);
      
      const waLink = `https://wa.me/${waNumber}?text=${message}`;
      window.open(waLink, '_blank');
    } else {
      toast.error('חסר מספר טלפון או שם');
    }
  };

  const handleSaveNote = async (e) => {
    e.stopPropagation();
    
    // If the input is empty or unchanged from the last state, just close it
    if (!editedNote.trim() || editedNote === Notes) {
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
      'Event Date': editForm['Event Date']
    };

    const success = await updateAirtableRecord(id, payload);
    setIsSaving(false);
    
    if (success) {
      toast.success('פרטי לקוח עודכנו בהצלחה!');
      setIsEditingCard(false);
      setLocalData(prev => ({
        ...prev,
        ...payload,
        ['Event Date']: parsedDisplayDate,
        _rawDate: editForm['Event Date']
      }));
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

  const handleDragStart = (e) => {
    e.dataTransfer.setData('recordId', id);
    // Slight opacity change on the ghost image doesn't work well natively, but we can set effectAllowed
    e.dataTransfer.effectAllowed = "move";
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

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileDrag={{ rotate: 2, scale: 1.02, zIndex: 100 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      draggable 
      onDragStart={handleDragStart}
      className="bg-white p-5 rounded-[16px] border border-[#EAE3D9] shadow-[0_4px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_20px_rgba(197,168,128,0.1)] hover:-translate-y-[2px] hover:border-[#C5A880]/40 transition-all duration-300 flex flex-col gap-3 cursor-grab active:cursor-grabbing"
    >
      {isEditingCard ? (
        <div className="flex flex-col gap-3 p-3 bg-[#FDFBF7] rounded-xl border border-[#C5A880]/30 shadow-inner mb-2 cursor-default">
          <div>
             <label className="block text-xs font-semibold text-[#666666] mb-1">שם חברה (אופציונלי)</label>
             <input type="text" value={editForm.Company} onChange={e => setEditForm({...editForm, Company: e.target.value})} className="w-full text-base p-2 border border-[#EAE3D9] rounded-lg focus:border-[#C5A880] outline-none transition-colors" placeholder="שם חברה / ארגון" onClick={e => e.stopPropagation()} />
          </div>
          <div>
             <label className="block text-xs font-semibold text-[#666666] mb-1">שם איש קשר (חובה)</label>
             <input type="text" value={editForm.Name} onChange={e => setEditForm({...editForm, Name: e.target.value})} className="w-full text-base p-2 border border-[#EAE3D9] rounded-lg focus:border-[#C5A880] outline-none transition-colors" placeholder="איש קשר" onClick={e => e.stopPropagation()} />
          </div>
          <div>
             <label className="block text-xs font-semibold text-[#666666] mb-1">טלפון</label>
             <input type="tel" dir="ltr" value={editForm.Phone} onChange={e => setEditForm({...editForm, Phone: e.target.value})} className="w-full text-base p-2 border border-[#EAE3D9] rounded-lg focus:border-[#C5A880] outline-none text-right transition-colors" placeholder="05X-XXXXXXX" onClick={e => e.stopPropagation()} />
          </div>
          <div>
             <label className="block text-xs font-semibold text-[#666666] mb-1">דוא"ל</label>
             <input type="email" dir="ltr" value={editForm.Email} onChange={e => setEditForm({...editForm, Email: e.target.value})} className="w-full text-base p-2 border border-[#EAE3D9] rounded-lg focus:border-[#C5A880] outline-none text-right transition-colors" placeholder="name@example.com" onClick={e => e.stopPropagation()} />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
               <label className="block text-xs font-semibold text-[#666666] mb-1">סוג אירוע</label>
               <select value={editForm['Event Type']} onChange={e => setEditForm({...editForm, 'Event Type': e.target.value})} className="w-full text-base p-2 border border-[#EAE3D9] rounded-lg focus:border-[#C5A880] outline-none bg-white transition-colors" onClick={e => e.stopPropagation()}>
                 <option value="">- ללא שיוך -</option>
                 <option value="יום גיבוש">יום גיבוש</option>
                 <option value="נופש חברה">נופש חברה</option>
                 <option value="הרמת כוסית">הרמת כוסית</option>
                 <option value="כנס">כנס</option>
                 <option value="אחר">אחר</option>
               </select>
            </div>
            <div className="flex-1">
               <label className="block text-xs font-semibold text-[#666666] mb-1">תאריך</label>
               <input type="date" value={editForm['Event Date']} onChange={e => setEditForm({...editForm, 'Event Date': e.target.value})} className="w-full text-base p-2 border border-[#EAE3D9] rounded-lg focus:border-[#C5A880] outline-none transition-colors" onClick={e => e.stopPropagation()} />
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
                {getInitials(Company ? Company : Name)}
              </div>
              <div className="flex flex-col flex-1">
                <h3 className="text-xl font-bold text-[#333333] leading-tight">
                   {Company || Name || 'ללא שם'}
                </h3>
                {Company && Name && (
                   <span className="text-base text-[#666666] leading-tight mt-1">{Name}</span>
                )}
                {/* Event Type Soft Tag directly underneath */}
                {EventType && (
                  <div className="mt-2">
                    <span className="bg-[#9BACA4]/15 text-[#6c8579] text-sm px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap">
                      {EventType}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-1 ml-[-0.5rem] mt-[-0.5rem]">
              <button 
                disabled={isDeleting}
                onClick={handleDelete}
                className="flex-shrink-0 text-[#9BACA4] hover:text-red-500 transition-colors p-2 bg-[#FDFBF7] hover:bg-white rounded-full border border-transparent hover:border-red-100 shadow-sm"
              >
                <Trash2 size={16} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsEditingCard(true); }}
                className="flex-shrink-0 text-[#9BACA4] hover:text-[#C5A880] transition-colors p-2 bg-[#FDFBF7] hover:bg-white rounded-full border border-transparent hover:border-[#EAE3D9] shadow-sm"
              >
                <Edit2 size={16} />
              </button>
            </div>
          </div>
          
        <div className="flex flex-col gap-3 text-base text-[#666666]">
            {EventDate && (
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-[#C5A880]" />
                {/* Fallback to EventDate string if raw formats are funky */}
                <span>{EventDate}</span>
              </div>
            )}
            {Phone && (
              <div className="flex items-center gap-2">
                <PhoneIcon size={18} className="text-[#C5A880]" />
                <span>{Phone}</span>
              </div>
            )}
            {Email && (
              <div className="flex items-center gap-2 break-all">
                <Mail size={18} className="text-[#C5A880]" />
                <span>{Email}</span>
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
          <div className="text-base text-[#666666] bg-[#FDFBF7] p-4 rounded-xl border border-[#EAE3D9] shadow-inner max-h-[120px] overflow-y-auto hide-scrollbar whitespace-pre-wrap leading-relaxed">
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
              className="w-full bg-white text-[#333333] text-base p-4 rounded-xl border-2 border-[#C5A880]/50 focus:border-[#C5A880] outline-none resize-none min-h-[80px] shadow-sm transition-colors"
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

      <div className="mt-4 pt-4 border-t border-[#EAE3D9]/60 relative">
        {showTemplates && (
          <div className="absolute bottom-full mb-2 left-0 right-0 bg-white border border-[#EAE3D9] rounded-xl shadow-lg z-10 overflow-hidden">
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
