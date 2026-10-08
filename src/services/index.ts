/**
 * Единая точка входа слоя данных. UI импортирует только отсюда.
 */
export { doctorsService } from "./doctorsService";
export { appointmentsService } from "./appointmentsService";
export { roomsService } from "./roomsService";
export { patientsService } from "./patientsService";
export { integrationService } from "./integrationService";
export { notificationsService, smsTemplates } from "./notificationsService";
export { DATA_SOURCE } from "./config";
export { analyticsService } from "./analyticsService";
