import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import { FiEye, FiEyeOff } from 'react-icons/fi'

const ResetPassword = () => {
  const [searchParams] = useSearchParams()
  const [formData, setFormData] = useState({
    email: '',
    token: '',
    password: '',
    password_confirmation: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [validToken, setValidToken] = useState(false)
  const [checkingToken, setCheckingToken] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const token = searchParams.get('token')
    const email = searchParams.get('email')

    if (token && email) {
      setFormData(prev => ({
        ...prev,
        token: token,
        email: email
      }))
      setValidToken(true)
    }
    setCheckingToken(false)
  }, [searchParams])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    // Basic validation
    if (formData.password !== formData.password_confirmation) {
      toast.error('Passwords do not match')
      setLoading(false)
      return
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters long')
      setLoading(false)
      return
    }

    try {
      const response = await axios.post('/api/reset-password', formData)
      
      toast.success('Password reset successfully!')
      navigate('/login')
    } catch (error) {
      console.error('Reset password error:', error)
      const message = error.response?.data?.message || 'Failed to reset password. Please try again.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  if (checkingToken) {
    return (
      <div className="container-fluid">
        <div className="row justify-content-center align-items-center min-vh-100">
          <div className="col-md-4 text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Verifying reset link...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!validToken) {
    return (
      <div className="container-fluid">
        <div className="row justify-content-center align-items-center min-vh-100">
          <div className="col-md-4">
            <div className="card shadow">
              <div className="card-body p-5 text-center">
                <h2 className="fs-20 fw-bolder mb-4">Invalid Reset Link</h2>
                <div className="alert alert-danger">
                  <p className="mb-3">The password reset link is invalid or has expired.</p>
                  <p>Please request a new reset link from the forgot password page.</p>
                </div>
                <Link to="/forgot-password" className="btn btn-primary">
                  Request New Reset Link
                </Link>
                <div className="mt-3">
                  <Link to="/login" className="text-decoration-none">
                    ← Back to Login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container-fluid">
      <div className="row justify-content-center align-items-center min-vh-100">
        <div className="col-md-4 col-lg-4">
          <div className="card shadow">
            <div className="card-body p-5">
              <h2 className="fs-20 fw-bolder mb-4 text-center">Reset Password</h2>
              <p className="text-muted text-center mb-4">
                Enter your new password below.
              </p>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label fw-medium">
                    Email
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="password" className="form-label fw-medium">
                    New Password
                  </label>
                  <div className="input-group">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-control"
                      id="password"
                      name="password"
                      placeholder="Enter new password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength="8"
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                    </button>
                  </div>
                  <div className="form-text">
                    Password must be at least 8 characters long.
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="password_confirmation" className="form-label fw-medium">
                    Confirm New Password
                  </label>
                  <div className="input-group">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="form-control"
                      id="password_confirmation"
                      name="password_confirmation"
                      placeholder="Confirm new password"
                      value={formData.password_confirmation}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="d-grid gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={loading}
                  >
                    {loading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              </form>

              <div className="text-center mt-4">
                <Link to="/login" className="text-decoration-none">
                  ← Back to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword