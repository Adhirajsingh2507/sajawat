import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

// RTL + jsdom + jest-dom harness smoke (real components arrive with Phase 1 UI).
function Heading(): React.JSX.Element {
  return <h1>Sajawat Admin</h1>;
}

describe('RTL/jsdom harness', () => {
  it('renders a component into the DOM', () => {
    render(<Heading />);
    expect(screen.getByRole('heading', { name: 'Sajawat Admin' })).toBeInTheDocument();
  });
});
