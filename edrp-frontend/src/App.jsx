import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import DecisionList from "./pages/DecisionList";
import CreateDecision from "./pages/CreateDecision";
import DecisionDetail from "./pages/DecisionDetail";
import Landing from "./pages/Landing";

function App() {
  return (
    <div>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/" element={<Landing />} />
      <Route path="/decisions/new" element={<CreateDecision />} />
      <Route path="/decisions/:id" element={<DecisionDetail />} />
      <Route path="/decisions" element={<DecisionList />} />
      </Routes>
    </div>
    
  );
}

export default App;