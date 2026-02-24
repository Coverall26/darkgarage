import type {
  AnalyticsProvider,
  AnalyticsProviderConfig,
  AnalyticsEvent,
  AnalyticsQuery,
  AnalyticsQueryResult,
} from "./types";

export class PostHogAnalyticsProvider implements AnalyticsProvider {
  readonly name = "PostHog";
  readonly type = "posthog" as const;
  private config: AnalyticsProviderConfig;

  constructor(config?: Partial<AnalyticsProviderConfig>) {
    this.config = {
      provider: "posthog",
      apiKey:
        config?.apiKey ||
        process.env.POSTHOG_SERVER_KEY ||
        process.env.NEXT_PUBLIC_POSTHOG_KEY,
      host:
        config?.host ||
        process.env.POSTHOG_HOST ||
        "https://us.i.posthog.com",
    };
  }

  isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  private getHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.config.apiKey}`,
      "Content-Type": "application/json",
    };
  }

  async track(event: AnalyticsEvent): Promise<void> {
    if (!this.isConfigured()) {
      console.warn("PostHog is not configured, skipping event tracking");
      return;
    }

    const url = `${this.config.host}/capture/`;

    const payload = {
      api_key: this.config.apiKey,
      event: event.name,
      distinct_id: event.distinctId || "anonymous",
      timestamp: (event.timestamp || new Date()).toISOString(),
      properties: event.properties || {},
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error("PostHog track error:", await response.text());
      }
    } catch (error) {
      console.error("PostHog track error:", error);
    }
  }

  async trackBatch(events: AnalyticsEvent[]): Promise<void> {
    if (!this.isConfigured()) {
      console.warn(
        "PostHog is not configured, skipping batch event tracking",
      );
      return;
    }

    const url = `${this.config.host}/batch/`;

    const batch = events.map((event) => ({
      event: event.name,
      distinct_id: event.distinctId || "anonymous",
      timestamp: (event.timestamp || new Date()).toISOString(),
      properties: event.properties || {},
    }));

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: this.config.apiKey,
          batch,
        }),
      });

      if (!response.ok) {
        console.error("PostHog batch track error:", await response.text());
      }
    } catch (error) {
      console.error("PostHog batch track error:", error);
    }
  }

  async query(query: AnalyticsQuery): Promise<AnalyticsQueryResult> {
    if (!this.isConfigured()) {
      throw new Error("PostHog is not configured");
    }

    // PostHog query API is not used for analytics queries.
    // Analytics queries use Prisma DB queries directly (see lib/tracking/postgres-stats.ts).
    console.warn(
      `PostHog query for "${query.endpoint}" — use Prisma DB queries instead`,
    );
    return { data: [], meta: { columns: [], rows: 0 } };
  }

  async identify(
    distinctId: string,
    properties: Record<string, unknown>,
  ): Promise<void> {
    if (!this.isConfigured()) return;

    const url = `${this.config.host}/capture/`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: this.config.apiKey,
          event: "$identify",
          distinct_id: distinctId,
          properties: { $set: properties },
        }),
      });

      if (!response.ok) {
        console.error("PostHog identify error:", await response.text());
      }
    } catch (error) {
      console.error("PostHog identify error:", error);
    }
  }
}
