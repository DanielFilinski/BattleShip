import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ModalSettings {
  autoCloseModal: boolean;
  questionTimer: number; // seconds, 0 = disabled
  autoStartTimer: boolean; // automatically start timer when modal opens
}

interface ModalSettingsState extends ModalSettings {
  setAutoCloseModal: (value: boolean) => void;
  toggleAutoCloseModal: () => void;
  setQuestionTimer: (value: number) => void;
  toggleAutoStartTimer: () => void;
}

export const useModalSettings = create<ModalSettingsState>()(
  persist(
    (set, get) => ({
      autoCloseModal: true, // По умолчанию автоматическое закрытие включено
      questionTimer: 60, // По умолчанию 60 секунд
      autoStartTimer: false, // По умолчанию автостарт выключен
      setAutoCloseModal: (value: boolean) => set({ autoCloseModal: value }),
      toggleAutoCloseModal: () => set({ autoCloseModal: !get().autoCloseModal }),
      setQuestionTimer: (value: number) => set({ questionTimer: value }),
      toggleAutoStartTimer: () => set({ autoStartTimer: !get().autoStartTimer }),
    }),
    {
      name: 'battleship-modal-settings',
    }
  )
);
