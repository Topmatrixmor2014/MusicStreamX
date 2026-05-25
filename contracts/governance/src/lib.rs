#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Bytes, Env, String, Symbol};
use musicstreamx_shared::{
    ContractError, GovernanceProposal, ProposalStatus, ProposalType, Vote, VoteChoice,
    VOTING_PERIOD,
};

#[contract]
pub struct GovernanceContract;

#[contractimpl]
impl GovernanceContract {
    /// Create a governance proposal
    pub fn create_proposal(
        env: Env,
        proposer: Address,
        proposal_type: ProposalType,
        title: String,
        description: String,
        target_contract: Address,
        target_function: String,
        call_data: Bytes,
    ) -> Result<Bytes, ContractError> {
        proposer.require_auth();

        let proposal_id = env.crypto().sha256(&call_data).into();
        let now = env.ledger().timestamp();

        let proposal = GovernanceProposal {
            id: proposal_id.clone(),
            proposer,
            proposal_type,
            title,
            description,
            target_contract,
            target_function,
            call_data,
            voting_start: now,
            voting_end: now + VOTING_PERIOD,
            votes_for: 0,
            votes_against: 0,
            votes_abstain: 0,
            status: ProposalStatus::Active,
            executed_at: 0,
        };

        let key = Symbol::new(&env, "PROPOSAL");
        env.storage().persistent().set(&(key, proposal_id.clone()), &proposal);
        Ok(proposal_id)
    }

    /// Cast a vote on a proposal
    pub fn vote(
        env: Env,
        voter: Address,
        proposal_id: Bytes,
        choice: VoteChoice,
        power: u128,
    ) -> Result<(), ContractError> {
        voter.require_auth();

        let pkey = Symbol::new(&env, "PROPOSAL");
        let mut proposal: GovernanceProposal = env
            .storage()
            .persistent()
            .get(&(pkey.clone(), proposal_id.clone()))
            .ok_or(ContractError::ProposalNotFound)?;

        if proposal.status != ProposalStatus::Active {
            return Err(ContractError::VotingClosed);
        }
        if env.ledger().timestamp() > proposal.voting_end {
            return Err(ContractError::VotingClosed);
        }

        // Check if already voted
        let vkey = Symbol::new(&env, "VOTE");
        if env.storage().persistent().has(&(vkey.clone(), voter.clone(), proposal_id.clone())) {
            return Err(ContractError::AlreadyVoted);
        }

        match choice {
            VoteChoice::For => proposal.votes_for += 1,
            VoteChoice::Against => proposal.votes_against += 1,
            VoteChoice::Abstain => proposal.votes_abstain += 1,
        }

        let vote = Vote {
            voter: voter.clone(),
            proposal_id: proposal_id.clone(),
            choice,
            power,
            timestamp: env.ledger().timestamp(),
        };

        env.storage().persistent().set(&(vkey, voter, proposal_id.clone()), &vote);
        env.storage().persistent().set(&(pkey, proposal_id), &proposal);
        Ok(())
    }

    /// Get proposal details
    pub fn get_proposal(env: Env, proposal_id: Bytes) -> Result<GovernanceProposal, ContractError> {
        let key = Symbol::new(&env, "PROPOSAL");
        env.storage()
            .persistent()
            .get(&(key, proposal_id))
            .ok_or(ContractError::ProposalNotFound)
    }
}
