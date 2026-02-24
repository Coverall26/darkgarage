/**
 * CRM page loading skeleton.
 * Shows pipeline stages + contact table skeleton.
 */
export default function CRMLoading() {
  return (
    <div className="p-6 space-y-6 max-w-[1440px] mx-auto">
      <div className="flex items-center justify-between">
        <div className="h-8 w-24 bg-gray-800 rounded animate-pulse" />
        <div className="flex gap-2">
          <div className="h-10 w-28 bg-gray-800 rounded animate-pulse" />
          <div className="h-10 w-10 bg-gray-800 rounded animate-pulse" />
        </div>
      </div>
      {/* Pipeline tabs */}
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-9 w-28 bg-gray-800 rounded animate-pulse" />
        ))}
      </div>
      {/* Search + filter */}
      <div className="flex gap-3">
        <div className="h-10 flex-1 max-w-sm bg-gray-800/50 rounded-md border border-gray-700 animate-pulse" />
        <div className="h-10 w-28 bg-gray-800/50 rounded-md border border-gray-700 animate-pulse" />
      </div>
      {/* Contact table */}
      <div className="border border-gray-700 rounded-lg overflow-hidden">
        <div className="h-10 bg-gray-800/60 animate-pulse" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-14 border-t border-gray-700/50 flex items-center px-4 gap-4">
            <div className="h-4 w-4 bg-gray-800 rounded animate-pulse" />
            <div className="h-4 w-32 bg-gray-800 rounded animate-pulse" />
            <div className="h-4 w-40 bg-gray-800/60 rounded animate-pulse" />
            <div className="flex-1" />
            <div className="h-6 w-20 bg-gray-800 rounded-full animate-pulse" />
            <div className="h-4 w-16 bg-gray-800/60 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
