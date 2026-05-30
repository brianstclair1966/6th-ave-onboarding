import { useState, useEffect } from 'react'
import useCheckboxState from '../hooks/useCheckboxState'

export default function EmergencyContactForm() {
  const { toggle } = useCheckboxState(2)
  const [formData, setFormData] = useState({
    trecLicenseNumber: '',
    licenseExpiry: '',
    cellPhone: '',
    birthday: '',
    homeAddressStreet: '',
    homeAddressCity: '',
    homeAddressZip: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactEmail: '',
    hasLocationAccess: false,
  })
  const [agentInfo, setAgentInfo] = useState(null)
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isDisabled, setIsDisabled] = useState(false)

  useEffect(() => {
    // Get agent info from localStorage
    const stored = localStorage.getItem('agentInfo')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setAgentInfo(parsed)
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

    if (!formData.trecLicenseNumber.trim()) {
      newErrors.trecLicenseNumber = 'TREC License # is required'
    }

    if (!formData.licenseExpiry.trim()) {
      newErrors.licenseExpiry = 'License Expiry is required'
    }

    if (!formData.cellPhone.trim()) {
      newErrors.cellPhone = 'Cell Phone is required'
    }

    if (!formData.birthday.trim()) {
      newErrors.birthday = 'Birthday is required'
    }

    if (!formData.homeAddressStreet.trim()) {
      newErrors.homeAddressStreet = 'Street address is required'
    }

    if (!formData.homeAddressCity.trim()) {
      newErrors.homeAddressCity = 'City is required'
    }

    if (!formData.homeAddressZip.trim()) {
      newErrors.homeAddressZip = 'Zip Code is required'
    }

    if (!formData.emergencyContactName.trim()) {
      newErrors.emergencyContactName = 'Emergency Contact Name is required'
    }

    if (!formData.emergencyContactPhone.trim()) {
      newErrors.emergencyContactPhone = 'Emergency Contact Phone is required'
    }

    if (!formData.emergencyContactEmail.trim()) {
      newErrors.emergencyContactEmail = 'Emergency Contact Email is required'
    } else if (!validateEmail(formData.emergencyContactEmail)) {
      newErrors.emergencyContactEmail = 'Please enter a valid email address'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    const newValue = type === 'checkbox' ? checked : value

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }))

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm() || !agentInfo) {
      if (!agentInfo) {
        setError('Agent information not found. Please fill out the initial form first.')
      }
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const submitData = {
        Email: agentInfo.email,
        'TREC License #': formData.trecLicenseNumber,
        'License Expiry': formData.licenseExpiry,
        'Cell Phone': formData.cellPhone,
        Birthday: formData.birthday,
        'Home Address Street': formData.homeAddressStreet,
        'Home Address City': formData.homeAddressCity,
        'Home Address Zip': formData.homeAddressZip,
        'Emergency Contact Name': formData.emergencyContactName,
        'Emergency Contact Phone': formData.emergencyContactPhone,
        'Emergency Contact Email': formData.emergencyContactEmail,
        'Location Access': formData.hasLocationAccess ? 'Yes' : 'No',
      }

      const response = await fetch('/api/submit-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formType: 'emergency-contact',
          data: submitData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit form')
      }

      // Auto-check the corresponding checkbox
      toggle(2, 0)

      setSubmitted(true)
      setIsDisabled(true)

      // Keep data visible - do NOT reset form
    } catch (err) {
      console.error('Form submission error:', err)
      setError(err.message || 'Failed to submit form. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
      <h3 className="text-2xl font-bold text-brand-navy mb-6">Emergency Contact Information</h3>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {submitted && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-800 font-medium">
            Your emergency contact information has been saved successfully!
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* License Section */}
        <div className="border-b pb-6">
          <h4 className="text-lg font-semibold text-brand-navy mb-4">License Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="trecLicenseNumber" className="block text-sm font-semibold text-brand-navy mb-2">
                TREC License #
              </label>
              <input
                type="text"
                id="trecLicenseNumber"
                name="trecLicenseNumber"
                value={formData.trecLicenseNumber}
                onChange={handleChange}
                className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition ${
                  errors.trecLicenseNumber
                    ? 'border-red-500 focus:border-red-600 bg-red-50'
                    : 'border-gray-300 focus:border-brand-coral bg-white'
                }`}
              />
              {errors.trecLicenseNumber && (
                <p className="text-red-600 text-sm mt-1">{errors.trecLicenseNumber}</p>
              )}
            </div>

            <div>
              <label htmlFor="licenseExpiry" className="block text-sm font-semibold text-brand-navy mb-2">
                License Expiry
              </label>
              <input
                type="date"
                id="licenseExpiry"
                name="licenseExpiry"
                value={formData.licenseExpiry}
                onChange={handleChange}
                className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition ${
                  errors.licenseExpiry
                    ? 'border-red-500 focus:border-red-600 bg-red-50'
                    : 'border-gray-300 focus:border-brand-coral bg-white'
                }`}
              />
              {errors.licenseExpiry && (
                <p className="text-red-600 text-sm mt-1">{errors.licenseExpiry}</p>
              )}
            </div>
          </div>
        </div>

        {/* Personal Information Section */}
        <div className="border-b pb-6">
          <h4 className="text-lg font-semibold text-brand-navy mb-4">Personal Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="cellPhone" className="block text-sm font-semibold text-brand-navy mb-2">
                Cell Phone
              </label>
              <input
                type="tel"
                id="cellPhone"
                name="cellPhone"
                value={formData.cellPhone}
                onChange={handleChange}
                className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition ${
                  errors.cellPhone
                    ? 'border-red-500 focus:border-red-600 bg-red-50'
                    : 'border-gray-300 focus:border-brand-coral bg-white'
                }`}
              />
              {errors.cellPhone && (
                <p className="text-red-600 text-sm mt-1">{errors.cellPhone}</p>
              )}
            </div>

            <div>
              <label htmlFor="birthday" className="block text-sm font-semibold text-brand-navy mb-2">
                Birthday
              </label>
              <input
                type="date"
                id="birthday"
                name="birthday"
                value={formData.birthday}
                onChange={handleChange}
                className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition ${
                  errors.birthday
                    ? 'border-red-500 focus:border-red-600 bg-red-50'
                    : 'border-gray-300 focus:border-brand-coral bg-white'
                }`}
              />
              {errors.birthday && (
                <p className="text-red-600 text-sm mt-1">{errors.birthday}</p>
              )}
            </div>
          </div>
        </div>

        {/* Home Address Section */}
        <div className="border-b pb-6">
          <h4 className="text-lg font-semibold text-brand-navy mb-4">Home Address</h4>
          <div className="space-y-4">
            <div>
              <label htmlFor="homeAddressStreet" className="block text-sm font-semibold text-brand-navy mb-2">
                Street Address
              </label>
              <input
                type="text"
                id="homeAddressStreet"
                name="homeAddressStreet"
                value={formData.homeAddressStreet}
                onChange={handleChange}
                className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition ${
                  errors.homeAddressStreet
                    ? 'border-red-500 focus:border-red-600 bg-red-50'
                    : 'border-gray-300 focus:border-brand-coral bg-white'
                }`}
              />
              {errors.homeAddressStreet && (
                <p className="text-red-600 text-sm mt-1">{errors.homeAddressStreet}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="homeAddressCity" className="block text-sm font-semibold text-brand-navy mb-2">
                  City
                </label>
                <input
                  type="text"
                  id="homeAddressCity"
                  name="homeAddressCity"
                  value={formData.homeAddressCity}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition ${
                    errors.homeAddressCity
                      ? 'border-red-500 focus:border-red-600 bg-red-50'
                      : 'border-gray-300 focus:border-brand-coral bg-white'
                  }`}
                />
                {errors.homeAddressCity && (
                  <p className="text-red-600 text-sm mt-1">{errors.homeAddressCity}</p>
                )}
              </div>

              <div>
                <label htmlFor="homeAddressZip" className="block text-sm font-semibold text-brand-navy mb-2">
                  Zip Code
                </label>
                <input
                  type="text"
                  id="homeAddressZip"
                  name="homeAddressZip"
                  value={formData.homeAddressZip}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition ${
                    errors.homeAddressZip
                      ? 'border-red-500 focus:border-red-600 bg-red-50'
                      : 'border-gray-300 focus:border-brand-coral bg-white'
                  }`}
                />
                {errors.homeAddressZip && (
                  <p className="text-red-600 text-sm mt-1">{errors.homeAddressZip}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Contact Section */}
        <div className="border-b pb-6">
          <h4 className="text-lg font-semibold text-brand-navy mb-4">Emergency Contact</h4>
          <div className="space-y-4">
            <div>
              <label htmlFor="emergencyContactName" className="block text-sm font-semibold text-brand-navy mb-2">
                Name
              </label>
              <input
                type="text"
                id="emergencyContactName"
                name="emergencyContactName"
                value={formData.emergencyContactName}
                onChange={handleChange}
                className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition ${
                  errors.emergencyContactName
                    ? 'border-red-500 focus:border-red-600 bg-red-50'
                    : 'border-gray-300 focus:border-brand-coral bg-white'
                }`}
              />
              {errors.emergencyContactName && (
                <p className="text-red-600 text-sm mt-1">{errors.emergencyContactName}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="emergencyContactPhone" className="block text-sm font-semibold text-brand-navy mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  id="emergencyContactPhone"
                  name="emergencyContactPhone"
                  value={formData.emergencyContactPhone}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition ${
                    errors.emergencyContactPhone
                      ? 'border-red-500 focus:border-red-600 bg-red-50'
                      : 'border-gray-300 focus:border-brand-coral bg-white'
                  }`}
                />
                {errors.emergencyContactPhone && (
                  <p className="text-red-600 text-sm mt-1">{errors.emergencyContactPhone}</p>
                )}
              </div>

              <div>
                <label htmlFor="emergencyContactEmail" className="block text-sm font-semibold text-brand-navy mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="emergencyContactEmail"
                  name="emergencyContactEmail"
                  value={formData.emergencyContactEmail}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition ${
                    errors.emergencyContactEmail
                      ? 'border-red-500 focus:border-red-600 bg-red-50'
                      : 'border-gray-300 focus:border-brand-coral bg-white'
                  }`}
                />
                {errors.emergencyContactEmail && (
                  <p className="text-red-600 text-sm mt-1">{errors.emergencyContactEmail}</p>
                )}
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  id="hasLocationAccess"
                  name="hasLocationAccess"
                  checked={formData.hasLocationAccess}
                  onChange={handleChange}
                  className="mt-1 w-5 h-5 text-brand-coral border-gray-300 rounded focus:ring-brand-coral cursor-pointer"
                />
                <div>
                  <span className="block text-sm font-semibold text-brand-navy">
                    Does your emergency contact have location access for you?
                  </span>
                  <p className="text-xs text-gray-600 mt-1">
                    Just in case you are out with clients & have an emergency situation.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || isDisabled}
          className="w-full bg-brand-coral hover:bg-red-600 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
        >
          {isLoading ? 'Submitting...' : isDisabled ? '✓ Submitted' : 'Submit Emergency Contact Information'}
        </button>
      </form>
    </div>
  )
}
