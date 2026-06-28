import React from "react";
import { C } from "../design/tokens";
import { debugError } from "../utils/debug";

export default class ErrorBoundary extends React.Component {
  state={ error:null };

  static getDerivedStateFromError(error) { return {error}; }

  componentDidCatch(error,info) {
    debugError(this.props.scope || "screen",error,{componentStack:info.componentStack});
  }

  render() {
    if(!this.state.error) return this.props.children;
    return <main className="flex min-h-full flex-col items-center justify-center p-6 text-center" style={{background:C.bg}}>
      <div className="text-4xl">⚠️</div>
      <h1 className="mt-3 text-lg font-extrabold" style={{color:C.text}}>This screen hit an error</h1>
      <p className="mt-2 text-xs" style={{color:C.textSec}}>The app is still running. Technical details were recorded in the browser console.</p>
      <pre className="mt-4 max-h-32 w-full overflow-auto rounded-xl p-3 text-left text-[10px]" style={{background:C.card,color:C.red}}>{this.state.error.message}</pre>
      <div className="mt-4 grid w-full grid-cols-2 gap-2"><button onClick={()=>history.back()} className="rounded-xl border py-3 text-xs font-bold" style={{background:C.card,borderColor:C.border,color:C.text}}>Go back</button><button onClick={()=>this.setState({error:null})} className="rounded-xl py-3 text-xs font-bold text-white" style={{background:C.primary}}>Try again</button></div>
      <button onClick={()=>{window.location.href="/"}} className="mt-2 w-full rounded-xl py-3 text-xs font-bold" style={{color:C.primary}}>Return home</button>
    </main>;
  }
}
