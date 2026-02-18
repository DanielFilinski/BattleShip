import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ModalSettings {
  autoCloseModal: boolean;
  questionTimer: number; // seconds, 0 = disabled
}

interface ModalSettingsState extends ModalSettings {
  setAutoCloseModal: (value: boolean) => void;
  toggleAutoCloseModal: () => void;
  setQuestionTimer: (value: number) => void;
}

export const useModalSettings = create<ModalSettingsState>()(
  persist(
    (set, get) => ({
      autoCloseModal: true, // По умолчанию автоматическое закрытие включено
      questionTimer: 60, // По умолчанию 60 секунд
      setAutoCloseModal: (value: boolean) => set({ autoCloseModal: value }),
      toggleAutoCloseModal: () => set({ autoCloseModal: !get().autoCloseModal }),
      setQuestionTimer: (value: number) => set({ questionTimer: value }),
    }),
    {
      name: 'battleship-modal-settings',
    }
  )
);
