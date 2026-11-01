/**
 * MOCK-ДАННЫЕ МИС: каталог процедур, кабинеты Геленджика, программы, питание, МКБ-10.
 *
 * Названия процедур и программ — из открытых материалов санаториев Ревиталь.
 * Цены, длительность и оборудование — демонстрационные.
 */
import type { Diagnosis, DietTable, Dish, MedRoom, Procedure, Program } from "@/lib/types";
import { toMin } from "@/lib/time";

/* ---------- Кабинеты лечебного корпуса Геленджика ---------- */

const room = (
  id: string, number: string, title: string, kind: MedRoom["kind"], capacity: number, equipment: string[], nurseId?: string,
): MedRoom => ({ id, sanatoriumId: "gelendzhik", number, title, kind, capacity, equipment, open: toMin("09:00"), close: toMin("18:00"), nurseId });

export const MED_ROOMS: MedRoom[] = [
  room("g-bath", "101", "Ванное отделение", "bath", 4, ["4 ванны для бальнеотерапии", "Установка жемчужных ванн", "Генератор водородной воды", "Установка сухих углекислых ванн"], "st-efimova"),
  room("g-shower", "103", "Зал душей", "bath", 2, ["Кафедра душа Шарко", "Циркулярный душ", "Душ Виши", "Ванна подводного душа-массажа"], "st-efimova"),
  room("g-physio-1", "110", "Физиокабинет №1", "physio", 3, ["Аппарат магнитотерапии", "Аппарат СМТ и интерференцтерапии", "Аппарат электрофореза", "Дарсонваль"], "st-kravchenko"),
  room("g-physio-2", "112", "Физиокабинет №2", "physio", 3, ["Лазерный терапевтический аппарат", "Магнитотурботрон", "Аппарат прессотерапии", "Аппарат электросна"], "st-kravchenko"),
  room("g-massage", "115", "Массажный кабинет", "massage", 2, ["2 массажных стола", "Набор камней для стоун-массажа"]),
  room("g-ayur", "117", "Аюрведический центр", "massage", 1, ["Стол для абъянги", "Установка для широдхары"]),
  room("g-mud", "120", "Грязелечение и обёртывания", "procedure", 2, ["Грязевая кухня", "Кушетки с подогревом"]),
  room("g-float", "122", "Флоатинг и фитосауна", "procedure", 2, ["Флоат-камера", "Кушетка сухого флоатинга", "Кедровая бочка"]),
  room("g-climate", "124", "Климатотерапия", "climate", 3, ["Барокамера", "Гипоксикатор", "Соляная пещера", "Криосауна"]),
  room("g-inhal", "126", "Ингаляторий и фитобар", "procedure", 4, ["Ультразвуковые ингаляторы", "Аппарат водородных ингаляций", "Кислородный концентратор"]),
  room("g-proc", "130", "Процедурный кабинет", "procedure", 1, ["Озонатор", "Аппарат плазмафереза", "Аппарат карбокситерапии", "Аппарат локальной криотерапии", "Аппарат гидроколонотерапии"], "st-kravchenko"),
  room("g-lfk", "140", "Зал ЛФК и терренкур", "fitness", 8, ["Тренажёры", "Кинезиотерапевтическая установка", "Маршруты терренкура по парку"]),
  room("g-diag", "132", "Кабинет функциональной диагностики", "diagnostic", 1, ["Электрокардиограф", "УЗИ-сканер"]),
];

/* ---------- Процедуры ---------- */

const p = (
  id: string, title: string, category: Procedure["category"], durationMin: number, priceRub: number, roomIds: string[],
  extra: Partial<Procedure> = {},
): Procedure => ({ id, title, category, durationMin, priceRub, roomIds, ...extra });

export const PROCEDURES: Procedure[] = [
  // Водолечение
  p("bath-bischofite", "Ванна бишофитная", "bath", 20, 2200, ["g-bath"]),
  p("bath-mineral", "Ванна минеральная", "bath", 20, 1900, ["g-bath"]),
  p("bath-pearl", "Ванна жемчужная", "bath", 20, 1800, ["g-bath"], { equipment: "Установка жемчужных ванн" }),
  p("bath-hydrogen", "Ванна водородная", "bath", 20, 2400, ["g-bath"], { equipment: "Генератор водородной воды" }),
  p("bath-iodine", "Ванна йодобромная", "bath", 20, 2100, ["g-bath"], { caution: "С осторожностью при заболеваниях щитовидной железы" }),
  p("bath-cleopatra", "Ванна «Клеопатра»", "bath", 25, 2800, ["g-bath"]),
  p("bath-dry-co2", "Сухая углекислая ванна", "bath", 20, 2000, ["g-bath"], { equipment: "Установка сухих углекислых ванн" }),
  p("thalasso", "Талассотерапия", "bath", 30, 2600, ["g-bath"]),
  p("shower-charcot", "Душ Шарко", "shower", 10, 1500, ["g-shower"], { caution: "Не назначается при варикозной болезни" }),
  p("shower-circular", "Душ циркулярный", "shower", 10, 1200, ["g-shower"]),
  p("shower-vichy", "Душ Виши", "shower", 20, 2600, ["g-shower"]),
  p("shower-underwater", "Подводный душ-массаж", "shower", 20, 2400, ["g-shower"]),
  // Физиотерапия
  p("magnet", "Магнитотерапия", "physio", 15, 1300, ["g-physio-1"]),
  p("smt", "Амплипульстерапия (СМТ)", "physio", 15, 1300, ["g-physio-1"]),
  p("interference", "Интерференцтерапия", "physio", 15, 1300, ["g-physio-1"]),
  p("electrophoresis", "Электрофорез лекарственный", "physio", 15, 1200, ["g-physio-1"]),
  p("darsonval", "Дарсонвализация", "physio", 10, 1000, ["g-physio-1"]),
  p("diadynamic", "Диадинамотерапия", "physio", 15, 1200, ["g-physio-1"]),
  p("laser", "Лазеротерапия", "physio", 10, 1400, ["g-physio-2"]),
  p("turbotron", "Магнитотурботрон", "physio", 20, 2200, ["g-physio-2"]),
  p("pressotherapy", "Прессотерапия", "physio", 30, 2000, ["g-physio-2"], { caution: "Не назначается при тромбозе вен" }),
  p("electrosleep", "Электросон", "physio", 40, 1600, ["g-physio-2"]),
  // Массаж
  p("massage-classic", "Массаж классический общий", "massage", 60, 4500, ["g-massage"]),
  p("massage-collar", "Массаж воротниковой зоны", "massage", 20, 1800, ["g-massage"]),
  p("massage-back", "Массаж спины", "massage", 30, 2500, ["g-massage"]),
  p("massage-face", "Массаж лица", "massage", 30, 2500, ["g-massage"]),
  p("massage-stone", "Массаж камнями", "massage", 60, 5200, ["g-massage"]),
  p("massage-thai", "Тайский массаж", "massage", 60, 5500, ["g-massage"]),
  p("massage-anticell", "Антицеллюлитный массаж", "massage", 45, 3800, ["g-massage"]),
  p("lymph", "Лимфодренажный массаж", "massage", 45, 3800, ["g-massage"]),
  // Аюрведа
  p("abhyanga", "Абъянга", "ayurveda", 60, 6500, ["g-ayur"]),
  p("udvartana", "Удвартан", "ayurveda", 50, 6000, ["g-ayur"]),
  p("shirodhara", "Широдхара", "ayurveda", 45, 6800, ["g-ayur"]),
  p("pinda", "Пинда сведа", "ayurveda", 60, 6500, ["g-ayur"]),
  p("marma", "Марма-терапия", "ayurveda", 45, 5800, ["g-ayur"]),
  // Грязи, сауны, климат
  p("mud", "Грязевые аппликации", "mud", 20, 2000, ["g-mud"]),
  p("wrap", "Обёртывание водорослями", "mud", 40, 3200, ["g-mud"]),
  p("cedar", "Кедровая бочка (фитосауна)", "other", 15, 1500, ["g-float"]),
  p("floating", "Флоатинг", "other", 45, 4000, ["g-float"], { equipment: "Флоат-камера" }),
  p("dry-floating", "Сухой флоатинг", "other", 30, 2800, ["g-float"]),
  p("baro", "Барокамера", "climate", 40, 3000, ["g-climate"], { equipment: "Барокамера" }),
  p("hypoxy", "Гипокситерапия", "climate", 30, 1800, ["g-climate"]),
  p("speleo", "Спелеотерапия (соляная пещера)", "climate", 40, 1500, ["g-climate"]),
  p("cryosauna", "Криосауна", "climate", 5, 2500, ["g-climate"]),
  // Ингаляции и фитотерапия
  p("inhal-mineral", "Ингаляция с минеральной водой", "inhalation", 10, 800, ["g-inhal"]),
  p("inhal-h2", "Водородная ингаляция", "inhalation", 20, 1500, ["g-inhal"]),
  p("oxy-cocktail", "Кислородный коктейль", "inhalation", 5, 400, ["g-inhal"]),
  p("phyto", "Фитотерапия (травяной сбор)", "inhalation", 10, 300, ["g-inhal"]),
  // Процедурный кабинет
  p("ozone", "Озонотерапия", "injection", 30, 3500, ["g-proc"]),
  p("plasma", "Плазмаферез", "injection", 90, 12000, ["g-proc"]),
  p("carboxy", "Карбокситерапия", "injection", 20, 3500, ["g-proc"]),
  p("cryo-local", "Криотерапия локальная", "injection", 10, 1200, ["g-proc"]),
  p("colon", "Гидроколонотерапия", "injection", 45, 4500, ["g-proc"]),
  p("acupuncture", "Иглорефлексотерапия", "injection", 40, 3200, ["g-proc"]),
  p("manual", "Мануальная терапия", "injection", 30, 3500, ["g-proc"]),
  // Движение
  p("lfk", "ЛФК в группе", "fitness", 40, 900, ["g-lfk"]),
  p("kinesio", "Кинезиотерапия", "fitness", 45, 3200, ["g-lfk"]),
  p("terrenkur", "Терренкур по парку", "fitness", 60, 0, ["g-lfk"]),
  // Диагностика
  p("ecg", "ЭКГ", "diagnostics", 15, 1200, ["g-diag"]),
  p("us-abd", "УЗИ органов брюшной полости", "diagnostics", 30, 3200, ["g-diag"]),
  p("lab", "Забор крови на анализы", "diagnostics", 10, 600, ["g-diag"]),
];

/* ---------- Программы (путёвки) ---------- */

export const PROGRAMS: Program[] = [
  {
    id: "base", title: "Базовая путёвка", short: "Базовая",
    description: "Консультация и наблюдение терапевта и физиотерапевта, процедуры по назначению врача.",
    minNights: 7, pricePerNightRub: 3500,
    includes: ["Проживание и питание по диетстолу", "Приём терапевта и физиотерапевта", "Процедуры по назначению", "Бассейн и тренажёрный зал", "Терренкур"],
    typicalProcedureIds: ["bath-mineral", "magnet", "massage-collar", "inhal-mineral", "terrenkur", "lfk", "phyto", "shower-circular"],
  },
  {
    id: "detox", title: "DETOX", short: "DETOX",
    description: "Мягкое очищение организма, снижение веса и восстановление обмена веществ.",
    minNights: 10, pricePerNightRub: 9000,
    includes: ["Детокс-питание", "Приём диетолога", "Обёртывания и лимфодренаж", "Гидроколонотерапия"],
    typicalProcedureIds: ["wrap", "lymph", "colon", "pressotherapy", "cedar", "shower-vichy", "phyto", "terrenkur"],
  },
  {
    id: "antistress", title: "Антистресс", short: "Антистресс",
    description: "Восстановление сна, снятие напряжения и тревоги.",
    minNights: 7, pricePerNightRub: 6500,
    includes: ["Приём невролога и психотерапевта", "Аюрведические процедуры", "Флоатинг", "Электросон"],
    typicalProcedureIds: ["electrosleep", "floating", "shirodhara", "abhyanga", "bath-pearl", "massage-collar", "speleo", "oxy-cocktail"],
  },
  {
    id: "msk", title: "Опорно-двигательный аппарат", short: "Опорно-двигательный",
    description: "Лечение суставов и позвоночника: уменьшение боли, восстановление подвижности.",
    minNights: 10, pricePerNightRub: 6000,
    includes: ["Приём невролога", "Грязелечение", "Подводный душ-массаж", "Кинезиотерапия"],
    typicalProcedureIds: ["mud", "shower-underwater", "kinesio", "bath-bischofite", "smt", "laser", "massage-back", "manual"],
  },
  {
    id: "covid", title: "Восстановление после COVID-19", short: "После COVID-19",
    description: "Восстановление дыхания, выносливости и сил после перенесённой болезни.",
    minNights: 10, pricePerNightRub: 5500,
    includes: ["Приём терапевта и кардиолога", "Дыхательная гимнастика", "Барокамера", "Ингаляции"],
    typicalProcedureIds: ["baro", "inhal-h2", "hypoxy", "lfk", "speleo", "massage-classic", "oxy-cocktail", "bath-dry-co2"],
  },
  {
    id: "aqua", title: "Акваминеральное СПА", short: "Акваминеральное СПА",
    description: "Ванны, души и массажи на основе минеральной воды для отдыха и тонуса.",
    minNights: 5, pricePerNightRub: 7500,
    includes: ["Минеральные ванны", "Душ Виши", "Талассотерапия", "Массаж камнями"],
    typicalProcedureIds: ["bath-mineral", "bath-cleopatra", "thalasso", "shower-vichy", "massage-stone", "wrap", "bath-hydrogen"],
  },
  {
    id: "rest", title: "Проживание с питанием", short: "Без лечения",
    description: "Отдых без медицинской программы. Процедуры можно докупить отдельно.",
    minNights: 1, pricePerNightRub: 0,
    includes: ["Проживание", "Питание", "Бассейн и тренажёрный зал"],
    typicalProcedureIds: [],
  },
];

/* ---------- Питание ---------- */

export const DIET_TABLES: DietTable[] = [
  { id: "t15", title: "Стол №15 — общий", short: "№15", description: "Полноценное питание без особых ограничений." },
  { id: "t1", title: "Стол №1 — щадящий", short: "№1", description: "Бережное питание при болезнях желудка: без острого и жареного." },
  { id: "t5", title: "Стол №5 — печень", short: "№5", description: "Меньше жиров, без жареного, при болезнях печени и желчного пузыря." },
  { id: "t9", title: "Стол №9 — сахар", short: "№9", description: "Без сахара и быстрых углеводов, при диабете." },
  { id: "t10", title: "Стол №10 — сердце", short: "№10", description: "Меньше соли и жидкости, при болезнях сердца и сосудов." },
  { id: "t8", title: "Стол №8 — снижение веса", short: "№8", description: "Пониженная калорийность для снижения веса." },
];

const ALL = DIET_TABLES.map((t) => t.id);
const d = (id: string, title: string, meal: Dish["meal"], tableIds: string[], kcal: number): Dish => ({ id, title, meal, tableIds, kcal });

export const DISHES: Dish[] = [
  d("oat", "Овсяная каша на воде с ягодами", "breakfast", ALL, 280),
  d("buckwheat-milk", "Гречневая каша на молоке", "breakfast", ["t15", "t1", "t5", "t10"], 320),
  d("omelet", "Омлет на пару", "breakfast", ALL, 240),
  d("cottage", "Творожная запеканка без сахара", "breakfast", ["t15", "t1", "t5", "t9", "t10"], 260),
  d("syrniki", "Сырники со сметаной", "breakfast", ["t15"], 420),
  d("yogurt", "Натуральный йогурт с отрубями", "breakfast", ["t15", "t5", "t9", "t10", "t8"], 150),
  d("soup-veg", "Суп-пюре из кабачков", "lunch", ALL, 160),
  d("borsch", "Борщ постный", "lunch", ["t15", "t9", "t10", "t8"], 190),
  d("soup-chicken", "Куриный суп с домашней лапшой", "lunch", ["t15", "t1", "t5"], 230),
  d("turkey", "Филе индейки на пару с овощами", "lunch", ALL, 340),
  d("fish-baked", "Судак, запечённый с травами", "lunch", ALL, 300),
  d("beef-stroganoff", "Бефстроганов с пюре", "lunch", ["t15"], 560),
  d("salad-greek", "Салат из свежих овощей", "lunch", ["t15", "t9", "t10", "t8"], 120),
  d("vinaigrette", "Винегрет", "lunch", ["t15", "t5", "t10"], 180),
  d("cutlet-steam", "Паровые котлеты из телятины с гречкой", "dinner", ALL, 420),
  d("cod", "Треска на пару с брокколи", "dinner", ALL, 260),
  d("chicken-zucchini", "Курица с кабачками в сливочном соусе", "dinner", ["t15", "t10"], 480),
  d("pumpkin", "Тыква, запечённая с творогом", "dinner", ["t15", "t1", "t5", "t8"], 240),
  d("lentil", "Чечевица с тушёными овощами", "dinner", ["t15", "t9", "t10", "t8"], 310),
  d("kefir", "Кефир 1%", "dinner", ALL, 80),
];

/* ---------- МКБ-10 (фрагмент справочника для демо-поиска) ---------- */

export const ICD10: Diagnosis[] = [
  { code: "I10", title: "Эссенциальная (первичная) гипертензия" },
  { code: "I11.9", title: "Гипертензивная болезнь с поражением сердца без сердечной недостаточности" },
  { code: "I25.1", title: "Атеросклеротическая болезнь сердца" },
  { code: "I67.2", title: "Церебральный атеросклероз" },
  { code: "I83.9", title: "Варикозное расширение вен нижних конечностей" },
  { code: "M42.1", title: "Остеохондроз позвоночника у взрослых" },
  { code: "M47.8", title: "Другой спондилёз" },
  { code: "M54.2", title: "Цервикалгия (боль в шее)" },
  { code: "M54.5", title: "Боль внизу спины" },
  { code: "M17.0", title: "Первичный гонартроз двусторонний" },
  { code: "M16.1", title: "Первичный коксартроз" },
  { code: "M79.1", title: "Миалгия" },
  { code: "M75.1", title: "Синдром сдавления ротатора плеча" },
  { code: "M81.0", title: "Постменопаузный остеопороз" },
  { code: "G47.0", title: "Нарушения засыпания и поддержания сна (бессонница)" },
  { code: "G44.2", title: "Головная боль напряжённого типа" },
  { code: "G43.9", title: "Мигрень неуточнённая" },
  { code: "G90.8", title: "Другие расстройства вегетативной нервной системы" },
  { code: "F43.2", title: "Расстройство приспособительных реакций" },
  { code: "F48.0", title: "Неврастения" },
  { code: "F41.2", title: "Смешанное тревожное и депрессивное расстройство" },
  { code: "K29.5", title: "Хронический гастрит неуточнённый" },
  { code: "K21.9", title: "Гастроэзофагеальный рефлюкс без эзофагита" },
  { code: "K58.9", title: "Синдром раздражённого кишечника без диареи" },
  { code: "K76.0", title: "Жировая дегенерация печени" },
  { code: "K81.1", title: "Хронический холецистит" },
  { code: "K86.1", title: "Другие хронические панкреатиты" },
  { code: "E11.9", title: "Сахарный диабет 2 типа без осложнений" },
  { code: "E66.0", title: "Ожирение, обусловленное избыточным поступлением энергетических ресурсов" },
  { code: "E03.9", title: "Гипотиреоз неуточнённый" },
  { code: "E78.0", title: "Чистая гиперхолестеринемия" },
  { code: "J31.0", title: "Хронический ринит" },
  { code: "J32.9", title: "Хронический синусит неуточнённый" },
  { code: "J42", title: "Хронический бронхит неуточнённый" },
  { code: "J44.9", title: "Хроническая обструктивная лёгочная болезнь неуточнённая" },
  { code: "J45.0", title: "Астма с преобладанием аллергического компонента" },
  { code: "U09.9", title: "Состояние после COVID-19 неуточнённое" },
  { code: "N95.1", title: "Менопаузное и климактерическое состояние у женщин" },
  { code: "N76.1", title: "Подострый и хронический вагинит" },
  { code: "L70.0", title: "Угри обыкновенные" },
  { code: "L57.4", title: "Старческая атрофия (вялость) кожи" },
  { code: "R53", title: "Недомогание и утомляемость" },
  { code: "Z73.0", title: "Переутомление" },
  { code: "Z54.8", title: "Период выздоровления после другого лечения" },
  { code: "Z00.0", title: "Общий медицинский осмотр" },
];
