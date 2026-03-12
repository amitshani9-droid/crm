import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react';

const GuidedTour = ({ steps, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);

  const step = steps[currentStep];

  useEffect(() => {
    const updateRect = () => {
      const element = document.querySelector(step.target);
      if (element) {
        setTargetRect(element.getBoundingClientRect());
      }
    };

    const scrollContainer = document.querySelector('main') || window;

    updateRect();
    window.addEventListener('resize', updateRect);
    scrollContainer.addEventListener('scroll', updateRect);

    return () => {
      window.removeEventListener('resize', updateRect);
      scrollContainer.removeEventListener('scroll', updateRect);
    };
  }, [step.target, currentStep]);

  if (!targetRect) return null;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Hole dimensions and position
  const padding = 8;
  const holeX = targetRect.left - padding;
  const holeY = targetRect.top - padding;
  const holeWidth = targetRect.width + padding * 2;
  const holeHeight = targetRect.height + padding * 2;

  const popoverHeight = 260;
  const popoverTop = holeY + holeHeight + 20 + popoverHeight > window.innerHeight
    ? holeY - popoverHeight - 20 // Place above if not enough space below
    : holeY + holeHeight + 20;

  return (
    <div className="fixed inset-0 z-[110] overflow-hidden pointer-events-none" dir="rtl">
      {/* SVG Overlay with Hole */}
      <svg className="absolute inset-0 w-full h-full pointer-events-auto">
        <defs>
          <mask id="tour-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect 
              x={holeX} 
              y={holeY} 
              width={holeWidth} 
              height={holeHeight} 
              rx="16" 
              fill="black" 
            />
          </mask>
        </defs>
        <rect 
          x="0" 
          y="0" 
          width="100%" 
          height="100%" 
          fill="rgba(0,0,0,0.5)" 
          mask="url(#tour-mask)" 
          onClick={onComplete}
        />
      </svg>

      {/* Popover */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        style={{
          position: 'absolute',
          top: popoverTop,
          left: Math.max(20, Math.min(window.innerWidth - 340, holeX + holeWidth / 2 - 160)),
          width: 320,
        }}
        className="bg-white rounded-[24px] shadow-2xl p-6 border border-[#EAE3D9] pointer-events-auto z-[120]"
      >
        <div className="flex justify-between items-start mb-4">
          <div className="w-8 h-8 rounded-full bg-[#C5A880]/10 flex items-center justify-center text-[#C5A880]">
            <Sparkles size={18} />
          </div>
          <button 
            onClick={onComplete}
            className="p-1 hover:bg-[#FDFBF7] rounded-full text-[#9BACA4] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <h3 className="text-xl font-bold text-[#333333] mb-2">{step.title}</h3>
        <p className="text-[#666666] text-sm leading-relaxed mb-6">
          {step.content}
        </p>

        <div className="flex justify-between items-center">
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-4 bg-[#C5A880]' : 'w-1.5 bg-[#EAE3D9]'}`}
              />
            ))}
          </div>
          
          <div className="flex gap-2">
            {currentStep > 0 && (
              <button 
                onClick={handleBack}
                className="p-2 text-[#666666] hover:bg-[#FDFBF7] rounded-xl transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            )}
            <button 
              onClick={handleNext}
              className="bg-[#333333] text-white px-6 py-2 rounded-xl font-bold text-sm shadow-md hover:bg-black transition-all flex items-center gap-2"
            >
              <span>{currentStep === steps.length - 1 ? 'סיום' : 'הבא'}</span>
              {currentStep < steps.length - 1 && <ChevronLeft size={16} />}
            </button>
          </div>
        </div>
      </motion.div>
      
      {/* Highlighting Border */}
      <motion.div 
        animate={{ 
          x: holeX - 2, 
          y: holeY - 2, 
          width: holeWidth + 4, 
          height: holeHeight + 4 
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="absolute border-2 border-[#C5A880] rounded-[18px] pointer-events-none z-[115] shadow-[0_0_0_4px_rgba(197,168,128,0.2)]"
      />
    </div>
  );
};

export default GuidedTour;
