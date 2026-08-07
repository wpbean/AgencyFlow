"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { updateSettingsAction } from "@/actions/settings";
import type { AppSettings } from "@/lib/settings";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function SettingsForm({ settings }: { settings: AppSettings }) {
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await updateSettingsAction(formData);
      toast.success("Settings saved.");
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">General</CardTitle>
          <CardDescription>Application-wide defaults.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="appName">Application Name</Label>
            <Input id="appName" name="appName" defaultValue={settings.appName} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="defaultCurrency">Default Currency</Label>
            <Input id="defaultCurrency" name="defaultCurrency" defaultValue={settings.defaultCurrency} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="defaultCountry">Default Country</Label>
            <Input id="defaultCountry" name="defaultCountry" defaultValue={settings.defaultCountry} placeholder="Germany" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Follow-up Intervals</CardTitle>
          <CardDescription>Days after the previous email before the next follow-up is scheduled.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="followUp1Days">Follow-up #1 (days)</Label>
            <Input id="followUp1Days" name="followUp1Days" type="number" min={1} defaultValue={settings.followUp1Days} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="followUp2Days">Follow-up #2 (days)</Label>
            <Input id="followUp2Days" name="followUp2Days" type="number" min={1} defaultValue={settings.followUp2Days} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="finalFollowUpDays">Final Follow-up (days)</Label>
            <Input id="finalFollowUpDays" name="finalFollowUpDays" type="number" min={1} defaultValue={settings.finalFollowUpDays} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lead Scoring Rules</CardTitle>
          <CardDescription>Points awarded when an agency matches each signal (0-100 total).</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <ScoreField label="WordPress" name="wordpress" defaultValue={settings.scoringWeights.wordpress} />
          <ScoreField label="WooCommerce" name="woocommerce" defaultValue={settings.scoringWeights.woocommerce} />
          <ScoreField label="Small/Medium Agency" name="smallMediumAgency" defaultValue={settings.scoringWeights.smallMediumAgency} />
          <ScoreField label="Hiring Developers" name="hiring" defaultValue={settings.scoringWeights.hiring} />
          <ScoreField label="Remote Friendly" name="remoteFriendly" defaultValue={settings.scoringWeights.remoteFriendly} />
          <ScoreField label="Specialty Tech" name="specialtyTech" defaultValue={settings.scoringWeights.specialtyTech} />
        </CardContent>
      </Card>

      <Separator />
      <div className="flex justify-end">
        <Button type="submit" disabled={pending} className="gap-1.5">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save Settings
        </Button>
      </div>
    </form>
  );
}

function ScoreField({ label, name, defaultValue }: { label: string; name: string; defaultValue: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type="number" min={0} max={100} defaultValue={defaultValue} />
    </div>
  );
}
