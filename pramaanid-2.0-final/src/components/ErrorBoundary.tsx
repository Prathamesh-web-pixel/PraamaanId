import React, { Component, ReactNode } from "react";

interface State { hasError: boolean; error: Error | null; }
interface Props { children: ReactNode; fallback?: ReactNode; }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[PramaanID] Error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", fontFamily:"sans-serif", background:"#F4F6F8", padding:"2rem", textAlign:"center" }}>
          <div style={{ fontSize:"3rem", marginBottom:"1rem" }}>⚠️</div>
          <h1 style={{ fontSize:"1.8rem", fontWeight:700, color:"#E87524", marginBottom:"0.5rem" }}>Something went wrong</h1>
          <p style={{ color:"#555", maxWidth:"480px", lineHeight:1.6 }}>An unexpected error occurred. Please refresh the page.</p>
          {this.state.error && (
            <pre style={{ marginTop:"1rem", background:"#fff3f3", border:"1px solid #f5c6cb", borderRadius:"8px", padding:"1rem", fontSize:"0.8rem", color:"#721c24", maxWidth:"600px", overflowX:"auto", textAlign:"left" }}>
              {this.state.error.message}
            </pre>
          )}
          <button onClick={() => window.location.reload()} style={{ marginTop:"1.5rem", padding:"0.75rem 2rem", background:"#E87524", color:"#fff", border:"none", borderRadius:"8px", fontSize:"1rem", fontWeight:600, cursor:"pointer" }}>
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
