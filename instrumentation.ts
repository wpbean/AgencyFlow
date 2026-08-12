const TICK_INTERVAL_MS = 5 * 60 * 1000;

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { runSchedulerTick } = await import("@/lib/campaigns/scheduler");

  const tick = () => {
    runSchedulerTick().catch((err) => console.error("[campaign-scheduler] tick failed:", err));
  };

  tick();
  setInterval(tick, TICK_INTERVAL_MS);
}
