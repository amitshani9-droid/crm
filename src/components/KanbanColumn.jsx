import { useState } from 'react';
import ContactCard from './ContactCard';

const KanbanColumn = ({ id, title, inquiries, onDropRecord, onDeleteRecord }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    // Only reset if leaving the column itself, not a child element
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const recordId = e.dataTransfer.getData('recordId');
    if (recordId) {
      onDropRecord(recordId, id);
    }
  };

  return (
    <div 
      className={`min-w-[320px] w-[320px] max-w-[320px] flex flex-col bg-white/40 border ${isDragOver ? 'border-[#C5A880] bg-white/60' : 'border-[#EAE3D9]'} rounded-[24px] snap-center h-full transition-colors duration-200`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="px-5 py-4 flex justify-between items-center border-b border-[#EAE3D9]/50 bg-white/60 rounded-t-[24px]">
        <h2 className="font-bold text-lg text-[#333333] tracking-wide">{title}</h2>
        <span className="bg-[#FDFBF7] text-[#9BACA4] text-sm font-semibold px-2.5 py-0.5 rounded-full border border-[#EAE3D9]">
          {inquiries.length}
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 hide-scrollbar">
        {inquiries.map(inquiry => (
          <ContactCard key={inquiry.id} data={inquiry} onDelete={onDeleteRecord} />
        ))}
        {inquiries.length === 0 && (
          <div className="text-center text-[#9BACA4] py-8 px-4 bg-white/30 rounded-2xl border border-dashed border-[#EAE3D9] text-sm font-medium">
            אין לקוחות
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;
