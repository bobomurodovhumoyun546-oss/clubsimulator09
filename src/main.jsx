import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './index.css';
import './game/game.css';
import './game/packs.css';
createRoot(document.getElementById('root')).render(<StrictMode><App/></StrictMode>);
