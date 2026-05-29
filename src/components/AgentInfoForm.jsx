import { useState, useEffect } from 'react'

export default function AgentInfoForm() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  })
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [showForm, setShowForm] = useState(true)

  useEffect(() => {
    // Check if agent info already exists in localStorage
    const stored = localStorage.getItem('agentInfo')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setFormData(parsed)
        setShowForm(false)
      } catch (e) {
        console.error('Error parsing stored agent info:', e)
      }
    }
  }, [])

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    // Store in localStorage
    localStorage.setItem('agentInfo', JSON.stringify(formData))
    setSubmitted(true)
    setShowForm(false)

    // Clear success message after 3 seconds
    setTimeout(() => {
      setSubmitted(false)
    }, 3000)
  }

  if (!showForm) {
    return (
      <div className="mb-8">
        {submitted && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <p className="text-green-800 font-medium">
              Welcome, {formData.firstName} {formData.lastName}! Your information has been saved.
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8 max-w-md">
      <h3 className="text-2xl font-bold text-brand-navy mb-6">Get Started</h3>

      {submitted && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-800 font-medium">
            Welcome, {formData.firstName} {formData.lastName}! Your information has been saved.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-semibold text-brand-navy mb-2">
            First Name
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition ${
              errors.firstName
                ? 'border-red-500 focus:border-red-600 bg-red-50'
                : 'border-gray-300 focus:border-brand-coral bg-white'
            }`}
            placeholder="Your first name"
          />
          {errors.firstName && (
            <p className="text-red-600 text-sm mt-1">{errors.firstName}</p>
          )}
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-semibold text-brand-navy mb-2">
            Last Name
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition ${
              errors.lastName
                ? 'border-red-500 focus:border-red-600 bg-red-50'
                : 'border-gray-300 focus:border-brand-coral bg-white'
            }`}
            placeholder="Your last name"
          />
          {errors.lastName && (
            <p className="text-red-600 text-sm mt-1">{errors.lastName}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-brand-navy mb-2">
            Personal Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition ${
              errors.email
                ? 'border-red-500 focus:border-red-600 bg-red-50'
                : 'border-gray-300 focus:border-brand-coral bg-white'
            }`}
            placeholder="your.email@example.com"
          />
          {errors.email && (
            <p className="text-red-600 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        <button
          type="submit"
          className="w-full bg-brand-coral hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg transition duration-200 mt-6"
        >
          Continue
        </button>
      </form>
    </div>
  )
}
