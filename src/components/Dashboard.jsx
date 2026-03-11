import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Link as LinkIcon, Users, CalendarDays, Briefcase, Download, TrendingUp, Database, Search, X, Loader2, MessageCircle, BarChart3, HelpCircle, Eye, EyeOff } from 'lucide-react';
import { fetchAirtableRecords, createAirtableRecord } from '../airtable';
import KanbanBoard from './KanbanBoard';
import { Toaster, toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import HelpSidebar from './HelpSidebar';
import HelpModal from './HelpModal';
import GuidedTour from './GuidedTour';

const Dashboard = () => {
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Help & Tour State
  const [showHelpSidebar, setShowHelpSidebar] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [runTour, setRunTour] = useState(false);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newClient, setNewClient] = useState({
    Name: '',
    Company: '',
    Phone: '',
    ['Event Type']: '',
    ['Event Date']: '',
    Notes: ''
  });

  const tourSteps = [
    {
      target: '#stats-grid',
      title: 'תמונת המצב שלך',
      content: 'כאן תראי את תמונת המצב של העסק שלך היום - פניות חדשות, סגירות ויחס המרה.'
    },
    {
      target: '#kanban-column-1',
      title: 'ניהול הלידים',
      content: 'כאן יופיעו אוטומטית אנשים שמילאו את הטופס באתר שלך. פשוט גררי אותם בין העמודות.'
    },
    {
      target: '#focus-mode-btn',
      title: 'מצב פוקוס',
      content: 'בלחיצה כאן, המערכת תסנן עבורך רק את מה שדחוף להיום - אירועים קרובים ופניות חדשות.'
    }
  ];

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('crm_has_seen_tour');
    if (!hasSeenTour) {
      setTimeout(() => setRunTour(true), 1500); // Small delay for entrance animation
    }
  }, []);

  const handleTourComplete = () => {
    setRunTour(false);
    localStorage.setItem('crm_has_seen_tour', 'true');
    toast.success('יוצאים לדרך! בהצלחה 🥂');
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await fetchAirtableRecords();
      setInquiries(data);
      setLoading(false);
    };

    loadData();
  }, []);

  const handleNewEvent = () => {
    setShowAddModal(true);
  };

  const handleSaveNewClient = async () => {
    if (!newClient.Name) {
      toast.error('חובה להזין את שם איש הקשר');
      return;
    }
    
    setIsSaving(true);
    const success = await createAirtableRecord(newClient);
    setIsSaving(false);
    
    if (success) {
      toast.success('הלקוח נוסף בהצלחה! 🥂');
      setShowAddModal(false);
      setNewClient({ Name: '', Company: '', Phone: '', ['Event Type']: '', ['Event Date']: '', Notes: '' });
      // Refresh Data
      setLoading(true);
      const data = await fetchAirtableRecords();
      setInquiries(data);
      setLoading(false);
    } else {
      toast.error('שגיאה בשמירת הלקוח');
    }
  };

  const shareJoinLink = () => {
    navigator.clipboard.writeText('https://crm-tal.vercel.app/join');
    toast.success('הקישור הועתק: https://crm-tal.vercel.app/join');
  };

  const exportToCSV = () => {
    if (inquiries.length === 0) {
      toast.error('אין נתונים לייצוא');
      return;
    }

    // Define columns to export
    const headers = ['שם הלקוח', 'טלפון', 'דוא"ל', 'סוג אירוע', 'תאריך', 'סטטוס', 'הערות'];
    const csvRows = [];
    
    // Add BOM for Hebrew Excel support
    csvRows.push('\uFEFF' + headers.join(','));

    inquiries.forEach(row => {
      const values = [
        row.Name || '',
        row.Phone || '',
        row.Email || '',
        row['Event Type'] || '',
        row['Event Date'] || '',
        row.Status || 'פניות חדשות',
        (row.Notes || '').replace(/\n/g, ' ') // Clean newlines from notes for CSV
      ];
      
      // Escape commas and quotes for CSV
      const escapedValues = values.map(val => `"${String(val).replace(/"/g, '""')}"`);
      csvRows.push(escapedValues.join(','));
    });

    const csvData = csvRows.join('\n');
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Tal_Shani_CRM_Export_${new Date().toLocaleDateString('he-IL').replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('הקובץ יוצא בהצלחה');
  };

  // Compute Smart Stats & Analytics
  const totalLeads = inquiries.length;
  const newLeadsCount = inquiries.filter(i => i.Status === 'פניות חדשות' || !i.Status).length;
  const inProgressCount = inquiries.filter(i => i.Status === 'בטיפול').length;
  const closedCount = inquiries.filter(i => i.Status === 'אירוע סגור').length;
  
  // Calculate Conversion Rate (Closed / Total)
  const conversionRate = totalLeads > 0 ? Math.round((closedCount / totalLeads) * 100) : 0;
  
  // Calculate percentages for the distribution bar
  const newPct = totalLeads > 0 ? (newLeadsCount / totalLeads) * 100 : 0;
  const inProgressPct = totalLeads > 0 ? (inProgressCount / totalLeads) * 100 : 0;
  const closedPct = totalLeads > 0 ? (closedCount / totalLeads) * 100 : 0;

  const eventsNext7DaysCount = inquiries.filter(inq => {
    if (!inq._rawDate) return false;
    const eventDate = new Date(inq._rawDate);
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    return eventDate >= today && eventDate <= nextWeek;
  }).length;

  // Calculate Top Event Type
  const eventTypes = inquiries
    .map(i => i['Event Type'])
    .filter(Boolean);
  
  const eventTypeCounts = eventTypes.reduce((acc, curr) => {
    acc[curr] = (acc[curr] || 0) + 1;
    return acc;
  }, {});

  let topEventType = 'אין נתונים';
  let maxCount = 0;
  for (const [type, count] of Object.entries(eventTypeCounts)) {
    if (count > maxCount) {
      maxCount = count;
      topEventType = type;
    }
  }

  // Get 5 recent leads for mobile "Quick Actions"
  // Assuming inquiries are loaded roughly chronologically or we can just slice
  const recentLeads = [...inquiries]
     .filter(i => i.Status === 'פניות חדשות' || !i.Status)
     .slice(0, 5);

  const handleQuickWhatsApp = (lead) => {
    if (!lead.Phone) {
      toast.error('חסר מספר טלפון');
      return;
    }
    const cleanPhone = lead.Phone.replace(/\D/g, '');
    const waNumber = `972${cleanPhone.startsWith('0') ? cleanPhone.slice(1) : cleanPhone}`;
    const nameStr = lead.Name || 'לקוח יקר';
    const message = encodeURIComponent(`היי ${nameStr}, זאת טל שני הפקת אירועים. אני רואה את הפנייה שלך ואשמח לעזור! ✨`);
    window.open(`https://wa.me/${waNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7]">
      {/* Top Bar - Glassmorphism Aesthetic (Desktop Only for now, or scaled down for mobile) */}
      <header className="glass-header flex items-center justify-between px-6 py-4 hidden md:flex">
        <h1 className="text-2xl font-bold text-[#333333]">
          טל שני <span className="font-light text-[#C5A880]">| ניהול פניות</span>
        </h1>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#333333] to-[#1a1a1a] rounded-xl flex items-center justify-center text-[#C5A880] font-bold text-xl shadow-md">
            TS
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#333333]">לוח בקרה</h1>
            <p className="text-[#9BACA4] text-sm">הפקת אירועים בסטנדרט אחר</p>
          </div>
        </div>
        
        {/* Sticky Search Bar */}
        <div className="w-full md:w-[400px] relative">
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-[#9BACA4]" />
          </div>
          <input
            type="text"
            className="w-full pl-4 pr-10 py-3 bg-[#FDFBF7] border border-[#EAE3D9] rounded-2xl text-base text-[#333333] placeholder-[#9BACA4] focus:outline-none focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880] transition-all"
            placeholder="חפש שם חברה, לקוח, טלפון..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/import')}
            className="flex items-center gap-2 bg-white text-[#666666] px-4 py-3 rounded-2xl text-base font-semibold transition-all border border-[#EAE3D9] hover:bg-[#FDFBF7] shadow-sm active:scale-95"
          >
            <Database size={18} className="text-[#C5A880]"/>
            <span className="hidden md:inline">יבוא נתונים</span>
          </button>

          <button
            onClick={shareJoinLink}
            className="flex items-center gap-2 bg-white text-[#666666] px-4 py-3 rounded-2xl text-base font-semibold transition-all border border-[#EAE3D9] hover:bg-[#FDFBF7] shadow-sm active:scale-95"
          >
            <LinkIcon size={18} className="text-[#333333]"/>
            <span className="hidden md:inline">טופס הוספה חיצוני</span>
          </button>
        </div>
      </header>

      {/* Mobile Header - Manager's Pulse */}
      <header className="md:hidden glass-header flex flex-col px-4 py-5 gap-4">
        <div className="flex justify-between items-center">
           <div>
             <h1 className="text-xl font-bold text-[#333333]">היי טל ✨</h1>
             <p className="text-[#9BACA4] text-sm">זה המצב להיום בלוח שלך</p>
           </div>
           <div className="w-10 h-10 bg-gradient-to-br from-[#EAE3D9] to-[#C5A880] rounded-full flex items-center justify-center text-white font-bold text-lg shadow-inner">
             TS
           </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative p-4 md:p-6 w-full max-w-[1400px] mx-auto flex flex-col gap-6 hide-scrollbar pb-24 md:pb-6">
        
        {/* Kanban Board Header & Add Button (Desktop Only) */}
        <div className="hidden md:flex justify-between items-center bg-[#FDFBF7]">
           <button 
             onClick={handleNewEvent}
             className="flex items-center gap-2 bg-gradient-to-r from-[#C5A880] to-[#b09673] text-white px-6 py-3.5 rounded-2xl text-lg font-bold shadow-[0_8px_16px_rgba(197,168,128,0.2)] hover:shadow-[0_12px_20px_rgba(197,168,128,0.3)] hover:-translate-y-0.5 transition-all active:scale-95 border border-[#C5A880]/50"
           >
             <Plus size={22} strokeWidth={2.5} />
             <span>הוספת לקוח חדש</span>
           </button>
        </div>
        
        {/* Analytics & Smart Stats Area */}
        <div className="flex flex-col gap-4 shrink-0">
          
          {/* Smart Stats Bento */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-[20px] p-5 border border-[#EAE3D9] shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#EAE3D9]/50 flex items-center justify-center text-[#C5A880]">
                <Users size={24} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#666666]">לידים חדשים</p>
                {loading ? <div className="h-8 w-16 bg-[#EAE3D9]/50 rounded animate-pulse mt-1" /> : <h2 className="text-3xl font-bold text-[#333333]">{newLeadsCount}</h2>}
              </div>
            </div>
            
            <div className="bg-white rounded-[20px] p-5 border border-[#EAE3D9] shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#EAE3D9]/50 flex items-center justify-center text-[#C5A880]">
                <Briefcase size={24} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#666666]">סה"כ בטיפול</p>
                {loading ? <div className="h-8 w-16 bg-[#EAE3D9]/50 rounded animate-pulse mt-1" /> : <h2 className="text-3xl font-bold text-[#333333]">{inProgressCount}</h2>}
              </div>
            </div>

            <div className="bg-white rounded-[20px] p-5 border border-[#EAE3D9] shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#EAE3D9]/50 flex items-center justify-center text-[#C5A880]">
                <CalendarDays size={24} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#666666]">אירועים השבוע</p>
                {loading ? <div className="h-8 w-16 bg-[#EAE3D9]/50 rounded animate-pulse mt-1" /> : <h2 className="text-3xl font-bold text-[#333333]">{eventsNext7DaysCount}</h2>}
              </div>
            </div>
            
            {/* Conversion Rate Card */}
            <div className="bg-[#333333] rounded-[20px] p-5 border border-[#444] shadow-md flex items-center justify-between relative overflow-hidden">
               <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/noise-lines.png')]" />
               <div className="relative z-10">
                 <p className="text-sm font-semibold text-[#C5A880] uppercase tracking-wider">יחס סגירה (המרות)</p>
                 <div className="flex items-end gap-2 mt-1">
                   {loading ? (
                     <div className="h-8 w-16 bg-[#444] rounded animate-pulse" />
                   ) : (
                     <>
                       <h2 className="text-4xl font-bold text-white">{conversionRate}%</h2>
                       <span className="text-[#9BACA4] text-sm mb-1.5 font-medium">{closedCount} משפחות</span>
                     </>
                   )}
                 </div>
               </div>
               <div className="relative z-10 w-12 h-12 rounded-full bg-[#C5A880]/20 flex items-center justify-center text-[#C5A880]">
                  <TrendingUp size={24} />
               </div>
            </div>
          </div>

          {/* Status Distribution Bar */}
          {!loading && totalLeads > 0 && (
            <div className="bg-white rounded-[16px] p-4 border border-[#EAE3D9] shadow-sm flex flex-col gap-2">
              <div className="flex justify-between text-xs font-semibold text-[#666666] px-1">
                <span>חלוקת פניות (סה"כ: {totalLeads})</span>
              </div>
              <div className="h-3 w-full bg-[#F5F2EB] rounded-full overflow-hidden flex">
                <div style={{ width: `${newPct}%` }} className="bg-[#C5A880] transition-all duration-1000" title={`פניות חדשות: ${Math.round(newPct)}%`} />
                <div style={{ width: `${inProgressPct}%` }} className="bg-[#9BACA4] transition-all duration-1000" title={`בטיפול: ${Math.round(inProgressPct)}%`} />
                <div style={{ width: `${closedPct}%` }} className="bg-[#333333] transition-all duration-1000" title={`אירוע סגור: ${Math.round(closedPct)}%`} />
              </div>
              <div className="flex gap-4 text-xs mt-1">
                 <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#C5A880]" /> <span className="text-[#666666]">חדשים ({newLeadsCount})</span></div>
                 <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#9BACA4]" /> <span className="text-[#666666]">בטיפול ({inProgressCount})</span></div>
                 <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#333333]" /> <span className="text-[#666666]">סגורים ({closedCount})</span></div>
              </div>
            </div>
          )}
        </div>

        {/* ---------------- MOBILE EXCLUSIVE: MANAGER'S PULSE ---------------- */}
        <div className="md:hidden flex flex-col gap-6 w-full">
           
           {/* Top Event Type & Status Pie */}
           <div className="grid grid-cols-2 gap-4">
              {/* Pie Chart Card */}
              <div className="bg-white rounded-[20px] p-5 border border-[#EAE3D9] shadow-sm flex flex-col items-center justify-center min-h-[160px]">
                 <p className="text-sm font-semibold text-[#666666] mb-4 w-full text-right">התפלגות פניות</p>
                 <div 
                   className="w-24 h-24 rounded-full shadow-inner"
                   style={{
                     background: totalLeads > 0 ? `conic-gradient(
                       #C5A880 0% ${newPct}%, 
                       #9BACA4 ${newPct}% ${newPct + inProgressPct}%, 
                       #333333 ${newPct + inProgressPct}% 100%
                     )` : '#EAE3D9'
                   }}
                 />
              </div>

              {/* Top Event Type Card */}
              <div className="bg-white rounded-[20px] p-5 border border-[#EAE3D9] shadow-sm flex flex-col justify-center min-h-[160px]">
                 <div className="w-10 h-10 rounded-full bg-[#EAE3D9]/50 flex items-center justify-center text-[#C5A880] mb-3">
                    <BarChart3 size={20} />
                 </div>
                 <p className="text-sm font-semibold text-[#666666]">סוג האירוע המוביל</p>
                 <h3 className="text-xl font-bold text-[#333333] mt-1 leading-tight">{topEventType}</h3>
              </div>
           </div>

           {/* Mobile Quick Actions List */}
           <div className="flex flex-col gap-2">
             <div className="flex justify-between items-center px-1 mb-1">
               <h3 className="text-sm font-bold text-[#333333]">פניות חדשות שניכנסו</h3>
               <span className="text-xs text-[#9BACA4] font-medium">{recentLeads.length} פניות</span>
             </div>
             
             {recentLeads.length > 0 ? recentLeads.map(lead => (
               <div key={lead.id} className="bg-white rounded-2xl p-4 border border-[#EAE3D9] shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex justify-between items-center">
                 <div className="flex flex-col gap-1 overflow-hidden">
                    <span className="font-bold text-[#333333] text-base truncate">{lead.Company || lead.Name}</span>
                    {lead.Company && lead.Name && <span className="text-[#9BACA4] text-xs truncate">{lead.Name}</span>}
                    {lead['Event Type'] && <span className="text-[#C5A880] text-xs font-semibold">{lead['Event Type']}</span>}
                 </div>
                 <button 
                   onClick={() => handleQuickWhatsApp(lead)}
                   className="flex-shrink-0 w-12 h-12 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-md active:scale-95 transition-transform"
                 >
                   <MessageCircle size={22} />
                 </button>
               </div>
             )) : (
               <div className="bg-white rounded-2xl p-6 border border-[#EAE3D9] text-center text-[#9BACA4]">
                 אין פניות חדשות שממתינות לטיפול
               </div>
             )}
           </div>
        </div>

        {/* ---------------- DESKTOP EXCLUSIVE: KANBAN BOARD ---------------- */}
        <div className="hidden md:flex flex-1 min-h-[400px]">
          {loading ? (
            <div className="flex gap-6 h-full w-full overflow-hidden">
              {[1,2,3].map(i => (
                <div key={i} className="min-w-[320px] w-[320px] flex-shrink-0 bg-[#F5F2EB]/50 backdrop-blur-sm rounded-[24px] border border-[#EAE3D9]/50 flex flex-col p-4 animate-pulse">
                   <div className="h-6 w-32 bg-[#EAE3D9]/80 rounded mb-4" />
                   <div className="flex gap-2 items-center mb-6">
                     <div className="h-6 w-12 bg-[#EAE3D9] rounded-full" />
                     <div className="h-[1px] flex-1 bg-[#EAE3D9]" />
                   </div>
                   <div className="space-y-4">
                     <div className="h-32 bg-white rounded-2xl border border-[#EAE3D9]/30" />
                     <div className="h-24 bg-white rounded-2xl border border-[#EAE3D9]/30" />
                   </div>
                </div>
              ))}
            </div>
          ) : (
            <KanbanBoard 
              inquiries={inquiries.filter(i => {
                if (!searchQuery) return true;
                const q = searchQuery.toLowerCase();
                return (
                  i.Name?.toLowerCase().includes(q) ||
                  i.Company?.toLowerCase().includes(q) ||
                  i.Phone?.includes(q) ||
                  i['Event Type']?.toLowerCase().includes(q)
                );
              })}
              setInquiries={setInquiries} 
              focusMode={focusMode} 
            />
          )}
        </div>
      </main>

      {/* Mobile Floating / Bottom Action Button */}
      <div className="md:hidden fixed bottom-6 left-4 right-4 z-40">
         <button 
           onClick={handleNewEvent}
           className="w-full flex justify-center items-center gap-2 bg-[#333333] text-[#C5A880] py-4 rounded-2xl text-lg font-bold shadow-[0_8px_20px_rgba(0,0,0,0.2)] border border-[#444] active:scale-95 transition-transform"
         >
           <Plus size={24} />
           <span>הוספת לקוח חדש</span>
         </button>
      </div>
      <Toaster position="bottom-center" toastOptions={{ duration: 3000, style: { background: '#333333', color: '#fff', borderRadius: '12px' } }} />
      
      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#333333]/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[24px] shadow-2xl overflow-hidden flex flex-col p-6 border border-[#EAE3D9] animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#333333]">הוספת לקוח חדש</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 bg-[#FDFBF7] hover:bg-[#EAE3D9] rounded-full text-[#666666] transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex flex-col gap-4 overflow-y-auto pr-1 hide-scrollbar" style={{maxHeight: '70vh'}}>
              <div>
                <label className="block text-sm font-semibold text-[#666666] mb-1">שם איש קשר (חובה)</label>
                <input 
                  type="text" 
                  value={newClient.Name}
                  onChange={(e) => setNewClient({...newClient, Name: e.target.value})}
                  className="w-full border-2 border-[#EAE3D9] rounded-xl p-3 text-base outline-none focus:border-[#C5A880] transition-colors"
                  placeholder="לדוגמה: דני פרידמן"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#666666] mb-1">שם החברה (אופציונלי)</label>
                <input 
                  type="text" 
                  value={newClient.Company}
                  onChange={(e) => setNewClient({...newClient, Company: e.target.value})}
                  className="w-full border-2 border-[#EAE3D9] rounded-xl p-3 text-base outline-none focus:border-[#C5A880] transition-colors"
                  placeholder="לדוגמה: גוגל ישראל"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#666666] mb-1">טלפון</label>
                <input 
                  type="tel" 
                  value={newClient.Phone}
                  onChange={(e) => setNewClient({...newClient, Phone: e.target.value})}
                  className="w-full border-2 border-[#EAE3D9] rounded-xl p-3 text-base outline-none focus:border-[#C5A880] transition-colors text-right"
                  dir="ltr"
                  placeholder="05X-XXXXXXX"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-semibold text-[#666666] mb-1">סוג אירוע</label>
                    <select 
                      value={newClient['Event Type']}
                      onChange={(e) => setNewClient({...newClient, ['Event Type']: e.target.value})}
                      className="w-full border-2 border-[#EAE3D9] rounded-xl p-3 text-base outline-none focus:border-[#C5A880] transition-colors bg-white"
                    >
                      <option value="">בחר...</option>
                      <option value="יום גיבוש">יום גיבוש</option>
                      <option value="נופש חברה">נופש חברה</option>
                      <option value="הרמת כוסית">הרמת כוסית</option>
                      <option value="כנס">כנס</option>
                      <option value="אחר">אחר</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-semibold text-[#666666] mb-1">תאריך האירוע</label>
                    <input 
                      type="date" 
                      value={newClient['Event Date']}
                      onChange={(e) => setNewClient({...newClient, ['Event Date']: e.target.value})}
                      className="w-full border-2 border-[#EAE3D9] rounded-xl p-3 text-base outline-none focus:border-[#C5A880] transition-colors"
                    />
                 </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#666666] mb-1">הערות ראשוניות</label>
                <textarea 
                  value={newClient.Notes}
                  onChange={(e) => setNewClient({...newClient, Notes: e.target.value})}
                  className="w-full border-2 border-[#EAE3D9] rounded-xl p-3 text-base outline-none focus:border-[#C5A880] transition-colors resize-none min-h-[100px]"
                  placeholder="פרטים נוספים, התקלות מיוחדות..."
                />
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-[#EAE3D9]/60 flex gap-3">
              <button 
                onClick={handleSaveNewClient}
                disabled={isSaving}
                className="flex-1 bg-[#C5A880] hover:bg-[#b09673] text-white py-4 rounded-xl font-bold text-lg shadow-md transition-all active:scale-95 disabled:opacity-70 flex justify-center items-center gap-2"
              >
                {isSaving ? <Loader2 className="animate-spin" size={24} /> : 'שמור לקוח חדש'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
