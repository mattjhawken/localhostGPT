export const FineTuningView = () => (
  <div className="py-5 px-3 text-white">
    <h2 className="text-2xl font-bold mb-4">Fine-Tuning Models</h2>

    <div className="bg-gray-800 rounded-lg p-4 mb-6">
      <div className="font-medium mb-2">What is fine-tuning?</div>
      <p className="text-sm text-white/70 mb-3">
        Fine-tuning allows you to customize the model's behavior based on your specific needs and
        conversation history. This process can improve response quality for your unique use cases.
      </p>
      <div className="font-medium mb-2">Benefits:</div>
      <ul className="text-sm text-white/70 list-disc pl-5 space-y-1">
        <li>More consistent response style</li>
        <li>Better understanding of domain-specific terminology</li>
        <li>Improved formatting based on your preferences</li>
        <li>Enhanced ability to follow your specific instructions</li>
      </ul>
    </div>

    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Training Data</h3>
        <div className="bg-gray-800 rounded-lg p-4 space-y-4">
          <div className="flex items-center">
            <input type="checkbox" id="use-chat-history" className="mr-2" defaultChecked />
            <label htmlFor="use-chat-history">Use chat history as training data</label>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <label className="text-sm text-white/70">Select chats to include</label>
              <button className="text-xs text-blue-400 hover:text-blue-300">Select All</button>
            </div>
            <div className="max-h-40 overflow-y-auto bg-gray-700 rounded-md p-2 text-sm space-y-1">
              <div className="flex items-center">
                <input type="checkbox" id="chat-1" className="mr-2" defaultChecked />
                <label htmlFor="chat-1">Project Brainstorming</label>
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="chat-2" className="mr-2" defaultChecked />
                <label htmlFor="chat-2">Code Review Session</label>
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="chat-3" className="mr-2" defaultChecked />
                <label htmlFor="chat-3">Bug Troubleshooting</label>
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="chat-4" className="mr-2" />
                <label htmlFor="chat-4">Meeting Notes</label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Fine-tuning Settings</h3>
        <div className="bg-gray-800 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm text-white/70 mb-1">Base Model</label>
            <select className="w-full bg-gray-700 rounded-md p-2 text-sm">
              <option>Claude 3 Sonnet</option>
              <option>GPT-3.5 Turbo</option>
              <option>Mistral Medium</option>
              <option>Llama 3 8B</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Epochs</label>
            <div className="flex items-center">
              <input
                type="number"
                min="1"
                max="10"
                defaultValue="3"
                className="bg-gray-700 rounded-md p-2 text-sm w-20"
              />
              <div className="ml-3 text-sm text-white/70">
                Higher values may improve results but increase training time and cost
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-1">Learning Rate</label>
            <input
              type="range"
              className="w-full"
              min="0.00001"
              max="0.001"
              step="0.00001"
              defaultValue="0.0001"
            />
            <div className="flex justify-between text-xs text-white/50">
              <span>Lower (Stable)</span>
              <span>Higher (Faster)</span>
            </div>
          </div>
        </div>
      </div>

      <button className="bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-md text-sm w-full flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-2"
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
        Start Fine-tuning Process
      </button>
    </div>
  </div>
)
