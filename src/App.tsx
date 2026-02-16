import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import QAEntry from './pages/QAEntry';
import QAPage from './pages/QAPage';
import QASummary from './pages/QASummary';

function App() {
  return (
    <HashRouter>
      <Toaster />
      <Routes>
        <Route path="/qa" element={<QAEntry />} />
        <Route path="/qa/:uuid/summary" element={<QASummary />} />
        <Route path="/qa/:uuid/:id" element={<QAPage />} />
        <Route path="/" element={<Navigate to="/qa" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
