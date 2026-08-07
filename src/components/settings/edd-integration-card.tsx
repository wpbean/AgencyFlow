"use client";

import { useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Save, Plug, RefreshCw, Unplug, CheckCircle2, XCircle } from "lucide-react";
import {
  saveEddSettingsAction,
  testEddConnectionAction,
  startEddSyncAction,
  getEddSyncStatusAction,
  disconnectEddAction,
  type EddIntegrationView,
} from "@/actions/edd";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function subscribeNever() {
  return () => {};
}

// Formats client-side only — new Date(...).toLocaleString() depends on the runtime's
// locale/timezone, which can differ between the server and the browser and would otherwise
// produce a hydration mismatch. getServerSnapshot returns null so SSR/first paint agree,
// then the real client value takes over right after hydration.
function useFormattedDate(date: Date | null): string | null {
  return useSyncExternalStore(
    subscribeNever,
    () => (date ? new Date(date).toLocaleString() : null),
    () => null
  );
}

const EMPTY_INTEGRATION: EddIntegrationView = {
  siteUrl: null,
  connected: false,
  syncStatus: "idle",
  syncError: null,
  lastSyncedAt: null,
  lastSyncStats: null,
  lastSyncDebug: null,
  hasCredentials: false,
};

export function EddIntegrationCard({ integration: initial }: { integration: EddIntegrationView }) {
  const [integration, setIntegration] = useState(initial);
  const [savePending, startSave] = useTransition();
  const [testPending, startTest] = useTransition();
  const [syncPending, startSyncStart] = useTransition();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSyncedLabel = useFormattedDate(integration.lastSyncedAt);

  useEffect(() => {
    if (integration.syncStatus === "syncing" && !pollRef.current) {
      pollRef.current = setInterval(async () => {
        const next = await getEddSyncStatusAction();
        setIntegration(next);
        if (next.syncStatus !== "syncing" && pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      }, 3000);
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [integration.syncStatus]);

  function handleSave(formData: FormData) {
    startSave(async () => {
      try {
        const next = await saveEddSettingsAction(formData);
        setIntegration(next);
        toast.success("Easy Digital Downloads settings saved. Test the connection next.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save settings.");
      }
    });
  }

  function handleTest() {
    startTest(async () => {
      try {
        const next = await testEddConnectionAction();
        setIntegration(next);
        toast.success("Connected to Easy Digital Downloads.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Connection failed.");
      }
    });
  }

  function handleSync() {
    startSyncStart(async () => {
      try {
        const next = await startEddSyncAction();
        setIntegration(next);
        toast.success("Sync started — this can take a few minutes for large customer lists.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to start sync.");
      }
    });
  }

  function handleDisconnect() {
    startSave(async () => {
      await disconnectEddAction();
      setIntegration(EMPTY_INTEGRATION);
      toast.success("Disconnected Easy Digital Downloads.");
    });
  }

  const syncing = integration.syncStatus === "syncing";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">Easy Digital Downloads</CardTitle>
            <CardDescription>
              Sync EDD customers from your WordPress site so you can filter them by product purchased.
            </CardDescription>
          </div>
          {integration.connected ? (
            <Badge variant="outline" className="gap-1 border-success/20 bg-success/15 text-success">
              <CheckCircle2 className="size-3" /> Connected
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 text-muted-foreground">
              <XCircle className="size-3" /> Not connected
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form action={handleSave} className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="siteUrl">Site URL</Label>
            <Input id="siteUrl" name="siteUrl" placeholder="https://wpbean.com" defaultValue={integration.siteUrl ?? ""} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="apiKey">API Key</Label>
            <Input id="apiKey" name="apiKey" placeholder={integration.hasCredentials ? "Saved — enter to change" : "Public key"} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="apiToken">Token</Label>
            <Input
              id="apiToken"
              name="apiToken"
              type="password"
              placeholder={integration.hasCredentials ? "Saved — enter to change" : "Secret token"}
              required
            />
          </div>
          <p className="text-xs text-muted-foreground sm:col-span-2">
            Generate a key/token pair in wp-admin under Downloads → Settings → API Keys.
          </p>
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <Button type="submit" size="sm" disabled={savePending} className="gap-1.5">
              {savePending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTest}
              disabled={testPending || !integration.siteUrl}
              className="gap-1.5"
            >
              {testPending ? <Loader2 className="size-4 animate-spin" /> : <Plug className="size-4" />}
              Test Connection
            </Button>
            {integration.siteUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDisconnect}
                disabled={savePending}
                className="gap-1.5 text-muted-foreground"
              >
                <Unplug className="size-4" /> Disconnect
              </Button>
            )}
          </div>
        </form>

        <div className="flex flex-col gap-2 rounded-lg border p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm">
              {syncing && (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" /> Syncing customers…
                </span>
              )}
              {!syncing && integration.syncStatus === "success" && integration.lastSyncStats && (
                <span className="text-muted-foreground">
                  Last synced {lastSyncedLabel ?? "…"} — {integration.lastSyncStats.customers} customers,{" "}
                  {integration.lastSyncStats.products} products, {integration.lastSyncStats.orders} orders.
                </span>
              )}
              {!syncing && integration.syncStatus === "error" && (
                <span className="text-danger">{integration.syncError || "Sync failed."}</span>
              )}
              {!syncing && integration.syncStatus === "idle" && <span className="text-muted-foreground">Not synced yet.</span>}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleSync}
              disabled={syncPending || syncing || !integration.connected}
              className="gap-1.5"
            >
              {syncing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
              Sync Now
            </Button>
          </div>
          {(integration.lastSyncDebug?.customersSample || integration.lastSyncDebug?.salesSample) && (
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground">Raw API response (debug)</summary>
              <div className="mt-2 flex flex-col gap-2">
                {integration.lastSyncDebug.customersSample && (
                  <div>
                    <p className="mb-1 text-muted-foreground">/customers (page 1)</p>
                    <pre className="max-h-40 overflow-auto rounded bg-muted p-2 whitespace-pre-wrap">
                      {integration.lastSyncDebug.customersSample}
                    </pre>
                  </div>
                )}
                {integration.lastSyncDebug.salesSample && (
                  <div>
                    <p className="mb-1 text-muted-foreground">/sales (page 1)</p>
                    <pre className="max-h-40 overflow-auto rounded bg-muted p-2 whitespace-pre-wrap">
                      {integration.lastSyncDebug.salesSample}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
