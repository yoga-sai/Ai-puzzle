import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Play from './pages/Play.jsx';

function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto p-6">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Adaptive Parsons</h1>
        <p className="text-gray-600 mb-8">Welcome to Adaptive Parsons Puzzle Platform</p>
        <div className="space-y-4">
          <Link
            to="/play/1"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
          >
            Try Puzzle (Demo)
          </Link>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/play/:id" element={<Play />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
