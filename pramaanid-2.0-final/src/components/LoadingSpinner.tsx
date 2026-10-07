import React from "react";

interface Props { message?: string; fullScreen?: boolean; }

export function LoadingSpinner({ message = "Loading...", fullScreen = false }: Props) {
  const style: React.CSSProperties = fullScreen
    ? { position:"fixed", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"#F4F6F8", zIndex:50 }
    : { display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"3rem" };
  return (
    <div style={style} role="status" aria-live="polite" aria-label={message}>
      <div style={{ width:48, height:48, border:"4px solid #e0e6ed", borderTopColor:"#E87524", borderRadius:"50%", animation:"pramaanSpin 0.8s linear infinite" }} />
      <p style={{ marginTop:"1rem", fontSize:"0.9rem", color:"#7a8a99" }}>{message}</p>
      <style>{`@keyframes pramaanSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
