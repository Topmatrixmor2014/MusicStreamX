#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Bytes, Env, Symbol};
use musicstreamx_shared::{ContractError, MusicNFT, NFTType};

#[contract]
pub struct MusicNFTContract;

#[contractimpl]
impl MusicNFTContract {
    /// Mint a new music NFT
    pub fn mint(
        env: Env,
        track_id: Bytes,
        creator: Address,
        total_editions: u32,
        royalty_percentage: u32,
        artwork_hash: Bytes,
        metadata: Bytes,
    ) -> Result<Bytes, ContractError> {
        creator.require_auth();

        if royalty_percentage > 5000 {
            return Err(ContractError::InvalidConfiguration);
        }

        let nft_id = env.crypto().sha256(&metadata).into();
        let nft = MusicNFT {
            id: nft_id.clone(),
            track_id,
            creator: creator.clone(),
            owner: creator,
            nft_type: NFTType::Standard,
            edition: 1,
            total_editions,
            royalty_percentage,
            artwork_hash,
            created_at: env.ledger().timestamp(),
            transferable: true,
            metadata,
        };

        let key = Symbol::new(&env, "NFT");
        env.storage().persistent().set(&(key, nft_id.clone()), &nft);
        Ok(nft_id)
    }

    /// Transfer NFT to a new owner
    pub fn transfer(
        env: Env,
        nft_id: Bytes,
        from: Address,
        to: Address,
    ) -> Result<(), ContractError> {
        from.require_auth();

        let key = Symbol::new(&env, "NFT");
        let mut nft: MusicNFT = env
            .storage()
            .persistent()
            .get(&(key.clone(), nft_id.clone()))
            .ok_or(ContractError::NFTNotFound)?;

        if nft.owner != from {
            return Err(ContractError::Unauthorized);
        }
        if !nft.transferable {
            return Err(ContractError::TransferNotAllowed);
        }

        nft.owner = to;
        env.storage().persistent().set(&(key, nft_id), &nft);
        Ok(())
    }

    /// Get NFT details
    pub fn get_nft(env: Env, nft_id: Bytes) -> Result<MusicNFT, ContractError> {
        let key = Symbol::new(&env, "NFT");
        env.storage()
            .persistent()
            .get(&(key, nft_id))
            .ok_or(ContractError::NFTNotFound)
    }
}
