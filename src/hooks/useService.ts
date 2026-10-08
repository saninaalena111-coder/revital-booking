"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { db } from "@/mock/db";

/** Версия демо-данных: меняется при любой записи/переносе/отмене */
export function useDataVersion() {
  return useSyncExternalStore(db.subscribe, db.getVersion, () => 0);
}

/**
 * Загрузка данных из сервиса. Перезапрашивает при изменении deps
 * и при изменении демо-данных. Предыдущий результат сохраняется,
 * пока идёт новый запрос, — без мерцания.
 */
export function useService<T>(fn: () => Promise<T>, deps: unknown[]) {
  const version = useDataVersion();
  const key = JSON.stringify([version, ...deps]);
  const [state, setState] = useState<{ key: string; data?: T }>({ key: "" });
  useEffect(() => {
    let alive = true;
    fn().then((data) => alive && setState({ key, data }));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return { data: state.data, loading: state.key !== key };
}
