import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { Modal } from '../../shared/ui/Modal';
import { LeadForm } from '../lead-form/LeadForm';
import { LeadModalContext } from './useLeadModal';
import {
  AutomaticLeadPromptContext,
  isAutomaticLeadPromptBlocked,
  type AutomaticLeadPromptSource,
} from './automaticLeadPromptContext';
import {
  automaticLeadPromptSession,
  type AutomaticLeadPromptSession,
} from './automaticLeadPromptSession';
import styles from './LeadModalProvider.module.css';

export function LeadModalProvider({
  children,
  promptSession = automaticLeadPromptSession,
}: {
  children: ReactNode;
  promptSession?: AutomaticLeadPromptSession;
}) {
  const [source, setSource] = useState<string | null>(null);
  const sourceRef = useRef<string | null>(null);
  const [consumed, setConsumed] = useState(() => promptSession.isConsumed());

  const openLeadModal = useCallback(
    (value: string) => {
      // A deliberate request already fulfils the purpose of either automatic trigger.
      promptSession.consume();
      setConsumed(true);
      if (sourceRef.current !== null) return;
      sourceRef.current = value;
      setSource(value);
    },
    [promptSession],
  );
  const tryOpenAutomatically = useCallback(
    (value: AutomaticLeadPromptSource) => {
      if (
        sourceRef.current !== null ||
        promptSession.isConsumed() ||
        isAutomaticLeadPromptBlocked()
      ) {
        return false;
      }
      // This synchronous claim prevents two triggers from resetting form input/source
      // before React has committed the first open.
      if (!promptSession.consume()) return false;
      sourceRef.current = value;
      setConsumed(true);
      setSource(value);
      return true;
    },
    [promptSession],
  );
  const closeLeadModal = useCallback(() => {
    sourceRef.current = null;
    setSource(null);
  }, []);
  const context = useMemo(
    () => ({ openLeadModal, closeLeadModal }),
    [openLeadModal, closeLeadModal],
  );
  const automaticContext = useMemo(
    () => ({ session: promptSession, consumed, tryOpen: tryOpenAutomatically }),
    [promptSession, consumed, tryOpenAutomatically],
  );

  return (
    <LeadModalContext.Provider value={context}>
      <AutomaticLeadPromptContext.Provider value={automaticContext}>
        {children}
      </AutomaticLeadPromptContext.Provider>
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
