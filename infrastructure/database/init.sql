-- MusicStreamX Database Initialization
-- Creates core tables for the platform

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Artists table
CREATE TABLE IF NOT EXISTS artists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stellar_address VARCHAR(56) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  verified BOOLEAN DEFAULT FALSE,
  total_streams BIGINT DEFAULT 0,
  total_earnings DECIMAL(20, 7) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tracks table
CREATE TABLE IF NOT EXISTS tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  ipfs_hash VARCHAR(255) NOT NULL,
  cover_art_hash VARCHAR(255),
  duration INTEGER NOT NULL DEFAULT 0,
  genre VARCHAR(100),
  tags TEXT[],
  price_per_stream DECIMAL(20, 7) DEFAULT 0.0001,
  total_streams BIGINT DEFAULT 0,
  total_earnings DECIMAL(20, 7) DEFAULT 0,
  is_nft BOOLEAN DEFAULT FALSE,
  nft_contract_address VARCHAR(56),
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fans table
CREATE TABLE IF NOT EXISTS fans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stellar_address VARCHAR(56) UNIQUE NOT NULL,
  username VARCHAR(100),
  avatar_url TEXT,
  total_streams BIGINT DEFAULT 0,
  total_spent DECIMAL(20, 7) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Streaming sessions table
CREATE TABLE IF NOT EXISTS streaming_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  fan_id UUID REFERENCES fans(id) ON DELETE SET NULL,
  stellar_address VARCHAR(56),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER DEFAULT 0,
  payment_tx_hash VARCHAR(64),
  amount_paid DECIMAL(20, 7) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NFTs table
CREATE TABLE IF NOT EXISTS nfts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  contract_address VARCHAR(56) NOT NULL,
  token_id VARCHAR(255) NOT NULL,
  edition_number INTEGER NOT NULL,
  total_editions INTEGER NOT NULL,
  price DECIMAL(20, 7) NOT NULL,
  owner_address VARCHAR(56),
  metadata_hash VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(contract_address, token_id)
);

-- Live events table
CREATE TABLE IF NOT EXISTS live_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  ticket_price DECIMAL(20, 7) DEFAULT 0,
  max_attendees INTEGER,
  stream_key VARCHAR(255),
  status VARCHAR(50) DEFAULT 'scheduled',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Governance proposals table
CREATE TABLE IF NOT EXISTS governance_proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposer_address VARCHAR(56) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  proposal_type VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  votes_for BIGINT DEFAULT 0,
  votes_against BIGINT DEFAULT 0,
  voting_ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tracks_artist_id ON tracks(artist_id);
CREATE INDEX IF NOT EXISTS idx_tracks_published ON tracks(published);
CREATE INDEX IF NOT EXISTS idx_streaming_sessions_track_id ON streaming_sessions(track_id);
CREATE INDEX IF NOT EXISTS idx_streaming_sessions_fan_id ON streaming_sessions(fan_id);
CREATE INDEX IF NOT EXISTS idx_nfts_track_id ON nfts(track_id);
CREATE INDEX IF NOT EXISTS idx_nfts_owner ON nfts(owner_address);
CREATE INDEX IF NOT EXISTS idx_live_events_artist_id ON live_events(artist_id);
CREATE INDEX IF NOT EXISTS idx_live_events_status ON live_events(status);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_artists_updated_at BEFORE UPDATE ON artists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tracks_updated_at BEFORE UPDATE ON tracks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fans_updated_at BEFORE UPDATE ON fans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_nfts_updated_at BEFORE UPDATE ON nfts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_live_events_updated_at BEFORE UPDATE ON live_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_governance_proposals_updated_at BEFORE UPDATE ON governance_proposals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
