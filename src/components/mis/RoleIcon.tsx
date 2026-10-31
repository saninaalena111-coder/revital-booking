import {
  BarChart3, CalendarRange, ConciergeBell, Megaphone, ShieldCheck, Stethoscope, Syringe, UtensilsCrossed,
  type LucideProps,
} from "lucide-react";
import type { Role } from "@/config/roles";

const ICONS = {
  stethoscope: Stethoscope,
  syringe: Syringe,
  concierge: ConciergeBell,
  calendar: CalendarRange,
  utensils: UtensilsCrossed,
  chart: BarChart3,
  megaphone: Megaphone,
  shield: ShieldCheck,
} satisfies Record<Role["icon"], unknown>;

export function RoleIcon({ icon, ...props }: { icon: Role["icon"] } & LucideProps) {
  const Icon = ICONS[icon];
  return <Icon strokeWidth={1.5} {...props} />;
}
