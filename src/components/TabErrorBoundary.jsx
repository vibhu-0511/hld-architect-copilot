import React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export class TabErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.tabKey !== this.props.tabKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <main className="stack">
          <section className="panel tab-error">
            <AlertTriangle size={22} />
            <h2>This view crashed.</h2>
            <pre>{String(this.state.error?.message || this.state.error)}</pre>
            <button className="primary-cta" onClick={() => this.setState({ error: null })}>
              <RotateCcw size={14} /> Try again
            </button>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}
