import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../services/api";
import AuthCard from "../components/AuthCard";
import "../styles/forms.css";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      await registerUser(name, email, password);
      navigate("/login");
    } catch (err) {
      const message = err.response?.data?.detail || "Registration failed";
      setError(message);
    }
  }

  return (
    <AuthCard
      title="Open a new file"
      footer={
        <>Already have an account? <Link to="/login">Log in</Link></>
      }
    >
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn-primary">Create Account</button>
      </form>
    </AuthCard>
  );
}

export default Register;