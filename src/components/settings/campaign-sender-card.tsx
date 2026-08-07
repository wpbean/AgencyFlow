"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { updateCampaignSenderSettingsAction } from "@/actions/settings";
import type { AppSettings } from "@/lib/settings";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function CampaignSenderCard({ settings }: { settings: AppSettings }) {
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateCampaignSenderSettingsAction(undefined, formData);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Campaign sender settings saved.");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Campaign Sending</CardTitle>
        <CardDescription>
          Default From address for Campaigns, sent via Resend. The From email must be on a domain verified in your
          Resend account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="campaignFromName">From Name</Label>
            <Input id="campaignFromName" name="campaignFromName" defaultValue={settings.campaignFromName} placeholder="Your Company" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="campaignFromEmail">From Email</Label>
            <Input
              id="campaignFromEmail"
              name="campaignFromEmail"
              type="email"
              defaultValue={settings.campaignFromEmail}
              placeholder="offers@yourdomain.com"
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="campaignReplyTo">Reply-To (optional)</Label>
            <Input
              id="campaignReplyTo"
              name="campaignReplyTo"
              type="email"
              defaultValue={settings.campaignReplyTo}
              placeholder="Leave blank to reply to the From address"
            />
            <p className="text-xs text-muted-foreground">
              Replies sent here land in the <strong>Inbox</strong> and are matched to the right campaign automatically —
              no need for a different reply-to per campaign.
            </p>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" size="sm" disabled={pending} className="gap-1.5">
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
