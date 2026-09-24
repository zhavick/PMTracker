import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div 
          className="p-8 max-w-xl mx-auto my-12 rounded-3xl border shadow-lg text-center space-y-4"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <AlertTriangle size={28} />
          </div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Terjadi Kesalahan Tampilan
          </h2>
          <p className="text-xs text-rose-500 bg-rose-500/10 p-3 rounded-xl font-mono text-left overflow-auto max-h-32">
            {this.state.error?.toString()}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-md flex items-center gap-2 mx-auto hover:opacity-90 active:scale-95 transition-all"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            <RefreshCw size={15} /> Muat Ulang Halaman
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
