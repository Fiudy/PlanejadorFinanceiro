import { create } from "zustand";
import type { ThemeMode } from "@/domain/entities/user";

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

const STORAGE_KEY = "planejador-financeiro:theme";

function applyToDocument(mode: ThemeMode) {
  document.documentElement.classList.toggle("dark", mode === "dark");
}

function readInitialMode(): ThemeMode {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

const initialMode = readInitialMode();
if (typeof document !== "undefined") applyToDocument(initialMode);

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: initialMode,
  setMode: (mode) => {
    localStorage.setItem(STORAGE_KEY, mode);
    applyToDocument(mode);
    set({ mode });
  },
  toggle: () => get().setMode(get().mode === "dark" ? "light" : "dark"),
}));
