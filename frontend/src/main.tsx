import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import './lib/i18n';
import { ThemeProvider } from './lib/ThemeContext';

createRoot(document.getElementById('root')!).render(
  <ThemeProvider defaultTheme="system" storageKey="app-theme">
    <App />
  </ThemeProvider>,
)
