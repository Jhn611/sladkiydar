import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { Modal } from '../../shared/ui/Modal';
import { LeadForm } from '../lead-form/LeadForm';
import { LeadModalContext } from './useLeadModal';
import styles from './LeadModalProvider.module.css';

export function LeadModalProvider({ children }: { children: ReactNode }) {
  const [source, setSource] = useState<string | null>(null);
  const openLeadModal = useCallback((value: string) => setSource(value), []);
  const closeLeadModal = useCallback(() => setSource(null), []);
  const context = useMemo(
    () => ({ openLeadModal, closeLeadModal }),
    [openLeadModal, closeLeadModal],
  );

  return (
    <LeadModalContext.Provider value={context}>
      {children}
      <Modal
        open={source !== null}
        onClose={closeLeadModal}
        title="Пришлём прайс-лист и подберём набор под ваш бюджет"
      >
        {source !== null && (
          <>
            <p className={styles.description}>
              Оставьте имя и телефон — менеджер пришлёт фото готовых наборов и поможет с выбором.
            </p>
            <LeadForm key={source} source={source} />
          </>
        )}
      </Modal>
    </LeadModalContext.Provider>
  );
}
