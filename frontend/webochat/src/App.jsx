import './App.css';
import {Routes , Route} from "react-router-dom"
import LandingPage from './component/LandingPage';
import Chat from './component/Chat';
function App() {


  return (
    <>
        <Routes>
            <Route path='/' element={<LandingPage />} />
            <Route path="/chat" element={<Chat />} />
        </Routes>
    </>
  );
}

export default App;
