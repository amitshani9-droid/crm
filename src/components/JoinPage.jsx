import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Calendar, MessageSquare, Phone, Mail, User, Info, Briefcase } from 'lucide-react';
import { createAirtableRecord } from '../airtable';

const JoinPage = () => {
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

  const eventTypes = [
    'יום גיבוש',
    'נופש חברה',
    'הרמת כוסית',
    'כנס',
    'אחר'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      alert('אירעה שגיאה בשליחת הפרטים. אנא נסה שוב או צור קשר טלפוני.');
    }
  };

  // Luxury aesthetic container variants
  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.8, 
        ease: [0.22, 1, 0.36, 1], // Custom elegant easing
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
      
      {/* Subtle luxury background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#2C8A99]/5 via-[#FDFBF7] to-[#6B3E8E]/5 pointer-events-none" />
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#2C8A99]/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-[#6B3E8E]/5 blur-[100px] pointer-events-none" />

      <AnimatePresence mode="wait">
        {!isSuccess ? (
          <motion.div
            key="form"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.4 } }}
            className="w-full max-w-4xl flex flex-col items-center z-10 my-8"
            style={{ fontFamily: "'Heebo', sans-serif" }}
          >
            {/* Logo */}
            <motion.div variants={itemVariants} className="mb-8">
               <img src="/logo.png" alt="Tal Shani Logo" className="h-28 object-contain" />
            </motion.div>

            {/* Hero Text */}
            <motion.div variants={itemVariants} className="text-center md:w-3/4 mb-10 space-y-4">
              <h1 className="text-4xl md:text-5xl font-extrabold text-[#2C8A99]">טל שני - חוויות שמחברות אנשים</h1>
              <p className="text-xl md:text-2xl font-medium text-[#333333]">
                ימי גיבוש ואירועי חברה בהתאמה אישית – עם סטייל, תוכן וערך חברתי שנשאר הרבה אחרי שהאירוע נגמר.
              </p>
            </motion.div>

            {/* About Text */}
            <motion.div variants={itemVariants} className="text-center md:w-2/3 mb-12 text-[#666666] text-lg leading-relaxed">
              אני יוצרת חוויות לארגונים שמחפשים יותר מעוד אירוע. ימים שמחברים בין אנשים, בין צוותים, ובין חוויה מהנה לתחושת משמעות אמיתית. כל אירוע נבנה מתוך הקשבה לאנשים שלכם – לאופי, לאנרגיה, למטרות ולערכים. זה יום כיף, זה גיבוש – ובדרך, זה גם עושה טוב.
            </motion.div>

            {/* The Glassmorphism Form Card */}
            <div className="w-full bg-white/90 backdrop-blur-md rounded-3xl border border-white/50 shadow-xl overflow-hidden mt-4">

              {/* Form Content */}
              <div className="p-8 md:p-10">
                <motion.div variants={itemVariants} className="mb-8 text-center">
                  <h2 className="text-2xl font-bold text-[#6B3E8E] mb-2">בואו ניצור את הקסם יחד</h2>
                  <p className="text-[#666666]">מלאו את הפרטים ונחזור אליכם בהקדם.</p>
                </motion.div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Name field */}
                  <motion.div variants={itemVariants} className="space-y-1.5 md:col-span-1">
                    <label className="text-sm font-semibold text-[#333333] flex items-center gap-2">
                       שם איש קשר <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[#9BACA4]">
                        <User size={18} />
                      </div>
                      <input
                        required
                        type="text"
                        name="Name"
                        value={formData.Name}
                        onChange={handleChange}
                        className="w-full bg-[#FDFBF7] border border-[#EAE3D9] rounded-xl py-3 pl-4 pr-10 text-[#333333] focus:ring-2 focus:ring-[#2C8A99]/40 focus:border-[#2C8A99] outline-none transition-all"
                        placeholder="ישראל ישראלי"
                      />
                    </div>
                  </motion.div>

                  {/* Company field */}
                  <motion.div variants={itemVariants} className="space-y-1.5 md:col-span-1">
                    <label className="text-sm font-semibold text-[#333333] flex items-center gap-2">
                       שם החברה (אופציונלי)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[#9BACA4]">
                        <Briefcase size={18} />
                      </div>
                      <input
                        type="text"
                        name="Company"
                        value={formData.Company}
                        onChange={handleChange}
                        className="w-full bg-[#FDFBF7] border border-[#EAE3D9] rounded-xl py-3 pl-4 pr-10 text-[#333333] focus:ring-2 focus:ring-[#2C8A99]/40 focus:border-[#2C8A99] outline-none transition-all"
                        placeholder="שם העסק / חברה"
                      />
                    </div>
                  </motion.div>

                  {/* Phone field */}
                  <motion.div variants={itemVariants} className="space-y-1.5">
                    <label className="text-sm font-semibold text-[#333333] flex items-center gap-2">
                       טלפון נייד <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[#9BACA4]">
                        <Phone size={18} />
                      </div>
                      <input
                        required
                        type="tel"
                        name="Phone"
                        value={formData.Phone}
                        onChange={handleChange}
                        dir="ltr"
                        className="w-full bg-[#FDFBF7] border border-[#EAE3D9] rounded-xl py-3 pl-4 pr-10 text-[#333333] focus:ring-2 focus:ring-[#2C8A99]/40 focus:border-[#2C8A99] outline-none transition-all text-right"
                        placeholder="05X-XXXXXXX"
                      />
                    </div>
                  </motion.div>

                  {/* Email field */}
                  <motion.div variants={itemVariants} className="space-y-1.5">
                    <label className="text-sm font-semibold text-[#333333] flex items-center gap-2">
                      דוא"ל 
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[#9BACA4]">
                        <Mail size={18} />
                      </div>
                      <input
                        type="email"
                        name="Email"
                        value={formData.Email}
                        onChange={handleChange}
                        dir="ltr"
                        className="w-full bg-[#FDFBF7] border border-[#EAE3D9] rounded-xl py-3 pl-4 pr-10 text-[#333333] focus:ring-2 focus:ring-[#2C8A99]/40 focus:border-[#2C8A99] outline-none transition-all text-right"
                        placeholder="example@mail.com"
                      />
                    </div>
                  </motion.div>

                  {/* Event Type field */}
                  <motion.div variants={itemVariants} className="space-y-1.5">
                    <label className="text-sm font-semibold text-[#333333] flex items-center gap-2">
                      סוג האירוע <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[#9BACA4]">
                        <Info size={18} />
                      </div>
                      <select
                        required
                        name="Event Type"
                        value={formData['Event Type']}
                        onChange={handleChange}
                        className="w-full bg-[#FDFBF7] border border-[#EAE3D9] rounded-xl py-3 pl-4 pr-10 text-[#333333] focus:ring-2 focus:ring-[#2C8A99]/40 focus:border-[#2C8A99] outline-none transition-all appearance-none"
                      >
                        <option value="" disabled>בחרו סוג אירוע...</option>
                        {eventTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  </motion.div>

                  {/* Event Date field */}
                  <motion.div variants={itemVariants} className="space-y-1.5">
                    <label className="text-sm font-semibold text-[#333333] flex items-center gap-2">
                      תאריך משוער
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[#9BACA4]">
                        <Calendar size={18} />
                      </div>
                      <input
                        type="date"
                        name="Event Date"
                        value={formData['Event Date']}
                        onChange={handleChange}
                        className="w-full bg-[#FDFBF7] border border-[#EAE3D9] rounded-xl py-3 pl-4 pr-10 text-[#333333] focus:ring-2 focus:ring-[#2C8A99]/40 focus:border-[#2C8A99] outline-none transition-all"
                      />
                    </div>
                  </motion.div>

                  {/* Notes field */}
                  <motion.div variants={itemVariants} className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-semibold text-[#333333] flex items-center gap-2">
                      הערות / בקשות מיוחדות
                    </label>
                    <div className="relative">
                      <div className="absolute top-3 right-0 pr-3 flex items-start pointer-events-none text-[#9BACA4]">
                        <MessageSquare size={18} />
                      </div>
                      <textarea
                        name="Notes"
                        value={formData.Notes}
                        onChange={handleChange}
                        rows={3}
                        className="w-full bg-[#FDFBF7] border border-[#EAE3D9] rounded-xl py-3 pl-4 pr-10 text-[#333333] focus:ring-2 focus:ring-[#2C8A99]/40 focus:border-[#2C8A99] outline-none transition-all resize-none"
                        placeholder="ספרו לנו כל דבר שחשוב שנדע..."
                      />
                    </div>
                  </motion.div>

                  {/* Submit Button */}
                  <motion.div variants={itemVariants} className="md:col-span-2 mt-6">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-[#2C8A99] hover:bg-[#6B3E8E] hover:shadow-[0_4px_15px_rgba(107,62,142,0.4)] text-white font-bold text-xl py-4 rounded-xl transition-all duration-300 shadow-[0_4px_14px_0_rgba(44,138,153,0.39)] hover:-translate-y-1 disabled:opacity-70 disabled:hover:translate-y-0 disabled:shadow-none flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                         <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        "בואו נצא לדרך! (שליחת פנייה)"
                      )}
                    </button>
                  </motion.div>

                </form>
              </div>
            </div>
          </motion.div>
        ) : (
          /* Success Screen */
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="bg-white/90 backdrop-blur-xl p-10 rounded-[24px] border border-[#EAE3D9] shadow-xl text-center max-w-md w-full z-10"
            style={{ fontFamily: "'Heebo', sans-serif" }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
              className="w-20 h-20 bg-[#9BC44C]/10 rounded-full flex items-center justify-center mx-auto mb-6 text-[#9BC44C]"
            >
              <CheckCircle size={40} />
            </motion.div>
            
            <h2 className="text-3xl font-bold text-[#6B3E8E] mb-3">תודה!</h2>
            <p className="text-[#666666] text-lg leading-relaxed">
              הפנייה התקבלת. טל תחזור אליכם עם הצעה מלאה בערך.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default JoinPage;
