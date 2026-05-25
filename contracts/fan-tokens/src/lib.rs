#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Bytes, Env, String, Symbol};
use musicstreamx_shared::{ContractError, FanToken, FanTokenBalance};

#[contract]
pub struct FanTokenContract;

#[contractimpl]
impl FanTokenContract {
    /// Create a new fan token for an artist
    pub fn create_token(
        env: Env,
        artist: Address,
        name: String,
        symbol: String,
        initial_supply: u128,
        price: u128,
        metadata: Bytes,
    ) -> Result<Bytes, ContractError> {
        artist.require_auth();

        if initial_supply == 0 {
            return Err(ContractError::InvalidAmount);
        }

        let token_id = env.crypto().sha256(&metadata).into();
        let token = FanToken {
            id: token_id.clone(),
            artist,
            name,
            symbol,
            total_supply: initial_supply,
            circulating_supply: initial_supply,
            price,
            created_at: env.ledger().timestamp(),
            active: true,
            metadata,
        };

        let key = Symbol::new(&env, "TOKEN");
        env.storage().persistent().set(&(key, token_id.clone()), &token);
        Ok(token_id)
    }

    /// Transfer fan tokens between holders
    pub fn transfer(
        env: Env,
        from: Address,
        to: Address,
        token_id: Bytes,
        amount: u128,
    ) -> Result<(), ContractError> {
        from.require_auth();

        let bkey = Symbol::new(&env, "BAL");

        let mut from_bal: FanTokenBalance = env
            .storage()
            .persistent()
            .get(&(bkey.clone(), from.clone(), token_id.clone()))
            .ok_or(ContractError::InsufficientBalance)?;

        if from_bal.balance < amount {
            return Err(ContractError::InsufficientBalance);
        }

        from_bal.balance -= amount;
        env.storage().persistent().set(&(bkey.clone(), from, token_id.clone()), &from_bal);

        let mut to_bal: FanTokenBalance = env
            .storage()
            .persistent()
            .get(&(bkey.clone(), to.clone(), token_id.clone()))
            .unwrap_or(FanTokenBalance {
                holder: to.clone(),
                token_id: token_id.clone(),
                balance: 0,
                engagement_score: 0,
                last_activity: env.ledger().timestamp(),
                voting_power: 0,
            });

        to_bal.balance += amount;
        env.storage().persistent().set(&(bkey, to, token_id), &to_bal);
        Ok(())
    }

    /// Get token details
    pub fn get_token(env: Env, token_id: Bytes) -> Result<FanToken, ContractError> {
        let key = Symbol::new(&env, "TOKEN");
        env.storage()
            .persistent()
            .get(&(key, token_id))
            .ok_or(ContractError::NFTNotFound)
    }

    /// Get holder balance
    pub fn get_balance(
        env: Env,
        holder: Address,
        token_id: Bytes,
    ) -> u128 {
        let key = Symbol::new(&env, "BAL");
        let bal: Option<FanTokenBalance> = env
            .storage()
            .persistent()
            .get(&(key, holder, token_id));
        bal.map(|b| b.balance).unwrap_or(0)
    }
}
