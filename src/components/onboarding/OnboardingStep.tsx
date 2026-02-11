import React from 'react';

interface OnboardingStepProps {
  stepNumber: number;
  title: string;
  description: string;
  onNext: () => void;
  onBack: () => void;
}

const OnboardingStep: React.FC<OnboardingStepProps> = ({ stepNumber, title, description, onNext, onBack }) => {
  return (
    <div className="onboarding-step">
      <h2>Step {stepNumber}: {title}</h2>
      <p>{description}</p>
      <div className="onboarding-buttons">
        <button onClick={onBack} className="btn-back">Back</button>
        <button onClick={onNext} className="btn-next">Next</button>
      </div>
    </div>
  );
};

export default OnboardingStep;