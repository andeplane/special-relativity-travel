import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import App from './App';
import { SPLASH_DISMISSED_KEY } from './components/SplashScreen';

describe('App Integration', () => {
  beforeEach(() => {
    localStorage.setItem(SPLASH_DISMISSED_KEY, '1');
  });

  afterEach(() => {
    localStorage.removeItem(SPLASH_DISMISSED_KEY);
  });

  it('shows splash until Enter simulator is clicked', async () => {
    localStorage.removeItem(SPLASH_DISMISSED_KEY);
    class MockResizeObserver {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    }
    window.ResizeObserver = MockResizeObserver;

    render(<App />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByText(/special relativity/i)
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /enter simulator/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(localStorage.getItem(SPLASH_DISMISSED_KEY)).toBe('1');
  });

  it('renders the app and calculates results correctly', async () => {
    // Need to mock ResizeObserver for Three.js canvas in JSDOM
    class MockResizeObserver {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    }
    window.ResizeObserver = MockResizeObserver;

    render(<App />);

    // Verify header exists
    expect(screen.getByText('Relativistic Space Travel Simulator')).toBeInTheDocument();

    // Verify default inputs are present (Proxima Centauri preset)
    const distanceInput = screen.getAllByDisplayValue('4.24')[0];
    const speedInput = screen.getAllByDisplayValue('0.9')[0];
    const accelInput = screen.getAllByDisplayValue('1')[0];

    expect(distanceInput).toBeInTheDocument();
    expect(speedInput).toBeInTheDocument();
    expect(accelInput).toBeInTheDocument();

    // The results should be visible. We know Proxima Centauri at 0.9c and 1g yields:
    // Earth time ~ 5-6 years
    expect(screen.getByText('Earth Time')).toBeInTheDocument();
    expect(screen.getByText('Ship Time')).toBeInTheDocument();
    
    // Lorentz factor at 0.9c (~2.29; ResultsPanel uses 3 significant figures)
    expect(screen.getByText(/2\.29/)).toBeInTheDocument();

    // Let's change the preset and see if it updates distance
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'Sirius' } });

    await waitFor(() => {
      expect(screen.getAllByDisplayValue('8.6').length).toBeGreaterThanOrEqual(1);
    });

    // Check if Play Animation button is present
    const playButton = screen.getByText(/Play Animation/i);
    expect(playButton).toBeInTheDocument();

    // Click it and verify it changes to Stop Animation
    fireEvent.click(playButton);
    await waitFor(() => {
      expect(screen.getByText(/Stop Animation/i)).toBeInTheDocument();
    });
  });
});
