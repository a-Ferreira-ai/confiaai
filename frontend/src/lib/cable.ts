import { createConsumer, type Consumer, type Subscription } from "@rails/actioncable";
import type { ReportBroadcast } from "./types";

let consumer: Consumer | null = null;

export function getCableConsumer(): Consumer {
  if (!consumer) {
    consumer = createConsumer("/cable");
  }
  return consumer;
}

type ReportCallback = (payload: ReportBroadcast) => void;

let reportsSubscription: Subscription | null = null;
const listeners = new Set<ReportCallback>();

function ensureReportsSubscription(): Subscription {
  if (reportsSubscription) return reportsSubscription;

  reportsSubscription = getCableConsumer().subscriptions.create(
    { channel: "ReportsChannel" },
    {
      received(data: ReportBroadcast) {
        if (data.event !== "report_created") return;
        listeners.forEach((listener) => listener(data));
      },
    },
  );

  return reportsSubscription;
}

export function subscribeToReports(callback: ReportCallback): () => void {
  ensureReportsSubscription();
  listeners.add(callback);

  return () => {
    listeners.delete(callback);
    if (listeners.size === 0 && reportsSubscription) {
      reportsSubscription.unsubscribe();
      reportsSubscription = null;
    }
  };
}
