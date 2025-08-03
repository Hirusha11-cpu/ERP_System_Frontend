import React, { useState } from 'react'
import { FiFacebook, FiGithub, FiTwitter } from 'react-icons/fi'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'

const LoginForm = ({ registerPath, resetPath }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await axios.post('/api/login', {
        email,
        password,
        device_name: 'web'
      })
      
      // Store token in localStorage if remember me is checked
      if (rememberMe) {
        localStorage.setItem('authToken', response.data.token)
      } else {
        sessionStorage.setItem('authToken', response.data.token)
      }
      
      // Store user data in context or state management
      // You might want to use a context provider for this
      
      toast.success('Login successful')
      navigate('/')
    } catch (error) {
      console.error('Login error:', error)
      toast.error(error.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h2 className="fs-20 fw-bolder mb-4">Login</h2>
      <h4 className="fs-13 fw-bold mb-2">Login to your account</h4>
      <p className="fs-12 fw-medium text-muted">Thank you for coming back to our application</p>
      
      <form onSubmit={handleFormSubmit} className="w-100 mt-4 pt-2">
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
          <input 
            type="password" 
            className="form-control" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
        </div>
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <div className="custom-control custom-checkbox">
              <input 
                type="checkbox" 
                className="custom-control-input" 
                id="rememberMe" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label className="custom-control-label c-pointer" htmlFor="rememberMe">Remember Me</label>
            </div>
          </div>
          <div>
            <Link to={resetPath} className="fs-11 text-primary">Forgot password?</Link>
          </div>
        </div>
        <div className="mt-5">
          <button 
            type="submit" 
            className="btn btn-lg btn-primary w-100"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </div>
      </form>

      {/* <div className="w-100 mt-5 text-center mx-auto">
        <div className="mb-4 border-bottom position-relative">
          <span className="small py-1 px-3 text-uppercase text-muted bg-white position-absolute translate-middle">or</span>
        </div>
        <div className="d-flex align-items-center justify-content-center gap-2">
          <a href="#" className="btn btn-light-brand flex-fill" data-bs-toggle="tooltip" data-bs-trigger="hover" title="Login with Facebook">
            <FiFacebook size={16} />
          </a>
          <a href="#" className="btn btn-light-brand flex-fill" data-bs-toggle="tooltip" data-bs-trigger="hover" title="Login with Twitter">
            <FiTwitter size={16} />
          </a>
          <a href="#" className="btn btn-light-brand flex-fill" data-bs-toggle="tooltip" data-bs-trigger="hover" title="Login with Github">
            <FiGithub size={16} className='text' />
          </a>
        </div>
      </div> */}
      
      <div className="mt-5 text-muted">
        <span> Don't have an account?</span>
        <Link to="/register" className="fw-bold"> Create an Account</Link>
      </div>
    </>
  )
}

export default LoginForm