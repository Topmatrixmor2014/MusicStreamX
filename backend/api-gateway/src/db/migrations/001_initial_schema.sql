-- Migration 001: Initial schema
-- Tables: artists, fans, tracks, nfts, events, royalty_distributions

BEGIN;

-- Artists
CREATE TABLE IF NOT EXISTS artists (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address VARCHAR(64) NOT NULL UNIQUE,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  bio           TEXT,
  avatar_cid    VARCHAR(128),          -- IPFS CID for avatar image
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fans
CREATE TABLE IF NOT EXISTS fans (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address VARCHAR(64) NOT NULL UNIQUE,
  username      VARCHAR(50) NOT NULL UNIQUE,
  email         VARCHAR(255) UNIQUE,
  avatar_cid    VARCHAR(128),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tracks
CREATE TABLE IF NOT EXISTS tracks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id     UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  title         VARCHAR(200) NOT NULL,
  genre         VARCHAR(50),
  duration_secs INTEGER NOT NULL CHECK (duration_secs > 0),
  audio_cid     VARCHAR(128) NOT NULL,   -- IPFS CID for audio file
  cover_cid     VARCHAR(128),            -- IPFS CID for cover art
  release_date  DATE,
  stream_count  BIGINT NOT NULL DEFAULT 0,
  is_published  BOOLEAN NOT NULL DEFAULT FALSE,
  -- Full-text search vector (auto-updated via trigger)
  search_vector TSVECTOR,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Full-text search index on tracks
CREATE INDEX IF NOT EXISTS idx_tracks_search ON tracks USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_tracks_artist ON tracks(artist_id);
CREATE INDEX IF NOT EXISTS idx_tracks_genre ON tracks(genre);
CREATE INDEX IF NOT EXISTS idx_tracks_release_date ON tracks(release_date DESC);
CREATE INDEX IF NOT EXISTS idx_tracks_stream_count ON tracks(stream_count DESC);

-- Trigger to keep search_vector up to date
CREATE OR REPLACE FUNCTION tracks_search_vector_update() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.genre, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tracks_search_vector_trigger ON tracks;
CREATE TRIGGER tracks_search_vector_trigger
  BEFORE INSERT OR UPDATE ON tracks
  FOR EACH ROW EXECUTE FUNCTION tracks_search_vector_update();

-- NFTs
CREATE TABLE IF NOT EXISTS nfts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id        UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  owner_id        UUID REFERENCES fans(id) ON DELETE SET NULL,
  token_id        VARCHAR(128) NOT NULL UNIQUE,  -- on-chain token identifier
  contract_address VARCHAR(64) NOT NULL,
  metadata_cid    VARCHAR(128) NOT NULL,
  price_xlm       NUMERIC(18, 7),
  is_for_sale     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nfts_track ON nfts(track_id);
CREATE INDEX IF NOT EXISTS idx_nfts_owner ON nfts(owner_id);

-- Live events
CREATE TABLE IF NOT EXISTS events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id       UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  title           VARCHAR(200) NOT NULL,
  description     TEXT,
  starts_at       TIMESTAMPTZ NOT NULL,
  ends_at         TIMESTAMPTZ,
  ticket_price_xlm NUMERIC(18, 7) NOT NULL DEFAULT 0,
  max_attendees   INTEGER,
  stream_url      TEXT,
  is_token_gated  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_artist ON events(artist_id);
CREATE INDEX IF NOT EXISTS idx_events_starts_at ON events(starts_at);

-- Royalty distributions
CREATE TABLE IF NOT EXISTS royalty_distributions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id    UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  artist_id   UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  fan_id      UUID REFERENCES fans(id) ON DELETE SET NULL,
  amount_xlm  NUMERIC(18, 7) NOT NULL CHECK (amount_xlm >= 0),
  tx_hash     VARCHAR(128),              -- Stellar transaction hash
  distributed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_royalties_track ON royalty_distributions(track_id);
CREATE INDEX IF NOT EXISTS idx_royalties_artist ON royalty_distributions(artist_id);
CREATE INDEX IF NOT EXISTS idx_royalties_distributed_at ON royalty_distributions(distributed_at DESC);

-- Governance proposals
CREATE TABLE IF NOT EXISTS governance_proposals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposer_id   UUID NOT NULL,           -- artist or fan UUID
  title         VARCHAR(200) NOT NULL,
  description   TEXT NOT NULL,
  status        VARCHAR(20) NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'passed', 'rejected')),
  voting_ends_at TIMESTAMPTZ NOT NULL,
  yes_votes     INTEGER NOT NULL DEFAULT 0,
  no_votes      INTEGER NOT NULL DEFAULT 0,
  abstain_votes INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proposals_status ON governance_proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_voting_ends_at ON governance_proposals(voting_ends_at);

-- Governance votes (one vote per voter per proposal)
CREATE TABLE IF NOT EXISTS governance_votes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES governance_proposals(id) ON DELETE CASCADE,
  voter_id    UUID NOT NULL,
  vote        VARCHAR(10) NOT NULL CHECK (vote IN ('yes', 'no', 'abstain')),
  voted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (proposal_id, voter_id)
);

CREATE INDEX IF NOT EXISTS idx_votes_proposal ON governance_votes(proposal_id);

COMMIT;
