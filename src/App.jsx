// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Home from "./pages/Home";
import ChooseRole from "./pages/ChooseRole";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AdminPanel from "./pages/AdminPanel";
import Notebook from "./pages/Notebook";
import Quiz from "./pages/Quiz";
import NoteTypeSelector from "./components/NoteTypeSelector";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import "./App.css";
import MathNotebook from "./pages/MathNotebook";
import CodeNotebook from "./pages/CodeNotebook";
import QuizMode from './pages/QuizMode';
import QuizSession from './pages/QuizSession';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/choose-role" element={<ChooseRole />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/adminpanel" element={<AdminPanel />} />
            
        
              {/* Note creation flow */}
             <Route path="/notebook/create" element={<NoteTypeSelector />} />
             <Route path="/notebook/math/:id?" element={<MathNotebook />} />
             <Route path="/notebook/code/:id?" element={<CodeNotebook />} />
             <Route path="/notebook/create/:type" element={<Notebook />} />
             <Route path="/notebook/:id" element={<Notebook />} />
              
              {/* Quiz routes */}
              <Route path="/quiz" element={<Quiz />} />
              <Route path="/quiz-mode" element={<QuizMode />} />
              <Route path="/quiz-session" element={<QuizSession />} />

             
              
              {/* Optional: Add a 404 page */}
              <Route path="*" element={<div>Page Not Found</div>} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;