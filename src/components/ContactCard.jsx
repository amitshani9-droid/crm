import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Mail, Phone as PhoneIcon, Calendar, Edit2, Check, Plus, Paperclip, Upload, File as FileIcon, Trash2 } from 'lucide-react';
import { updateAirtableRecord, uploadFileToRecord, deleteAirtableRecord } from '../airtable';
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
    'Event Type': EventType || '',
    'Event Date': localData._rawDate || ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleDelete = async (e) => {
    e.stopPropagation();
    
    const confirmed = window.confirm("האם את בטוחה שברצונך למחוק את הלקוח? פעולה זו אינה ניתנת לביטול.");
    if (!confirmed) return;

    setIsDeleting(true);
    const success = await deleteAirtableRecord(id);
    setIsDeleting(false);

    if (success) {
      toast.success('הלקוח נמחק בהצלחה');
      if (onDelete) onDelete(id);
    } else {
      toast.error('שגיאה במחיקת הלקוח');
    }
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
      const cleanPhone = Phone.replace(/\D/g, '');
      const waNumber = `972${cleanPhone.startsWith('0') ? cleanPhone.slice(1) : cleanPhone}`;
      
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

  const handleDragStart = (e) => {
    e.dataTransfer.setData('recordId', id);
    // Slight opacity change on the ghost image doesn't work well natively, but we can set effectAllowed
    e.dataTransfer.effectAllowed = "move";
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
              onBlur={handleSaveNote}
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
             className="text-[#9BACA4] hover:text-[#C5A880] italic text-sm text-right px-1 w-full text-right transition-colors"
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
                
                {/* Tooltip Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1">
                  <span className="text-[0.6rem] text-white text-center leading-tight truncate w-full px-0.5" dir="ltr">
                    {file.filename?.substring(0, 10)}{file.filename?.length > 10 ? '...' : ''}
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-[#EAE3D9]/60">
        <button 
          onClick={handleWhatsApp} 
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
