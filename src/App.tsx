import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import QAEntry from './pages/QAEntry';
import QAPage from './pages/QAPage';
import QASummary from './pages/QASummary';

// BASE_URL from Vite (e.g. /AP1-C01-QA/); React Router basename has no trailing slash
const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

function App() {
  return (
    <BrowserRouter basename={basename}>
      <Toaster />
      <Routes>
        <Route path="/qa" element={<QAEntry />} />
        <Route path="/qa/:uuid/summary" element={<QASummary />} />
        <Route path="/qa/:uuid/:id" element={<QAPage />} />
        <Route path="/" element={<Navigate to="/qa" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
