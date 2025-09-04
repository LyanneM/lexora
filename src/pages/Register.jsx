import "../styles/login.css"; // Reuse login styles for now

function Register() {
  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Create an Account</h2>
        <form>
          <input type="text" placeholder="Full Name" required />
          <input type="email" placeholder="Email" required />
          <input type="password" placeholder="Password" required />
          <button type="submit">Register</button>
        </form>
      </div>
    </div>
  );
}

export default Register;
