import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ModalSettings {
  autoCloseModal: boolean;
}

interface ModalSettingsState extends ModalSettings {
  setAutoCloseModal: (value: boolean) => void;
  toggleAutoCloseModal: () => void;
}

export const useModalSettings = create<ModalSettingsState>()(
  persist(
    (set, get) => ({
      autoCloseModal: true, // По умолчанию автоматическое закрытие включено
      setAutoCloseModal: (value: boolean) => set({ autoCloseModal: value }),
      toggleAutoCloseModal: () => set({ autoCloseModal: !get().autoCloseModal }),
    }),
    {
      name: 'battleship-modal-settings',
    }
  )
);
