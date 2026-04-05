import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, CheckCircle, Database, AlertCircle, FileText, ArrowRight, X } from 'lucide-react';
import Papa from 'papaparse';
import { importRecordsBatch, sanitizePhone } from '../airtable';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const ImportPage = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Mapping State: { airtableField: csvHeader }
  const [columnMapping, setColumnMapping] = useState({
    Name: '',
    Company: '',
    Phone: '',
    Email: '',
    EventType: '',
    EventDate: '', 
    Notes: '',
    Budget: '',
    Participants: ''
  });

  const [importState, setImportState] = useState('idle'); // idle | mapping | importing | complete
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [importResults, setImportResults] = useState({ success: 0, failed: 0 });

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = () => setIsDragActive(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile) => {
    if (!selectedFile.name.endsWith('.csv')) {
      toast.error('אנא בחר קובץ CSV בלבד');
      return;
    }
    setFile(selectedFile);
    parseCSV(selectedFile);
  };

  const parseCSV = (csvFile) => {
    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          setHeaders(Object.keys(results.data[0]));
          setParsedData(results.data);
          
          // Auto-guess mapping based on common Hebrew/English headers
          const firstRowKeys = Object.keys(results.data[0]);
          const findMatch = (aliases) => firstRowKeys.find(k => 
            aliases.some(alias => k.toLowerCase().includes(alias.toLowerCase()) || k.includes(alias))
          ) || '';

          const guessedMapping = {
            Name: findMatch(['Name', 'Full Name', 'Customer Name', 'שם מלא', 'שם', 'לקוח']),
            Company: findMatch(['Company', 'Business', 'עסק', 'חברה']),
            Phone: findMatch(['Phone', 'Cell', 'Mobile', 'Ph', 'טלפון', 'נייד', 'סלולרי']),
            Email: findMatch(['Email', 'Mail', 'מייל', 'אימייל']),
            EventType: findMatch(['Type', 'Event Type', 'סוג', 'סוג אירוע']),
            EventDate: findMatch(['Date', 'Event Date', 'תאריך', 'תאריך אירוע']),
            Notes: findMatch(['Notes', 'Comments', 'הערות', 'מידע נוסף']),
            Budget: findMatch(['Budget', 'Price', 'תקציב', 'מחיר', 'עלות']),
            Participants: findMatch(['Participants', 'Count', 'משתתפים', 'כמות', 'מספר'])
          };
          setColumnMapping(guessedMapping);
          setImportState('mapping');
        } else {
          toast.error('הקובץ ריק או לא תקין');
        }
      },
      error: () => toast.error('שגיאה בקריאת הקובץ')
    });
  };

  const startImportEngine = async () => {
    if (!columnMapping.Name || !columnMapping.Phone) {
      toast.error('שדות חובה: שם וטלפון');
      return;
    }

    setImportState('importing');
    setProgress({ current: 0, total: parsedData.length });
    
    // 1. Transform parsed CSV rows into Airtable-ready objects
    const cleanedRecords = parsedData
      .filter(row => {
        // Skip completely empty rows
        const values = Object.values(row).join('').trim();
        if (!values) return false;

        const hasName = columnMapping.Name && row[columnMapping.Name]?.toString().trim();
        const hasPhone = columnMapping.Phone && row[columnMapping.Phone]?.toString().trim();
        return hasName && hasPhone; // SKIP if missing Name or Phone
      })
      .map(row => {
        // Use central sanitization logic
        const rawPhone = columnMapping.Phone ? row[columnMapping.Phone] : '';
        const cleanPhone = sanitizePhone(rawPhone);

        // Clean Date: Robust parsing to YYYY-MM-DD
        let cleanDate = null;
        if (columnMapping.EventDate && row[columnMapping.EventDate]) {
          const rawDateStr = row[columnMapping.EventDate].toString().trim();
          
          if (rawDateStr) {
            // Case 1: DD/MM/YYYY
            if (rawDateStr.includes('/')) {
              const parts = rawDateStr.split('/');
              if (parts.length === 3) {
                if (parts[0].length <= 2 && parts[2].length === 4) {
                  cleanDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                } else if (parts[0].length === 4) {
                  cleanDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
                }
              }
            } 
            
            // Fallback to native parsing
            if (!cleanDate) {
              const d = new Date(rawDateStr);
              if (!isNaN(d.getTime())) {
                cleanDate = d.toISOString().split('T')[0]; 
              }
            }
          }
        }

        return {
          Name: columnMapping.Name ? String(row[columnMapping.Name] || 'ללא שם') : 'ללא שם',
          Company: columnMapping.Company ? String(row[columnMapping.Company] || '') : '',
          Phone: cleanPhone,
          Email: columnMapping.Email ? String(row[columnMapping.Email] || '') : '',
          'Event Type': columnMapping.EventType ? String(row[columnMapping.EventType] || '') || null : null,
          'Event Date': cleanDate || null, 
          Notes: columnMapping.Notes ? String(row[columnMapping.Notes] || '') : '',
          Budget: columnMapping.Budget && row[columnMapping.Budget] ? Number(row[columnMapping.Budget].toString().replace(/\D/g, '')) : null,
          Participants: columnMapping.Participants && row[columnMapping.Participants] ? Number(row[columnMapping.Participants].toString().replace(/\D/g, '')) : null,
          Status: 'פניות חדשות' // Forced status as per user request
        };
      });

    // 2. Batch Engine
    const BATCH_SIZE = 10; // Airtable create API limit
    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < cleanedRecords.length; i += BATCH_SIZE) {
      const batch = cleanedRecords.slice(i, i + BATCH_SIZE);
      
      const batchResult = await importRecordsBatch(batch);
      
      if (batchResult.success) {
        successCount += batchResult.count;
      } else {
        failedCount += batch.length;
        console.error(`=== BATCH FAILED (i=${i}) ===`);
        console.error("The following records caused a 422 or other error:", batch);
        const errMsg = batchResult.errorMessage || 'שגיאה לא ידועה';
        toast.error(`❌ שגיאת שרת: ${errMsg}`, { duration: 10000 });
      }

      setProgress({ current: Math.min(i + BATCH_SIZE, cleanedRecords.length), total: cleanedRecords.length });
    }

    setImportResults({ success: successCount, failed: failedCount });
    setImportState('complete');
  };

  const resetEngine = () => {
    setFile(null);
    setParsedData([]);
    setHeaders([]);
    setColumnMapping({ Name: '', Company: '', Phone: '', Email: '', EventType: '', EventDate: '', Notes: '' });
    setImportState('idle');
    setProgress({ current: 0, total: 0 });
    setImportResults({ success: 0, failed: 0 });
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center py-12 px-4 relative overflow-hidden text-[#333333]">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#C5A880]/5 blur-3xl pointer-events-none" />
      <button 
        onClick={() => navigate('/')}
        className="absolute top-6 right-6 flex items-center gap-2 text-[#666666] hover:text-[#C5A880] transition-colors"
      >
        <ArrowRight size={20} /> חזרה לדאשבורד
      </button>

      <div className="max-w-3xl w-full">
        <div className="text-center mb-10">
          <Database size={48} className="mx-auto text-[#C5A880] mb-4" />
          <h1 className="text-3xl font-bold mb-2">מנוע ייבוא נתונים (Legacy)</h1>
          <p className="text-[#666666]">ייבוא מהיר של אלפי רשומות .CSV למערכת בקליק אחד.</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-[24px] border border-[#EAE3D9] shadow-xl overflow-hidden p-8">
          <AnimatePresence mode="wait">
            
            {/* STAGE 1: UPLOAD */}
            {importState === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center"
              >
                <div 
                   onClick={() => fileInputRef.current?.click()}
                   onDragOver={handleDragOver}
                   onDragLeave={handleDragLeave}
                   onDrop={handleDrop}
                   className={`w-full max-w-xl aspect-[2/1] border-2 border-dashed rounded-[20px] flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
                     isDragActive ? 'border-[#C5A880] bg-[#C5A880]/5 scale-[1.02]' : 'border-[#EAE3D9] bg-[#FDFBF7] hover:border-[#9BACA4]'
                   }`}
                >
                  <UploadCloud size={48} className={`mb-4 ${isDragActive ? 'text-[#C5A880]' : 'text-[#9BACA4]'}`} />
                  <p className="text-lg font-bold mb-1">גררו קובץ CSV לכאן</p>
                  <p className="text-[#666666] text-sm">או לחצו לבחירת קובץ מהמחשב</p>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileSelect} 
                    accept=".csv"
                    className="hidden" 
                  />
                </div>

                <div className="mt-6 text-center">
                  <a
                    href="/crm-template.csv"
                    download="crm-template.csv"
                    className="inline-flex items-center gap-2 text-sm text-[#C5A880] hover:text-[#a8895f] font-semibold underline underline-offset-4 transition-colors"
                  >
                    ⬇️ הורד תבנית CSV מוכנה למילוי
                  </a>
                  <p className="text-xs text-[#9BACA4] mt-1">פתח ב-Google Sheets ← מלא לקוחות ← ייצא כ-CSV ← העלה כאן</p>
                </div>
              </motion.div>
            )}

            {/* STAGE 2: MAPPING */}
            {importState === 'mapping' && (
              <motion.div
                key="mapping"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
              >
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#EAE3D9]">
                  <div className="flex items-center gap-3">
                    <FileText className="text-[#9BACA4]" size={24} />
                    <div>
                      <h3 className="font-bold relative">{file?.name}</h3>
                      <p className="text-xs text-[#666666]">{parsedData.length} שורות זוהו</p>
                    </div>
                  </div>
                  <button onClick={resetEngine} className="text-red-400 hover:text-red-500 rounded-full p-2 hover:bg-red-50 transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <div className="bg-[#FDFBF7] rounded-xl p-5 border border-[#EAE3D9] mb-8">
                  <h4 className="font-bold mb-4 text-sm flex items-center gap-2">
                    <AlertCircle size={16} className="text-[#C5A880]" /> שיוך עמודות (Mapping)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Name Mapping */}
                    <div>
                      <label className="block text-xs font-semibold mb-2">שם מלא <span className="text-red-500">*</span></label>
                      <select 
                        value={columnMapping.Name} 
                        onChange={(e) => setColumnMapping({...columnMapping, Name: e.target.value})}
                        className="w-full border border-[#EAE3D9] rounded-lg p-2.5 text-sm outline-none focus:border-[#C5A880]"
                      >
                        <option value="">-- בחרו עמודה --</option>
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                    {/* Company Mapping */}
                    <div>
                      <label className="block text-xs font-semibold mb-2">שם החברה (אופציונלי)</label>
                      <select 
                        value={columnMapping.Company} 
                        onChange={(e) => setColumnMapping({...columnMapping, Company: e.target.value})}
                        className="w-full border border-[#EAE3D9] rounded-lg p-2.5 text-sm outline-none focus:border-[#C5A880]"
                      >
                        <option value="">-- ללא שיוך --</option>
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                    {/* Phone Mapping */}
                    <div>
                      <label className="block text-xs font-semibold mb-2">טלפון <span className="text-red-500">*</span></label>
                      <select 
                        value={columnMapping.Phone} 
                        onChange={(e) => setColumnMapping({...columnMapping, Phone: e.target.value})}
                        className="w-full border border-[#EAE3D9] rounded-lg p-2.5 text-sm outline-none focus:border-[#C5A880]"
                      >
                        <option value="">-- בחרו עמודה --</option>
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                    {/* Email Mapping */}
                    <div>
                      <label className="block text-xs font-semibold mb-2">דוא"ל (אופציונלי)</label>
                      <select 
                        value={columnMapping.Email} 
                        onChange={(e) => setColumnMapping({...columnMapping, Email: e.target.value})}
                        className="w-full border border-[#EAE3D9] rounded-lg p-2.5 text-sm outline-none focus:border-[#C5A880]"
                      >
                        <option value="">-- ללא שיוך --</option>
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                    {/* Event Type Mapping */}
                    <div>
                      <label className="block text-xs font-semibold mb-2">סוג אירוע (אופציונלי)</label>
                      <select 
                        value={columnMapping.EventType} 
                        onChange={(e) => setColumnMapping({...columnMapping, EventType: e.target.value})}
                        className="w-full border border-[#EAE3D9] rounded-lg p-2.5 text-sm outline-none focus:border-[#C5A880]"
                      >
                        <option value="">-- ללא שיוך --</option>
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                    {/* Date Mapping */}
                    <div>
                      <label className="block text-xs font-semibold mb-2">תאריך אירוע (אופציונלי)</label>
                      <select 
                        value={columnMapping.EventDate} 
                        onChange={(e) => setColumnMapping({...columnMapping, EventDate: e.target.value})}
                        className="w-full border border-[#EAE3D9] rounded-lg p-2.5 text-sm outline-none focus:border-[#C5A880]"
                      >
                        <option value="">-- ללא שיוך --</option>
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                    {/* Notes Mapping */}
                    <div>
                      <label className="block text-xs font-semibold mb-2">הערות (אופציונלי)</label>
                      <select 
                        value={columnMapping.Notes} 
                        onChange={(e) => setColumnMapping({...columnMapping, Notes: e.target.value})}
                        className="w-full border border-[#EAE3D9] rounded-lg p-2.5 text-sm outline-none focus:border-[#C5A880]"
                      >
                        <option value="">-- ללא שיוך --</option>
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                    {/* Budget Mapping */}
                    <div>
                      <label className="block text-xs font-semibold mb-2">תקציב (אופציונלי)</label>
                      <select 
                        value={columnMapping.Budget} 
                        onChange={(e) => setColumnMapping({...columnMapping, Budget: e.target.value})}
                        className="w-full border border-[#EAE3D9] rounded-lg p-2.5 text-sm outline-none focus:border-[#C5A880]"
                      >
                        <option value="">-- ללא שיוך --</option>
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                    {/* Participants Mapping */}
                    <div>
                      <label className="block text-xs font-semibold mb-2">משתתפים (אופציונלי)</label>
                      <select 
                        value={columnMapping.Participants} 
                        onChange={(e) => setColumnMapping({...columnMapping, Participants: e.target.value})}
                        className="w-full border border-[#EAE3D9] rounded-lg p-2.5 text-sm outline-none focus:border-[#C5A880]"
                      >
                        <option value="">-- ללא שיוך --</option>
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={startImportEngine}
                  disabled={!columnMapping.Name || !columnMapping.Phone}
                  className="w-full bg-[#333333] hover:bg-[#222] text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  התחל ייבוא נתונים
                </button>
              </motion.div>
            )}

            {/* STAGE 3: IMPORTING */}
            {importState === 'importing' && (
              <motion.div
                key="importing"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-10"
              >
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <svg className="animate-spin w-full h-full text-[#EAE3D9]" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" />
                  </svg>
                  <svg className="absolute top-0 left-0 w-full h-full text-[#C5A880]" viewBox="0 0 100 100" style={{ strokeDasharray: 283, strokeDashoffset: 283 - (progress.current / progress.total) * 283, transition: 'stroke-dashoffset 0.5s ease' }}>
                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center font-bold text-lg">
                    {Math.round((progress.current / progress.total) * 100)}%
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2">מייבא רשומות למערכת...</h3>
                <p className="text-[#666666]">מעבד {progress.current} מתוך {progress.total} לקוחות</p>
                <p className="text-xs text-[#9BACA4] mt-4 max-w-sm mx-auto">אנא אל תסגרו דף זה עד לסיום התהליך. מספר הטלפון מנוקה אוטומטית מכפילויות תווים ומובטח להתחיל ב-0.</p>
              </motion.div>
            )}

            {/* STAGE 4: COMPLETE */}
            {importState === 'complete' && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6"
              >
                <div className="w-20 h-20 bg-[#C5A880]/10 rounded-full flex items-center justify-center mx-auto mb-6 text-[#C5A880]">
                  <CheckCircle size={40} />
                </div>
                <h2 className="text-3xl font-bold mb-3">הייבוא הושלם!</h2>
                <div className="bg-[#FDFBF7] border border-[#EAE3D9] rounded-2xl p-6 mb-8 inline-block text-right w-full max-w-sm">
                  <div className="flex justify-between border-b border-[#EAE3D9]/50 pb-3 mb-3">
                    <span className="text-[#666666]">רשומות שעובדו:</span>
                    <span className="font-bold">{progress.total}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#EAE3D9]/50 pb-3 mb-3">
                    <span className="text-[#666666]">יובאו בהצלחה:</span>
                    <span className="font-bold text-green-600">{importResults.success}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#666666]">נכשלו:</span>
                    <span className="font-bold text-red-500">{importResults.failed}</span>
                  </div>
                </div>
                <div className="flex gap-4 max-w-sm mx-auto">
                  <button 
                    onClick={() => navigate('/')}
                    className="flex-1 bg-[#333333] hover:bg-[#222] text-white font-bold py-3 rounded-xl transition-all"
                  >
                    לדאשבורד
                  </button>
                  <button 
                    onClick={resetEngine}
                    className="flex-1 bg-white border border-[#EAE3D9] hover:bg-[#FDFBF7] text-[#333333] font-bold py-3 rounded-xl transition-all"
                  >
                    ייבוא נוסף
                  </button>
                </div>
              </motion.div>
            )}
            
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ImportPage;
