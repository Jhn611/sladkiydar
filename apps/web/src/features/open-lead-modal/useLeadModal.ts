import { createContext, useContext } from 'react';

export interface LeadModalContextValue {
  openLeadModal: (source: string) => void;
  closeLeadModal: () => void;
}

export const LeadModalContext = createContext<LeadModalContextValue | null>(null);

export function useLeadModal(): LeadModalContextValue {
  const context = useContext(LeadModalContext);
  if (!context) throw new Error('useLeadModal must be used within LeadModalProvider');
  return context;
}
