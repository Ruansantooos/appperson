import React from 'react';

interface Props {
  children: React.ReactNode;
  pageName?: string;
}

interface State {
  hasError: boolean;
  error: string;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-red-400 bg-red-500/10 rounded-xl border border-red-500/20 m-4">
          <h3 className="text-lg font-bold mb-2">
            Erro{this.props.pageName ? ` em ${this.props.pageName}` : ''}
          </h3>
          <p className="text-sm font-mono text-red-400/70">{this.state.error}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: '' })}
            className="mt-4 px-4 py-2 bg-red-500/20 rounded-lg text-sm font-bold hover:bg-red-500/30 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
