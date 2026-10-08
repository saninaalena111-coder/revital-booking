import type { Appointment } from "./types";

/** Файл календаря (.ics) для кнопки «Добавить в календарь» */
export function downloadIcs(a: Appointment, title: string, location: string) {
  const d = a.date.replace(/-/g, "");
  const t = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}${String(m % 60).padStart(2, "0")}00`;
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Revital//Booking//RU", "BEGIN:VEVENT",
    `UID:${a.id}@revitalpark`, `DTSTART:${d}T${t(a.start)}`, `DTEND:${d}T${t(a.end)}`,
    `SUMMARY:${title}`, `LOCATION:${location}`, "BEGIN:VALARM", "TRIGGER:-PT2H", "ACTION:DISPLAY",
    "DESCRIPTION:Приём в Ревиталь Парк", "END:VALARM", "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "revital-park-zapis.ics";
  link.click();
  URL.revokeObjectURL(url);
}
