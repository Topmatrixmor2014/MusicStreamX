import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchProposal, castVote } from '../api/governance';
import type { Proposal, VoteChoice } from '../types/governance';

const VOTE_STYLES: Record<VoteChoice, string> = {
  yes: 'bg-green-600 hover:bg-green-700 text-white',
  no: 'bg-red-600 hover:bg-red-700 text-white',
  abstain: 'bg-gray-400 hover:bg-gray-500 text-white',
};

export const ProposalDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);
  const [voted, setVoted] = useState<VoteChoice | null>(null);
  const [voteError, setVoteError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchProposal(id)
      .then(setProposal)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleVote = async (choice: VoteChoice) => {
    if (!proposal || voting) return;
    const voterId = localStorage.getItem('user_id') ?? 'anonymous';
    setVoting(true);
    setVoteError(null);
    try {
      await castVote(proposal.id, { voterId, vote: choice });
      setVoted(choice);
      // Optimistically update counts
      setProposal((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          yesVotes: choice === 'yes' ? prev.yesVotes + 1 : prev.yesVotes,
          noVotes: choice === 'no' ? prev.noVotes + 1 : prev.noVotes,
          abstainVotes: choice === 'abstain' ? prev.abstainVotes + 1 : prev.abstainVotes,
        };
      });
    } catch (e) {
      setVoteError(e instanceof Error ? e.message : 'Vote failed');
    } finally {
      setVoting(false);
    }
  };

  if (loading) return <p className="p-6 text-gray-500">Loading…</p>;
  if (error || !proposal) return <p className="p-6 text-red-500">Error: {error ?? 'Not found'}</p>;

  const total = proposal.yesVotes + proposal.noVotes + proposal.abstainVotes;
  const yesPercent = total > 0 ? Math.round((proposal.yesVotes / total) * 100) : 0;
  const noPercent = total > 0 ? Math.round((proposal.noVotes / total) * 100) : 0;
  const isActive = proposal.status === 'active' && new Date(proposal.votingEndsAt) > new Date();

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Link to="/" className="text-purple-600 hover:underline text-sm mb-4 inline-block">← Back to proposals</Link>

      <h1 className="text-2xl font-bold text-gray-900 mt-2">{proposal.title}</h1>
      <p className="text-sm text-gray-400 mt-1">
        Voting ends {new Date(proposal.votingEndsAt).toLocaleString()}
      </p>

      <p className="mt-4 text-gray-700 whitespace-pre-wrap">{proposal.description}</p>

      {/* Vote breakdown */}
      <div className="mt-6 space-y-2">
        {(['yes', 'no', 'abstain'] as VoteChoice[]).map((choice) => {
          const count = choice === 'yes' ? proposal.yesVotes : choice === 'no' ? proposal.noVotes : proposal.abstainVotes;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const barColor = choice === 'yes' ? 'bg-green-500' : choice === 'no' ? 'bg-red-500' : 'bg-gray-400';
          return (
            <div key={choice}>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span className="capitalize">{choice}</span>
                <span>{count} ({pct}%)</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
        <p className="text-xs text-gray-400 text-right">{total} total votes</p>
      </div>

      {/* Voting buttons */}
      {isActive && !voted && (
        <div className="mt-6">
          <p className="text-sm font-medium text-gray-700 mb-3">Cast your vote:</p>
          <div className="flex gap-3">
            {(['yes', 'no', 'abstain'] as VoteChoice[]).map((choice) => (
              <button
                key={choice}
                onClick={() => handleVote(choice)}
                disabled={voting}
                className={`flex-1 py-2 rounded-lg font-medium text-sm capitalize transition-colors disabled:opacity-50 ${VOTE_STYLES[choice]}`}
              >
                {choice}
              </button>
            ))}
          </div>
          {voteError && <p className="text-red-500 text-sm mt-2">{voteError}</p>}
        </div>
      )}

      {voted && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
          ✓ You voted <strong>{voted}</strong>. Thank you for participating!
        </div>
      )}

      {!isActive && (
        <p className="mt-6 text-sm text-gray-500 italic">Voting has ended for this proposal.</p>
      )}
    </div>
  );
};
