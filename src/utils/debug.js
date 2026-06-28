const EVENT_NAME="orbit:debug";
const MAX_EVENTS=100;

export function debugLog(scope,message,data) {
  const entry={ time:new Date().toISOString(), scope, message, data:data ?? null };
  window.__ORBIT_DEBUG__=window.__ORBIT_DEBUG__ || [];
  window.__ORBIT_DEBUG__.push(entry);
  if(window.__ORBIT_DEBUG__.length>MAX_EVENTS) window.__ORBIT_DEBUG__.shift();
  console.info(`[ORBIT:${scope}] ${message}`,data ?? "");
  window.dispatchEvent(new CustomEvent(EVENT_NAME,{detail:entry}));
  return entry;
}

export function debugError(scope,error,context) {
  const normalized={ name:error?.name || "Error", message:error?.message || String(error), stack:error?.stack, context };
  console.error(`[ORBIT:${scope}]`,normalized);
  return debugLog(scope,"ERROR",normalized);
}

export function installGlobalDiagnostics() {
  if(window.__ORBIT_DIAGNOSTICS_INSTALLED__) return;
  window.__ORBIT_DIAGNOSTICS_INSTALLED__=true;
  window.addEventListener("error",event=>debugError("window",event.error || event.message,{file:event.filename,line:event.lineno,column:event.colno}));
  window.addEventListener("unhandledrejection",event=>debugError("promise",event.reason));
  debugLog("app","Global diagnostics installed");
}

export { EVENT_NAME };
