import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await axios.post('/api/forgot-password', {
        email: email
      })

      setSuccess(true)
      toast.success('Password reset link sent to your email')
    } catch (error) {
      console.error('Forgot password error:', error)
      const message = error.response?.data?.message || 'Failed to send reset link. Please try again.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-fluid">
      <div className="row justify-content-center align-items-center min-vh-100">
        <div className="col-md">
          <div className="card shadow">
            <div className="card-body p-5">
              <h2 className="fs-20 fw-bolder mb-4 text-center">Forgot Password</h2>
              
              {success ? (
                <div className="text-center">
                  <div className="alert alert-success">
                    <h5 className="fw-bold">Check Your Email</h5>
                    <p className="mb-0">
                      If your email exists in our system, you will receive a password reset link.
                    </p>
                  </div>
                  <div className="mt-4">
                    <Link to="/login" className="btn btn-primary me-2">
                      Back to Login
                    </Link>
                    <button 
                      onClick={() => setSuccess(false)}
                      className="btn btn-outline-secondary"
                    >
                      Try Another Email
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-muted text-center mb-4">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>

                  <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                      <label htmlFor="email" className="form-label fw-medium">
                        Email Address
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        id="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>

                    <div className="d-grid gap-2">
                      <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        disabled={loading}
                      >
                        {loading ? 'Sending...' : 'Send Reset Link'}
                      </button>
                    </div>
                  </form>

                  <div className="text-center mt-4">
                    <Link to="/login" className="text-decoration-none">
                      ← Back to Login
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword