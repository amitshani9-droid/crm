import React from 'react';
import KanbanColumn from './KanbanColumn';
import { updateAirtableRecord } from '../airtable';
import toast from 'react-hot-toast';

const KanbanBoard = ({ inquiries, setInquiries }) => {
  // Simplified Apple-style Columns
  const columns = [
    { id: 'פניות חדשות', title: 'חדשים' },
    { id: 'בטיפול', title: 'בטיפול' },
    { id: 'אירוע סגור', title: 'סגורים' }
  ];

  const getInquiriesForColumn = (statusId) => {
    return inquiries.filter(inq => 
      inq.Status === statusId || (!inq.Status && statusId === 'פניות חדשות')
    );
  };

  const handleDropRecord = async (recordId, newStatusId) => {
    const recordToUpdate = inquiries.find(inq => inq.id === recordId);
    if (!recordToUpdate || recordToUpdate.Status === newStatusId) return;

    // Optimistic UI update
    setInquiries(prev => prev.map(inq => 
      inq.id === recordId ? { ...inq, Status: newStatusId } : inq
    ));

    // Update Airtable via SDK
    const success = await updateAirtableRecord(recordId, { Status: newStatusId });
    if (!success) {
      toast.error('שגיאה בעדכון הסטטוס');
    } else {
      toast.success('הסטטוס עודכן בהצלחה! ✨');
    }
  };

  const handleDeleteRecord = (recordId) => {
    setInquiries(prev => prev.filter(inq => inq.id !== recordId));
  };

  return (
    <div className="flex gap-6 h-full w-full overflow-x-auto overflow-y-hidden snap-x snap-mandatory pb-4 hide-scrollbar">
      {columns.map(col => {
        const columnInquiries = getInquiriesForColumn(col.id);
        
        return (
          <div key={col.id} className="min-w-[320px] w-[320px] max-w-[320px] flex-shrink-0 flex flex-col snap-center">
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
