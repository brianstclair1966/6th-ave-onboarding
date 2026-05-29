import { useState, useEffect } from 'react'
import useCheckboxState from '../hooks/useCheckboxState'

export default function AboutYouForm() {
  const { toggle } = useCheckboxState(3)
  const [formData, setFormData] = useState({
    beverage: '',
    currentObsession: '',
    cantLiveWithout: '',
    nonProfit: '',
    favoriteMealFW: '',
    favoriteBarFW: '',
    whatLoveAboutJob: '',
    interestingFact: '',
    enneagram: '',
  })
  const [agentInfo, setAgentInfo] = useState(null)
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

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

  const validateForm = () => {
    const newErrors = {}

    if (!formData.beverage.trim()) {
      newErrors.beverage = 'Beverage preference is required'
    }

    if (!formData.currentObsession.trim()) {
      newErrors.currentObsession = 'Current obsession is required'
    }

    if (!formData.cantLiveWithout.trim()) {
      newErrors.cantLiveWithout = 'This field is required'
    }

    if (!formData.nonProfit.trim()) {
      newErrors.nonProfit = 'Non-profit choice is required'
    }

    if (!formData.favoriteMealFW.trim()) {
      newErrors.favoriteMealFW = 'Favorite meal is required'
    }

    if (!formData.favoriteBarFW.trim()) {
      newErrors.favoriteBarFW = 'Favorite bar/venue is required'
    }

    if (!formData.whatLoveAboutJob.trim()) {
      newErrors.whatLoveAboutJob = 'This field is required'
    }

    if (!formData.interestingFact.trim()) {
      newErrors.interestingFact = 'Interesting fact is required'
    }

    if (!formData.enneagram.trim()) {
      newErrors.enneagram = 'Enneagram type is required'
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
        Beverage: formData.beverage,
        'Current Obsession': formData.currentObsession,
        "Can't Live Without": formData.cantLiveWithout,
        'Non-Profit': formData.nonProfit,
        'Favorite Meal FW': formData.favoriteMealFW,
        'Favorite Bar FW': formData.favoriteBarFW,
        'What Love About Job': formData.whatLoveAboutJob,
        'Interesting Fact': formData.interestingFact,
        Enneagram: formData.enneagram,
      }

      const response = await fetch('/api/submit-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formType: 'about-you',
          data: submitData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit form')
      }

      // Auto-check the corresponding checkbox
      toggle(3, 1)

      setSubmitted(true)

      // Reset form
      setFormData({
        beverage: '',
        currentObsession: '',
        cantLiveWithout: '',
        nonProfit: '',
        favoriteMealFW: '',
        favoriteBarFW: '',
        whatLoveAboutJob: '',
        interestingFact: '',
        enneagram: '',
      })

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSubmitted(false)
      }, 3000)
    } catch (err) {
      console.error('Form submission error:', err)
      setError(err.message || 'Failed to submit form. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
      <h3 className="text-2xl font-bold text-brand-navy mb-6">All About You</h3>

      <p className="text-gray-700 mb-6">
        Help us get to know you better! Share a bit about yourself and what makes you unique.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {submitted && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-800 font-medium">
            Thanks for sharing! Your information has been saved.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="beverage" className="block text-sm font-semibold text-brand-navy mb-2">
            What's your go-to beverage?
          </label>
          <input
            type="text"
            id="beverage"
            name="beverage"
            value={formData.beverage}
            onChange={handleChange}
            className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition ${
              errors.beverage
                ? 'border-red-500 focus:border-red-600 bg-red-50'
                : 'border-gray-300 focus:border-brand-coral bg-white'
            }`}
            placeholder="e.g., Coffee, Tea, Water..."
          />
          {errors.beverage && (
            <p className="text-red-600 text-sm mt-1">{errors.beverage}</p>
          )}
        </div>

        <div>
          <label htmlFor="currentObsession" className="block text-sm font-semibold text-brand-navy mb-2">
            What's your current obsession?
          </label>
          <input
            type="text"
            id="currentObsession"
            name="currentObsession"
            value={formData.currentObsession}
            onChange={handleChange}
            className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition ${
              errors.currentObsession
                ? 'border-red-500 focus:border-red-600 bg-red-50'
                : 'border-gray-300 focus:border-brand-coral bg-white'
            }`}
            placeholder="What are you obsessed with right now?"
          />
          {errors.currentObsession && (
            <p className="text-red-600 text-sm mt-1">{errors.currentObsession}</p>
          )}
        </div>

        <div>
          <label htmlFor="cantLiveWithout" className="block text-sm font-semibold text-brand-navy mb-2">
            What can't you live without?
          </label>
          <input
            type="text"
            id="cantLiveWithout"
            name="cantLiveWithout"
            value={formData.cantLiveWithout}
            onChange={handleChange}
            className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition ${
              errors.cantLiveWithout
                ? 'border-red-500 focus:border-red-600 bg-red-50'
                : 'border-gray-300 focus:border-brand-coral bg-white'
            }`}
            placeholder="What's essential to you?"
          />
          {errors.cantLiveWithout && (
            <p className="text-red-600 text-sm mt-1">{errors.cantLiveWithout}</p>
          )}
        </div>

        <div>
          <label htmlFor="nonProfit" className="block text-sm font-semibold text-brand-navy mb-2">
            Which non-profit would you support?
          </label>
          <input
            type="text"
            id="nonProfit"
            name="nonProfit"
            value={formData.nonProfit}
            onChange={handleChange}
            className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition ${
              errors.nonProfit
                ? 'border-red-500 focus:border-red-600 bg-red-50'
                : 'border-gray-300 focus:border-brand-coral bg-white'
            }`}
            placeholder="Name a non-profit you care about"
          />
          {errors.nonProfit && (
            <p className="text-red-600 text-sm mt-1">{errors.nonProfit}</p>
          )}
        </div>

        <div>
          <label htmlFor="favoriteMealFW" className="block text-sm font-semibold text-brand-navy mb-2">
            Favorite meal in Fort Worth?
          </label>
          <input
            type="text"
            id="favoriteMealFW"
            name="favoriteMealFW"
            value={formData.favoriteMealFW}
            onChange={handleChange}
            className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition ${
              errors.favoriteMealFW
                ? 'border-red-500 focus:border-red-600 bg-red-50'
                : 'border-gray-300 focus:border-brand-coral bg-white'
            }`}
            placeholder="Your favorite Fort Worth meal/restaurant"
          />
          {errors.favoriteMealFW && (
            <p className="text-red-600 text-sm mt-1">{errors.favoriteMealFW}</p>
          )}
        </div>

        <div>
          <label htmlFor="favoriteBarFW" className="block text-sm font-semibold text-brand-navy mb-2">
            Favorite bar/venue in Fort Worth?
          </label>
          <input
            type="text"
            id="favoriteBarFW"
            name="favoriteBarFW"
            value={formData.favoriteBarFW}
            onChange={handleChange}
            className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition ${
              errors.favoriteBarFW
                ? 'border-red-500 focus:border-red-600 bg-red-50'
                : 'border-gray-300 focus:border-brand-coral bg-white'
            }`}
            placeholder="Your favorite Fort Worth bar/venue"
          />
          {errors.favoriteBarFW && (
            <p className="text-red-600 text-sm mt-1">{errors.favoriteBarFW}</p>
          )}
        </div>

        <div>
          <label htmlFor="whatLoveAboutJob" className="block text-sm font-semibold text-brand-navy mb-2">
            What do you love about your job?
          </label>
          <textarea
            id="whatLoveAboutJob"
            name="whatLoveAboutJob"
            value={formData.whatLoveAboutJob}
            onChange={handleChange}
            rows="3"
            className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition ${
              errors.whatLoveAboutJob
                ? 'border-red-500 focus:border-red-600 bg-red-50'
                : 'border-gray-300 focus:border-brand-coral bg-white'
            }`}
            placeholder="What aspects of real estate excite you?"
          />
          {errors.whatLoveAboutJob && (
            <p className="text-red-600 text-sm mt-1">{errors.whatLoveAboutJob}</p>
          )}
        </div>

        <div>
          <label htmlFor="interestingFact" className="block text-sm font-semibold text-brand-navy mb-2">
            Share an interesting fact about yourself
          </label>
          <textarea
            id="interestingFact"
            name="interestingFact"
            value={formData.interestingFact}
            onChange={handleChange}
            rows="3"
            className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition ${
              errors.interestingFact
                ? 'border-red-500 focus:border-red-600 bg-red-50'
                : 'border-gray-300 focus:border-brand-coral bg-white'
            }`}
            placeholder="Something interesting about you that we should know"
          />
          {errors.interestingFact && (
            <p className="text-red-600 text-sm mt-1">{errors.interestingFact}</p>
          )}
        </div>

        <div>
          <label htmlFor="enneagram" className="block text-sm font-semibold text-brand-navy mb-2">
            What's your Enneagram type?
          </label>
          <input
            type="text"
            id="enneagram"
            name="enneagram"
            value={formData.enneagram}
            onChange={handleChange}
            className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition ${
              errors.enneagram
                ? 'border-red-500 focus:border-red-600 bg-red-50'
                : 'border-gray-300 focus:border-brand-coral bg-white'
            }`}
            placeholder="e.g., 1w2, 3w2, 5w4..."
          />
          {errors.enneagram && (
            <p className="text-red-600 text-sm mt-1">{errors.enneagram}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-brand-coral hover:bg-red-600 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition duration-200 mt-6"
        >
          {isLoading ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </div>
  )
}
