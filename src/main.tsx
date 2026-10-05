import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

class ForgeMuscleErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ForgeMuscle] Unhandled UI error:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return <BootError error={this.state.error} />;
  }
}

function BootError({ error }: { error: Error }) {
  const isDev = import.meta.env.DEV;

  return (
    <div className="min-h-screen bg-[#0B0D11] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-3xl border border-red-500/30 bg-[#13171F] p-6 shadow-2xl">
        <div className="text-xs font-bold uppercase tracking-wider text-red-400 mb-2">ForgeMuscle</div>
        <h1 className="text-2xl font-black mb-2">Інтерфейс не зміг завантажитися</h1>
        <p className="text-sm text-slate-400 mb-5">
          Перезавантажте сторінку. У режимі розробки нижче показано технічну причину помилки.
        </p>
        {isDev && (
          <pre className="mb-5 max-h-56 overflow-auto rounded-xl bg-black/40 border border-white/10 p-3 text-xs text-red-300 whitespace-pre-wrap">
            {error.stack || error.message}
          </pre>
        )}
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="w-full rounded-xl bg-[#FF4D00] px-4 py-3 text-sm font-bold text-white hover:bg-[#ff5f1a] transition-colors"
        >
          Перезавантажити
        </button>
      </div>
    </div>
  );
}

function registerProductionServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch((error) => {
      console.warn('[ForgeMuscle] Service worker registration failed:', error);
    });
  });
}

function disableServiceWorkerInDevelopment() {
  if (!import.meta.env.DEV || !('serviceWorker' in navigator)) return;

  window.addEventListener('load', async () => {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));

      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(
          keys
            .filter((key) => key.startsWith('forgemuscle-cache-'))
            .map((key) => caches.delete(key))
        );
      }
    } catch (error) {
      console.warn('[ForgeMuscle] Dev cache cleanup failed:', error);
    }
  });
}

function showFatalBootError(error: unknown) {
  const normalized = error instanceof Error ? error : new Error(String(error));
  console.error('[ForgeMuscle] Fatal bootstrap error:', normalized);

  const rootElement = document.getElementById('root');
  if (!rootElement) return;

  createRoot(rootElement).render(<BootError error={normalized} />);
}

async function bootstrap() {
  registerProductionServiceWorker();
  disableServiceWorkerInDevelopment();

  const rootElement = document.getElementById('root');
  if (!rootElement) {
    showFatalBootError(new Error('ForgeMuscle root element #root was not found'));
    return;
  }

  try {
    const { default: App } = await import('./App.tsx');

    createRoot(rootElement).render(
      <ForgeMuscleErrorBoundary>
        <App />
      </ForgeMuscleErrorBoundary>
    );
  } catch (error) {
    showFatalBootError(error);
  }
}

window.addEventListener('error', (event) => {
  console.error('[ForgeMuscle] Window error:', event.error || event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[ForgeMuscle] Unhandled promise rejection:', event.reason);
});

void bootstrap();
