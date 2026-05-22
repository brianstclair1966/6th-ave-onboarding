export default function ProgressIndicator({ current, total }) {
  const percentage = (current / total) * 100

  return (
    <div className="sticky top-40 z-30 bg-white border-b border-gray-100 py-3">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-xs font-bold text-brand-taupe uppercase tracking-widest">
              PROGRESS
            </span>
            <p className="text-lg font-semibold text-brand-navy mt-1">
              Page {current} of {total}
            </p>
          </div>
          <span className="text-2xl font-bold text-brand-coral">
            {percentage.toFixed(0)}%
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-coral to-brand-navy transition-all duration-500 rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  )
}
