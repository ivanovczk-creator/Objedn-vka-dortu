import React from 'react';

interface StepsProps {
  currentStep: number;
  totalSteps: number;
}

export const Steps: React.FC<StepsProps> = ({ currentStep, totalSteps }) => {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-center space-x-2">
        {Array.from({ length: totalSteps }).map((_, idx) => {
          const stepNum = idx + 1;
          const isActive = stepNum === currentStep;
          const isCompleted = stepNum < currentStep;

          return (
            <React.Fragment key={stepNum}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  isActive
                    ? 'bg-brand-600 text-white scale-110 shadow-lg'
                    : isCompleted
                    ? 'bg-brand-300 text-brand-900'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                {isCompleted ? '✓' : stepNum}
              </div>
              {stepNum < totalSteps && (
                <div
                  className={`h-1 w-8 sm:w-16 rounded transition-all duration-300 ${
                    isCompleted ? 'bg-brand-300' : 'bg-gray-200'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
      <div className="text-center mt-2 text-brand-800 font-serif font-medium">
        {currentStep === 1 && "Předloha a Základ"}
        {currentStep === 2 && "Příchuť a Vzhled"}
        {currentStep === 3 && "Detaily"}
        {currentStep === 4 && "Vyzvednutí"}
        {currentStep === 5 && "Souhrn"}
      </div>
    </div>
  );
};