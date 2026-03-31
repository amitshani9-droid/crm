import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Calendar, MessageSquare, Phone, Mail, User, Info, Briefcase, ArrowRight } from 'lucide-react';
import { createAirtableRecord, isValidIsraeliPhone } from '../airtable';
import { useSettings } from '../hooks/useSettings';
import { toast, Toaster } from 'react-hot-toast';

const JoinPage = () => {
  const { settings } = useSettings();
  const [formData, setFormData] = useState({
    Name: '',
    Company: '',
    Phone: '',
    Email: '',
    ['Event Type']: '',
    ['Event Date']: '',
    Notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [honeypot, setHoneypot] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Honeypot: bots fill hidden fields, humans don't
    if (honeypot) {
      setIsSuccess(true); // Fake success to not reveal detection
      return;
    }

    if (!formData.Phone) {
      toast.error('יש להזין מספר טלפון.');
      return;
    }
    if (!isValidIsraeliPhone(formData.Phone)) {
      toast.error('מספר הטלפון אינו תקין. אנא הזן מספר ישראלי תקני (05X-XXXXXXX).');
      return;
    }

    setIsSubmitting(true);
    
    // Add default status and format data for Airtable
    const success = await createAirtableRecord({
      ...formData,
      Status: 'פניות חדשות'
    });
    
    setIsSubmitting(false);
    
    if (success) {
      setIsSuccess(true);
    } else {
      toast.error('אירעה שגיאה בשליחת הפרטים. אנא נסה שוב או צור קשר טלפוני.');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.98 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <div className="min-h-screen bg-[#F1F3ED] flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden" dir="rtl" style={{ fontFamily: "'Heebo', sans-serif" }}>
      <Toaster position="top-center" toastOptions={{ duration: 4000, style: { fontFamily: 'Heebo, sans-serif', fontSize: '15px', fontWeight: '600' } }} />

      <AnimatePresence mode="wait">
        {!isSuccess ? (
          <motion.div
            key="form"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.4 } }}
            className="w-full max-w-[550px] z-10 my-4"
          >
            {/* The White Card Container */}
            <div className="bg-white rounded-[24px] shadow-[0_20px_40px_rgba(0,0,0,0.05)] p-8 md:p-10 w-full relative">
              
              {/* Logo */}
              <motion.div variants={itemVariants} className="flex justify-center mb-6">
                 <img src="/logo.png" alt="Tal Shani Logo" className="h-20 object-contain" onError={(e) => e.target.style.display='none'} />
              </motion.div>

              {/* Header inside the card */}
              <motion.div variants={itemVariants} className="text-center mb-10">
                <h2 className="text-3xl font-bold text-[#7D8F69] mb-3">בואו ניצור חוויה משמעותית יחד</h2>
                <p className="text-sm text-[#2C3327] leading-relaxed px-2">
                  הופכים ערכים לחוויה חיה ונושמת. השאירו פרטים ונחזור אליכם לתכנון האירוע המדויק שלכם.
                </p>
              </motion.div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Honeypot */}
                <div style={{ display: 'none' }} aria-hidden="true">
                  <input type="text" name="website" value={honeypot} onChange={e => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Name field */}
                  <div className="space-y-1.5 md:col-span-1">
                    <label className="text-sm font-semibold text-[#2C3327] flex items-center gap-2">
                       שם איש קשר <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-[#A0AEC0]">
                        <User size={18} />
                      </div>
                      <input
                        required
                        type="text"
                        name="Name"
                        value={formData.Name}
                        onChange={handleChange}
                        className="w-full bg-white border border-[#D1D5DB] rounded-[10px] py-3.5 pl-4 pr-11 text-[#2C3327] focus:ring-2 focus:ring-[#7D8F69]/20 focus:border-[#7D8F69] outline-none transition-all placeholder:text-[#CBD5E0]"
                        placeholder="ישראל ישראלי"
                      />
                    </div>
                  </div>

                  {/* Company field */}
                  <div className="space-y-1.5 md:col-span-1">
                    <label className="text-sm font-semibold text-[#2C3327] flex items-center gap-2">
                       שם החברה
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-[#A0AEC0]">
                        <Briefcase size={18} />
                      </div>
                      <input
                        required
                        type="text"
                        name="Company"
                        value={formData.Company}
                        onChange={handleChange}
                        className="w-full bg-white border border-[#D1D5DB] rounded-[10px] py-3.5 pl-4 pr-11 text-[#2C3327] focus:ring-2 focus:ring-[#7D8F69]/20 focus:border-[#7D8F69] outline-none transition-all placeholder:text-[#CBD5E0]"
                        placeholder="שם העסק / חברה"
                      />
                    </div>
                  </div>

                  {/* Phone field */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-[#2C3327] flex items-center gap-2">
                       טלפון נייד <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-[#A0AEC0]">
                        <Phone size={18} />
                      </div>
                      <input
                        required
                        type="tel"
                        name="Phone"
                        value={formData.Phone}
                        onChange={handleChange}
                        dir="ltr"
                        className="w-full bg-white border border-[#D1D5DB] rounded-[10px] py-3.5 pl-4 pr-11 text-[#2C3327] focus:ring-2 focus:ring-[#7D8F69]/20 focus:border-[#7D8F69] outline-none transition-all text-right placeholder:text-[#CBD5E0]"
                        placeholder="05X-XXXXXXX"
                      />
                    </div>
                  </div>

                  {/* Email field */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-[#2C3327] flex items-center gap-2">
                      דוא"ל 
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-[#A0AEC0]">
                        <Mail size={18} />
                      </div>
                      <input
                        type="email"
                        name="Email"
                        value={formData.Email}
                        onChange={handleChange}
                        dir="ltr"
                        className="w-full bg-white border border-[#D1D5DB] rounded-[10px] py-3.5 pl-4 pr-11 text-[#2C3327] focus:ring-2 focus:ring-[#7D8F69]/20 focus:border-[#7D8F69] outline-none transition-all text-right placeholder:text-[#CBD5E0]"
                        placeholder="example@mail.com"
                      />
                    </div>
                  </div>

                  {/* Event Type field */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-[#2C3327] flex items-center gap-2">
                      סוג האירוע <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-[#A0AEC0]">
                        <Info size={18} />
                      </div>
                      <select
                        required
                        name="Event Type"
                        value={formData['Event Type']}
                        onChange={handleChange}
                        className="w-full bg-white border border-[#D1D5DB] rounded-[10px] py-3.5 pl-4 pr-11 text-[#2C3327] focus:ring-2 focus:ring-[#7D8F69]/20 focus:border-[#7D8F69] outline-none transition-all appearance-none placeholder:text-[#CBD5E0]"
                      >
                        <option value="" disabled>בחרו סוג אירוע...</option>
                        {settings.eventTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Event Date field */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-[#2C3327] flex items-center gap-2">
                      תאריך משוער
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-[#A0AEC0]">
                        <Calendar size={18} />
                      </div>
                      <input
                        type="date"
                        name="Event Date"
                        value={formData['Event Date']}
                        onChange={handleChange}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full bg-white border border-[#D1D5DB] rounded-[10px] py-3.5 pl-4 pr-11 text-[#2C3327] focus:ring-2 focus:ring-[#7D8F69]/20 focus:border-[#7D8F69] outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Notes field */}
                <div className="space-y-1.5 mt-2">
                  <label className="text-sm font-semibold text-[#2C3327] flex items-center gap-2">
                    הערות / בקשות מיוחדות
                  </label>
                  <div className="relative">
                    <div className="absolute top-4 right-0 pr-4 flex items-start pointer-events-none text-[#A0AEC0]">
                      <MessageSquare size={18} />
                    </div>
                    <textarea
                      name="Notes"
                      value={formData.Notes}
                      onChange={handleChange}
                      rows={3}
                      className="w-full bg-white border border-[#D1D5DB] rounded-[10px] py-3.5 pl-4 pr-11 text-[#2C3327] focus:ring-2 focus:ring-[#7D8F69]/20 focus:border-[#7D8F69] outline-none transition-all resize-none placeholder:text-[#CBD5E0]"
                      placeholder="ספרו לנו כל דבר שחשוב שנדע..."
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="mt-8 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#C777B1] hover:bg-[#B0609C] text-white font-bold text-lg py-4 rounded-full transition-transform duration-300 hover:scale-[1.02] hover:shadow-[0_10px_20px_rgba(199,119,177,0.3)] disabled:opacity-70 disabled:hover:scale-100 disabled:shadow-none flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                       <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      "בואי נתחיל"
                    )}
                  </button>
                </div>

              </form>
            </div>

            {/* Footer Links */}
            <motion.div variants={itemVariants} className="mt-6 flex flex-col md:flex-row items-center justify-center gap-6 text-[#A0AEC0] text-sm font-medium">
              <a 
                href="https://wondrous-druid-2df08e.netlify.app/#" 
                className="flex items-center gap-2 hover:text-[#7D8F69] transition-colors opacity-80 hover:opacity-100"
              >
                <ArrowRight size={16} />
                <span>חזרה לאתר של טל</span>
              </a>
              <a 
                href="https://wa.me/972544866372" 
                target="_blank" rel="noreferrer"
                className="flex items-center gap-2 hover:text-[#25D366] transition-colors opacity-80 hover:opacity-100"
              >
                <MessageSquare size={16} />
                <span>כיתבו לי בוואטסאפ</span>
              </a>
            </motion.div>

          </motion.div>
        ) : (
          /* Success Screen */
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="bg-white p-12 rounded-[24px] shadow-[0_20px_40px_rgba(0,0,0,0.05)] text-center max-w-[550px] w-full z-10"
            style={{ fontFamily: "'Heebo', sans-serif" }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
              className="w-24 h-24 bg-[#7D8F69]/10 rounded-full flex items-center justify-center mx-auto mb-6 text-[#7D8F69]"
            >
              <CheckCircle size={48} />
            </motion.div>
            
            <h2 className="text-3xl font-bold text-[#7D8F69] mb-4">תודה!</h2>
            <p className="text-[#2C3327] text-lg leading-relaxed">
              הפנייה התקבלה בהצלחה! טל תחזור אליכם בהקדם לתכנון האירוע המושלם.
            </p>
            
            <a 
              href="https://wondrous-druid-2df08e.netlify.app/#" 
              className="mt-8 inline-block text-[#7D8F69] font-semibold hover:underline"
            >
              חזרה לאתר הראשי
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default JoinPage;
