import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}


export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleReload = () => window.location.reload();

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        role="alert"
        aria-live="assertive"
        className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center bg-white dark:bg-zinc-950 text-ink dark:text-white"
      >
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
          An unexpected error occurred. Please reload the page and try again.
        </p>
        {this.state.message && (
          <code className="rounded bg-zinc-100 dark:bg-zinc-800 px-3 py-1 text-xs text-red-600 dark:text-red-400">
            {this.state.message}
          </code>
        )}
        <button
          onClick={this.handleReload}
          className="rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          Reload page
        </button>
      </div>
    );
  }
}