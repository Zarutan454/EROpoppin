import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatMediaUpload } from '../ChatMediaUpload';

describe('ChatMediaUpload', () => {
  const mockOnUpload = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders upload button', () => {
    render(<ChatMediaUpload onUpload={mockOnUpload} isUploading={false} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('disables upload button while uploading', () => {
    render(<ChatMediaUpload onUpload={mockOnUpload} isUploading={true} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows loading indicator while uploading', () => {
    render(<ChatMediaUpload onUpload={mockOnUpload} isUploading={true} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('handles file selection', async () => {
    render(<ChatMediaUpload onUpload={mockOnUpload} isUploading={false} />);
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/attach/i);

    Object.defineProperty(input, 'files', {
      value: [file]
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalled();
    });
  });

  it('shows error for invalid file type', async () => {
    render(<ChatMediaUpload onUpload={mockOnUpload} isUploading={false} />);
    
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByLabelText(/attach/i);

    Object.defineProperty(input, 'files', {
      value: [file]
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText(/nur bilder/i)).toBeInTheDocument();
    });
  });
});