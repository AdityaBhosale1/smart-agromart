import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught React Error Boundary caught:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full min-h-screen bg-[#f4fbf7] flex items-center justify-center p-6 text-center select-none font-sans">
          <div className="max-w-md w-full p-8 rounded-3xl bg-white border border-rose-200 shadow-2xl space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto shadow-md">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-gray-900 font-['Outfit']">
                Something went wrong while loading Smart AgroMart
              </h2>
              <p className="text-xs text-gray-500 mt-1.5 font-medium">
                {this.state.error?.message || 'A temporary application rendering error occurred.'}
              </p>
            </div>
            <button
              onClick={this.handleReload}
              className="w-full py-3 px-4 rounded-xl bg-[#064E3B] hover:bg-[#15803D] text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
