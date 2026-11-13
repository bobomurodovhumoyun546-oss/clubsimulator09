import {BrowserRouter,Routes,Route} from 'react-router-dom';
import LanguageProvider from './i18n/LanguageProvider';
import ThemeProvider from './theme/ThemeProvider';
import AuthProvider from './auth/AuthProvider';
import GameShell from './game/GameShell';
import GameAuth from './game/GameAuth';
export default function App(){return <LanguageProvider><ThemeProvider><AuthProvider><BrowserRouter><Routes><Route path="/login" element={<GameAuth/>}/><Route path="/signup" element={<GameAuth signup/>}/><Route path="/account" element={<GameAuth profile/>}/><Route path="*" element={<GameShell/>}/></Routes></BrowserRouter></AuthProvider></ThemeProvider></LanguageProvider>;}
