#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Bytes, Env, String, Symbol};
use musicstreamx_shared::{calculate_royalty, ContractError, MusicTrack, StreamingSession};

#[contract]
pub struct StreamingContract;

#[contractimpl]
impl StreamingContract {
    /// Register a music track
    pub fn register_track(
        env: Env,
        artist: Address,
        title: String,
        duration: u64,
        ipfs_hash: Bytes,
        genre: String,
        royalty_rate: u32,
        metadata: Bytes,
    ) -> Result<Bytes, ContractError> {
        artist.require_auth();

        if duration == 0 || duration > 3600 {
            return Err(ContractError::InvalidDuration);
        }
        if royalty_rate == 0 || royalty_rate > 5000 {
            return Err(ContractError::InvalidConfiguration);
        }

        let track_id = env.crypto().sha256(&ipfs_hash).into();
        let track = MusicTrack {
            id: track_id.clone(),
            title,
            artist,
            duration,
            ipfs_hash,
            genre,
            release_date: env.ledger().timestamp(),
            total_streams: 0,
            royalty_rate,
            active: true,
            metadata,
        };

        let key = Symbol::new(&env, "TRACK");
        env.storage().persistent().set(&(key, track_id.clone()), &track);
        Ok(track_id)
    }

    /// Record a stream and calculate royalty
    pub fn record_stream(
        env: Env,
        listener: Address,
        track_id: Bytes,
        quality: String,
        duration: u64,
    ) -> Result<u64, ContractError> {
        listener.require_auth();

        let key = Symbol::new(&env, "TRACK");
        let mut track: MusicTrack = env
            .storage()
            .persistent()
            .get(&(key.clone(), track_id.clone()))
            .ok_or(ContractError::TrackNotFound)?;

        if !track.active {
            return Err(ContractError::TrackNotFound);
        }

        track.total_streams += 1;
        env.storage().persistent().set(&(key, track_id.clone()), &track);

        let royalty = calculate_royalty(1, track.royalty_rate, 500); // 5% platform fee

        let session_id = env.crypto().sha256(&listener.clone().into()).into();
        let session = StreamingSession {
            id: session_id,
            listener,
            track_id,
            start_time: env.ledger().timestamp(),
            end_time: env.ledger().timestamp() + duration,
            quality,
            duration,
            royalty_paid: royalty,
            platform_fee_paid: royalty / 20,
            metadata: Bytes::new(&env),
        };

        let skey = Symbol::new(&env, "SESSION");
        env.storage().temporary().set(&(skey, session.id.clone()), &session);

        Ok(royalty)
    }

    /// Get track details
    pub fn get_track(env: Env, track_id: Bytes) -> Result<MusicTrack, ContractError> {
        let key = Symbol::new(&env, "TRACK");
        env.storage()
            .persistent()
            .get(&(key, track_id))
            .ok_or(ContractError::TrackNotFound)
    }
}
