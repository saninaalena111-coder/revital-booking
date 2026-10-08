/**
 * notificationsService — СМС-напоминания и настройки уведомлений.
 *
 * ДЕМО: сообщения только формируются и показываются в интерфейсе.
 * РЕАЛЬНАЯ ОТПРАВКА: подключить СМС-шлюз (например, через серверный
 * эндпоинт /api/notifications) и планировщик задач для напоминаний
 * за сутки и за 2 часа.
 */
import type { Appointment, SmsMessage } from "@/lib/types";
import { DOCTORS, SERVICES } from "@/mock/catalog";
import { db } from "@/mock/db";
import { addDays, dayNum, DEMO_TODAY, fmtDay, fmtTime } from "@/lib/time";
import { latency, uid } from "./config";

const docName = (a: Appointment) => {
  const d = DOCTORS.find((x) => x.id === a.doctorId)!;
  return `${d.firstName} ${d.patronymic} ${d.lastName}`;
};
const docDative = (a: Appointment) => {
  // Упрощённое склонение для демо: «к Марии Ивановне Орловой»
  const d = DOCTORS.find((x) => x.id === a.doctorId)!;
  const female = d.patronymic.endsWith("на");
  if (!female) {
    const first = d.firstName.endsWith("й") ? d.firstName.slice(0, -1) + "ю" : d.firstName + "у";
    return `${first} ${d.patronymic}у ${d.lastName}у`;
  }
  const first = d.firstName.endsWith("ия") ? d.firstName.slice(0, -1) + "и" : d.firstName.slice(0, -1) + "е";
  return `${first} ${d.patronymic.slice(0, -1)}е ${d.lastName.slice(0, -1)}ой`;
};
const visitWord = (a: Appointment) =>
  SERVICES.find((s) => s.id === a.serviceId)?.title.includes("онсультац") ? "консультацию" : "приём";
const short = (date: string) => `${dayNum(date)} ${fmtDay(date).split(" ")[1].slice(0, 3)}`;

export const smsTemplates = {
  created: (a: Appointment) =>
    `Ревиталь Парк: Вы записаны на ${visitWord(a)} к ${docDative(a)} ${fmtDay(a.date)} в ${fmtTime(a.start)}.`,
  dayBefore: (a: Appointment) => `Ревиталь Парк: напоминаем о приёме завтра в ${fmtTime(a.start)}.`,
  twoHours: (a: Appointment) =>
    `Ревиталь Парк: ждём вас сегодня в ${fmtTime(a.start)}. Если планы изменились, запись можно перенести в личном кабинете.`,
  changed: (a: Appointment) => `Ревиталь Парк: время вашего приёма изменено. Новое время — ${fmtDay(a.date)}, ${fmtTime(a.start)}.`,
  cancelled: (a: Appointment) => `Ревиталь Парк: запись на ${fmtDay(a.date)}, ${fmtTime(a.start)} отменена.`,
};

function plan(a: Appointment): SmsMessage[] {
  const on = db.settings().smsEnabled;
  const status = on ? "scheduled" : "skipped";
  return [
    { id: uid("sms"), appointmentId: a.id, kind: "created", text: smsTemplates.created(a), sendAt: "сразу", status: on ? "sent" : "skipped" },
    // Запись на сегодня: напоминание «за сутки» уже не нужно
    a.date === DEMO_TODAY
      ? { id: uid("sms"), appointmentId: a.id, kind: "day_before", text: smsTemplates.dayBefore(a), sendAt: "не требуется", status: "skipped" }
      : { id: uid("sms"), appointmentId: a.id, kind: "day_before", text: smsTemplates.dayBefore(a), sendAt: `${short(addDays(a.date, -1))}, ${fmtTime(a.start)}`, status },
    { id: uid("sms"), appointmentId: a.id, kind: "two_hours", text: smsTemplates.twoHours(a), sendAt: `${short(a.date)}, ${fmtTime(a.start - 120)}`, status },
  ];
}

export const notificationsService = {
  async list(): Promise<SmsMessage[]> {
    await latency();
    return db.sms();
  },
  async settings() {
    await latency();
    return db.settings();
  },
  async setSmsEnabled(on: boolean) {
    await latency();
    db.setSettings({ smsEnabled: on });
  },
  /** Предпросмотр цепочки СМС без сохранения */
  preview: (a: Appointment) => plan(a),
  onCreated(a: Appointment) {
    db.addSms(plan(a));
  },
  onChanged(a: Appointment) {
    db.addSms([{ id: uid("sms"), appointmentId: a.id, kind: "changed", text: smsTemplates.changed(a), sendAt: "сразу", status: db.settings().smsEnabled ? "sent" : "skipped" }]);
  },
  onCancelled(a: Appointment) {
    db.addSms([{ id: uid("sms"), appointmentId: a.id, kind: "cancelled", text: smsTemplates.cancelled(a), sendAt: "сразу", status: db.settings().smsEnabled ? "sent" : "skipped" }]);
  },
  doctorName: docName,
};
