import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';
import { vi } from 'vitest';

// Mock global fetch to return empty polygon list by default
vi.stubGlobal('fetch', vi.fn(() =>
  Promise.resolve({ json: () => Promise.resolve([]) })
));

describe('UI basic interactions', () => {
  it('displays welcome modal which can be closed and reopened', async () => {
    render(<App />);

    // Welcome modal visible on load
    expect(await screen.findByText(/Hi Guy/i)).toBeInTheDocument();

    // Dismiss modal
    fireEvent.click(screen.getByRole('button', { name: '✕' }));
    expect(screen.queryByText(/Hi Guy/i)).not.toBeInTheDocument();

    // Reopen via info button
    fireEvent.click(screen.getByRole('button', { name: 'ℹ️' }));
    expect(await screen.findByText(/Hi Guy/i)).toBeInTheDocument();
  });

  it('toggles create mode with the New Polygon / Cancel button', async () => {
    render(<App />);

    // Dismiss modal for unobstructed interaction
    fireEvent.click(await screen.findByRole('button', { name: '✕' }));

    const newBtn = screen.getByRole('button', { name: '+ New Polygon' });
    fireEvent.click(newBtn);

    // Button should now read Cancel and input should appear
    expect(newBtn).toHaveTextContent('Cancel');
    expect(screen.getByPlaceholderText('Polygon name')).toBeInTheDocument();

    // Click cancel again
    fireEvent.click(newBtn);
    expect(newBtn).toHaveTextContent('+ New Polygon');
    // Input should be gone
    expect(screen.queryByPlaceholderText('Polygon name')).not.toBeInTheDocument();
  });
}); 