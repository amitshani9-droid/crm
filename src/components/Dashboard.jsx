import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Link as LinkIcon, Search, Eye, EyeOff, RotateCw, FileDown, Database, HelpCircle, MessageCircle, Phone as PhoneIcon, Moon, Sun, Settings, Calendar } from 'lucide-react';
import { fetchAirtableRecords, createAirtableRecord, isValidIsraeliPhone } from '../airtable';
import KanbanBoard from './KanbanBoard';
import { Toaster, toast } from 'react-hot-toast';
import { useNavigate, useOutletContext } from 'react-router-dom';
import HelpSidebar from './HelpSidebar';
import HelpModal from './HelpModal';
import GuidedTour from './GuidedTour';
import StatsGrid from './StatsGrid';
import AddClientModal from './AddClientModal';
import FilterBar from './FilterBar';
import MonthlyChart from './MonthlyChart';

// Animated number count-up hook
const useAnimatedNumber = (value, duration = 1100) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setDisplay(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value, duration]);
  return display;
};

const btnMotion = { whileHover: { scale: 1.02, y: -1 }, whileTap: { scale: 0.97 }, transition: { type: 'spring', stiffness: 400, damping: 25 } };

const Dashboard = () => {
  const navigate = useNavigate();
  const { searchQuery, setSearchQuery, focusMode, setFocusMode, refreshing, setRefreshing } = useOutletContext();
  
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Help & Tour State
  const [showHelpSidebar, setShowHelpSidebar] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [runTour, setRunTour] = useState(false);

  // Dark mode
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('crm_dark_mode') === 'true');
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('crm_dark_mode', darkMode);
  }, [darkMode]);

  // Filter State
  const [filters, setFilters] = useState({ status: '', eventType: '', quoteSent: '' });

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 150);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newClient, setNewClient] = useState({
    Name: '', Company: '', Phone: '', Email: '',
    ['Event Type']: '', ['Event Date']: '', Notes: '', Status: 'פניות חדשות',
    Budget: '', Participants: ''
  });

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        setShowAddModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const tourSteps = [
    { target: '#stats-grid', title: 'תמונת המצב שלך', content: 'כאן תראי את תמונת המצב של העסק שלך היום - פניות חדשות, סגירות ויחס המרה.' },
    { target: '#kanban-column-1', title: 'ניהול הלידים', content: 'כאן יופיעו אוטומטית אנשים שמילאו את הטופס באתר שלך. פשוט גררי אותם בין העמודות.' },
    { target: '#focus-mode-btn', title: 'מצב פוקוס', content: 'בלחיצה כאן, המערכת תסנן עבורך רק את מה שדחוף להיום - אירועים קרובים ופניות חדשות.' }
  ];

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('crm_has_seen_tour');
    if (!hasSeenTour) setTimeout(() => setRunTour(true), 1500);
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

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const data = await fetchAirtableRecords();
        if (data.length > 0) setInquiries(data);
      } catch {
        // Silent fail — user can manually refresh
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await fetchAirtableRecords();
      setInquiries(data);
      toast.success('הנתונים רועננו בהצלחה! 🔄');
    } catch {
      toast.error('שגיאה ברענון הנתונים');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSaveNewClient = async () => {
    if (!newClient.Name) { toast.error('חובה להזין את שם איש הקשר'); return; }
    if (newClient.Phone && !isValidIsraeliPhone(newClient.Phone)) {
      toast.error('מספר הטלפון אינו תקין (יש להזין מספר ישראלי תקני)'); return;
    }
    setIsSaving(true);
    const success = await createAirtableRecord(newClient);
    setIsSaving(false);
    if (success) {
      toast.success('הלקוח נוסף בהצלחה! 🥂');
      setShowAddModal(false);
      setNewClient({ Name: '', Company: '', Phone: '', Email: '', ['Event Type']: '', ['Event Date']: '', Notes: '', Status: 'פניות חדשות', Budget: '', Participants: '' });
      // Refresh in background without showing skeleton loader
      fetchAirtableRecords().then(data => setInquiries(data));
    } else {
      toast.error('שגיאה בשמירת הלקוח');
    }
  };

  const shareJoinLink = () => {
    const link = `${window.location.origin}/join`;
    navigator.clipboard.writeText(link);
    toast.success(`הקישור הועתק: ${link}`);
  };

  const exportToCSV = () => {
    const q = debouncedSearch.toLowerCase();
    const toExport = inquiries.filter(i => {
      if (filters.status && (i.Status || 'פניות חדשות') !== filters.status) return false;
      if (filters.eventType && i['Event Type'] !== filters.eventType) return false;
      if (filters.quoteSent && !i['Quote Sent']) return false;
      if (!q) return true;
      return [i.Name, i.Company, i.Phone, i['Event Type']].filter(Boolean).some(v => v.toLowerCase().includes(q));
    });
    if (toExport.length === 0) { toast.error('אין נתונים לייצוא'); return; }
    const headers = ['שם הלקוח', 'חברה', 'טלפון', 'דוא"ל', 'סוג אירוע', 'תאריך', 'סטטוס', 'נשלח הצ"מ', 'הערות'];
    const csvRows = ['\uFEFF' + headers.join(',')];
    toExport.forEach(row => {
      const values = [row.Name || '', row.Company || '', row.Phone || '', row.Email || '', row['Event Type'] || '', row['Event Date'] || '', row.Status || 'פניות חדשות', row['Quote Sent'] ? 'כן' : 'לא', (row.Notes || '').replace(/\n/g, ' ')];
      csvRows.push(values.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Tal_Shani_CRM_Export_${new Date().toLocaleDateString('he-IL').replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('הקובץ יוצא בהצלחה');
  };

  const { totalLeads, newLeadsCount, inProgressCount, closedCount, conversionRate, newPct, inProgressPct, closedPct, eventsNext7DaysCount, upcomingEvents } = useMemo(() => {
    const total = inquiries.length;
    const newCount = inquiries.filter(i => i.Status === 'פניות חדשות' || !i.Status).length;
    const inProgress = inquiries.filter(i => i.Status === 'בטיפול').length;
    const closed = inquiries.filter(i => i.Status === 'סגור').length;
    const today = new Date();
    const nextWeek = new Date(); nextWeek.setDate(today.getDate() + 7);
    const eventsNext7Days = inquiries.filter(inq => { if (!inq._rawDate) return false; const d = new Date(inq._rawDate); return d >= today && d <= nextWeek; }).length;
    return {
      totalLeads: total, newLeadsCount: newCount, inProgressCount: inProgress, closedCount: closed,
      conversionRate: total > 0 ? Math.round((closed / total) * 100) : 0,
      newPct: total > 0 ? (newCount / total) * 100 : 0,
      inProgressPct: total > 0 ? (inProgress / total) * 100 : 0,
      closedPct: total > 0 ? (closed / total) * 100 : 0,
      eventsNext7DaysCount: eventsNext7Days,
      upcomingEvents: inquiries.filter(inq => { if (!inq._rawDate) return false; const diff = (new Date(inq._rawDate) - new Date()) / (1000 * 60 * 60 * 24); return diff >= 0 && diff <= 3; })
    };
  }, [inquiries]);

  // Animated stat values
  const animNewLeads = useAnimatedNumber(loading ? 0 : newLeadsCount);
  const animInProgress = useAnimatedNumber(loading ? 0 : inProgressCount);
  const animEvents = useAnimatedNumber(loading ? 0 : eventsNext7DaysCount);
  const animConversion = useAnimatedNumber(loading ? 0 : conversionRate);

  const handleQuickWhatsApp = (lead) => {
    if (!lead.Phone) { toast.error('חסר מספר טלפון'); return; }
    const cleanPhone = lead.Phone.replace(/\D/g, '');
    const waNumber = `972${cleanPhone.startsWith('0') ? cleanPhone.slice(1) : cleanPhone}`;
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(`היי ${lead.Name || 'לקוח יקר'}, זאת טל שני הפקת אירועים. אני רואה את הפנייה שלך ואשמח לעזור! ✨`)}`, '_blank');
  };

  return (
    <div className="min-h-screen flex flex-col ambient-bg">

      {/* ── Desktop Header ── */}
      <header className="glass-header hidden md:flex items-center justify-between px-6 py-4 gap-6">
        {/* Brand */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-br from-[#333333] to-[#1a1a1a] rounded-xl flex items-center justify-center text-[#C5A880] font-bold text-base shadow-lg shadow-black/20 border border-white/10">
            TS
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#333333] leading-tight tracking-tight">
              טל שני <span className="font-light text-[#C5A880]">| CRM</span>
            </h1>
            <p className="text-[#9BACA4] text-xs font-medium">הפקת אירועים בסטנדרט אחר</p>
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-[380px] relative">
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
            <Search className="h-4.5 w-4.5 text-[#9BACA4]" size={18} />
          </div>
          <input
            type="text"
            className="w-full pl-4 pr-10 py-2.5 bg-white/70 border border-[#EAE3D9] rounded-xl text-sm text-[#333333] placeholder-[#9BACA4] focus:outline-none focus:border-[#C5A880] focus:ring-2 focus:ring-[#C5A880]/10 focus:bg-white transition-all"
            placeholder="חיפוש לקוח, חברה, טלפון..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {[
            { onClick: handleRefresh, disabled: refreshing, icon: <RotateCw size={17} className={`text-[#C5A880] ${refreshing ? 'animate-spin' : ''}`} />, label: 'רענן' },
            { onClick: exportToCSV, icon: <FileDown size={17} className="text-[#C5A880]" />, label: 'ייצוא' },
            { onClick: () => navigate('/import'), icon: <Database size={17} className="text-[#C5A880]" />, label: 'ייבוא' },
            { onClick: shareJoinLink, icon: <LinkIcon size={17} className="text-[#666666]" />, label: 'טופס חיצוני' },
          ].map((btn, i) => (
            <motion.button
              key={i}
              onClick={btn.onClick}
              disabled={btn.disabled}
              {...btnMotion}
              className="flex items-center gap-1.5 bg-white dark:bg-[#1a1917] text-[#666666] dark:text-[#9BACA4] px-3.5 py-2.5 rounded-xl text-sm font-semibold border border-[#EAE3D9] dark:border-[#2d2b28] shadow-sm disabled:opacity-50"
            >
              {btn.icon}
              <span className="hidden lg:inline">{btn.label}</span>
            </motion.button>
          ))}

          <motion.button
            id="focus-mode-btn"
            onClick={() => setFocusMode(!focusMode)}
            {...btnMotion}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold border shadow-sm transition-colors ${focusMode ? 'bg-[#333333] text-[#C5A880] border-[#333333]' : 'bg-white text-[#666666] border-[#EAE3D9]'}`}
          >
            {focusMode ? <EyeOff size={17} /> : <Eye size={17} className="text-[#C5A880]" />}
            <span className="hidden lg:inline">{focusMode ? 'בטל פוקוס' : 'פוקוס'}</span>
          </motion.button>

          <motion.button
            onClick={() => setDarkMode(d => !d)}
            {...btnMotion}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold border shadow-sm transition-colors ${darkMode ? 'bg-[#1a1917] text-[#C5A880] border-[#2d2b28]' : 'bg-white text-[#666666] border-[#EAE3D9]'}`}
            title={darkMode ? 'מצב בהיר' : 'מצב כהה'}
          >
            {darkMode ? <Sun size={17} /> : <Moon size={17} />}
          </motion.button>

          <motion.button
            onClick={() => setShowHelpSidebar(true)}
            {...btnMotion}
            className="flex items-center gap-1.5 bg-[#F0F8F9] text-[#2C8A99] px-3.5 py-2.5 rounded-xl text-sm font-semibold border border-[#2C8A99]/20 shadow-sm dark:bg-[#0d2a2f] dark:border-[#2C8A99]/30"
          >
            <HelpCircle size={17} strokeWidth={2.5} />
            <span className="hidden lg:inline">עזרה</span>
          </motion.button>

          <motion.button
            onClick={() => navigate('/settings')}
            {...btnMotion}
            className="flex items-center gap-1.5 bg-white text-[#666666] px-3.5 py-2.5 rounded-xl text-sm font-semibold border border-[#EAE3D9] shadow-sm dark:bg-[#1a1917] dark:border-[#2d2b28]"
          >
            <Settings size={17} className="text-[#C5A880]" />
            <span className="hidden lg:inline">הגדרות</span>
          </motion.button>
        </div>
      </header>

      {/* ── Mobile Header ── */}
      <header className="md:hidden glass-header flex flex-col px-4 py-4 gap-3">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-[#333333]">היי טל ✨</h1>
            <p className="text-[#9BACA4] text-xs">זה המצב להיום בלוח שלך</p>
          </div>
          <div className="flex items-center gap-2">
            <motion.button onClick={handleRefresh} disabled={refreshing} whileTap={{ scale: 0.93 }}
              className="p-2.5 bg-white border border-[#EAE3D9] rounded-xl text-[#C5A880] shadow-sm disabled:opacity-50">
              <RotateCw size={20} className={refreshing ? 'animate-spin' : ''} />
            </motion.button>
            <motion.button onClick={() => setDarkMode(d => !d)} whileTap={{ scale: 0.93 }}
              className="p-2.5 bg-white dark:bg-[#1a1917] border border-[#EAE3D9] dark:border-[#2d2b28] rounded-xl text-[#C5A880] shadow-sm">
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </motion.button>
            <motion.button onClick={() => setShowHelpSidebar(true)} whileTap={{ scale: 0.93 }}
              className="p-2.5 bg-white dark:bg-[#1a1917] border border-[#EAE3D9] dark:border-[#2d2b28] rounded-xl text-[#2C8A99] shadow-sm">
              <HelpCircle size={20} />
            </motion.button>
            <div className="w-9 h-9 bg-gradient-to-br from-[#C5A880] to-[#9b825f] rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
              TS
            </div>
          </div>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Search size={16} className="text-[#9BACA4]" />
          </div>
          <input
            type="text"
            className="w-full pl-4 pr-9 py-2.5 bg-white border border-[#EAE3D9] rounded-xl text-sm placeholder-[#9BACA4] focus:outline-none focus:border-[#C5A880] focus:ring-2 focus:ring-[#C5A880]/10 transition-all"
            placeholder="חפש לקוח, חברה, טלפון..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 overflow-y-auto relative p-4 md:p-6 w-full max-w-[1400px] mx-auto flex flex-col gap-5 hide-scrollbar pb-24 md:pb-6">

        {/* Add Client Button (Desktop) */}
        <div className="hidden md:flex justify-between items-center">
          <motion.button
            onClick={() => setShowAddModal(true)}
            whileHover={{ scale: 1.02, y: -2, boxShadow: '0 16px 32px rgba(197,168,128,0.35)' }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 22 }}
            className="flex items-center gap-2 bg-gradient-to-r from-[#C5A880] to-[#b09673] text-white px-6 py-3.5 rounded-2xl text-base font-bold shadow-[0_8px_20px_rgba(197,168,128,0.25)] border border-[#C5A880]/40"
          >
            <Plus size={20} strokeWidth={2.5} />
            <span>הוספת לקוח חדש</span>
          </motion.button>
        </div>

        {/* Upcoming Events Banner */}
        <AnimatePresence>
          {!loading && upcomingEvents.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="flex items-center gap-3 px-5 py-3 rounded-2xl shrink-0"
              style={{
                background: 'linear-gradient(135deg, #FEF9EC, #FEF3C7)',
                border: '1px solid #FDE68A',
                boxShadow: '0 2px 12px rgba(251,191,36,0.12)'
              }}
            >
              <span className="text-xl">⚡</span>
              <span className="text-amber-800 text-sm font-semibold">
                יש לך {upcomingEvents.length} אירוע{upcomingEvents.length > 1 ? 'ים' : ''} ב-3 הימים הקרובים:&nbsp;
                <span className="font-bold">{upcomingEvents.map(e => e.Company || e.Name).join(', ')}</span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Stats Grid (desktop only) ── */}
        <div className="hidden md:block">
          <StatsGrid
            loading={loading}
            stats={{
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
              inProgressCount,
            }}
          />
        </div>

        {/* ── Filter Bar ── */}
        {!loading && (
          <FilterBar filters={filters} setFilters={setFilters} />
        )}

        {/* ── Desktop: Monthly Chart ── */}
        {!loading && (
          <div className="hidden md:block">
            <MonthlyChart inquiries={inquiries} />
          </div>
        )}

        {/* ── Kanban Board (tabs — all screens) ── */}
        <div className="flex flex-col w-full flex-1 min-h-[500px]">
          {loading ? (
            <div className="w-full flex flex-col gap-3">
              <div className="h-14 skeleton-shimmer rounded-2xl" />
              <div className="space-y-3">
                <div className="h-40 skeleton-shimmer rounded-2xl" />
                <div className="h-32 skeleton-shimmer rounded-2xl" />
                <div className="h-28 skeleton-shimmer rounded-2xl" />
              </div>
            </div>
          ) : (
            <KanbanBoard
              inquiries={inquiries.filter(i => {
                if (focusMode) {
                  const isNew = i.Status === 'פניות חדשות' || !i.Status;
                  const hasUpcoming = i._rawDate && (new Date(i._rawDate) - new Date()) / (1000 * 60 * 60 * 24) <= 3;
                  if (!isNew && !hasUpcoming) return false;
                }
                if (filters.status && (i.Status || 'פניות חדשות') !== filters.status) return false;
                if (filters.priority && i.Priority !== filters.priority) return false;
                if (filters.eventType && i['Event Type'] !== filters.eventType) return false;
                if (filters.quoteSent && !i['Quote Sent']) return false;
                if (!debouncedSearch) return true;
                const q = debouncedSearch.toLowerCase();
                return i.Name?.toLowerCase().includes(q) || i.Company?.toLowerCase().includes(q) || i.Phone?.includes(q) || i['Event Type']?.toLowerCase().includes(q);
              })}
              setInquiries={setInquiries}
            />
          )}
        </div>
      </main>

      {/* Mobile FAB */}
      <div className="md:hidden fixed bottom-5 left-4 right-4 z-40">
        <motion.button
          onClick={() => setShowAddModal(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="w-full flex justify-center items-center gap-2 bg-[#333333] text-[#C5A880] py-4 rounded-2xl text-base font-bold shadow-[0_8px_24px_rgba(0,0,0,0.22)] border border-[#444]"
        >
          <Plus size={22} />
          <span>הוספת לקוח חדש</span>
        </motion.button>
      </div>

      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 3500,
          style: { background: '#1a1a1a', color: '#fff', borderRadius: '14px', border: '1px solid #333', fontFamily: 'Heebo, sans-serif', fontSize: '14px', fontWeight: '600', padding: '12px 16px' }
        }}
      />

      <AddClientModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        newClient={newClient}
        setNewClient={setNewClient}
        onSave={handleSaveNewClient}
        isSaving={isSaving}
      />

      <HelpSidebar isOpen={showHelpSidebar} onClose={() => setShowHelpSidebar(false)} onOpenFullHelp={() => { setShowHelpSidebar(false); setShowHelpModal(true); }} />
      <HelpModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} />
      {runTour && <GuidedTour steps={tourSteps} onComplete={handleTourComplete} />}
    </div>
  );
};

export default Dashboard;
