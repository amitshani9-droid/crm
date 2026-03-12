import { X, Info, MousePointer2, Smartphone, Paperclip, Copy, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const HelpSidebar = ({ isOpen, onClose, onOpenFullHelp }) => {
  const copyJoinLink = () => {
    const link = `${window.location.origin}/join`;
    navigator.clipboard.writeText(link);
    toast.success('הקישור הועתק בהצלחה! ✨');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          />
          
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-80 bg-white border-l border-[#EAE3D9] shadow-2xl z-50 flex flex-col"
            dir="rtl"
          >
            {/* Header */}
            <div className="p-6 border-b border-[#EAE3D9]/60 flex justify-between items-center bg-[#FDFBF7]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#2C8A99]/10 flex items-center justify-center text-[#2C8A99]">
                  <Info size={20} />
                </div>
                <h2 className="text-xl font-bold text-[#333333]">מדריך מקוצר</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-[#EAE3D9] rounded-full text-[#666666] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
              <div className="space-y-2">
                <h3 className="text-[#2C8A99] font-bold text-lg">היי טל, כך המערכת עובדת:</h3>
                <p className="text-[#666666] text-sm leading-relaxed">ריכזנו עבורך את הפעולות הכי חשובות לניהול שוטף ומהיר.</p>
              </div>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 shrink-0 rounded-xl bg-[#FDFBF7] border border-[#EAE3D9] flex items-center justify-center text-[#C5A880] shadow-sm">
                    <MousePointer2 size={20} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-[#333333]">ניהול הלוח</h4>
                    <p className="text-sm text-[#666666] leading-relaxed">גררי לקוחות בין העמודות כדי לעדכן סטטוס באופן מידי.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 shrink-0 rounded-xl bg-[#FDFBF7] border border-[#EAE3D9] flex items-center justify-center text-[#25D366] shadow-sm">
                    <Smartphone size={20} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-[#333333]">פנייה מהירה</h4>
                    <p className="text-sm text-[#666666] leading-relaxed">לחצי על כרטיס ואז על כפתור הוואטסאפ כדי לשלוח הודעה מוכנה.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 shrink-0 rounded-xl bg-[#FDFBF7] border border-[#EAE3D9] flex items-center justify-center text-[#6B3E8E] shadow-sm">
                    <Paperclip size={20} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-[#333333]">תיעוד מלא</h4>
                    <p className="text-sm text-[#666666] leading-relaxed">בתוך כל כרטיס תוכלי להוסיף הערות והסכמים שיישמרו לתמיד.</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={onOpenFullHelp}
                className="mt-4 flex items-center justify-center gap-2 text-[#2C8A99] font-bold py-3 px-4 rounded-xl border-2 border-[#2C8A99]/20 hover:bg-[#2C8A99]/5 transition-all"
              >
                <ExternalLink size={18} />
                <span>הסבר מפורט ומלא</span>
              </button>
            </div>

            {/* Footer Action */}
            <div className="p-6 bg-[#FDFBF7] border-t border-[#EAE3D9]">
              <button 
                onClick={copyJoinLink}
                className="w-full bg-[#333333] text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-black transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <Copy size={20} className="text-[#C5A880]" />
                <span>העתקת לינק לדף הנחיתה</span>
              </button>
              <p className="text-center text-[10px] text-[#9BACA4] mt-3">שלחי את הלינק ללקוחות חדשים כדי שיכנסו ישר ללוח</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default HelpSidebar;
