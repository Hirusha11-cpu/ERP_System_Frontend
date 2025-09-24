import React, { useState } from 'react'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useUser } from '../../contentApi/UserProvider'

const LoginForm = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const navigate = useNavigate()
  const { refreshUser } = useUser()

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage('')

    try {
      const response = await axios.post('/api/login', {
        email,
        password,
        device_name: 'web',
      })

      if (rememberMe) {
        localStorage.setItem('authToken', response.data.token)
      } else {
        sessionStorage.setItem('authToken', response.data.token)
      }

      await refreshUser()
      toast.success('Login successful')
      navigate('/')
    } catch (error) {
      console.error('Login error:', error)
      const msg =
        error.response?.data?.message ||
        'Invalid credentials. Please try again.'
      setErrorMessage(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h2 className="fs-20 fw-bolder mb-4">Login</h2>
      <h4 className="fs-13 fw-bold mb-2">Login to your account</h4>
      <p className="fs-12 fw-medium text-muted">
        Thank you for coming back to our application
      </p>

      <form onSubmit={handleFormSubmit} className="w-100 mt-4 pt-2">
        {errorMessage && (
          <div className="alert alert-danger py-2">{errorMessage}</div>
        )}

        <div className="mb-4">
          <input
            type="email"
            className="form-control"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <div className="input-group">
            <input
              type={showPassword ? 'text' : 'password'}
              className="form-control"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="form-check">
            <input
              type="checkbox"
              className="form-check-input"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <label className="form-check-label fs-12" htmlFor="rememberMe">
              Remember me
            </label>
          </div>
          <div>
            <Link to="/forgot-password" className="fs-11 text-primary text-decoration-none">
              Forgot password?
            </Link>
          </div>
        </div>

        <div className="mt-4">
          <button
            type="submit"
            className="btn btn-lg btn-primary w-100"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </div>
      </form>

      <div className="mt-5 text-muted text-center">
        <span>Don't have an account?</span>
        <Link to="/register" className="fw-bold text-decoration-none ms-1">
          Create an Account
        </Link>
      </div>
    </>
  )
}

export default LoginForm