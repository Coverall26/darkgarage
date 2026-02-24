import { Suspense } from "react";
import ESignPageClient from "./page-client";

export default function ESignPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 space-y-4">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-10 w-full bg-muted animate-pulse rounded" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 w-full bg-muted animate-pulse rounded" />
            ))}
          </div>
        </div>
      }
    >
      <ESignPageClient />
    </Suspense>
  );
}
