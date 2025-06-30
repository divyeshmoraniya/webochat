import './App.css';
import {Routes , Route} from "react-router-dom"
import LandingPage from './component/LandingPage';
import Chat from './component/Chat';
import HideChat from './component/HideChat';
function App() {


  return (
    <>
        <Routes>
            <Route path='/' element={<LandingPage />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="hidechat" element={<HideChat />} />
        </Routes>
    </>
  );
}

export default App;
