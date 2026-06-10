import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const ADMIN_COOKIE = "fahs_admin";
export const LINK_COOKIE_PREFIX = "fahs_link_";

export async function isAdmin() {
  const store = await cookies();
  return store.get(ADMIN_COOKIE)?.value === "1";
}

export async function verifyAdminPassword(password: string) {
  const setting = await prisma.systemSetting.findUnique({ where: { key: "adminPasswordHash" } });
  return setting ? bcrypt.compare(password, setting.value) : password === (process.env.ADMIN_PASSWORD ?? "123456");
}

export async function setAdminCookie() {
  const store = await cookies();
  store.set(ADMIN_COOKIE, "1", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 8 });
}

export async function clearAdminCookie() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}

export async function setLinkCookie(token: string) {
  const store = await cookies();
  store.set(`${LINK_COOKIE_PREFIX}${token}`, "1", { httpOnly: true, sameSite: "lax", path: `/w/${token}`, maxAge: 60 * 60 * 24 * 7 });
}

export async function hasLinkCookie(token: string) {
  const store = await cookies();
  return store.get(`${LINK_COOKIE_PREFIX}${token}`)?.value === "1";
}
