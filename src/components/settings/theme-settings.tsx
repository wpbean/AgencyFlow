"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export function ThemeSettings() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration-safe mount flag
  useEffect(() => setMounted(true), []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Appearance</CardTitle>
        <CardDescription>Choose how {"the app"} looks on this device.</CardDescription>
      </CardHeader>
      <CardContent className="flex gap-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setTheme(opt.value)}
            className={cn(
              "flex flex-1 flex-col items-center gap-2 rounded-md border p-4 text-sm transition-colors hover:bg-accent",
              mounted && theme === opt.value ? "border-primary/50 bg-primary/5 text-primary" : "text-muted-foreground"
            )}
          >
            <opt.icon className="size-5" />
            {opt.label}
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
