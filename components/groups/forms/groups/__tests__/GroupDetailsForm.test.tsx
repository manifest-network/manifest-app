import { Duration } from '@manifest-network/manifestjs/dist/codegen/google/protobuf/duration';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, jest, test } from 'bun:test';
import React from 'react';

import GroupDetails from '@/components/groups/forms/groups/GroupDetailsForm';
import { clearAllMocks, mockRouter } from '@/tests';
import { manifestAddr1, mockGroupFormData } from '@/tests/data';
import { renderWithChainProvider } from '@/tests/render';

const mockProps = {
  nextStep: jest.fn(),
  formData: mockGroupFormData,
  dispatch: jest.fn(),
  address: 'manifest1address',
};

describe('GroupDetails Component', () => {
  beforeEach(() => {
    mockRouter();
  });
  afterEach(() => {
    cleanup();
    clearAllMocks();
    jest.clearAllMocks();
  });

  test('renders component with correct details', () => {
    renderWithChainProvider(<GroupDetails {...mockProps} />);
    expect(screen.getByText('Group details')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Title')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Author name or address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Long Bio')).toBeInTheDocument();
  });

  test('updates form fields correctly', async () => {
    renderWithChainProvider(<GroupDetails {...mockProps} />);

    const titleInput = screen.getByPlaceholderText('Title');
    fireEvent.change(titleInput, { target: { value: 'New Group Title' } });
    await waitFor(() => {
      expect(mockProps.dispatch).toHaveBeenCalledWith({
        type: 'UPDATE_FIELD',
        field: 'title',
        value: 'New Group Title',
      });
    });

    const summaryInput = screen.getByPlaceholderText('Long Bio');
    fireEvent.change(summaryInput, { target: { value: 'New Summary' } });
    await waitFor(() => {
      expect(mockProps.dispatch).toHaveBeenCalledWith({
        type: 'UPDATE_FIELD',
        field: 'description',
        value: 'New Summary',
      });
    });

    const authorsInput = screen.getByPlaceholderText('Author name or address');
    fireEvent.change(authorsInput, { target: { value: manifestAddr1 } });
    await waitFor(() => {
      expect(mockProps.dispatch).toHaveBeenCalledWith({
        type: 'UPDATE_FIELD',
        field: 'authors',
        value: [manifestAddr1],
      });
    });
  });

  test('next button is enabled when form is not dirty but valid', async () => {
    renderWithChainProvider(<GroupDetails {...mockProps} />);
    expect(screen.getByText('Next: Group Members')).toBeEnabled();
  });

  test('next button is disabled when form is dirty and invalid', async () => {
    const invalidProps = {
      ...mockProps,
      formData: {
        ...mockGroupFormData,
        title: '',
        authors: [],
        description: '',
        members: [],
        votingThreshold: '',
        votingPeriod: Duration.fromPartial({ seconds: 1n, nanos: 1 }),
      },
    };

    renderWithChainProvider(<GroupDetails {...invalidProps} />);
    const nextButton = screen.getByText('Next: Group Members');
    // Initially disabled because authors is [''] (empty string)
    expect(nextButton).toBeDisabled();

    // Fill all fields to valid values
    fireEvent.change(screen.getByLabelText('Group Title'), {
      target: { value: 'New Group Title' },
    });
    fireEvent.change(screen.getByLabelText('Author name or address'), {
      target: { value: manifestAddr1 },
    });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'New Long Description is Long Enough well well well...' },
    });

    // Wait for Formik validation to settle and button to become enabled
    await waitFor(() => expect(nextButton).toBeEnabled());
  });

  test('next button is enabled when form is valid and dirty', async () => {
    renderWithChainProvider(<GroupDetails {...mockProps} />);
    const titleInput = screen.getByLabelText('Group Title');
    fireEvent.change(titleInput, { target: { value: 'New Group Title' } });
    await waitFor(() => {
      expect(screen.getByText('Next: Group Members')).toBeEnabled();
    });
  });

  test('calls nextStep when next button is clicked', async () => {
    renderWithChainProvider(<GroupDetails {...mockProps} />);

    const titleInput = screen.getByLabelText('Group Title');
    fireEvent.change(titleInput, { target: { value: 'New Group Title' } });

    const authorsInput = screen.getByLabelText('Author name or address');
    fireEvent.change(authorsInput, { target: { value: manifestAddr1 } });

    const descriptionInput = screen.getByLabelText('Description');
    fireEvent.change(descriptionInput, {
      target: { value: 'New description that is at least 20 characters long' },
    });

    await waitFor(() => {
      expect(screen.getByText('Next: Group Members')).toBeEnabled();
    });

    const nextButton = screen.getByText('Next: Group Members');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(mockProps.nextStep).toHaveBeenCalled();
    });
  });
});
