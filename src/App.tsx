import MaintexShell from './components/shell/MaintexShell';
import { LanguageProvider } from './i18n/LanguageContext';

export default function App() {
  return (
    <LanguageProvider>
      <MaintexShell />
    </LanguageProvider>
  );
}
