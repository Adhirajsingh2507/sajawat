import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '@sajawat/ui';

describe('@sajawat/ui Button', () => {
  it('renders an accessible button with its label', () => {
    render(<Button>Shop now</Button>);
    expect(screen.getByRole('button', { name: 'Shop now' })).toBeInTheDocument();
  });
});
