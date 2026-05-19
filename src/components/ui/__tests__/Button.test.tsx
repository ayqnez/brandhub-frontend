import { render, screen } from '@testing-library/react';
import Button from '../Button';

describe('Button component', () => {
  test('renders children', () => {
    render(<Button>Save changes</Button>);
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  test('is disabled while loading', () => {
    render(<Button loading>Submit</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
