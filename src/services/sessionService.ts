/**
 * sessionService — вход в МИС, текущая роль, выбранный санаторий и арендатор.
 *
 * РЕАЛЬНЫЙ API: POST /auth/login → POST /auth/2fa → серверная сессия.
 * Роль и права приходят с сервера, а не выбираются на экране входа.
 */
import { session } from "@/mock/session";

export type { SessionState } from "@/mock/session";

export const sessionService = {
  subscribe: session.subscribe,
  snapshot: session.get,
  serverSnapshot: session.server,
  hydrate: session.hydrate,
  signIn: session.signIn,
  signOut: session.signOut,
  setSanatorium: session.setSanatorium,
  setTenant: session.setTenant,
};
