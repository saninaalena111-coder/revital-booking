/**
 * Единая точка входа слоя данных. UI импортирует только отсюда.
 */
export { doctorsService } from "./doctorsService";
export { appointmentsService } from "./appointmentsService";
export { roomsService } from "./roomsService";
export { patientsService, patientShortName, patientFullName, patientAge, PATIENT_TYPE_LABEL } from "./patientsService";
export { integrationService } from "./integrationService";
export { notificationsService, smsTemplates } from "./notificationsService";
export { DATA_SOURCE } from "./config";
export { analyticsService } from "./analyticsService";
export { sessionService } from "./sessionService";
export { staffService, staffShortName, staffFullName } from "./staffService";
export { auditService, AUDIT_KIND_LABEL } from "./auditService";
export { catalogService, CATEGORY_LABEL } from "./catalogService";
export { staysService, STAY_STATUS_LABEL, PAYMENT_LABEL, ROOM_STATE_LABEL } from "./staysService";
export { proceduresService, prescriptionsService, SESSION_STATUS_LABEL } from "./proceduresService";
export { visitsService, documentsService, labsService, DAY_STATUS_LABEL, DOC_STATUS_LABEL } from "./visitsService";
export { mealsService, TOMORROW } from "./mealsService";
export type { DayItem, DocRow } from "./visitsService";
export type { SessionRow, CourseProgress } from "./proceduresService";
export type { MealGuest } from "./mealsService";
export type { GridRow, GridCell } from "./staysService";
export type { NetworkSummary } from "./analyticsService";
export { assistantService } from "./assistantService";
export type { AssistantAnswer } from "./assistantService";
