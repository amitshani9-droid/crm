import KanbanColumn from './KanbanColumn';
import { updateAirtableRecord, deleteAirtableRecord } from '../airtable';
import toast from 'react-hot-toast';

const KanbanBoard = ({ inquiries, setInquiries }) => {
  // Simplified Apple-style Columns
  const columns = [
    { id: 'פניות חדשות', title: 'חדשים' },
    { id: 'בטיפול', title: 'בטיפול' },
    { id: 'סגור', title: 'סגורים' }
  ];

  const getInquiriesForColumn = (statusId) => {
    return inquiries.filter(inq => 
      inq.Status === statusId || (!inq.Status && statusId === 'פניות חדשות')
    );
  };

  const handleDropRecord = async (recordId, newStatusId) => {
    const recordToUpdate = inquiries.find(inq => inq.id === recordId);
    if (!recordToUpdate || recordToUpdate.Status === newStatusId) return;

    const previousStatus = recordToUpdate.Status;

    // Optimistic UI update
    setInquiries(prev => prev.map(inq =>
      inq.id === recordId ? { ...inq, Status: newStatusId } : inq
    ));

    // Update Airtable via SDK
    const success = await updateAirtableRecord(recordId, { Status: newStatusId });
    if (!success) {
      // Roll back on failure
      setInquiries(prev => prev.map(inq =>
        inq.id === recordId ? { ...inq, Status: previousStatus } : inq
      ));
      toast.error('שגיאה בעדכון הסטטוס');
    } else {
      toast.success('הסטטוס עודכן בהצלחה! ✨');
    }
  };

  const handleDeleteRecord = (recordId, recordData) => {
    // Optimistically remove from UI immediately
    setInquiries(prev => prev.filter(inq => inq.id !== recordId));

    let undone = false;

    // Show undo toast for 5 seconds
    toast(
      (t) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>הלקוח נמחק</span>
          <button
            onClick={() => {
              undone = true;
              setInquiries(prev => [...prev, recordData]);
              toast.dismiss(t.id);
              toast.success('המחיקה בוטלה ✅');
            }}
            style={{
              background: '#C5A880',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '4px 12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            בטל
          </button>
        </div>
      ),
      { duration: 5000 }
    );

    // Perform actual deletion after 5 seconds if not undone
    setTimeout(async () => {
      if (!undone) {
        await deleteAirtableRecord(recordId);
      }
    }, 5000);
  };

  return (
    <div className="flex gap-6 h-full w-full overflow-x-auto overflow-y-hidden snap-x snap-mandatory pb-4 hide-scrollbar">
      {columns.map((col, index) => {
        const columnInquiries = getInquiriesForColumn(col.id);
        
        return (
          <div key={col.id} id={index === 0 ? 'kanban-column-1' : undefined} className="min-w-[320px] w-[320px] max-w-[320px] flex-shrink-0 flex flex-col snap-center">
            {/* We still use KanbanColumn for the drop logic, but we can pass the simplified title */}
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
  );
};

export default KanbanBoard;
