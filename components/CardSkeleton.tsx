export default function CardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-gray-200 h-48 rounded-t-lg"></div>
          <div className="bg-white p-4 rounded-b-lg shadow">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6 mb-4"></div>
            <div className="flex justify-between items-center">
              <div className="h-6 bg-gray-300 rounded w-20"></div>
              <div className="h-8 bg-gray-300 rounded w-24"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
