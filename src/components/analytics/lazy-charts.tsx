"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

function ChartSkeleton() {
  return <Skeleton className="h-[220px] w-full" />;
}

export const LazyBarChart = dynamic(() => import("./simple-bar-chart").then((m) => m.SimpleBarChart), {
  ssr: false,
  loading: ChartSkeleton,
});

export const LazyLineChart = dynamic(() => import("./simple-line-chart").then((m) => m.SimpleLineChart), {
  ssr: false,
  loading: ChartSkeleton,
});

export const LazyCampaignEventsChart = dynamic(() => import("./campaign-events-chart").then((m) => m.CampaignEventsChart), {
  ssr: false,
  loading: ChartSkeleton,
});
