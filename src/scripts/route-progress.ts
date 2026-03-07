const routeProgressEl = document.getElementById('route-progress');
const routeProgressBar = routeProgressEl?.querySelector<HTMLElement>('.route-progress-bar');
let routeProgress = 0;
let routeProgressTimer: number | null = null;
let routeHideTimer: number | null = null;
let routeNavInFlight = false;

function setRouteProgress(value: number) {
  routeProgress = Math.max(0, Math.min(1, value));
  routeProgressBar?.style.setProperty('--route-progress', routeProgress.toFixed(4));
}

export function startRouteProgress() {
  if (!routeProgressEl || !routeProgressBar) return;
  routeNavInFlight = true;
  if (routeHideTimer) {
    clearTimeout(routeHideTimer);
    routeHideTimer = null;
  }
  if (routeProgressTimer) {
    clearInterval(routeProgressTimer);
    routeProgressTimer = null;
  }
  routeProgressEl.classList.add('is-active');
  setRouteProgress(0.08);
  routeProgressTimer = window.setInterval(() => {
    setRouteProgress(Math.min(0.78, routeProgress + (0.82 - routeProgress) * 0.18));
    if (routeProgress >= 0.775 && routeProgressTimer) {
      clearInterval(routeProgressTimer);
      routeProgressTimer = null;
    }
  }, 70);
}

export function bumpRouteProgress(value: number) {
  if (!routeNavInFlight) return;
  setRouteProgress(Math.max(routeProgress, value));
}

export function finishRouteProgress() {
  if (!routeNavInFlight) return;
  routeNavInFlight = false;
  if (routeProgressTimer) {
    clearInterval(routeProgressTimer);
    routeProgressTimer = null;
  }
  setRouteProgress(1);
  routeHideTimer = window.setTimeout(() => {
    routeProgressEl?.classList.remove('is-active');
    setRouteProgress(0);
  }, 180);
}
