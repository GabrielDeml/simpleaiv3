import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';
import { Link } from 'react-router';

interface Props {
  children: ReactNode;
  moduleName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // eslint-disable-next-line no-console
    if (import.meta.env.DEV) console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full p-8">
          <div className="max-w-md w-full text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent-red/10 mb-6">
              <AlertTriangle size={32} className="text-accent-red" />
            </div>

            <h2 className="text-2xl font-bold text-text mb-2">Something went wrong</h2>

            {this.props.moduleName && (
              <p className="text-sm text-text-muted mb-2">in {this.props.moduleName}</p>
            )}

            {this.state.error && (
              <div className="mt-4 p-3 rounded-lg bg-surface-light border border-border text-left">
                <p className="text-xs font-mono text-accent-red break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-light transition-colors"
              >
                <RotateCcw size={16} />
                Try Again
              </button>
              <Link
                to="/"
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-text-muted text-sm font-medium hover:text-text hover:bg-surface-lighter transition-colors"
              >
                <Home size={16} />
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
