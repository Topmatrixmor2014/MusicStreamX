export type ProposalStatus = 'active' | 'passed' | 'rejected';
export type VoteChoice = 'yes' | 'no' | 'abstain';

export interface Proposal {
  id: string;
  title: string;
  description: string;
  proposerId: string;
  status: ProposalStatus;
  votingEndsAt: string;
  yesVotes: number;
  noVotes: number;
  abstainVotes: number;
  createdAt: string;
}

export interface CreateProposalPayload {
  title: string;
  description: string;
  proposerId: string;
  votingEndsAt: string;
}

export interface CastVotePayload {
  voterId: string;
  vote: VoteChoice;
}
