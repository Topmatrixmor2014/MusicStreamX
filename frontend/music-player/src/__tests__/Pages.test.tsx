import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TrackList } from '../pages/TrackList';
import { ArtistProfile } from '../pages/ArtistProfile';
import { NFTMarketplace } from '../pages/NFTMarketplace';
import { FanPortal } from '../pages/FanPortal';
import { LiveEvents } from '../pages/LiveEvents';

describe('Page components', () => {
  it('TrackList renders', () => {
    render(<TrackList />);
    expect(screen.getByText('Track List')).toBeInTheDocument();
  });

  it('ArtistProfile renders', () => {
    render(<ArtistProfile />);
    expect(screen.getByText('Artist Profile')).toBeInTheDocument();
  });

  it('NFTMarketplace renders', () => {
    render(<NFTMarketplace />);
    expect(screen.getByText('NFT Marketplace')).toBeInTheDocument();
  });

  it('FanPortal renders', () => {
    render(<FanPortal />);
    expect(screen.getByText('Fan Portal')).toBeInTheDocument();
  });

  it('LiveEvents renders', () => {
    render(<LiveEvents />);
    expect(screen.getByText('Live Events')).toBeInTheDocument();
  });
});
