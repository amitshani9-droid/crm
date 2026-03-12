import { X, CheckCircle2, ShieldCheck, Zap, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const HelpModal = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#333333]/60 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col"
            dir="rtl"
          >
            {/* Header */}
            <div className="p-8 border-b border-[#EAE3D9]/60 flex justify-between items-center bg-[#FDFBF7]">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-[#333333]">מרכז הבקרה של טל שני</h2>
                <p className="text-[#2C8A99] font-medium mt-1">חוויות שמחברות אנשים</p>
              </div>
              <button 
                onClick={onClose}
                className="p-3 bg-white border border-[#EAE3D9] hover:bg-[#FDFBF7] rounded-full text-[#666666] transition-all shadow-sm active:scale-90"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 hide-scrollbar">
              <section className="space-y-4">
                <h3 className="text-xl font-bold text-[#333333] flex items-center gap-2">
                  <Zap size={24} className="text-[#C5A880]" />
                  איך זה עובד?
                </h3>
                
                <div className="grid gap-6">
                  <div className="flex gap-4 p-4 rounded-2xl bg-[#FDFBF7] border border-[#EAE3D9]/50">
                    <div className="w-10 h-10 shrink-0 rounded-full bg-white border border-[#EAE3D9] flex items-center justify-center text-[#2C8A99] font-bold shadow-sm">1</div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-[#333333]">הזרמת לידים</h4>
                      <p className="text-[#666666] text-sm leading-relaxed">
                        שלחי ללקוחות את דף הנחיתה המעוצב שלך. כל מי שימלא פרטים יופיע מיד בלוח הבקרה שלך בעמודת "פניות חדשות".
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 p-4 rounded-2xl bg-[#FDFBF7] border border-[#EAE3D9]/50">
                    <div className="w-10 h-10 shrink-0 rounded-full bg-white border border-[#EAE3D9] flex items-center justify-center text-[#2C8A99] font-bold shadow-sm">2</div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-[#333333]">סטטוסים ושלבי עבודה</h4>
                      <p className="text-[#666666] text-sm leading-relaxed">
                        המערכת מחולקת ל-3 שלבים: <span className="text-[#2C8A99] font-semibold">"פניות חדשות"</span> (כחול), <span className="text-[#C5A880] font-semibold">"בטיפול"</span> (צהוב), ו-<span className="text-[#9BACA4] font-semibold">"סגור"</span> (ירוק). פשוט גררי את הכרטיס ליעד הבא.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 p-4 rounded-2xl bg-[#FDFBF7] border border-[#EAE3D9]/50">
                    <div className="w-10 h-10 shrink-0 rounded-full bg-white border border-[#EAE3D9] flex items-center justify-center text-[#2C8A99] font-bold shadow-sm">3</div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-[#333333]">חיסכון אדיר בזמן</h4>
                      <p className="text-[#666666] text-sm leading-relaxed">
                        במקום להקליד הודעות כל פעם מחדש, השתמשי בכפתורי הוואטסאפ המוכנים. המערכת תכין עבורך את ההודעה הרלוונטית עם שם הלקוח.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 p-4 rounded-2xl bg-[#FDFBF7] border border-[#EAE3D9]/50">
                    <div className="w-10 h-10 shrink-0 rounded-full bg-white border border-[#EAE3D9] flex items-center justify-center text-[#2C8A99] font-bold shadow-sm">4</div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-[#333333]">שליטה מלאה בנתונים</h4>
                      <p className="text-[#666666] text-sm leading-relaxed">
                        תוכלי לייצא את רשימת הלקוחות בכל רגע לקובץ אקסל (CSV) לצורכי הנהלת חשבונות או דוחות תקופתיים.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <div className="p-6 rounded-2xl bg-[#333333] text-white flex items-center gap-4 shadow-xl">
                 <ShieldCheck size={32} className="text-[#C5A880] shrink-0" />
                 <div>
                   <h4 className="font-bold">המידע שלך מוגן</h4>
                   <p className="text-[#9BACA4] text-xs">כל הנתונים מגובים באופן אוטומטי בענן של Airtable וזמינים לך מכל מכשיר.</p>
                 </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-[#FDFBF7] border-t border-[#EAE3D9] flex justify-center">
              <button 
                onClick={onClose}
                className="bg-[#2C8A99] text-white py-3 px-12 rounded-2xl font-bold shadow-lg hover:bg-[#236e7a] transition-all active:scale-95"
              >
                הבנתי, תודה! 🥂
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default HelpModal;
