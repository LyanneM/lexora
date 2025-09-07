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
import QuizCreator from "./pages/QuizCreator";
import Quiz from "./pages/Quiz";
import NoteTypeSelector from "./components/NoteTypeSelector";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import "./App.css";

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
            
              {/* New routes for notebook and quiz functionality */}
              <Route path="/notebook/create" element={<NoteTypeSelector />} />
              <Route path="/notebook/:id" element={<Notebook />} />
              <Route path="/quiz/create" element={<QuizCreator />} />
              <Route path="/quiz/:id" element={<Quiz />} />
              
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