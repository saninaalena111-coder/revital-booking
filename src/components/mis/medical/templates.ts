/**
 * Шаблоны осмотра по специальности: подписи полей, быстрые фразы,
 * частые диагнозы и пример диктовки для демо голосового ввода.
 */

export type FieldKey = "complaints" | "anamnesis" | "objective" | "recommendations";

export interface FieldTemplate {
  label: string;
  placeholder: string;
  phrases: string[];
  /** Пример диктовки — вставляется, если браузер не распознаёт речь */
  sample: string;
}

export interface ExamTemplate {
  title: string;
  fields: Record<FieldKey, FieldTemplate>;
  frequentDiagnoses: string[];
}

const THERAPY: ExamTemplate = {
  title: "Осмотр терапевта",
  frequentDiagnoses: ["M42.1", "M54.5", "I10", "U09.9", "Z00.0"],
  fields: {
    complaints: {
      label: "Жалобы", placeholder: "Что беспокоит гостя",
      phrases: ["Жалоб нет", "Повышенная утомляемость", "Боль в спине"],
      sample: "Боль в пояснице при наклонах и после долгого сидения, скованность по утрам около получаса.",
    },
    anamnesis: {
      label: "Анамнез", placeholder: "История заболевания, хронические болезни, лекарства",
      phrases: ["Хронических заболеваний не отмечает", "Лекарства не принимает"],
      sample: "Остеохондроз поясничного отдела около восьми лет, обострения два раза в год. Последнее обострение весной, лечилась амбулаторно.",
    },
    objective: {
      label: "Объективно", placeholder: "Осмотр: состояние, давление, пульс, органы",
      phrases: ["Состояние удовлетворительное", "Дыхание везикулярное, хрипов нет", "Живот мягкий, безболезненный"],
      sample: "Состояние удовлетворительное. Давление 128 на 82, пульс 72, ритмичный. Ограничение наклонов вперёд, болезненность паравертебральных точек в поясничном отделе.",
    },
    recommendations: {
      label: "Рекомендации", placeholder: "Режим, питание, процедуры",
      phrases: ["Процедуры по назначению", "Терренкур ежедневно", "Питьевой режим"],
      sample: "Грязевые аппликации на поясничную область, подводный душ-массаж, кинезиотерапия. Избегать подъёма тяжестей. Повторный приём через 5 дней.",
    },
  },
};

const NEURO: ExamTemplate = {
  title: "Осмотр невролога",
  frequentDiagnoses: ["M42.1", "M54.2", "G47.0", "G44.2", "F48.0"],
  fields: {
    complaints: { ...THERAPY.fields.complaints, phrases: ["Головная боль", "Нарушение сна", "Боль в шее"], sample: "Головная боль к вечеру, давящего характера, трудно заснуть, просыпается два-три раза за ночь." },
    anamnesis: { ...THERAPY.fields.anamnesis, sample: "Жалобы около года на фоне высокой нагрузки на работе. Снотворные не принимает." },
    objective: {
      label: "Неврологический статус", placeholder: "Сознание, черепные нервы, рефлексы, координация",
      phrases: ["Сознание ясное", "Очаговой симптоматики нет", "Напряжение мышц шеи"],
      sample: "Сознание ясное. Очаговой неврологической симптоматики нет. Напряжение трапециевидных мышц, болезненность при пальпации шейного отдела.",
    },
    recommendations: { ...THERAPY.fields.recommendations, sample: "Электросон, массаж воротниковой зоны, флоатинг. Режим сна: отход ко сну до 23 часов." },
  },
};

const GYN: ExamTemplate = {
  title: "Осмотр гинеколога",
  frequentDiagnoses: ["N95.1", "N76.1", "Z00.0"],
  fields: {
    complaints: { ...THERAPY.fields.complaints, phrases: ["Жалоб нет", "Профилактический осмотр"], sample: "Профилактический осмотр, жалоб активно не предъявляет." },
    anamnesis: { ...THERAPY.fields.anamnesis, label: "Акушерско-гинекологический анамнез", sample: "Беременностей две, родов двое. Наблюдается у гинеколога по месту жительства ежегодно." },
    objective: { ...THERAPY.fields.objective, sample: "Состояние удовлетворительное. При осмотре патологии не выявлено." },
    recommendations: { ...THERAPY.fields.recommendations, sample: "УЗИ органов малого таза. Повторный осмотр через год." },
  },
};

const COSM: ExamTemplate = {
  title: "Осмотр косметолога",
  frequentDiagnoses: ["L57.4", "L70.0", "Z73.0"],
  fields: {
    complaints: { ...THERAPY.fields.complaints, phrases: ["Сухость кожи", "Снижение тонуса", "Пигментация"], sample: "Сухость и снижение тонуса кожи лица, мелкие морщины в области глаз." },
    anamnesis: { ...THERAPY.fields.anamnesis, sample: "Аппаратные процедуры ранее не проводились. Уход домашний." },
    objective: {
      label: "Состояние кожи", placeholder: "Тип кожи, тургор, высыпания, пигментация",
      phrases: ["Кожа сухая", "Тургор снижен", "Высыпаний нет"],
      sample: "Кожа сухая, тургор снижен, мелкие морщины периорбитальной области. Высыпаний нет.",
    },
    recommendations: { ...THERAPY.fields.recommendations, sample: "Курс аппаратного лифтинга, массаж лица, увлажняющий уход." },
  },
};

const PHYSIO: ExamTemplate = {
  ...THERAPY,
  title: "Осмотр физиотерапевта",
  frequentDiagnoses: ["M42.1", "M17.0", "M54.5", "M75.1"],
};

const PSY: ExamTemplate = {
  title: "Консультация психолога",
  frequentDiagnoses: ["F43.2", "F48.0", "Z73.0", "G47.0"],
  fields: {
    complaints: { ...THERAPY.fields.complaints, label: "Запрос", phrases: ["Тревожность", "Усталость", "Проблемы со сном"], sample: "Чувство постоянной усталости и тревоги, трудно переключиться с работы." },
    anamnesis: { ...THERAPY.fields.anamnesis, sample: "Высокая нагрузка последние полгода, отпуск давно не брала." },
    objective: { label: "Наблюдение", placeholder: "Эмоциональное состояние, контакт", phrases: ["Контакт продуктивный", "Фон настроения снижен"], sample: "Контакт продуктивный, фон настроения снижен, признаки эмоционального истощения." },
    recommendations: { ...THERAPY.fields.recommendations, sample: "Антистресс-сессии три раза, дыхательные практики, флоатинг." },
  },
};

/** Шаблон по услуге записи */
export function templateFor(serviceId: string | null): ExamTemplate {
  if (!serviceId) return THERAPY;
  if (serviceId.startsWith("neuro") || serviceId === "reflexo") return NEURO;
  if (serviceId.startsWith("gyn")) return GYN;
  if (serviceId.startsWith("cosm")) return COSM;
  if (serviceId.startsWith("physio") || serviceId === "rehab") return PHYSIO;
  if (serviceId.startsWith("psy")) return PSY;
  return THERAPY;
}
