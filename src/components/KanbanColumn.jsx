import LeadTable from './LeadTable';

const KanbanColumn = ({ id, title, inquiries, onDropRecord, onDeleteRecord, onUpdateRecord, fullWidth = false }) => {
  return (
    <div
      className={`${fullWidth ? 'w-full' : 'min-w-[320px] w-[320px] max-w-[320px]'} flex flex-col h-full`}
    >
      <div className="flex-1 overflow-y-auto hide-scrollbar">
        <LeadTable
          inquiries={inquiries}
          onDelete={onDeleteRecord}
          onStatusChange={onDropRecord}
          onUpdate={onUpdateRecord}
        />
      </div>
    </div>
  );
};

export default KanbanColumn;
