export const FineTuneButton = ({
  currentView,
  setCurrentView
}: {
  currentView: string
  setCurrentView: (view: string) => void
}) => {
  return (
    <div className="relative group">
      <button
        onClick={() => setCurrentView(currentView === 'fine-tuning' ? 'chat' : 'fine-tuning')}
        className={`p-1 rounded-md ${
          currentView === 'fine-tuning' ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      </button>
      <span className="absolute left-1/2 transform -translate-x-1/2 bottom-full -mb-16 mr-3 opacity-0 transition-opacity group-hover:opacity-100 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
        Learn
      </span>
    </div>
  )
}
