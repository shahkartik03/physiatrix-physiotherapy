import React, { useState } from 'react';
import OnboardingStep from './OnboardingStep';

const steps = [
  { id: 1, title: 'Welcome', content: 'Welcome to our medical practice onboarding process!' },
  { id: 2, title: 'Personal Information', content: 'Please provide your personal information.' },
  { id: 3, title: 'Credentials', content: 'Upload your medical credentials.' },
  { id: 4, title: 'Review', content: 'Review your information before submission.' },
  { id: 5, title: 'Complete', content: 'Thank you for completing the onboarding process!' },
];

const OnboardingFlow = () => {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="onboarding-flow">
      <OnboardingStep 
        title={steps[currentStep].title} 
        content={steps[currentStep].content} 
      />
      <div className="navigation">
        <button onClick={prevStep} disabled={currentStep === 0}>
          Previous
        </button>
        <button onClick={nextStep} disabled={currentStep === steps.length - 1}>
          Next
        </button>
      </div>
    </div>
  );
};

export default OnboardingFlow;