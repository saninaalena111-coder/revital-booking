"use client";

import type { ReactNode } from "react";
import { useService } from "@/hooks/useService";
import { integrationService } from "@/services";
import type { ContractItem } from "@/services/integrationService";
import { AdminTitle } from "./AdminShell";

/*
 * Раздел «Для разработчиков».
 * Вся техническая информация показана сразу, без сворачивания:
 * её можно открыть и обсудить с разработчиком МИС «Санаториум».
 * Названия запросов — предложение для обсуждения; точные названия
 * определит документация МИС.
 */

const card = "rounded-[24px] border border-line bg-milk";

function Section({ title, lead, children }: { title: string; lead?: ReactNode; children: ReactNode }) {
  return (
    <section className={`${card} mt-4 p-6 sm:p-8`}>
      <h2 className="font-display text-3xl text-forest-deep">{title}</h2>
      {lead && <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-muted">{lead}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Code({ title, children }: { title?: string; children: string }) {
  return (
    <div className="min-w-0">
      {title && <div className="mb-2 text-[13px] font-semibold text-forest-deep">{title}</div>}
      <pre className="overflow-x-auto rounded-2xl bg-forest-deep p-4 font-mono text-[12.5px] leading-relaxed text-sage">{children}</pre>
    </div>
  );
}

function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line">
      <table className="w-full min-w-[640px] text-left text-[14px]">
        <thead className="bg-cream/70 text-[12px] text-muted">
          <tr>{head.map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((r, i) => (
            <tr key={i} className="align-top">
              {r.map((c, j) => <td key={j} className="px-4 py-3 text-ink/85">{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const M = ({ children }: { children: ReactNode }) => (
  <code className="whitespace-nowrap rounded-md bg-cream px-1.5 py-0.5 font-mono text-[12px] text-teal">{children}</code>
);

function Steps({ items }: { items: ReactNode[] }) {
  return (
    <ol className="space-y-3">
      {items.map((it, i) => (
        <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-ink/85">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-forest text-[13px] font-semibold text-milk">{i + 1}</span>
          <span className="pt-0.5">{it}</span>
        </li>
      ))}
    </ol>
  );
}

const DevNote = () => (
  <p className="mb-2 max-w-3xl rounded-2xl border border-dashed border-gold/60 bg-gold-soft/30 p-4 text-[14px] leading-relaxed text-ink/80">
    Формат запросов ниже — наше предложение для обсуждения с разработчиком МИС «Санаториум». Точные названия и поля определит их документация. В прототипе все данные вымышленные.
  </p>
);

/* =============== ОБМЕН ДАННЫМИ =============== */

export function DevExchange() {
  const { data } = useService(() => integrationService.contract(), []);
  const rows = (list?: ContractItem[]) =>
    (list ?? []).map((it) => [<b key="t" className="font-semibold text-forest-deep">{it.title}</b>, it.hint, <M key="m">{it.tech}</M>, it.stage === 2 ? "второй" : "первый"]);

  return (
    <>
      <AdminTitle title="Обмен данными с МИС" lead="Какие данные наша система получает из «Санаториума» и что передаёт обратно. Всё в открытом виде — для разработчиков обеих сторон." />
      <DevNote />

      <Section title="Как устроено подключение" lead="Сайт записи никогда не обращается к МИС напрямую. Все запросы идут через наш сервер — там хранятся ключи доступа.">
        <Code>{`Браузер пациента  ──►  Сервер «Онлайн-запись Ревиталь»  ──►  API МИС «Санаториум»
                         (ключи доступа, журнал запросов)   (HTTPS, авторизация по ключу)
                                   ▲
                                   └──  события об изменениях (webhook) от МИС`}</Code>
        <ul className="mt-5 grid gap-2 text-[14.5px] text-ink/80 sm:grid-cols-2">
          <li>• Защищённое соединение HTTPS, авторизация по ключу или токену</li>
          <li>• Ключи хранятся только на сервере, не в браузере</li>
          <li>• Единый часовой пояс: Москва (UTC+3)</li>
          <li>• Постоянные номера (ID) врачей, кабинетов, услуг и записей</li>
          <li>• Ограничение частоты запросов согласуется с МИС</li>
          <li>• Журнал всех запросов на нашей стороне для разбора ошибок</li>
        </ul>
      </Section>

      <Section title="Что получаем из МИС" lead="Справочники обновляем раз в несколько минут и кешируем. Занятость проверяем повторно перед созданием записи.">
        <Table head={["Данные", "Зачем", "Предлагаемый запрос", "Этап"]} rows={rows(data?.receive)} />
      </Section>

      <Section title="Что передаём в МИС">
        <Table head={["Данные", "Зачем", "Поле / запрос", "Этап"]} rows={rows(data?.send)} />
      </Section>

      <Section title="Примеры запросов и ответов">
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <Code title="1. Поиск бронирования гостя">{`POST /patients/lookup
{ "phone": "+79001234567", "lastName": "Смирнова" }

→ 200
{
  "patientId": "SAN-PAT-55120",
  "firstName": "Анна",
  "lastName": "Смирнова",
  "stay": { "room": "315", "from": "2026-10-08", "to": "2026-10-15" }
}`}</Code>
          <Code title="2. Свободное время врача">{`GET /slots?doctorId=SAN-DOC-1042&serviceId=SAN-SRV-0101&date=2026-10-12

→ 200
{
  "slots": [
    { "start": "10:30", "end": "11:00", "roomId": "SAN-ROOM-201" },
    { "start": "12:00", "end": "12:30", "roomId": "SAN-ROOM-201" }
  ]
}
// Если МИС не умеет считать свободное время,
// мы считаем его сами по сменам, кабинетам и записям.`}</Code>
          <Code title="3. Создание записи">{`POST /appointments
{
  "patientId": "SAN-PAT-55120",
  "doctorId": "SAN-DOC-1042",
  "serviceId": "SAN-SRV-0101",
  "date": "2026-10-12",
  "start": "10:30",
  "roomId": "SAN-ROOM-201",      // если МИС не назначает кабинет сама
  "comment": "Онлайн-запись"
}

→ 201
{ "appointmentId": "SAN-APP-8F2K1", "status": "confirmed" }

→ 409 — время уже занято: показываем пациенту другие варианты`}</Code>
          <Code title="4. Перенос и отмена">{`PATCH /appointments/SAN-APP-8F2K1
{ "date": "2026-10-13", "start": "12:00" }
→ 200 { "status": "confirmed" }

DELETE /appointments/SAN-APP-8F2K1
→ 200 { "status": "cancelled" }

// После отмены врач и кабинет освобождаются,
// время снова доступно другим пациентам.`}</Code>
        </div>
      </Section>
    </>
  );
}

/* =============== СОБЫТИЯ =============== */

export function DevEvents() {
  return (
    <>
      <AdminTitle title="События об изменениях" lead="Как наша система узнаёт, что запись изменили прямо в «Санаториуме»: мгновенное уведомление (webhook) или регулярная проверка." />
      <DevNote />

      <Section title="Вариант 1. Мгновенные уведомления (webhook)" lead="МИС сама отправляет нашему серверу сообщение о каждом изменении. Пациент узнаёт о переносе через несколько секунд.">
        <Table
          head={["Событие", "Когда приходит", "Что делает наша система"]}
          rows={[
            [<M key="1">appointment.created</M>, "Запись создана в МИС (по телефону, на ресепшене)", "Добавляет запись, время перестаёт быть доступным онлайн"],
            [<M key="2">appointment.rescheduled</M>, "Запись перенесена", "Меняет время в личном кабинете, отправляет СМС о новом времени"],
            [<M key="3">appointment.cancelled</M>, "Запись отменена", "Освобождает время, отправляет СМС об отмене"],
            [<M key="4">appointment.completed</M>, "Пациент пришёл на приём", "Переносит запись в историю посещений"],
            [<M key="5">shift.changed</M>, "Изменилась смена врача", "Пересчитывает свободное время"],
            [<M key="6">doctor.absence</M>, "Отпуск или больничный", "Скрывает время врача, сообщает пациентам с записями"],
            [<M key="7">prescription.updated</M>, "Терапевт изменил назначения (второй этап)", "Обновляет список доступных процедур"],
          ]}
        />
        <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
          <Code title="Пример уведомления">{`POST https://запись.ревиталь/api/integrations/sanatorium/events
X-Signature: sha256=9f2c…   // подпись для проверки подлинности

{
  "eventId": "evt_01HZX…",
  "type": "appointment.rescheduled",
  "occurredAt": "2026-10-12T08:41:05+03:00",
  "appointment": {
    "id": "SAN-APP-ANNA1011",
    "date": "2026-10-12",
    "start": "12:00",
    "end": "13:00",
    "doctorId": "SAN-DOC-1042",
    "roomId": "SAN-ROOM-305"
  }
}`}</Code>
          <div>
            <div className="mb-2 text-[13px] font-semibold text-forest-deep">Требования к уведомлениям</div>
            <Steps
              items={[
                <>Подпись каждого сообщения (<M>X-Signature</M>) — чтобы чужой сервер не мог подделать событие.</>,
                <>Уникальный номер события (<M>eventId</M>) — повторно пришедшее событие не обработается дважды.</>,
                <>Время изменения (<M>occurredAt</M>) — если события пришли не по порядку, побеждает более позднее.</>,
                <>Повторная отправка со стороны МИС, если наш сервер временно не ответил.</>,
                <>Наш сервер отвечает <M>200</M> сразу, а обработку выполняет в очереди.</>,
              ]}
            />
          </div>
        </div>
      </Section>

      <Section title="Вариант 2. Регулярная проверка (если уведомлений в МИС нет)" lead="Наша система сама спрашивает у МИС, что изменилось. Работает надёжно, но с задержкой до нескольких минут.">
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <Steps
            items={[
              "Каждые 5 минут запрашиваем изменения с момента прошлой проверки.",
              "Сравниваем с нашими записями: время, врач, кабинет, статус.",
              "Обновляем личный кабинет и отправляем СМС, если изменилось время или запись отменена.",
              "Раз в сутки (ночью) — полная сверка записей на ближайшие две недели.",
            ]}
          />
          <Code title="Пример запроса изменений">{`GET /appointments/changes?since=2026-10-12T08:35:00+03:00

→ 200
{
  "changes": [
    { "id": "SAN-APP-ANNA1011", "status": "confirmed",
      "date": "2026-10-12", "start": "12:00",
      "updatedAt": "2026-10-12T08:41:05+03:00" }
  ],
  "serverTime": "2026-10-12T08:40:00+03:00"
}`}</Code>
        </div>
      </Section>
    </>
  );
}

/* =============== СТРУКТУРА ДАННЫХ =============== */

const ENTITIES: { title: string; where: string; fields: [string, string, string][] }[] = [
  {
    title: "Врач", where: "Справочник из МИС + фото и описание в нашей системе",
    fields: [
      ["id / misId", "строка", "Номер врача в МИС"],
      ["lastName, firstName, patronymic", "строка", "ФИО"],
      ["specialties", "список", "Специализации"],
      ["mainRoomId", "строка или пусто", "Основной кабинет (может отсутствовать)"],
      ["roomIds", "список", "Все кабинеты, где врач может принимать, по приоритету"],
      ["serviceIds", "список", "Услуги, которые проводит врач"],
      ["workDays, shiftStart, shiftEnd", "дни недели, время", "Рабочие дни и смена"],
      ["absences", "список периодов", "Отпуск, больничный"],
    ],
  },
  {
    title: "Кабинет", where: "Справочник из МИС; режим доступа может храниться у нас",
    fields: [
      ["id / misId", "строка", "Номер кабинета в МИС"],
      ["number, floor, title", "строка, число", "Номер, этаж, название"],
      ["access", "personal | group | shared", "Персональный / ограничен группой / общий"],
      ["ownerDoctorId", "строка", "Владелец персонального кабинета"],
      ["allowedDoctorIds", "список", "Специалисты, допущенные в кабинет-«группу»"],
      ["equipment", "список", "Оборудование"],
    ],
  },
  {
    title: "Услуга", where: "Справочник из МИС",
    fields: [
      ["id / misId", "строка", "Номер услуги в МИС"],
      ["title, directionId", "строка", "Название и направление"],
      ["durationMin", "число", "Длительность в минутах"],
      ["roomIds", "список", "Кабинеты, оборудованные для услуги"],
      ["doctorIds", "список", "Кто проводит"],
      ["selfBooking", "да / нет", "Можно ли записаться без назначения врача"],
    ],
  },
  {
    title: "Запись", where: "Создаётся у нас и в МИС; связь по номеру записи",
    fields: [
      ["id", "строка", "Номер записи в нашей системе"],
      ["misId", "строка", "Номер записи в МИС (приходит после создания)"],
      ["patientId", "строка", "Пациент"],
      ["doctorId, serviceId, roomId", "строка", "Врач, услуга, назначенный кабинет"],
      ["date, start, end", "дата, минуты", "Дата и время"],
      ["status", "confirmed | cancelled | completed", "Подтверждена / отменена / завершена"],
      ["createdVia", "online | mis | phone", "Где создана запись"],
      ["attribution", "объект", "Источник обращения (см. ниже)"],
    ],
  },
  {
    title: "Пациент", where: "Контакты у нас, медицинская карта — только в МИС",
    fields: [
      ["id / misId", "строка", "Номер пациента в МИС"],
      ["firstName, lastName, phone", "строка", "Имя и телефон для записи и СМС"],
      ["type", "guest | future_guest | outpatient", "Гость / будущий гость / амбулаторный"],
      ["stay", "объект", "Номер и даты проживания (для гостей)"],
    ],
  },
  {
    title: "Источник записи", where: "Только наша система — для маркетинговой аналитики",
    fields: [
      ["source", "строка", "Источник: Instagram, сайт, QR-код…"],
      ["medium", "строка", "Канал: видео врача, поиск, рассылка…"],
      ["campaign", "строка", "Рекламная кампания"],
      ["utm_source, utm_medium, utm_campaign", "строка", "Метки из ссылки, по которой пришёл пациент"],
      ["landing_page", "строка", "Страница, с которой началась запись"],
      ["referrer", "строка", "Сайт, с которого перешёл пациент"],
    ],
  },
  {
    title: "СМС-уведомление", where: "Только наша система",
    fields: [
      ["appointmentId", "строка", "К какой записи относится"],
      ["kind", "created | day_before | two_hours | changed | cancelled", "Тип сообщения"],
      ["text, sendAt", "строка", "Текст и время отправки"],
      ["status", "sent | scheduled | skipped", "Отправлено / запланировано / не отправляется"],
    ],
  },
];

export function DevData() {
  return (
    <>
      <AdminTitle title="Структура данных" lead="Какие сущности есть в системе, какие у них поля и где они хранятся. Медицинские сведения не дублируются — они остаются в МИС." />
      {ENTITIES.map((e) => (
        <Section key={e.title} title={e.title} lead={e.where}>
          <Table head={["Поле", "Тип", "Описание"]} rows={e.fields.map(([f, t, d]) => [<M key="f">{f}</M>, <span key="t" className="text-muted">{t}</span>, d])} />
        </Section>
      ))}
    </>
  );
}

/* =============== АЛГОРИТМ =============== */

export function DevAlgorithm() {
  return (
    <>
      <AdminTitle title="Алгоритм расписания" lead="Как система решает, показывать ли пациенту время. Наглядная версия — на странице «Логика расписания» на сайте." />
      <Section title="Проверка одного времени" lead="Время доступно, только если пройдены все шаги. Кабинеты проверяются в порядке приоритета врача: основной — первым.">
        <Steps
          items={[
            "Врач работает в этот день: нет отпуска, больничного, день входит в рабочие.",
            "Приём целиком помещается в смену врача (начало и конец услуги).",
            "Врач не занят другой записью в это время — в любом кабинете, а также нет внутренней занятости (обход, совещание).",
            "Кабинет оборудован для этой услуги.",
            "Кабинет разрешён врачу по режиму доступа: персональный — только владельцу, группа — только допущенным, общий — всем.",
            "Кабинет свободен на всё время услуги. Первый подходящий свободный кабинет назначается автоматически.",
          ]}
        />
        <div className="mt-6">
          <Code title="Упрощённый код проверки (src/lib/scheduling/engine.ts)">{`function checkSlot(doctor, service, date, start) {
  const end = start + service.durationMin;

  if (!worksOn(doctor, date))                 return "врач не работает";
  if (start < doctor.shiftStart || end > doctor.shiftEnd)
                                              return "вне смены";
  if (doctorHasAppointment(doctor, date, start, end))
                                              return "врач занят";   // в любом кабинете!

  for (const room of doctor.roomIds) {        // основной кабинет — первым
    if (!service.roomIds.includes(room))      continue;  // нет оборудования
    if (!canUseRoom(room, doctor))            continue;  // чужой персональный
    if (roomIsBusy(room, date, start, end))   continue;  // занят
    return { available: true, roomId: room };            // назначаем
  }
  return "нет свободного подходящего кабинета";
}`}</Code>
        </div>
      </Section>

      <Section title="Важные правила">
        <Table
          head={["Правило", "Почему"]}
          rows={[
            ["Свободный кабинет не означает свободного врача", "Иначе врач окажется записан одновременно в двух кабинетах"],
            ["Кабинет пациенту при выборе не показывается", "Распределение кабинетов может меняться внутри клиники"],
            ["Шаг сетки — 30 минут, длительность берётся из услуги", "Услуга на 60 минут занимает два соседних интервала"],
            ["Перед созданием записи проверка повторяется", "За время выбора время мог занять другой пациент или администратор"],
            ["Гостю санатория сначала доступен только терапевт", "Процедуры назначает врач на первичном приёме"],
            ["После записи блокируются и врач, и кабинет", "Оба ресурса заняты на всё время услуги"],
          ]}
        />
      </Section>
    </>
  );
}

/* =============== УСТРОЙСТВО ПРОТОТИПА =============== */

export function DevStructure() {
  return (
    <>
      <AdminTitle title="Устройство прототипа" lead="Из чего собран прототип, где лежат демо-данные и что нужно сделать, чтобы подключить настоящую МИС." />
      <Section title="Технологии">
        <Table
          head={["Что", "Чем сделано"]}
          rows={[
            ["Интерфейс", "Next.js 16, React 19, TypeScript"],
            ["Оформление", "Tailwind CSS 4, фирменный шрифт Myriad Pro, анимации Framer Motion"],
            ["Публикация", "Статический сайт на GitHub Pages; обновление командой npm run deploy"],
            ["Код", <a key="r" href="https://github.com/saninaalena111-coder/revital-booking" className="text-teal underline-offset-4 hover:underline">github.com/saninaalena111-coder/revital-booking</a>],
          ]}
        />
      </Section>

      <Section title="Слои приложения" lead="Интерфейс не знает, откуда берутся данные. Чтобы подключить МИС, меняются только сервисы — экраны остаются прежними.">
        <Code>{`src/
  lib/types.ts               общие типы данных (врач, кабинет, запись…)
  lib/scheduling/engine.ts   алгоритм свободного времени
  lib/rules.ts               правила записи (гостю — только терапевт)
  services/                  слой данных — экраны берут данные только отсюда
    doctorsService           врачи, смены, услуги, направления
    appointmentsService      свободное время, создание, перенос, отмена
    roomsService             кабинеты, режимы доступа, занятость
    patientsService          поиск бронирования гостя
    integrationService       подключение к МИС «Санаториум»
    notificationsService     СМС-шаблоны и напоминания
    analyticsService         показатели и источники записей
  mock/                      вымышленные демо-данные (заменяются на МИС)
  components/                экраны и элементы интерфейса`}</Code>
      </Section>

      <Section title="Что в прототипе сделано «понарошку»">
        <Table
          head={["Функция", "В прототипе", "В рабочей версии"]}
          rows={[
            ["Врачи, кабинеты, расписание", "Вымышленные данные в src/mock", "Получаем из МИС «Санаториум»"],
            ["Записи пациента", "Хранятся в браузере (localStorage)", "Наш сервер + база данных + МИС"],
            ["Поиск бронирования гостя", "Любые данные находят Анну Смирнову", "Запрос в МИС по телефону и фамилии"],
            ["СМС", "Только показываются на экране", "Отправка через СМС-шлюз по расписанию"],
            ["Вход в личный кабинет", "Без входа", "Вход по коду из СМС"],
            ["Назначения терапевта", "Пример (второй этап)", "Получаем из МИС по пациенту"],
            ["Дашборд", "Демо-цифры", "Реальная статистика нашей базы"],
          ]}
        />
      </Section>

      <Section title="План перехода на рабочую версию">
        <Steps
          items={[
            "Получить документацию и тестовый доступ к API «Санаториума».",
            "Поднять сервер и базу данных для наших данных (контакты, источники, СМС, настройки).",
            "Реализовать integrationService: справочники, свободное время, создание, перенос и отмена записей.",
            "Настроить приём мгновенных уведомлений или регулярную проверку изменений.",
            "Подключить СМС-шлюз и вход в личный кабинет по коду из СМС.",
            "Переключить сервисы с демо-данных на МИС (NEXT_PUBLIC_DATA_SOURCE=mis) и провести тестирование на реальном расписании.",
          ]}
        />
      </Section>
    </>
  );
}
