import { MetadataSDKType } from '@manifest-network/manifestjs/dist/codegen/cosmos/bank/v1beta1/bank';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { Mock, afterEach, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test';

import { DenomImage } from '@/components/factory/components/DenomImage';
import { clearAllMocks, formatComponent, mockModule } from '@/tests';

// A cute little candle gif
const uri =
  'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExdHg1aHVqa3NoMG45bzYwbHR5ODk3b2JqbHhnemlmcXpjOXB0enExMSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/zHcirZSkw8RSDhawFl/giphy.gif';

const renderWithProps = (props = {}) => {
  const defaultProps = {
    denom: {
      base: 'umfx',
      uri: uri,
    } as MetadataSDKType,
  };
  return render(<DenomImage {...defaultProps} {...props} />);
};

describe('DenomImage', () => {
  beforeEach(() => {
    mockModule('next/image', () => ({
      default: (props: any) => {
        // eslint-disable-next-line @next/next/no-img-element,jsx-a11y/alt-text
        return <img alt="" {...props} />;
      },
    }));
  });

  afterEach(() => {
    clearAllMocks();
    cleanup();
  });

  test('renders MFX token image correctly', async () => {
    const mockup = renderWithProps();
    await waitFor(() => expect(document.querySelector('[src="/logo.svg"]')).toBeInTheDocument());
    expect(formatComponent(mockup.asFragment())).toMatchSnapshot();
  });

  test('renders ProfileAvatar for unsupported URL', async () => {
    const mockup = renderWithProps({
      denom: { base: 'unsupported', uri: 'https://unsupported.com/token.png' },
    });
    await waitFor(() => expect(screen.getByAltText('Token Icon')).toBeInTheDocument());
    expect(formatComponent(mockup.asFragment())).toMatchSnapshot();
  });

  test('renders image from supported URL', async () => {
    const mockup = renderWithProps({ denom: { base: 'supported', uri: uri } });
    await waitFor(() => expect(document.querySelector(`[src="${uri}"]`)).toBeInTheDocument());
    expect(formatComponent(mockup.asFragment())).toMatchSnapshot();
  });
});
