// Settings view component
export const SettingsView = () => (
  <div className="p-6 text-white">
    <h2 className="text-2xl font-bold mb-4">Settings</h2>

    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Model Preferences</h3>
        <div className="bg-gray-800 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm text-white/70 mb-1">Default Model</label>
            <select className="w-full bg-gray-700 rounded-md p-2 text-sm">
              <option>GPT-3.5 Turbo</option>
              <option>GPT-4</option>
              <option>Claude 3 Opus</option>
              <option>Claude 3 Sonnet</option>
              <option>Llama 3 70B</option>
              <option>Mistral Large</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-1">Default Temperature</label>
            <input type="range" className="w-full" min="0" max="2" step="0.1" defaultValue="0.7" />
            <div className="flex justify-between text-xs text-white/50">
              <span>More Precise</span>
              <span>More Creative</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Tensorlink Connection</h3>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">API Endpoint</div>
              <div className="text-sm text-white/70">Configure your Tensorlink connection</div>
            </div>
            <input
              type="text"
              placeholder="https://api.tensorlink.example"
              className="bg-gray-700 rounded-md p-2 text-sm w-1/2"
            />
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div>
              <div className="font-medium">API Key</div>
              <div className="text-sm text-white/70">Your Tensorlink API key</div>
            </div>
            <input
              type="password"
              placeholder="••••••••••••••••"
              className="bg-gray-700 rounded-md p-2 text-sm w-1/2"
            />
          </div>

          <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm w-full">
            Save Connection Settings
          </button>
        </div>
      </div>
    </div>
  </div>
)
