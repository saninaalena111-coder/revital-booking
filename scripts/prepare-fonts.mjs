/**
 * Готовит подключение фирменного шрифта перед запуском и сборкой.
 *
 * Myriad Pro лицензионный и не хранится в репозитории (папка src/fonts/ в .gitignore).
 * Если файлы шрифта лежат локально — подключаем их через next/font/local.
 * Если нет — создаём заглушку, и сайт собирается на системном шрифте
 * (запасной стек задан в globals.css).
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "fonts");
const FILES = [
  ["MyriadPro-Light.otf", "300"],
  ["MyriadPro-Regular.otf", "400"],
  ["MyriadPro-SemiBold.otf", "600"],
  ["MyriadPro-Bold.otf", "700"],
];

mkdirSync(dir, { recursive: true });
const present = FILES.every(([f]) => existsSync(join(dir, f)));

const header = "// Файл создаётся скриптом scripts/prepare-fonts.mjs — не редактируйте вручную.\n";
const body = present
  ? `import localFont from "next/font/local";

export const brandFont = localFont({
  variable: "--font-myriad",
  display: "swap",
  src: [
${FILES.map(([f, w]) => `    { path: "./${f}", weight: "${w}", style: "normal" },`).join("\n")}
  ],
});
`
  : `/** Файлов Myriad Pro нет — используется системный шрифт */
export const brandFont = { variable: "" };
`;

writeFileSync(join(dir, "index.ts"), header + body);
console.log(present ? "Шрифт Myriad Pro подключён" : "Myriad Pro не найден — сборка на системном шрифте");
