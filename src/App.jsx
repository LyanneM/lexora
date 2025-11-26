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
import EnhancedNotebook from "./pages/EnhancedNotebook"; // ADD THIS IMPORT
import Quiz from "./pages/Quiz";
import NoteTypeSelector from "./components/NoteTypeSelector";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import "./App.css";
import MathNotebook from "./pages/MathNotebook";
import CodeNotebook from "./pages/CodeNotebook";
import QuizMode from './pages/QuizMode';
import QuizReview from './pages/QuizReview';
import QuizSession from './pages/QuizSession';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import ProtectedRoute from "./components/ProtectedRoute";
import ComplexMathNotebook from "./pages/ComplexMathNotebook";
import Feedback from "./pages/Feedback";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <main className="main-content">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route path="/choose-role" element={<ChooseRole />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              
              {/* Protected routes - require authentication */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                  path="/feedback" 
                element={
             <ProtectedRoute>
                  <Feedback />
                    </ProtectedRoute>
                 } 
            />
              
              <Route 
                path="/adminpanel" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminPanel />
                  </ProtectedRoute>
                } 
              />
            
              {/* Note creation flow - protected */}
              <Route 
                path="/notebook/create" 
                element={
                  <ProtectedRoute>
                    <NoteTypeSelector />
                  </ProtectedRoute>
                } 
              />
              
              {/* Math Notebook Routes */}
              <Route 
                path="/notebook/math/:id?" 
                element={
                  <ProtectedRoute>
                    <MathNotebook />
                  </ProtectedRoute>
                } 
              />
              
              
           
  
               <Route 
                  path="/notebook/complex-math/:id?" 
                  element={
                    <ProtectedRoute>
                      <ComplexMathNotebook />
                   </ProtectedRoute>
              } 
            />
              
              <Route 
                path="/notebook/code/:id?" 
                element={
                  <ProtectedRoute>
                    <CodeNotebook />
                  </ProtectedRoute>
                } 
              />
              
              {/* ENHANCED NOTEBOOK ROUTES - ADD THESE */}
              <Route 
                path="/notebook-enhanced/:id?" 
                element={
                  <ProtectedRoute>
                    <EnhancedNotebook />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/notebook-new/:id?" 
                element={
                  <ProtectedRoute>
                    <EnhancedNotebook />
                  </ProtectedRoute>
                } 
              />
              
              
              <Route 
                path="/notebook/create/:type" 
                element={
                  <ProtectedRoute>
                    <Notebook />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/notebook/:id" 
                element={
                  <ProtectedRoute>
                    <Notebook />
                  </ProtectedRoute>
                } 
              />

<Route 
  path="/quiz-review/:quizId" 
  element={
    <ProtectedRoute>
      <QuizReview />
    </ProtectedRoute>
  } 
/>
              {/* Quiz routes - protected */}
              <Route 
                path="/quiz" 
                element={
                  <ProtectedRoute>
                    <Quiz />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/quiz-mode" 
                element={
                  <ProtectedRoute>
                    <QuizMode />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/quiz-session" 
                element={
                  <ProtectedRoute>
                    <QuizSession />
                  </ProtectedRoute>
                } 
              />

              {/* Profile and Settings - protected */}
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } 
              />

              {/* Add a 404 page in case of errors */}
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