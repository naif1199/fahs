import { redirect } from "next/navigation";
import { Inter } from "next/font/google";
import { AdminLoginHero } from "@/components/admin-login-hero";
import { isAdmin } from "@/lib/auth";

const inter = Inter({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], display: "swap" });

export default async function HomePage() {
  if (await isAdmin()) redirect("/admin");
  return <AdminLoginHero className={inter.className} />;
}
