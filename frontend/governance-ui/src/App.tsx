import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ProposalList } from './components/ProposalList';
import { ProposalDetail } from './components/ProposalDetail';
import { CreateProposal } from './components/CreateProposal';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <Link to="/" className="text-xl font-bold text-purple-700">
            🗳️ MusicStreamX Governance
          </Link>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<ProposalList />} />
            <Route path="/proposals/:id" element={<ProposalDetail />} />
            <Route path="/create" element={<CreateProposal />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
