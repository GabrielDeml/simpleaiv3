import { Outlet } from 'react-router';
import { Navigation } from './Navigation';

export function AppShell() {
  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:text-sm focus:font-medium"
      >
        Skip to content
      </a>
      <Navigation />
      <main id="main-content" className="flex-1 overflow-auto md:ml-0 relative">
        <Outlet />
      </main>
    </div>
  );
}
