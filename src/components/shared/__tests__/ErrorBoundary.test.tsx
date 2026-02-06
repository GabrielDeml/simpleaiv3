import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { ErrorBoundary } from '../ErrorBoundary';

function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>Child content</div>;
}

// Suppress console.error from React error boundary logging during tests
/* eslint-disable no-console */
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const msg = String(args[0]);
    if (msg.includes('ErrorBoundary caught')) return;
    if (msg.includes('The above error occurred')) return;
    if (msg.includes('Error: Uncaught')) return;
    if (msg.includes('recreate this component tree')) return;
    // React 19 logs the Error object directly
    if (args[0] instanceof Error) return;
    originalConsoleError(...args);
  };
});
afterAll(() => {
  console.error = originalConsoleError;
});
/* eslint-enable no-console */

afterEach(cleanup);

describe('ErrorBoundary', () => {
  it('renders children normally', () => {
    render(
      <MemoryRouter>
        <ErrorBoundary>
          <div>Hello world</div>
        </ErrorBoundary>
      </MemoryRouter>,
    );
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('shows error UI when child throws', () => {
    render(
      <MemoryRouter>
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      </MemoryRouter>,
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('shows error message', () => {
    render(
      <MemoryRouter>
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      </MemoryRouter>,
    );
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('shows moduleName if provided', () => {
    render(
      <MemoryRouter>
        <ErrorBoundary moduleName="Linear Regression">
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      </MemoryRouter>,
    );
    expect(screen.getByText('in Linear Regression')).toBeInTheDocument();
  });

  it('does not show moduleName section when not provided', () => {
    render(
      <MemoryRouter>
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      </MemoryRouter>,
    );
    expect(screen.queryByText(/^in /)).not.toBeInTheDocument();
  });

  it('has a Try Again button that resets error state', async () => {
    const user = userEvent.setup();
    // Use a stateful wrapper to control the throw
    let shouldThrow = true;
    function Wrapper() {
      if (shouldThrow) throw new Error('Boom');
      return <div>Recovered</div>;
    }

    render(
      <MemoryRouter>
        <ErrorBoundary>
          <Wrapper />
        </ErrorBoundary>
      </MemoryRouter>,
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Stop throwing, then click Try Again
    shouldThrow = false;
    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(screen.getByText('Recovered')).toBeInTheDocument();
  });

  it('has a Back to Home link pointing to /', () => {
    render(
      <MemoryRouter>
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      </MemoryRouter>,
    );
    const link = screen.getByRole('link', { name: /back to home/i });
    expect(link).toHaveAttribute('href', '/');
  });
});
