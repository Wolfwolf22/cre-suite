import { render, screen } from '@testing-library/react';

import LoadingSpinner from './LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders default loading copy', () => {
    render(<LoadingSpinner />);
    expect(screen.getByText('Generating with AI...')).toBeInTheDocument();
    expect(screen.getByText('This may take 15–30 seconds')).toBeInTheDocument();
  });

  it('renders custom message when provided', () => {
    render(<LoadingSpinner message="Analyzing rent roll..." />);
    expect(screen.getByText('Analyzing rent roll...')).toBeInTheDocument();
  });
});
