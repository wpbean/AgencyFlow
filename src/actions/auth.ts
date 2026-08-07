"use server";

import { redirect } from "next/navigation";
import { loginSchema } from "@/lib/validation";
import { createSession, destroySession, verifyPassword } from "@/lib/auth";

export type LoginState = { error?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({ password: formData.get("password") });
  if (!parsed.success) {
    return { error: "Password is required." };
  }

  let valid: boolean;
  try {
    valid = verifyPassword(parsed.data.password);
  } catch {
    return { error: "Server is not configured correctly. Set APP_PASSWORD." };
  }

  if (!valid) {
    return { error: "Incorrect password." };
  }

  await createSession();
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
