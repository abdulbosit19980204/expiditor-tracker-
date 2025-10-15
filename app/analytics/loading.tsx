import { LoadingSpinner } from "@/components/loading-spinner"

export default function AnalyticsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="py-20 flex flex-col items-center justify-center gap-4">
          <LoadingSpinner size="lg" />
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Loading Analytics</h2>
            <p className="text-gray-600 dark:text-gray-400">Preparing your analytics dashboard...</p>
          </div>
        </div>
      </div>
    </div>
  )
}
