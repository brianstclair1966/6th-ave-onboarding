export default function ProgressIndicator({ current, total }) {
  const percentage = (current / total) * 100

  return (
    <div className="bg-white border-b border-gray-200 py-4">
      <div className="max-w-2xl mx-auto px-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-brand-navy">
            Step {current} of {total}
          </span>
          <span className="text-xs text-brand-taupe">
            {percentage.toFixed(0)}%
          </span>
        </div>
        <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-coral transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  )
}
