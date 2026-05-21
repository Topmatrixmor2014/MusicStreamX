import axios from 'axios';
import type { Proposal, CreateProposalPayload, CastVotePayload } from '../types/governance';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
});

// Attach JWT from localStorage if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function fetchProposals(status?: string): Promise<Proposal[]> {
  const params = status ? { status } : {};
  const { data } = await api.get<{ proposals: Proposal[] }>('/api/v1/governance/proposals', { params });
  return data.proposals;
}

export async function fetchProposal(id: string): Promise<Proposal> {
  const { data } = await api.get<Proposal>(`/api/v1/governance/proposals/${id}`);
  return data;
}

export async function createProposal(payload: CreateProposalPayload): Promise<Proposal> {
  const { data } = await api.post<{ data: Proposal }>('/api/v1/governance/proposals', payload);
  return data.data;
}

export async function castVote(proposalId: string, payload: CastVotePayload): Promise<void> {
  await api.post(`/api/v1/governance/proposals/${proposalId}/vote`, payload);
}
