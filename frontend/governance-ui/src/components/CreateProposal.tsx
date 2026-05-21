import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProposal } from '../api/governance';

export const CreateProposal: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', votingEndsAt: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const proposerId = localStorage.getItem('user_id') ?? 'anonymous';
      await createProposal({ ...form, proposerId });
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create proposal');
    } finally {
      setSubmitting(false);
    }
  };

  // Minimum voting end date: tomorrow
  const minDate = new Date(Date.now() + 86400000).toISOString().slice(0, 16);

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Proposal</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="title">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            maxLength={200}
            value={form.title}
            onChange={handleChange}
            placeholder="Short, descriptive title"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="description">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            required
            maxLength={5000}
            rows={6}
            value={form.description}
            onChange={handleChange}
            placeholder="Describe the proposal in detail…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-y"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="votingEndsAt">
            Voting ends at <span className="text-red-500">*</span>
          </label>
          <input
            id="votingEndsAt"
            name="votingEndsAt"
            type="datetime-local"
            required
            min={minDate}
            value={form.votingEndsAt}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit Proposal'}
          </button>
        </div>
      </form>
    </div>
  );
};
