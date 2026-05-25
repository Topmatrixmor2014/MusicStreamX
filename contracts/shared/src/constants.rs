#![no_std]

// Platform constants
pub const MIN_PLATFORM_FEE: u32 = 100; // 1%
pub const MAX_PLATFORM_FEE: u32 = 2000; // 20%
pub const DEFAULT_PLATFORM_FEE: u32 = 500; // 5%
pub const MIN_ROYALTY_PER_STREAM: u64 = 1000; // 0.0001 XLM
pub const MAX_TRACK_DURATION: u64 = 3600; // 1 hour

// Music NFT constants
pub const MIN_NFT_SUPPLY: u32 = 1;
pub const MAX_NFT_SUPPLY: u32 = 10000;
pub const DEFAULT_NFT_ROYALTY: u32 = 1000; // 10%
pub const MAX_NFT_ROYALTY: u32 = 5000; // 50%

// Streaming constants
pub const MIN_STREAM_REWARD: u64 = 1000;
pub const MAX_STREAM_REWARD: u64 = 100000;
pub const DEFAULT_STREAM_REWARD: u64 = 5000;

// Fan token constants
pub const MIN_FAN_TOKEN_SUPPLY: u128 = 1000000;
pub const MAX_FAN_TOKEN_SUPPLY: u128 = 10000000000;

// Governance constants
pub const VOTING_PERIOD: u64 = 604800; // 7 days
pub const QUORUM_REQUIREMENT: u32 = 1000; // 10%
pub const PROPOSAL_THRESHOLD: u32 = 500; // 5%

// Amount constants (in stroops)
pub const ONE_XLM: u128 = 10000000;
pub const MIN_MINT_PRICE: u128 = 10000000;

// Collaboration constants
pub const MAX_COLLABORATORS: usize = 10;
pub const MIN_COLLABORATOR_SPLIT: u32 = 500; // 5%
