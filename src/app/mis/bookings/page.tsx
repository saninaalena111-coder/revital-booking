import type { Metadata } from "next";
import { Bookings } from "@/components/mis/stays/Bookings";

export const metadata: Metadata = { title: "Брони и путёвки — МИС Ревиталь" };

export default function Page() {
  return <Bookings />;
}
