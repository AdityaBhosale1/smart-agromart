import React, { useState } from 'react';
import { X, Copy, Check, Terminal, FileCode, CheckCircle2 } from 'lucide-react';

/**
 * CodeExportModal Component
 * Displays the ready-to-use React component code and Tailwind/CSS background code.
 */
export const CodeExportModal = ({ isOpen, onClose, showLeaves, showFraming, showBranding, blurAmount, centerOpacity }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('react');

  if (!isOpen) return null;

  const reactCodeSnippet = `import React from 'react';
import { AgroMartBackgroundWrapper } from './components/AgroMartBackgroundWrapper';

export default function SmartAgroMartDashboard() {
  return (
    <AgroMartBackgroundWrapper
      showLeaves={${showLeaves}}
      showFraming={${showFraming}}
      showBranding={${showBranding}}
      blurAmount={${blurAmount}}
      centerOpacity={${centerOpacity}}
    >
      {/* 
        Dashboard widgets, charts, and content will go here in the future!
        The background layout & frosted center canvas are ready.
      */}
    </AgroMartBackgroundWrapper>
  );
}`;

  const cssSnippet = `/* Smart AgroMart - Full Screen SaaS Background Styles */

.agromart-bg-root {
  min-height: 100vh;
  width: 100%;
  background-color: #f4fbf7;
  background-image: 
    linear-gradient(to bottom, rgba(232, 244, 248, 0.9), rgba(247, 251, 248, 0.4)),
    radial-gradient(ellipse at top center, rgba(255, 255, 255, 0.95), transparent 70%),
    url('/assets/agromart_pure_bg.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.agromart-center-panel {
  background-color: rgba(255, 255, 255, ${centerOpacity});
  backdrop-filter: blur(${blurAmount}px);
  -webkit-backdrop-filter: blur(${blurAmount}px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 1.5rem;
  box-shadow: 0 20px 50px rgba(27, 67, 50, 0.08);
}`;

  const currentCode = activeTab === 'react' ? reactCodeSnippet : cssSnippet;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-agro-dark/40 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl border border-white/80 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-agro-pale/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-agro-forest text-white flex items-center justify-center">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-agro-dark font-['Outfit']">
                Smart AgroMart Component Integration
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                Copy reusable background wrapper code for your project
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white border border-gray-200 text-gray-500 hover:text-agro-dark flex items-center justify-center hover:bg-gray-50 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TABS HEADER */}
        <div className="flex items-center justify-between px-6 py-2 bg-gray-50 border-b border-gray-200">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('react')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'react'
                  ? 'bg-agro-forest text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-200/60'
              }`}
            >
              React Wrapper
            </button>
            <button
              onClick={() => setActiveTab('css')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'css'
                  ? 'bg-agro-forest text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-200/60'
              }`}
            >
              Pure CSS Setup
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="px-3.5 py-1.5 rounded-xl bg-agro-pale border border-agro-mint/60 text-agro-dark text-xs font-bold flex items-center gap-1.5 hover:bg-agro-mint/30 transition-all"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-agro-forest" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-agro-forest" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>

        {/* CODE BLOCK */}
        <div className="flex-1 p-6 overflow-y-auto bg-gray-900 text-emerald-300 font-mono text-xs leading-relaxed">
          <pre>{currentCode}</pre>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500 font-medium">
          <span>Component file: <code>AgroMartBackgroundWrapper.jsx</code></span>
          <span className="text-agro-forest font-semibold">Ready for future SaaS dashboard widgets</span>
        </div>
      </div>
    </div>
  );
};
