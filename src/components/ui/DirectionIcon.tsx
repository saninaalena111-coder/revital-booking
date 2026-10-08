import { Brain, Flower2, Leaf, ScanLine, Sparkles, Stethoscope, Waves, type LucideProps } from "lucide-react";

const map = { stethoscope: Stethoscope, flower: Flower2, brain: Brain, sparkles: Sparkles, waves: Waves, leaf: Leaf, scan: ScanLine };

export function DirectionIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = map[name as keyof typeof map] ?? Stethoscope;
  return <Icon strokeWidth={1.4} {...props} />;
}
