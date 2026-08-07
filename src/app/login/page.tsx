import { LoginForm } from "./login-form";
import { getSettings } from "@/lib/settings";
import { Zap } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const settings = await getSettings();

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Zap className="size-5" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight">{settings.appName}</h1>
          <p className="text-sm text-muted-foreground">Sign in to access your workspace.</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
