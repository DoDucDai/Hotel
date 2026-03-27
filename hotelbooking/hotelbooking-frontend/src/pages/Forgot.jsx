import { useState } from "react";
import { useToast } from "../components/ToastProvider";

function Forgot() {
  const [email, setEmail] = useState("");
  const toast = useToast();

  const handleSubmit = (event) => {
    event.preventDefault();
    toast.info(`Da gui yeu cau dat lai mat khau cho ${email || "email cua ban"} (demo)`);
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2>Forgot Password</h2>

        <form onSubmit={handleSubmit}>
          <input
            placeholder="Enter your email"
            onChange={(event) => setEmail(event.target.value)}
          />

          <button>Send Reset Link</button>
        </form>
      </div>
    </div>
  );
}

export default Forgot;
