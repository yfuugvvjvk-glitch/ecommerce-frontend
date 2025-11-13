export default function FormSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {/* Form field skeleton */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i}>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>
      ))}
      
      {/* Button skeleton */}
      <div className="flex gap-2 pt-4">
        <div className="h-10 bg-gray-300 rounded w-24"></div>
        <div className="h-10 bg-gray-200 rounded w-24"></div>
      </div>
    </div>
  );
}
