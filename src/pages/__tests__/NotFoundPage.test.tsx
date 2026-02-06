import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import NotFoundPage from '../NotFoundPage';

afterEach(cleanup);

describe('NotFoundPage', () => {
  it('renders 404', () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    );
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('renders Page not found', () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    );
    expect(screen.getByText('Page not found')).toBeInTheDocument();
  });

  it('has Back to Home link with href="/"', () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    );
    const link = screen.getByRole('link', { name: /back to home/i });
    expect(link).toHaveAttribute('href', '/');
  });

  it('shows module suggestion links', () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    );
    // NotFoundPage shows first 6 module routes as suggestions
    const suggestions = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href') !== '/');
    expect(suggestions).toHaveLength(6);
    expect(suggestions[0]).toHaveAttribute('href', '/linear-regression');
    expect(suggestions[1]).toHaveAttribute('href', '/kmeans');
    expect(suggestions[2]).toHaveAttribute('href', '/gradient-descent');
    expect(suggestions[3]).toHaveAttribute('href', '/neural-network');
    expect(suggestions[4]).toHaveAttribute('href', '/image-classification');
    expect(suggestions[5]).toHaveAttribute('href', '/transfer-learning');
  });
});
