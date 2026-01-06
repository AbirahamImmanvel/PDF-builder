import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TemplateProvider } from './context/TemplateContext';
import Navbar from './components/Navbar';
import TemplatesPage from './pages/TemplatesPage';
import BuilderPage from './pages/BuilderPage';
import ViewTemplatePage from './pages/ViewTemplatePage';

const RouterSetup = () => {
  return (
    <BrowserRouter>
      <TemplateProvider>
        <div style={{ minHeight: '100vh', background: '#f5f7fa' }}>
          <Navbar />
          <Routes>
            <Route path="/" element={<TemplatesPage />} />
            <Route path="/builder" element={<BuilderPage />} />
            <Route path="/builder/:id" element={<BuilderPage />} />
            <Route path="/view/:id" element={<ViewTemplatePage />} />
          </Routes>
        </div>
      </TemplateProvider>
    </BrowserRouter>
  );
};

export default RouterSetup;
