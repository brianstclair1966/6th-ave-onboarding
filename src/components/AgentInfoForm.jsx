import { useState, useEffect } from 'react'

export default function AgentInfoForm() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  })
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    // Check if agent info already exists in localStorage
    const stored = localStorage.getItem('agentInfo')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setFormData(parsed)
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

    // Clear success message after 3 seconds
    setTimeout(() => {
      setSubmitted(false)
    }, 3000)
  }

  return (
    <div className="bg-brand-cream border-b border-gray-200 p-4 mb-8">
      {submitted && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-sm">
          <p className="text-green-800 font-medium">
            ✓ Welcome, {formData.firstName} {formData.lastName}! Your information has been saved.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3 items-end">
        <div className="flex-1 min-w-0">
          <label htmlFor="firstName" className="block text-xs font-semibold text-brand-navy mb-1">
            First Name
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className={`w-full px-3 py-2 text-sm border-2 rounded focus:outline-none transition ${
              errors.firstName
                ? 'border-red-500 focus:border-red-600 bg-red-50'
                : 'border-gray-300 focus:border-brand-coral bg-white'
            }`}
            placeholder="First name"
          />
          {errors.firstName && (
            <p className="text-red-600 text-xs mt-0.5">{errors.firstName}</p>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <label htmlFor="lastName" className="block text-xs font-semibold text-brand-navy mb-1">
            Last Name
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className={`w-full px-3 py-2 text-sm border-2 rounded focus:outline-none transition ${
              errors.lastName
                ? 'border-red-500 focus:border-red-600 bg-red-50'
                : 'border-gray-300 focus:border-brand-coral bg-white'
            }`}
            placeholder="Last name"
          />
          {errors.lastName && (
            <p className="text-red-600 text-xs mt-0.5">{errors.lastName}</p>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <label htmlFor="email" className="block text-xs font-semibold text-brand-navy mb-1">
            Your email address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-3 py-2 text-sm border-2 rounded focus:outline-none transition ${
              errors.email
                ? 'border-red-500 focus:border-red-600 bg-red-50'
                : 'border-gray-300 focus:border-brand-coral bg-white'
            }`}
            placeholder="your@email.com"
          />
          {errors.email && (
            <p className="text-red-600 text-xs mt-0.5">{errors.email}</p>
          )}
        </div>

        <button
          type="submit"
          className="px-6 py-2 bg-brand-coral hover:bg-red-600 text-white font-bold text-sm rounded transition duration-200 whitespace-nowrap"
        >
          Continue
        </button>
      </form>
    </div>
  )
}
