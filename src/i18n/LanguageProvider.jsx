import { useEffect, useState } from 'react';
import { LanguageContext } from './context';
import { translate, languageIndex } from './messages';
export default function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    try { const saved = localStorage.getItem('clubsim-language'); return Object.hasOwn(languageIndex, saved) ? saved : 'uz'; } catch { return 'uz'; }
  });
  useEffect(() => {
    document.documentElement.lang = language;
    document.title = 'Club Simulator';
    try { localStorage.setItem('clubsim-language', language); } catch { /* Private browsing can disable storage. */ }
  }, [language]);
  const t = (key, values) => translate(language, key, values);
  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>;
}
