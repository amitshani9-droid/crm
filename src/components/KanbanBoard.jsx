import { useRef, useMemo, useCallback, useEffect, useState } from 'react';
import KanbanColumn from './KanbanColumn';
import { updateAirtableRecord, deleteAirtableRecord } from '../airtable';
import toast from 'react-hot-toast';
import { useSettings } from '../hooks/useSettings';

const TAB_STYLES = {
  'פניות חדשות': { dot: 'bg-blue-400',   countActive: 'bg-blue-100 text-blue-600' },
  'בטיפול':      { dot: 'bg-amber-400',  countActive: 'bg-amber-100 text-amber-600' },
  'סגור':        { dot: 'bg-green-400',  countActive: 'bg-green-100 text-green-600' },
};

const KanbanBoard = ({ inquiries, setInquiries }) => {
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState('פניות חדשות');

  const columns = useMemo(() => [
    { id: 'פניות חדשות', title: settings.kanbanLabels['פניות חדשות'] },
    { id: 'בטיפול',      title: settings.kanbanLabels['בטיפול'] },
    { id: 'סגור',        title: settings.kanbanLabels['סגור'] },
  ], [settings.kanbanLabels]);

  const columnMap = useMemo(() => {
    const map = { 'פניות חדשות': [], 'בטיפול': [], 'סגור': [] };
    for (const inq of inquiries) {
      const status = inq.Status || 'פניות חדשות';
      if (map[status]) map[status].push(inq);
    }
    return map;
  }, [inquiries]);

  const handleDropRecord = useCallback(async (recordId, newStatusId) => {
    const recordToUpdate = inquiries.find(inq => inq.id === recordId);
    if (!recordToUpdate || recordToUpdate.Status === newStatusId) return;

    const previousStatus = recordToUpdate.Status;

    setInquiries(prev => prev.map(inq =>
      inq.id === recordId ? { ...inq, Status: newStatusId } : inq
    ));

    const success = await updateAirtableRecord(recordId, { Status: newStatusId });
    if (!success) {
      setInquiries(prev => prev.map(inq =>
        inq.id === recordId ? { ...inq, Status: previousStatus } : inq
      ));
      toast.error('שגיאה בעדכון הסטטוס');
    } else {
      toast.success('הסטטוס עודכן בהצלחה! ✨');
    }
  }, [inquiries, setInquiries]);

  const deletionTimers = useRef({});

  const handleDeleteRecord = useCallback((recordId, recordData) => {
    let originalIndex;
    setInquiries(prev => {
      originalIndex = prev.findIndex(inq => inq.id === recordId);
      return prev.filter(inq => inq.id !== recordId);
    });

    let isUndone = false;

    toast(
      (t) => (
        <div className="flex items-center gap-4" dir="rtl">
          <div className="flex flex-col">
            <span className="font-bold text-sm text-white">הלקוח הועבר לסל המיחזור</span>
            <span className="text-xs text-white/70">ניתן לבטל את הפעולה ב-5 שניות הקרובות</span>
          </div>
          <button
            onClick={() => {
              isUndone = true;
              toast.dismiss(t.id);
              if (deletionTimers.current[recordId]) {
                clearTimeout(deletionTimers.current[recordId]);
                delete deletionTimers.current[recordId];
              }
              setInquiries(prev => {
                const next = [...prev];
                const insertAt = originalIndex != null ? Math.min(originalIndex, next.length) : next.length;
                next.splice(insertAt, 0, recordData);
                return next;
              });
              toast.success('המחיקה בוטלה בהצלחה');
            }}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl font-bold transition-all border border-white/20 text-sm whitespace-nowrap"
          >
            בטל מחיקה
          </button>
        </div>
      ),
      {
        duration: 5000,
        position: 'bottom-center',
        style: {
          background: '#1a1a1a',
          color: '#fff',
          borderRadius: '20px',
          padding: '16px 20px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          border: '1px solid rgba(255,255,255,0.1)',
          minWidth: '350px'
        }
      }
    );

    deletionTimers.current[recordId] = setTimeout(async () => {
      if (!isUndone) {
        const success = await deleteAirtableRecord(recordId);
        if (!success) {
          toast.error('שגיאה במחיקת הלקוח מהשרת');
          setInquiries(prev => [...prev, recordData]);
        }
      }
      delete deletionTimers.current[recordId];
    }, 5000);
  }, [setInquiries]);

  useEffect(() => {
    return () => {
      Object.values(deletionTimers.current).forEach(clearTimeout);
    };
  }, []);

  // Called when card details are edited inside the ContactCard modal
  const handleUpdateRecord = useCallback((recordId, updatedData) => {
    setInquiries(prev => prev.map(inq => inq.id === recordId ? updatedData : inq));
  }, [setInquiries]);

  const activeColumn = columns.find(c => c.id === activeTab);

  return (
    <div className="flex flex-col w-full gap-3">
      {/* Tab Bar */}
      <div className="flex gap-1.5 bg-white/60 dark:bg-[#1a1917]/60 border border-[#EAE3D9] dark:border-[#2d2b28] rounded-2xl p-1.5 flex-shrink-0">
        {columns.map(col => {
          const isActive = activeTab === col.id;
          const style = TAB_STYLES[col.id];
          const count = columnMap[col.id].length;
          return (
            <button
              key={col.id}
              onClick={() => setActiveTab(col.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-bold transition-all ${
                isActive
                  ? 'bg-white dark:bg-[#252320] shadow-sm text-[#333333] dark:text-[#e8e4df]'
                  : 'text-[#9BACA4] hover:text-[#666666]'
              }`}
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${style.dot}`} />
              <span className="truncate">{col.title}</span>
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                isActive ? style.countActive : 'bg-[#EAE3D9]/60 text-[#9BACA4]'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Column — full width */}
      <div className="flex-1 min-h-0">
        <KanbanColumn
          key={activeTab}
          id={activeTab}
          title={activeColumn?.title || ''}
          inquiries={columnMap[activeTab] || []}
          onDropRecord={handleDropRecord}
          onDeleteRecord={handleDeleteRecord}
          onUpdateRecord={handleUpdateRecord}
          fullWidth
        />
      </div>
    </div>
  );
};

export default KanbanBoard;
