import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchProposals } from '../api/governance';
import type { Proposal, ProposalStatus } from '../types/governance';

const STATUS_COLORS: Record<ProposalStatus, string> = {
  active: 'bg-green-100 text-green-800',
  passed: 'bg-blue-100 text-blue-800',
  rejected: 'bg-red-100 text-red-800',
};

export const ProposalList: React.FC = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchProposals(filter || undefined)
      .then(setProposals)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [filter]);

  const totalVotes = (p: Proposal) => p.yesVotes + p.noVotes + p.abstainVotes;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Governance Proposals</h1>
        <Link
          to="/create"
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
        >
          + New Proposal
        </Link>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-6">
        {(['', 'active', 'passed', 'rejected'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === s
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading && <p className="text-gray-500">Loading proposals…</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      <ul className="space-y-4">
        {proposals.map((p) => {
          const total = totalVotes(p);
          const yesPercent = total > 0 ? Math.round((p.yesVotes / total) * 100) : 0;
          return (
            <li key={p.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <Link to={`/proposals/${p.id}`} className="text-lg font-semibold text-gray-900 hover:text-purple-600 truncate block">
                    {p.title}
                  </Link>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{p.description}</p>
                </div>
                <span className={`shrink-0 px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[p.status]}`}>
                  {p.status}
                </span>
              </div>

              {/* Vote bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Yes {p.yesVotes}</span>
                  <span>{total} votes</span>
                  <span>No {p.noVotes}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${yesPercent}%` }}
                  />
                </div>
              </div>

              <p className="text-xs text-gray-400 mt-2">
                Voting ends {new Date(p.votingEndsAt).toLocaleDateString()}
              </p>
            </li>
          );
        })}
        {!loading && proposals.length === 0 && (
          <p className="text-gray-500 text-center py-8">No proposals found.</p>
        )}
      </ul>
    </div>
  );
};
