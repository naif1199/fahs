import { redirect } from "next/navigation";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import { AdminLoginHero } from "@/components/admin-login-hero";
import { isAdmin } from "@/lib/auth";

const saudiIdentityFont = IBM_Plex_Sans_Arabic({ subsets: ["arabic", "latin"], weight: ["400", "500", "600", "700"], display: "swap" });

export default async function HomePage() {
  if (await isAdmin()) redirect("/admin");
  return <AdminLoginHero className={saudiIdentityFont.className} />;
}
