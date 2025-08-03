import React, { useState } from 'react'
import { FiEye, FiEyeOff, FiHash } from 'react-icons/fi'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'

const RegisterForm = ({ path }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    company_id: '',
    role_id: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [newsletter, setNewsletter] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await axios.post('/api/register', {
        ...formData,
        terms_accepted: termsAccepted
      })
      
      toast.success('Registration successful! Please login.')
      navigate('/login'); // Redirect to login page
    } catch (error) {
      console.error('Registration error:', error)
      toast.error(error.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  // In a real app, you would fetch these from your API
  const companies = [
    { id: 1, name: 'Apple Holidays' },
    { id: 2, name: 'Aahaas' },
    { id: 3, name: 'Shirmila Travels' }
  ]

  const roles = [
    { id: 1, name: 'Admin' },
    { id: 2, name: 'Manager' },
    { id: 3, name: 'Staff' }
  ]

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
        
        <div className="mb-4">
          <select
            name="company_id"
            className="form-control"
            value={formData.company_id}
            onChange={handleChange}
            required
          >
            <option value="">Select Company</option>
            {companies.map(company => (
              <option key={company.id} value={company.id}>{company.name}</option>
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
            {roles.map(role => (
              <option key={role.id} value={role.id}>{role.name}</option>
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
        </div>
        
        <div className="mt-4">
          <div className="custom-control custom-checkbox mb-2">
            <input
              type="checkbox"
              className="custom-control-input"
              id="receiveMail"
              checked={newsletter}
              onChange={(e) => setNewsletter(e.target.checked)}
            />
            <label className="custom-control-label c-pointer text-muted" htmlFor="receiveMail">
              Yes, I want to receive community emails
            </label>
          </div>
          
          <div className="custom-control custom-checkbox">
            <input
              type="checkbox"
              className="custom-control-input"
              id="termsCondition"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              required
            />
            <label className="custom-control-label c-pointer text-muted" htmlFor="termsCondition">
              I agree to all the <a href="#">Terms & Conditions</a>
            </label>
          </div>
        </div>
        
        <div className="mt-5">
          <button
            type="submit"
            className="btn btn-lg btn-primary w-100"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Create Account'}
          </button>
        </div>
      </form>
      
      <div className="mt-5 text-muted">
        <span>Already have an account?</span>
        <Link to="/login" className="fw-bold"> Login</Link>
      </div>
    </>
  )
}

export default RegisterForm