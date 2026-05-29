# Implementation Examples

Complete examples for integrating the form system into your pages.

## Page 1: Agent Registration & Onboarding

File: `/src/pages/page/1.js`

```jsx
import Page from '@/components/Page'
import AgentInfoForm from '@/components/AgentInfoForm'
import Checkpoint from '@/components/Checkpoint'

export default function Page1() {
  return (
    <Page pageNumber={1} sectionTitle="Agent Onboarding">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-brand-navy mb-4">
            Welcome to 6th Ave Homes
          </h1>
          <p className="text-lg text-gray-700 mb-6">
            We're excited to have you join our team. Let's get you set up for success!
          </p>
        </div>

        {/* Agent Info Form */}
        <div className="mb-16">
          <AgentInfoForm />
        </div>

        {/* Learning Checkpoints */}
        <div className="bg-brand-cream rounded-lg p-6 md:p-8">
          <h2 className="text-2xl font-bold text-brand-navy mb-6">Learning Checkpoints</h2>
          <p className="text-gray-700 mb-6">
            Complete these checkpoints as you work through the onboarding process:
          </p>
          <div className="space-y-3">
            <Checkpoint 
              label="I've completed my profile with name and email" 
              checkpointName="Page 1"
            />
            <Checkpoint 
              label="I understand the structure of the onboarding" 
              checkpointName="Page 1"
            />
            <Checkpoint 
              label="I've reviewed what the next pages will cover" 
              checkpointName="Page 1"
            />
          </div>
        </div>
      </div>
    </Page>
  )
}
```

## Page 2: Emergency Contact Information

File: `/src/pages/page/2.js`

```jsx
import Page from '@/components/Page'
import EmergencyContactForm from '@/components/EmergencyContactForm'
import Checkpoint from '@/components/Checkpoint'

export default function Page2() {
  return (
    <Page pageNumber={2} sectionTitle="Emergency Information">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-brand-navy mb-4">
            Emergency Contact Information
          </h1>
          <p className="text-lg text-gray-700 mb-6">
            We need some important information to keep on file for your safety and compliance.
          </p>
        </div>

        {/* Emergency Contact Form */}
        <div className="mb-16">
          <EmergencyContactForm />
        </div>

        {/* Learning Checkpoints */}
        <div className="bg-brand-cream rounded-lg p-6 md:p-8">
          <h2 className="text-2xl font-bold text-brand-navy mb-6">Learning Checkpoints</h2>
          <div className="space-y-3">
            <Checkpoint 
              label="I've provided my TREC license information" 
              checkpointName="Page 2"
            />
            <Checkpoint 
              label="I've added an emergency contact" 
              checkpointName="Page 2"
            />
            <Checkpoint 
              label="I've confirmed location access agreement" 
              checkpointName="Page 2"
            />
          </div>
        </div>
      </div>
    </Page>
  )
}
```

## Page 3: All About You

File: `/src/pages/page/3.js`

```jsx
import Page from '@/components/Page'
import AboutYouForm from '@/components/AboutYouForm'
import Checkpoint from '@/components/Checkpoint'

export default function Page3() {
  return (
    <Page pageNumber={3} sectionTitle="Get to Know You">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-brand-navy mb-4">
            All About You
          </h1>
          <p className="text-lg text-gray-700 mb-6">
            We believe the best teams know each other well. Let's get personal!
          </p>
        </div>

        {/* About You Form */}
        <div className="mb-16">
          <AboutYouForm />
        </div>

        {/* Learning Checkpoints */}
        <div className="bg-brand-cream rounded-lg p-6 md:p-8">
          <h2 className="text-2xl font-bold text-brand-navy mb-6">Learning Checkpoints</h2>
          <div className="space-y-3">
            <Checkpoint 
              label="I've shared my personal preferences and interests" 
              checkpointName="Page 3"
            />
            <Checkpoint 
              label="I've identified my favorite Fort Worth spots" 
              checkpointName="Page 3"
            />
            <Checkpoint 
              label="I've shared what I love about my job" 
              checkpointName="Page 3"
            />
          </div>
        </div>
      </div>
    </Page>
  )
}
```

## Page with Multiple Forms (Advanced Example)

If you want to combine forms on a single page:

```jsx
import Page from '@/components/Page'
import AgentInfoForm from '@/components/AgentInfoForm'
import Checkpoint from '@/components/Checkpoint'
import { useState } from 'react'

export default function PageWithMultipleForms() {
  const [agentInfo, setAgentInfo] = useState(null)

  return (
    <Page pageNumber={4} sectionTitle="Complete Setup">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-brand-navy mb-12">Complete Your Setup</h1>

        {/* Only show additional forms if agent info is complete */}
        {agentInfo ? (
          <div className="space-y-16">
            {/* Other form content here */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-brand-navy mb-4">
                You're All Set!
              </h2>
              <p className="text-gray-700">
                Your profile is complete. Let's move on to the next page.
              </p>
            </div>
          </div>
        ) : (
          <div className="mb-16">
            <p className="text-gray-700 mb-6">
              Please start with your basic information below.
            </p>
            <AgentInfoForm />
          </div>
        )}

        {/* Checkpoints */}
        <div className="bg-brand-cream rounded-lg p-6 md:p-8 mt-16">
          <h2 className="text-2xl font-bold text-brand-navy mb-6">Learning Checkpoints</h2>
          <div className="space-y-3">
            <Checkpoint 
              label="I've completed all required information" 
              checkpointName="Page 4"
            />
          </div>
        </div>
      </div>
    </Page>
  )
}
```

## Minimal Integration (Just Checkpoints)

If you already have forms elsewhere and just want to add checkpoints:

```jsx
import Page from '@/components/Page'
import Checkpoint from '@/components/Checkpoint'

export default function MinimalPage() {
  return (
    <Page pageNumber={5}>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-brand-navy mb-8">
          Your Content Here
        </h1>

        {/* Your existing page content */}
        <div className="prose prose-lg">
          <p>Your page content goes here...</p>
        </div>

        {/* Add checkpoints at the bottom */}
        <div className="bg-brand-cream rounded-lg p-6 mt-16">
          <h2 className="text-lg font-bold text-brand-navy mb-4">Progress Checkpoints</h2>
          <div className="space-y-3">
            <Checkpoint label="Section 1 completed" checkpointName="Page 5" />
            <Checkpoint label="Section 2 completed" checkpointName="Page 5" />
            <Checkpoint label="All content reviewed" checkpointName="Page 5" />
          </div>
        </div>
      </div>
    </Page>
  )
}
```

## Using Custom Checkpoint Logic

For more control over checkpoint behavior:

```jsx
import { useCheckpointLogger } from '@/components/CheckpointLogger'
import { useState } from 'react'

export default function CustomCheckpointPage() {
  const { logCheckpoint, isLoading, agentInfo } = useCheckpointLogger('Page X')
  const [completed, setCompleted] = useState(false)

  const handleComplete = async () => {
    const success = await logCheckpoint()
    if (success) {
      setCompleted(true)
      // Show success message, update UI, etc.
    }
  }

  if (!agentInfo) {
    return <p>Please complete your profile first</p>
  }

  return (
    <div>
      <button
        onClick={handleComplete}
        disabled={isLoading || completed}
        className={`px-6 py-3 rounded-lg font-bold text-white ${
          completed
            ? 'bg-green-600'
            : 'bg-brand-coral hover:bg-red-600 disabled:bg-gray-400'
        }`}
      >
        {completed ? '✓ Completed' : 'Mark as Complete'}
      </button>
    </div>
  )
}
```

## Styling Variations

### Compact Form Layout
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
  <div>
    <h2 className="text-2xl font-bold text-brand-navy mb-6">Contact</h2>
    <EmergencyContactForm />
  </div>
  <div>
    <h2 className="text-2xl font-bold text-brand-navy mb-6">About You</h2>
    <AboutYouForm />
  </div>
</div>
```

### Accordion/Collapsible Forms
```jsx
const [expandedForm, setExpandedForm] = useState(null)

return (
  <div className="space-y-4">
    <details
      open={expandedForm === 'emergency'}
      onToggle={() => setExpandedForm(expandedForm === 'emergency' ? null : 'emergency')}
    >
      <summary className="text-lg font-bold text-brand-navy cursor-pointer">
        Emergency Contact
      </summary>
      <div className="mt-4">
        <EmergencyContactForm />
      </div>
    </details>

    <details
      open={expandedForm === 'about'}
      onToggle={() => setExpandedForm(expandedForm === 'about' ? null : 'about')}
    >
      <summary className="text-lg font-bold text-brand-navy cursor-pointer">
        All About You
      </summary>
      <div className="mt-4">
        <AboutYouForm />
      </div>
    </details>
  </div>
)
```

### Card-Based Layout
```jsx
return (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-brand-coral">
      <h3 className="text-xl font-bold text-brand-navy mb-4">Profile</h3>
      <AgentInfoForm />
    </div>

    <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-brand-taupe">
      <h3 className="text-xl font-bold text-brand-navy mb-4">Emergency Info</h3>
      <EmergencyContactForm />
    </div>

    <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-brand-navy">
      <h3 className="text-xl font-bold text-brand-navy mb-4">About You</h3>
      <AboutYouForm />
    </div>
  </div>
)
```

## Error Handling Examples

### Global Error Display
```jsx
import { useState } from 'react'

export default function PageWithErrorHandling() {
  const [pageError, setPageError] = useState(null)

  const handleFormError = (error) => {
    setPageError(error)
    setTimeout(() => setPageError(null), 5000)
  }

  return (
    <div>
      {pageError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{pageError}</p>
        </div>
      )}
      
      <EmergencyContactForm onError={handleFormError} />
    </div>
  )
}
```

### Retry Logic
```jsx
const [retryCount, setRetryCount] = useState(0)
const maxRetries = 3

const handleSubmit = async () => {
  try {
    // attempt submission
  } catch (error) {
    if (retryCount < maxRetries) {
      setRetryCount(retryCount + 1)
      // show "Retrying..." message
    } else {
      // show final error
    }
  }
}
```

## Progress Indicators

### Linear Progress
```jsx
import { useState, useEffect } from 'react'

export default function PageWithProgress() {
  const [progress, setProgress] = useState(0)
  const [completedCheckpoints, setCompletedCheckpoints] = useState([])

  const TOTAL_CHECKPOINTS = 3
  
  useEffect(() => {
    setProgress((completedCheckpoints.length / TOTAL_CHECKPOINTS) * 100)
  }, [completedCheckpoints])

  return (
    <div>
      {/* Progress bar */}
      <div className="bg-gray-200 rounded-full h-2 mb-6">
        <div
          className="bg-brand-coral h-2 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="text-sm text-brand-taupe mb-6">
        Progress: {completedCheckpoints.length} of {TOTAL_CHECKPOINTS}
      </p>

      {/* Checkpoints */}
      <div className="space-y-3">
        <Checkpoint label="Checkpoint 1" checkpointName="Page X" />
        <Checkpoint label="Checkpoint 2" checkpointName="Page X" />
        <Checkpoint label="Checkpoint 3" checkpointName="Page X" />
      </div>
    </div>
  )
}
```

## Conditional Content Based on Form Completion

```jsx
import { useState, useEffect } from 'react'

export default function ConditionalPage() {
  const [agentInfo, setAgentInfo] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem('agentInfo')
    if (stored) {
      setAgentInfo(JSON.parse(stored))
    }
  }, [])

  if (!agentInfo) {
    return (
      <Page pageNumber={1}>
        <div className="max-w-4xl mx-auto px-6 py-12">
          <h1>Complete Your Profile First</h1>
          <AgentInfoForm />
        </div>
      </Page>
    )
  }

  return (
    <Page pageNumber={1}>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1>Welcome, {agentInfo.firstName}!</h1>
        {/* Show personalized content */}
      </div>
    </Page>
  )
}
```

These examples show various ways to integrate the form system into your pages. Mix and match based on your specific needs!
