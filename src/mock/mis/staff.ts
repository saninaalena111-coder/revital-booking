/**
 * MOCK-ДАННЫЕ: персонал сети. Все люди вымышлены.
 *
 * Врачи Геленджика — те же, что в онлайн-записи (связь через doctorId),
 * поэтому запись гостя с сайта сразу видна врачу в МИС.
 */
import type { RoleId, SanatoriumId, Staff } from "@/lib/types";

const s = (
  id: string, sanatoriumId: SanatoriumId, role: RoleId, fio: string, position: string,
  extra: Partial<Staff> = {},
): Staff => {
  const [lastName, firstName, patronymic] = fio.split(" ");
  return {
    id, sanatoriumId, role, lastName, firstName, patronymic, position,
    email: `${id}@revital.demo`, lastSeen: "12 окт, 08:40", twoFactor: true, active: true, ...extra,
  };
};

export const STAFF: Staff[] = [
  // Геленджик — врачи (карточки врачей — src/mock/catalog.ts)
  s("st-orlova", "gelendzhik", "doctor", "Орлова Мария Ивановна", "Терапевт, косметолог", { doctorId: "orlova" }),
  s("st-volkova", "gelendzhik", "doctor", "Волкова Зинаида Петровна", "Терапевт, физиотерапевт", { doctorId: "volkova" }),
  s("st-morozov", "gelendzhik", "doctor", "Морозов Алексей Сергеевич", "Невролог", { doctorId: "morozov", lastSeen: "11 окт, 18:55" }),
  s("st-sokolova", "gelendzhik", "doctor", "Соколова Елена Викторовна", "Акушер-гинеколог", { doctorId: "sokolova" }),
  s("st-belova", "gelendzhik", "doctor", "Белова Ирина Андреевна", "Физиотерапевт", { doctorId: "belova" }),
  s("st-lebedeva", "gelendzhik", "doctor", "Лебедева Ольга Николаевна", "Медицинский психолог", { doctorId: "lebedeva", lastSeen: "10 окт, 17:20" }),
  // Геленджик — средний медперсонал
  s("st-kravchenko", "gelendzhik", "nurse", "Кравченко Татьяна Олеговна", "Медсестра физиотерапевтического кабинета", { roomId: "g-physio-1" }),
  s("st-efimova", "gelendzhik", "nurse", "Ефимова Светлана Игоревна", "Медсестра ванного отделения", { roomId: "g-bath" }),
  // Геленджик — ресепшн, бронирование, ресторан
  s("st-gordeeva", "gelendzhik", "reception", "Гордеева Алина Романовна", "Администратор ресепшн"),
  s("st-shestakov", "gelendzhik", "reception", "Шестаков Максим Ильич", "Администратор ресепшн", { lastSeen: "11 окт, 23:10" }),
  s("st-polyakova", "gelendzhik", "booking", "Полякова Ксения Андреевна", "Менеджер отдела бронирования"),
  s("st-timofeeva", "gelendzhik", "restaurant", "Тимофеева Галина Петровна", "Диетсестра"),
  // Управление сетью
  s("st-vorontsov", "gelendzhik", "manager", "Воронцов Андрей Викторович", "Руководитель сети санаториев"),
  s("st-belousova", "gelendzhik", "marketer", "Белоусова Дарья Сергеевна", "Маркетолог"),
  s("st-kotov", "gelendzhik", "sysadmin", "Котов Илья Валерьевич", "Администратор системы"),
  // Сочи
  s("st-sochi-1", "sochi", "doctor", "Арсеньева Юлия Михайловна", "Терапевт"),
  s("st-sochi-2", "sochi", "doctor", "Гаврилов Павел Олегович", "Физиотерапевт"),
  s("st-sochi-3", "sochi", "doctor", "Мельник Оксана Викторовна", "Кардиолог"),
  s("st-sochi-4", "sochi", "doctor", "Рябов Денис Аркадьевич", "Невролог", { twoFactor: false }),
  // Балашиха
  s("st-bal-1", "balashikha", "doctor", "Субботина Ирина Львовна", "Терапевт"),
  s("st-bal-2", "balashikha", "doctor", "Карпов Виктор Евгеньевич", "Физиотерапевт"),
  s("st-bal-3", "balashikha", "doctor", "Лаптева Наталья Георгиевна", "Гастроэнтеролог"),
  // Четвёртый объект — данные уточняются
  s("st-4-1", "fourth", "doctor", "Демидов Сергей Николаевич", "Терапевт", { lastSeen: "—", twoFactor: false }),
  s("st-4-2", "fourth", "doctor", "Захарова Анна Петровна", "Физиотерапевт", { lastSeen: "—", twoFactor: false }),
  s("st-4-3", "fourth", "doctor", "Медведева Лидия Олеговна", "Диетолог", { lastSeen: "—", twoFactor: false, active: false }),
];

/** Под кем входим в демо для каждой роли */
export const DEMO_USER: Record<RoleId, string> = {
  doctor: "st-orlova",
  nurse: "st-kravchenko",
  reception: "st-gordeeva",
  booking: "st-polyakova",
  restaurant: "st-timofeeva",
  manager: "st-vorontsov",
  marketer: "st-belousova",
  sysadmin: "st-kotov",
};
