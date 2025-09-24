import React, { useState } from "react";
import { FiEye, FiEyeOff, FiX } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const RegisterForm = ({ path }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    company_id: 1,
    role_id: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [newsletter, setNewsletter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showTermsModal, setShowTermsModal] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "password" || name === "password_confirmation") {
      if (
        (name === "password_confirmation" && value !== formData.password) ||
        (name === "password" && formData.password_confirmation && value !== formData.password_confirmation)
      ) {
        setError("Passwords do not match");
      } else {
        setError("");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (error) {
      toast.error("Please fix errors before submitting.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post("/api/register", {
        ...formData,
        terms_accepted: termsAccepted,
      });

      toast.success("Registration successful! Please login.");
      navigate("/login");
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const openTermsModal = (e) => {
    e.preventDefault();
    setShowTermsModal(true);
  };

  const closeTermsModal = () => {
    setShowTermsModal(false);
  };

  const companies = [
    { id: 1, name: "Apple Holidays" },
    { id: 2, name: "Aahaas" },
    { id: 3, name: "Sharmila Tours and Travels" },
  ];

  const roles = [
    { id: 1, name: "Admin" },
    { id: 2, name: "Manager" },
    { id: 3, name: "Staff" },
  ];

  const termsAndConditions = `
    <h4>Terms and Conditions</h4>
    <p><strong>Last Updated:</strong> ${new Date().toLocaleDateString()}</p>
    
    <h5>1. Acceptance of Terms</h5>
    <p>By registering for an account, you agree to be bound by these Terms and Conditions and our Privacy Policy.</p>
    
    <h5>2. Account Registration</h5>
    <p>You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your password and account.</p>
    
    <h5>3. User Responsibilities</h5>
    <p>You agree to use the application only for lawful purposes and in accordance with these terms. You are responsible for all activities that occur under your account.</p>
    
    <h5>4. Data Privacy</h5>
    <p>We collect and process personal data in accordance with our Privacy Policy. By using our services, you consent to such processing.</p>
    
    <h5>5. Intellectual Property</h5>
    <p>All content, features, and functionality of the application are owned by us and are protected by international copyright laws.</p>
    
    <h5>6. Termination</h5>
    <p>We reserve the right to terminate or suspend your account at our sole discretion, without notice, for conduct that we believe violates these Terms.</p>
    
    <h5>7. Limitation of Liability</h5>
    <p>We shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the application.</p>
    
    <h5>8. Changes to Terms</h5>
    <p>We may modify these Terms at any time. We will notify you of any changes by posting the new Terms on this page.</p>
    
    <h5>9. Contact Information</h5>
    <p>If you have any questions about these Terms, please contact us at support@yourapp.com</p>
  `;

  return (
    <>
      <h2 className="fs-20 fw-bolder mb-4">Register</h2>
      <h4 className="fs-13 fw-bold mb-2">Create your account</h4>
      <p className="fs-12 fw-medium text-muted">
        Let's get you all setup so you can start using the application.
      </p>

      <form onSubmit={handleSubmit} className="w-100 mt-4 pt-2">
        <div className="mb-4">
          <input
            type="text"
            name="name"
            className="form-control"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-4">
          <input
            type="email"
            name="email"
            className="form-control"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-4 d-none">
          <select
            name="company_id"
            className="form-control"
            value={formData.company_id}
            onChange={handleChange}
            required
          >
            <option value="">Select Company</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <select
            name="role_id"
            className="form-control"
            value={formData.role_id}
            onChange={handleChange}
            required
          >
            <option value="">Select Role</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <div className="input-group">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              className="form-control"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </button>
          </div>
        </div>

        <div className="mb-4">
          <input
            type="password"
            name="password_confirmation"
            className="form-control"
            placeholder="Confirm Password"
            value={formData.password_confirmation}
            onChange={handleChange}
            required
          />
          {error && <small className="text-danger fs-11">{error}</small>}
        </div>

        <div className="mt-4">
          <div className="form-check mb-3">
            <input
              type="checkbox"
              className="form-check-input"
              id="termsCondition"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              required
            />
            <label
              className="form-check-label c-pointer text-muted fs-12"
              htmlFor="termsCondition"
            >
              I agree to all the{" "}
              <a href="#" onClick={openTermsModal} className="text-primary">
                Terms & Conditions
              </a>
            </label>
          </div>
        </div>

        <div className="mt-5">
          <button
            type="submit"
            className="btn btn-lg btn-primary w-100"
            disabled={loading || !!error || !termsAccepted}
          >
            {loading ? "Registering..." : "Create Account"}
          </button>
        </div>
      </form>

      <div className="mt-5 text-muted text-center">
        <span>Already have an account?</span>
        <Link to="/login" className="fw-bold text-decoration-none ms-1">
          Login
        </Link>
      </div>

      {/* Terms & Conditions Modal */}
      {showTermsModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fs-18 fw-bold">Terms and Conditions</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeTermsModal}
                >
                  <FiX size={18} />
                </button>
              </div>
              <div className="modal-body">
                <div 
                  className="terms-content fs-13"
                  dangerouslySetInnerHTML={{ __html: termsAndConditions }}
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeTermsModal}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setTermsAccepted(true);
                    closeTermsModal();
                  }}
                >
                  I Accept
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop styles */}
      <style jsx>{`
        .modal {
          backdrop-filter: blur(5px);
        }
        .terms-content h4 {
          color: #2c3e50;
          margin-bottom: 1rem;
        }
        .terms-content h5 {
          color: #34495e;
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
          font-size: 14px;
          font-weight: 600;
        }
        .terms-content p {
          color: #7f8c8d;
          line-height: 1.6;
          margin-bottom: 1rem;
          font-size: 12px;
        }
        .modal-header {
          border-bottom: 1px solid #ecf0f1;
          padding: 1rem 1.5rem;
        }
        .modal-footer {
          border-top: 1px solid #ecf0f1;
          padding: 1rem 1.5rem;
        }
      `}</style>
    </>
  );
};

export default RegisterForm;