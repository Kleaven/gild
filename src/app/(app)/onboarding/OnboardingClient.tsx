'use client';

import React, { useState } from 'react';
import { PersonaPicker } from './PersonaPicker';
import { MemberKYC } from './MemberKYC';

interface OnboardingClientProps {
  step: 'persona' | 'member_kyc';
}

export function OnboardingClient({ step: initialStep }: OnboardingClientProps) {
  const [step, setStep] = useState(initialStep);

  if (step === 'persona') {
    return (
      <PersonaPicker 
        onSelect={(persona) => {
          if (persona === 'member') {
            setStep('member_kyc');
          } else {
            // If owner, the server page will redirect on refresh
            window.location.reload();
          }
        }} 
      />
    );
  }

  if (step === 'member_kyc') {
    return <MemberKYC />;
  }

  return null;
}
