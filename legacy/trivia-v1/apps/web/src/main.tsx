import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router';
import { Centered } from './components/Centered';
import './index.css';
import AbbyPage from './pages/AbbyPage';
import AdminPage from './pages/AdminPage';
import HostPage from './pages/HostPage';
import StagePage from './pages/StagePage';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StagePage />} />
        <Route path="/host" element={<HostPage />} />
        <Route path="/abby" element={<AbbyPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Centered>Página no encontrada</Centered>} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
