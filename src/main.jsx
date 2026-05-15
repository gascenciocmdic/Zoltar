import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import UATWrapper from './UATWrapper.jsx';
import TermsPage from './components/legal/TermsPage.jsx';
import PrivacyPage from './components/legal/PrivacyPage.jsx';
import { ThemeProvider } from './lib/themeContext.jsx';

const path = window.location.pathname;

function Root() {
  if (path.startsWith('/uat')) return <UATWrapper />;
  if (path.startsWith('/terms')) return <TermsPage />;
  if (path.startsWith('/privacy')) return <PrivacyPage />;
  return <App />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <Root />
    </ThemeProvider>
  </StrictMode>,
);
