'use client';

import { useState } from 'react';
import { useBoardStore } from '@/lib/store';

export default function Settings() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [cardCountInput, setCardCountInput] = useState('5000');
  
  const setTotalCardsCount = useBoardStore((state) => state.setTotalCardsCount);
  const resetOrder = useBoardStore((state) => state.resetOrder);

  const handleApplyCardCount = () => {
    const count = parseInt(cardCountInput);
    if (!isNaN(count) && count > 0 && count <= 50000) {
      setTotalCardsCount(count);
      setSettingsOpen(false);
    }
  };

  const handleReset = () => {
    // Complete reset to default state
    resetOrder();
    setCardCountInput('5000');
    setSettingsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setSettingsOpen(!settingsOpen)}
        className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
        aria-label="Settings"
      >
        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* Settings Popover */}
      {settingsOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setSettingsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-20 p-5">
            <h3 className="text-lg font-bold text-gray-900 mb-4">⚙️ Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Cards
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={cardCountInput}
                    onChange={(e) => setCardCountInput(e.target.value)}
                    min="1"
                    max="50000"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter number"
                  />
                  <button
                    onClick={handleApplyCardCount}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Apply
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Min: 1, Max: 50,000</p>
              </div>

              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-2 text-center">
                  ⚠️ Resets everything to default
                </p>
                <button
                  onClick={handleReset}
                  className="w-full px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset Everything
                </button>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Clears all edits, reordering & sets to 5000 cards
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

