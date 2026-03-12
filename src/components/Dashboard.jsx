import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Link as LinkIcon, Users, CalendarDays, Briefcase, TrendingUp, Database, Search, X, Loader2, MessageCircle, BarChart3, HelpCircle, Eye, EyeOff, RotateCw } from 'lucide-react';
import { fetchAirtableRecords, createAirtableRecord, isValidIsraeliPhone } from '../airtable';
import KanbanBoard from './KanbanBoard';
import { Toaster, toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import HelpSidebar from './HelpSidebar';
import HelpModal from './HelpModal';
import GuidedTour from './GuidedTour';

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

// Animation variants
const statsContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } }
};

const statCardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 280, damping: 28 } }
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
};

// Premium stat card icon wrapper
const StatIcon = ({ children, color = '#C5A880' }) => (
  <div
    className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 relative"
    style={{
      background: `linear-gradient(135deg, ${color}18, ${color}08)`,
      boxShadow: `0 0 0 1px ${color}20, 0 2px 8px ${color}12`
    }}
  >
    <div style={{ color }}>{children}</div>
  </div>
);

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
  const [refreshing, setRefreshing] = useState(false);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newClient, setNewClient] = useState({
    Name: '', Company: '', Phone: '', Email: '',
    ['Event Type']: '', ['Event Date']: '', Notes: '', Status: 'פניות חדשות'
  });

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
      const data = await fetchAirtableRecords();
      setInquiries(data);
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    const data = await fetchAirtableRecords();
    setInquiries(data);
    setRefreshing(false);
    toast.success('הנתונים רועננו בהצלחה! 🔄');
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
      setNewClient({ Name: '', Company: '', Phone: '', Email: '', ['Event Type']: '', ['Event Date']: '', Notes: '', Status: 'פניות חדשות' });
      setLoading(true);
      const data = await fetchAirtableRecords();
      setInquiries(data);
      setLoading(false);
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
    if (inquiries.length === 0) { toast.error('אין נתונים לייצוא'); return; }
    const headers = ['שם הלקוח', 'טלפון', 'דוא"ל', 'סוג אירוע', 'תאריך', 'סטטוס', 'הערות'];
    const csvRows = ['\uFEFF' + headers.join(',')];
    inquiries.forEach(row => {
      const values = [row.Name || '', row.Phone || '', row.Email || '', row['Event Type'] || '', row['Event Date'] || '', row.Status || 'פניות חדשות', (row.Notes || '').replace(/\n/g, ' ')];
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

  const { totalLeads, newLeadsCount, inProgressCount, closedCount, conversionRate, newPct, inProgressPct, closedPct, eventsNext7DaysCount, topEventType, recentLeads, upcomingEvents } = useMemo(() => {
    const total = inquiries.length;
    const newCount = inquiries.filter(i => i.Status === 'פניות חדשות' || !i.Status).length;
    const inProgress = inquiries.filter(i => i.Status === 'בטיפול').length;
    const closed = inquiries.filter(i => i.Status === 'סגור').length;
    const today = new Date();
    const nextWeek = new Date(); nextWeek.setDate(today.getDate() + 7);
    const eventsNext7Days = inquiries.filter(inq => { if (!inq._rawDate) return false; const d = new Date(inq._rawDate); return d >= today && d <= nextWeek; }).length;
    const eventTypeCounts = inquiries.map(i => i['Event Type']).filter(Boolean).reduce((acc, curr) => { acc[curr] = (acc[curr] || 0) + 1; return acc; }, {});
    let topType = 'אין נתונים'; let maxCount = 0;
    for (const [type, count] of Object.entries(eventTypeCounts)) { if (count > maxCount) { maxCount = count; topType = type; } }
    return {
      totalLeads: total, newLeadsCount: newCount, inProgressCount: inProgress, closedCount: closed,
      conversionRate: total > 0 ? Math.round((closed / total) * 100) : 0,
      newPct: total > 0 ? (newCount / total) * 100 : 0,
      inProgressPct: total > 0 ? (inProgress / total) * 100 : 0,
      closedPct: total > 0 ? (closed / total) * 100 : 0,
      eventsNext7DaysCount: eventsNext7Days, topEventType: topType,
      recentLeads: inquiries.filter(i => i.Status === 'פניות חדשות' || !i.Status).slice(0, 5),
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

  // Shared button motion props
  const btnMotion = { whileHover: { scale: 1.02, y: -1 }, whileTap: { scale: 0.97 }, transition: { type: 'spring', stiffness: 400, damping: 25 } };

  const inputCls = "w-full border-2 border-[#EAE3D9] rounded-xl p-3 text-base outline-none focus:border-[#C5A880] focus:ring-2 focus:ring-[#C5A880]/10 transition-all";

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
            { onClick: () => navigate('/import'), icon: <Database size={17} className="text-[#C5A880]" />, label: 'ייבוא' },
            { onClick: shareJoinLink, icon: <LinkIcon size={17} className="text-[#666666]" />, label: 'טופס חיצוני' },
          ].map((btn, i) => (
            <motion.button
              key={i}
              onClick={btn.onClick}
              disabled={btn.disabled}
              {...btnMotion}
              className="flex items-center gap-1.5 bg-white text-[#666666] px-3.5 py-2.5 rounded-xl text-sm font-semibold border border-[#EAE3D9] shadow-sm disabled:opacity-50"
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
            onClick={() => setShowHelpSidebar(true)}
            {...btnMotion}
            className="flex items-center gap-1.5 bg-[#F0F8F9] text-[#2C8A99] px-3.5 py-2.5 rounded-xl text-sm font-semibold border border-[#2C8A99]/20 shadow-sm"
          >
            <HelpCircle size={17} strokeWidth={2.5} />
            <span className="hidden lg:inline">עזרה</span>
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
            <motion.button onClick={() => setShowHelpSidebar(true)} whileTap={{ scale: 0.93 }}
              className="p-2.5 bg-white border border-[#EAE3D9] rounded-xl text-[#2C8A99] shadow-sm">
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

        {/* ── Stats Grid ── */}
        <div id="stats-grid" className="flex flex-col gap-4 shrink-0">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
            variants={statsContainerVariants}
            initial="hidden"
            animate={loading ? 'hidden' : 'visible'}
          >
            {/* New Leads */}
            <motion.div variants={statCardVariants}
              whileHover={{ y: -3, boxShadow: '0 12px 28px rgba(197,168,128,0.14)', borderColor: 'rgba(197,168,128,0.35)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="bg-white rounded-[20px] p-5 border border-[#EAE3D9] shadow-sm flex items-center gap-4 cursor-default"
            >
              <StatIcon><Users size={22} /></StatIcon>
              <div>
                <p className="text-xs font-semibold text-[#9BACA4] uppercase tracking-wide mb-0.5">לידים חדשים</p>
                {loading
                  ? <div className="h-9 w-14 skeleton-shimmer rounded-lg mt-1" />
                  : <h2 className="text-4xl font-bold text-[#333333] stat-number leading-none">{animNewLeads}</h2>}
              </div>
            </motion.div>

            {/* In Progress */}
            <motion.div variants={statCardVariants}
              whileHover={{ y: -3, boxShadow: '0 12px 28px rgba(155,172,164,0.14)', borderColor: 'rgba(155,172,164,0.35)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="bg-white rounded-[20px] p-5 border border-[#EAE3D9] shadow-sm flex items-center gap-4 cursor-default"
            >
              <StatIcon color="#9BACA4"><Briefcase size={22} /></StatIcon>
              <div>
                <p className="text-xs font-semibold text-[#9BACA4] uppercase tracking-wide mb-0.5">בטיפול</p>
                {loading
                  ? <div className="h-9 w-14 skeleton-shimmer rounded-lg mt-1" />
                  : <h2 className="text-4xl font-bold text-[#333333] leading-none">{animInProgress}</h2>}
              </div>
            </motion.div>

            {/* Events This Week */}
            <motion.div variants={statCardVariants}
              whileHover={{ y: -3, boxShadow: '0 12px 28px rgba(44,138,153,0.12)', borderColor: 'rgba(44,138,153,0.3)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="bg-white rounded-[20px] p-5 border border-[#EAE3D9] shadow-sm flex items-center gap-4 cursor-default"
            >
              <StatIcon color="#2C8A99"><CalendarDays size={22} /></StatIcon>
              <div>
                <p className="text-xs font-semibold text-[#9BACA4] uppercase tracking-wide mb-0.5">אירועים השבוע</p>
                {loading
                  ? <div className="h-9 w-14 skeleton-shimmer rounded-lg mt-1" />
                  : <h2 className="text-4xl font-bold text-[#333333] leading-none">{animEvents}</h2>}
              </div>
            </motion.div>

            {/* Conversion Rate — premium dark card */}
            <motion.div variants={statCardVariants}
              whileHover={{ y: -3, boxShadow: '0 20px 40px rgba(0,0,0,0.25), 0 0 0 1px rgba(197,168,128,0.3)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="rounded-[20px] p-5 border border-[#3a3a3a] shadow-lg flex items-center justify-between relative overflow-hidden cursor-default"
              style={{ background: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)' }}
            >
              {/* Ambient gold glow */}
              <div className="absolute inset-0 pointer-events-none" style={{
                background: 'radial-gradient(ellipse 80% 60% at 20% 100%, rgba(197,168,128,0.18), transparent)'
              }} />
              {/* Subtle grain */}
              <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }}
              />
              <div className="relative z-10">
                <p className="text-[10px] font-bold text-[#C5A880] uppercase tracking-widest mb-1">יחס המרה</p>
                {loading
                  ? <div className="h-10 w-20 bg-[#3a3a3a] rounded-lg animate-pulse" />
                  : (
                    <div className="flex items-end gap-2">
                      <h2 className="text-5xl font-black text-white leading-none">{animConversion}<span className="text-3xl font-bold text-[#C5A880]">%</span></h2>
                    </div>
                  )}
                <p className="text-[#9BACA4] text-xs mt-1 font-medium">{closedCount} סגורים מתוך {totalLeads}</p>
              </div>
              <div className="relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center text-[#C5A880]"
                style={{ background: 'rgba(197,168,128,0.1)', border: '1px solid rgba(197,168,128,0.2)' }}>
                <TrendingUp size={26} />
              </div>
            </motion.div>
          </motion.div>

          {/* Loading skeleton for stats */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="bg-white rounded-[20px] p-5 border border-[#EAE3D9] flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl skeleton-shimmer" />
                  <div className="flex flex-col gap-2">
                    <div className="h-3 w-20 skeleton-shimmer rounded" />
                    <div className="h-9 w-14 skeleton-shimmer rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Status Distribution Bar */}
          <AnimatePresence>
            {!loading && totalLeads > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="bg-white rounded-[16px] p-4 border border-[#EAE3D9] shadow-sm flex flex-col gap-2"
              >
                <div className="flex justify-between text-xs font-semibold text-[#9BACA4] px-0.5">
                  <span>התפלגות פניות</span>
                  <span className="text-[#666666]">סה״כ: {totalLeads}</span>
                </div>
                <div className="h-2 w-full bg-[#F5F2EB] rounded-full overflow-hidden flex">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${newPct}%` }}
                    transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="bg-[#C5A880] h-full"
                    title={`פניות חדשות: ${Math.round(newPct)}%`}
                  />
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${inProgressPct}%` }}
                    transition={{ duration: 1, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="bg-[#9BACA4] h-full"
                    title={`בטיפול: ${Math.round(inProgressPct)}%`}
                  />
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${closedPct}%` }}
                    transition={{ duration: 1, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className="bg-[#333333] h-full"
                    title={`סגור: ${Math.round(closedPct)}%`}
                  />
                </div>
                <div className="flex gap-5 text-xs mt-0.5">
                  {[
                    { color: '#C5A880', label: 'חדשים', count: newLeadsCount },
                    { color: '#9BACA4', label: 'בטיפול', count: inProgressCount },
                    { color: '#333333', label: 'סגורים', count: closedCount },
                  ].map(({ color, label, count }) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                      <span className="text-[#666666] font-medium">{label} ({count})</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Mobile: Manager's Pulse ── */}
        <div className="md:hidden flex flex-col gap-5 w-full">
          <div className="grid grid-cols-2 gap-3">
            {/* Pie */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible"
              className="bg-white rounded-[20px] p-4 border border-[#EAE3D9] shadow-sm flex flex-col items-center justify-center min-h-[150px]">
              <p className="text-xs font-semibold text-[#9BACA4] mb-3 w-full text-right uppercase tracking-wide">התפלגות</p>
              <div className="w-20 h-20 rounded-full shadow-inner" style={{
                background: totalLeads > 0
                  ? `conic-gradient(#C5A880 0% ${newPct}%, #9BACA4 ${newPct}% ${newPct + inProgressPct}%, #333333 ${newPct + inProgressPct}% 100%)`
                  : '#EAE3D9'
              }} />
            </motion.div>
            {/* Top Event Type */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.1 }}
              className="bg-white rounded-[20px] p-4 border border-[#EAE3D9] shadow-sm flex flex-col justify-center min-h-[150px]">
              <div className="w-9 h-9 rounded-xl bg-[#C5A880]/10 flex items-center justify-center text-[#C5A880] mb-2.5">
                <BarChart3 size={18} />
              </div>
              <p className="text-xs font-semibold text-[#9BACA4]">אירוע מוביל</p>
              <h3 className="text-lg font-bold text-[#333333] mt-0.5 leading-tight">{topEventType}</h3>
            </motion.div>
          </div>

          {/* Mobile leads list */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center px-0.5 mb-1">
              <h3 className="text-sm font-bold text-[#333333]">פניות חדשות שניכנסו</h3>
              <span className="text-xs text-[#9BACA4] font-medium">{recentLeads.length} פניות</span>
            </div>
            {(() => {
              const filtered = searchQuery
                ? recentLeads.filter(l => [l.Name, l.Company, l.Phone].filter(Boolean).some(v => v.toLowerCase().includes(searchQuery.toLowerCase())))
                : recentLeads;
              return filtered.length > 0 ? filtered.map((lead, idx) => (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.07, type: 'spring', stiffness: 300, damping: 30 }}
                  className="bg-white rounded-2xl p-4 border border-[#EAE3D9] shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex justify-between items-center"
                >
                  <div className="flex flex-col gap-0.5 overflow-hidden">
                    <span className="font-bold text-[#333333] text-base truncate">{lead.Company || lead.Name}</span>
                    {lead.Company && lead.Name && <span className="text-[#9BACA4] text-xs truncate">{lead.Name}</span>}
                    {lead['Event Type'] && <span className="text-[#C5A880] text-xs font-semibold">{lead['Event Type']}</span>}
                  </div>
                  <motion.button
                    onClick={() => handleQuickWhatsApp(lead)}
                    whileTap={{ scale: 0.9 }}
                    className="flex-shrink-0 w-11 h-11 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-md"
                  >
                    <MessageCircle size={20} />
                  </motion.button>
                </motion.div>
              )) : (
                <div className="bg-white rounded-2xl p-6 border border-[#EAE3D9] text-center text-[#9BACA4] text-sm">
                  אין פניות חדשות שממתינות לטיפול
                </div>
              );
            })()}
          </div>
        </div>

        {/* ── Desktop: Kanban Board ── */}
        <div className="hidden md:flex flex-1 min-h-[420px]">
          {loading ? (
            <div className="flex gap-5 h-full w-full overflow-hidden">
              {[1,2,3].map(i => (
                <div key={i} className="min-w-[320px] w-[320px] flex-shrink-0 rounded-[24px] border border-[#EAE3D9]/60 flex flex-col p-5 gap-4"
                  style={{ background: 'rgba(245,242,235,0.4)' }}>
                  <div className="h-5 w-28 skeleton-shimmer rounded-full" />
                  <div className="h-4 w-10 skeleton-shimmer rounded-full" />
                  <div className="space-y-3">
                    <div className="h-32 skeleton-shimmer rounded-2xl" />
                    <div className="h-24 skeleton-shimmer rounded-2xl" />
                    <div className="h-20 skeleton-shimmer rounded-2xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <KanbanBoard
              inquiries={inquiries.filter(i => {
                if (focusMode) {
                  const isNew = i.Status === 'פניות חדשות' || !i.Status;
                  const hasUpcoming = i._rawDate && (new Date(i._rawDate) - new Date()) / (1000 * 60 * 60 * 24) <= 3;
                  if (!isNew && !hasUpcoming) return false;
                }
                if (!searchQuery) return true;
                const q = searchQuery.toLowerCase();
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

      {/* ── Add Client Modal ── */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(26,26,26,0.5)', backdropFilter: 'blur(8px)' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="bg-white w-full max-w-lg rounded-[24px] shadow-2xl overflow-hidden flex flex-col p-7 border border-[#EAE3D9]"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-[#333333]">לקוח חדש</h2>
                  <p className="text-xs text-[#9BACA4] mt-0.5 font-medium">הוסיפי את הפרטים ונשמור ל-Airtable</p>
                </div>
                <motion.button
                  onClick={() => setShowAddModal(false)}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
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
                    <label className="block text-xs font-bold text-[#666666] mb-1.5 uppercase tracking-wide">{label}</label>
                    <input
                      type={type} dir={dir} value={newClient[key]} placeholder={placeholder}
                      onChange={(e) => setNewClient({ ...newClient, [key]: e.target.value })}
                      className={inputCls + (dir ? ' text-right' : '')}
                    />
                  </div>
                ))}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#666666] mb-1.5 uppercase tracking-wide">סוג אירוע</label>
                    <select value={newClient['Event Type']} onChange={(e) => setNewClient({ ...newClient, ['Event Type']: e.target.value })} className={inputCls + ' bg-white'}>
                      <option value="">בחר...</option>
                      {['יום גיבוש','נופש חברה','הרמת כוסית','כנס','אחר'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#666666] mb-1.5 uppercase tracking-wide">תאריך האירוע</label>
                    <input type="date" value={newClient['Event Date']} onChange={(e) => setNewClient({ ...newClient, ['Event Date']: e.target.value })} className={inputCls} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#666666] mb-1.5 uppercase tracking-wide">הערות ראשוניות</label>
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
                  onClick={handleSaveNewClient}
                  disabled={isSaving}
                  whileHover={!isSaving ? { scale: 1.01, boxShadow: '0 12px 24px rgba(197,168,128,0.3)' } : {}}
                  whileTap={!isSaving ? { scale: 0.98 } : {}}
                  transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                  className="w-full bg-gradient-to-r from-[#C5A880] to-[#b09673] text-white py-4 rounded-xl font-bold text-base shadow-[0_6px_16px_rgba(197,168,128,0.25)] disabled:opacity-60 flex justify-center items-center gap-2"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={22} /> : 'שמור לקוח חדש'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <HelpSidebar isOpen={showHelpSidebar} onClose={() => setShowHelpSidebar(false)} onOpenFullHelp={() => { setShowHelpSidebar(false); setShowHelpModal(true); }} />
      <HelpModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} />
      {runTour && <GuidedTour steps={tourSteps} onComplete={handleTourComplete} />}
    </div>
  );
};

export default Dashboard;
