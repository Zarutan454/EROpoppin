import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReviewList } from '../ReviewList';
import { ThemeProvider, createTheme } from '@mui/material';

const theme = createTheme();

describe('ReviewList', () => {
  const mockReviews = [
    {
      id: '1',
      title: 'Great service',
      content: 'Amazing experience',
      rating: 5,
      date: new Date().toISOString(),
      userId: 'user1',
      userName: 'John Doe',
    },
    {
      id: '2',
      title: 'Good service',
      content: 'Nice experience',
      rating: 4,
      date: new Date().toISOString(),
      userId: 'user2',
      userName: 'Jane Doe',
    },
  ];

  const mockOnPageChange = jest.fn();

  const renderWithTheme = (component: React.ReactElement) => {
    return render(
      <ThemeProvider theme={theme}>
        {component}
      </ThemeProvider>
    );
  };

  it('renders reviews correctly', () => {
    renderWithTheme(
      <ReviewList
        reviews={mockReviews}
        totalPages={1}
        currentPage={1}
        onPageChange={mockOnPageChange}
      />
    );

    expect(screen.getByText('Great service')).toBeInTheDocument();
    expect(screen.getByText('Good service')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    renderWithTheme(
      <ReviewList
        reviews={[]}
        totalPages={1}
        currentPage={1}
        onPageChange={mockOnPageChange}
        isLoading={true}
      />
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows error message', () => {
    const errorMessage = 'Failed to load reviews';
    renderWithTheme(
      <ReviewList
        reviews={[]}
        totalPages={1}
        currentPage={1}
        onPageChange={mockOnPageChange}
        error={errorMessage}
      />
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('handles page changes', () => {
    renderWithTheme(
      <ReviewList
        reviews={mockReviews}
        totalPages={3}
        currentPage={1}
        onPageChange={mockOnPageChange}
      />
    );

    const nextPageButton = screen.getByRole('button', { name: /go to page 2/i });
    fireEvent.click(nextPageButton);

    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  it('does not show pagination for single page', () => {
    renderWithTheme(
      <ReviewList
        reviews={mockReviews}
        totalPages={1}
        currentPage={1}
        onPageChange={mockOnPageChange}
      />
    );

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });
});