export default function TableSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Desktop table skeleton */}
      <div className="hidden md:block">
        <div className="bg-gray-200 h-12 rounded-t-lg mb-2"></div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-gray-100 h-16 mb-2 rounded"></div>
        ))}
      </div>

      {/* Mobile cards skeleton */}
      <div className="md:hidden space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white p-4 rounded-lg shadow">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
