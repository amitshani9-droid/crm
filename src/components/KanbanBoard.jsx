import { useRef, useMemo, useCallback, useEffect } from 'react';
import KanbanColumn from './KanbanColumn';
import { updateAirtableRecord, deleteAirtableRecord } from '../airtable';
import toast from 'react-hot-toast';
import { useSettings } from '../hooks/useSettings';

const KanbanBoard = ({ inquiries, setInquiries }) => {
  const { settings } = useSettings();
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

  return (
    <>
      {/* Desktop: full Kanban */}
      <div className="hidden md:flex gap-6 h-full w-full overflow-x-auto overflow-y-hidden snap-x snap-mandatory pb-4 hide-scrollbar">
        {columns.map((col, index) => {
          const columnInquiries = columnMap[col.id];
          return (
            <div key={col.id} id={index === 0 ? 'kanban-column-1' : undefined} className="min-w-[320px] w-[320px] max-w-[320px] flex-shrink-0 flex flex-col snap-center">
              <KanbanColumn
                id={col.id}
                title={col.title}
                inquiries={columnInquiries}
                onDropRecord={handleDropRecord}
                onDeleteRecord={handleDeleteRecord}
              />
            </div>
          );
        })}
      </div>
    </>
  );
};


export default KanbanBoard;
