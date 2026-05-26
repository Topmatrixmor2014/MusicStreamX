#![no_std]
use soroban_sdk::{contract, contractimpl, token, Address, Bytes, Env, String, Symbol};
use musicstreamx_shared::{utils::calculate_royalty, ContractError, MusicTrack, StreamingSession};

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
            return Err(ContractError::InvalidConfiguration);
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

    /// Record a stream and pay XLM royalty to the artist.
    ///
    /// The listener must have pre-authorised a transfer of at least `royalty`
    /// stroops to this contract (or the contract must hold sufficient balance
    /// on behalf of the listener).  The contract then forwards the artist's
    /// share directly to the artist address via the Stellar XLM token client.
    ///
    /// Parameters:
    /// - `xlm_token`  – address of the native XLM token contract
    /// - `listener`   – fan paying for the stream
    /// - `track_id`   – ID of the track being played
    /// - `quality`    – quality code: 0=standard, 1=high, 2=lossless, 3=master
    /// - `duration`   – stream duration in seconds
    pub fn record_stream(
        env: Env,
        xlm_token: Address,
        listener: Address,
        track_id: Bytes,
        quality: u32,
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

        // Calculate royalty (in stroops).  Platform fee is 5 % (500 bps).
        let royalty = calculate_royalty(1, track.royalty_rate, 500);

        // Transfer XLM from listener → artist via the native token contract.
        let xlm = token::TokenClient::new(&env, &xlm_token);
        xlm.transfer(&listener, &track.artist, &(royalty as i128));

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
