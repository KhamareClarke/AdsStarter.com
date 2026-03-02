"use client";

import React, { createContext, useContext, useState } from "react";
import LeadCaptureForm from "@/components/ui/lead-capture-form";

type OnboardingContextType = {
  openOnboarding: boolean;
  setOpenOnboarding: (open: boolean) => void;
};

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be used within OnboardingProvider");
  return ctx;
}

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [openOnboarding, setOpenOnboarding] = useState(false);

  return (
    <OnboardingContext.Provider value={{ openOnboarding, setOpenOnboarding }}>
      {children}
      <LeadCaptureForm
        isOpen={openOnboarding}
        onClose={() => setOpenOnboarding(false)}
        title="Get Your Free Strategy Call"
        subtitle="Fill out the form below and we'll get back to you within 24 hours"
      />
    </OnboardingContext.Provider>
  );
}
