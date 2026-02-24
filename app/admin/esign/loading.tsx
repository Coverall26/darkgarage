/**
 * E-Signature dashboard loading skeleton.
 * Shows envelope list + stats cards skeleton.
 */
export default function EsignLoading() {
  return (
    <div className="p-6 space-y-6 max-w-[1440px] mx-auto">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-gray-800 rounded animate-pulse" />
        <div className="h-10 w-40 bg-gray-800 rounded animate-pulse" />
      </div>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-gray-800/30 border border-gray-700 rounded-lg animate-pulse" />
        ))}
      </div>
      {/* Envelope list */}
      <div className="border border-gray-700 rounded-lg overflow-hidden">
        <div className="h-10 bg-gray-800/60 animate-pulse" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 border-t border-gray-700/50 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
