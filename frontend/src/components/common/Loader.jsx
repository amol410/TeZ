export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 relative">
          <div className="absolute inset-0 rounded-full border-4 border-dolphin-500/20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-dolphin-500 animate-spin"></div>
          <div className="absolute inset-3 rounded-full bg-dolphin-500/10 flex items-center justify-center">
            <span className="text-lg">🐬</span>
          </div>
        </div>
        <p className="text-gray-500 text-sm animate-pulse">Loading...</p>
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="glass-card p-5 space-y-3 animate-pulse">
      <div className="skeleton h-4 rounded w-3/4"></div>
      <div className="skeleton h-3 rounded w-full"></div>
      <div className="skeleton h-3 rounded w-5/6"></div>
      <div className="flex gap-2 mt-4">
        <div className="skeleton h-5 rounded-full w-16"></div>
        <div className="skeleton h-5 rounded-full w-12"></div>
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export default function Loader() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-2 border-white/10 border-t-dolphin-500 rounded-full animate-spin"></div>
    </div>
  );
}
