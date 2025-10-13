'use client';

import { SetupWizard } from '@/components/onboarding/setup-wizard';

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-background">
      <SetupWizard />
    </div>
  );
}