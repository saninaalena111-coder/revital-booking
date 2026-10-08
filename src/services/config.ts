/**
 * Конфигурация слоя данных.
 *
 * Сейчас все сервисы работают в режиме "mock". Когда появится доступ к API
 * МИС «Санаториум», режим переключается на "mis", и сервисы начинают ходить
 * в integrationService вместо mock-данных. Компоненты интерфейса при этом
 * не меняются — они работают только с публичными методами сервисов.
 */
export type DataSource = "mock" | "mis";

export const DATA_SOURCE: DataSource = (process.env.NEXT_PUBLIC_DATA_SOURCE as DataSource) ?? "mock";

/** Имитация сетевой задержки, чтобы демо ощущалось как реальный сервис */
export const latency = (ms = 0) => new Promise<void>((r) => setTimeout(r, ms));

export const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
