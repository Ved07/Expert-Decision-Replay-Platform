import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser, saveToken } from "../services/api";
import AuthCard from "../components/AuthCard";
import "../styles/forms.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      const data = await loginUser(email, password);
      saveToken(data.access_token);
      setError("");
      navigate("/dashboard");
    } catch (err) {
      setError("Invalid email or password");
    }
  }

  return (
    <AuthCard
      title="Sign in to your file"
      footer={
        <>Don't have an account? <Link to="/register">Register</Link></>
      }
    >
      <form onSubmit={handleSubmit}>
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
        <button type="submit" className="btn-primary">Log In</button>
      </form>
    </AuthCard>
  );
}

export default Login;