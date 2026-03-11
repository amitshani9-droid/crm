import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import JoinPage from './components/JoinPage'; // We will create this next
import ImportPage from './components/ImportPage';

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/join" element={<JoinPage />} />
          <Route path="/import" element={<ImportPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
