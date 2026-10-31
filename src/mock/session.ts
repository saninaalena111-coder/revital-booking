/**
 * Сессия демо-МИС: кто вошёл, выбранный санаторий и арендатор.
 *
 * Хранится отдельно от демо-данных: «Сбросить демо-данные» не выходит из системы.
 * В рабочей версии — серверная сессия с входом в два шага.
 */
import type { RoleId, SanatoriumId } from "@/lib/types";
import { DEMO_USER } from "./mis/staff";

export interface SessionState {
  role: RoleId | null;
  staffId: string | null;
  sanatoriumId: SanatoriumId | "all";
  tenantId: string;
  /** Данные из localStorage уже прочитаны — можно показывать экран без мерцания */
  ready: boolean;
}

const KEY = "revital-mis-session-v1";
const INITIAL: SessionState = { role: null, staffId: null, sanatoriumId: "gelendzhik", tenantId: "revital", ready: false };

let state: SessionState = INITIAL;
const listeners = new Set<() => void>();

function set(p: Partial<SessionState>) {
  state = { ...state, ...p };
  try {
    const { ready: _ready, ...saved } = state;
    void _ready;
    localStorage.setItem(KEY, JSON.stringify(saved));
  } catch {
    /* приватный режим — работаем без сохранения */
  }
  listeners.forEach((l) => l());
}

export const session = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  get: () => state,
  server: () => INITIAL,

  /** Повторный вызов ничего не делает: состояние читается один раз */
  hydrate() {
    if (state.ready) return;
    let saved: Partial<SessionState> = {};
    try {
      saved = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    } catch {
      /* игнорируем повреждённые данные */
    }
    state = { ...INITIAL, ...saved, ready: true };
    listeners.forEach((l) => l());
  },

  signIn(role: RoleId) {
    set({ role, staffId: DEMO_USER[role] });
  },
  signOut() {
    set({ role: null, staffId: null });
  },
  setSanatorium(sanatoriumId: SessionState["sanatoriumId"]) {
    set({ sanatoriumId });
  },
  setTenant(tenantId: string) {
    set({ tenantId });
  },
};
