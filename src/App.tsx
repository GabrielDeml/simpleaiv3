import { BrowserRouter, Routes, Route, useLocation } from 'react-router';
import { Suspense, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AppShell } from './components/layout/AppShell';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { PageTransition } from './components/shared/PageTransition';
import { moduleRoutes, mathRoutes } from './config/routes';
import { initTFBackend } from './ml/backend-init';
import HomePage from './pages/HomePage';
import NotFoundPage from './pages/NotFoundPage';

function LoadingFallback({ name }: { name?: string }) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-4 text-text-muted">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 border-2 border-primary/20 rounded-full" />
          <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <span className="text-sm">{name ? `Loading ${name}...` : 'Loading module...'}</span>
      </div>
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route element={<AppShell />}>
          <Route
            index
            element={
              <PageTransition>
                <HomePage />
              </PageTransition>
            }
          />
          {moduleRoutes.map(({ path, component: Component, title }) => (
            <Route
              key={path}
              path={path}
              element={
                <PageTransition>
                  <ErrorBoundary moduleName={title}>
                    <Suspense fallback={<LoadingFallback name={title} />}>
                      <Component />
                    </Suspense>
                  </ErrorBoundary>
                </PageTransition>
              }
            />
          ))}
          {mathRoutes.map(({ path, component: Component, title }) => (
            <Route
              key={path}
              path={path}
              element={
                <PageTransition>
                  <ErrorBoundary moduleName={title}>
                    <Suspense fallback={<LoadingFallback name={title} />}>
                      <Component />
                    </Suspense>
                  </ErrorBoundary>
                </PageTransition>
              }
            />
          ))}
          <Route
            path="*"
            element={
              <PageTransition>
                <NotFoundPage />
              </PageTransition>
            }
          />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  useEffect(() => {
    initTFBackend().catch(() => {});
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <AnimatedRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
