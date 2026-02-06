import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import HomePage from '../HomePage';

afterEach(cleanup);

describe('HomePage', () => {
  it('renders SimpleAI heading', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );
    expect(screen.getByText('Simple')).toBeInTheDocument();
    expect(screen.getByText('AI')).toBeInTheDocument();
  });

  it('renders all 8 module cards', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );
    const expectedTitles = [
      'Linear Regression',
      'K-Means Clustering',
      'Gradient Descent',
      'Neural Network',
      'Image Classification',
      'Transfer Learning',
      'CNN Visualization',
      'LLM Playground',
    ];
    for (const title of expectedTitles) {
      const matches = screen.getAllByText(title);
      expect(matches.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('each card links to correct path', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );
    const expectedPaths = [
      { title: 'Linear Regression', path: '/linear-regression' },
      { title: 'K-Means Clustering', path: '/kmeans' },
      { title: 'Gradient Descent', path: '/gradient-descent' },
      { title: 'Neural Network', path: '/neural-network' },
      { title: 'Image Classification', path: '/image-classification' },
      { title: 'Transfer Learning', path: '/transfer-learning' },
      { title: 'CNN Visualization', path: '/cnn-visualization' },
      { title: 'LLM Playground', path: '/llm' },
    ];
    const links = screen.getAllByRole('link');
    for (const { title, path } of expectedPaths) {
      const link = links.find((l) => l.textContent?.includes(title));
      expect(link).toBeDefined();
      expect(link).toHaveAttribute('href', path);
    }
  });
});
