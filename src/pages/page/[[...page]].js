import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import Page from '../../components/Page'
import Navigation from '../../components/Navigation'
import useCheckboxState from '../../hooks/useCheckboxState'
import AgentInfoForm from '../../components/AgentInfoForm'
import EmergencyContactForm from '../../components/EmergencyContactForm'
import BioForm from '../../components/BioForm'
import AboutYouForm from '../../components/AboutYouForm'

const TOTAL_PAGES = 8

function renderMarkdown(content) {
  let html = content

  // Extract form markers to preserve them
  const markers = []
  html = html.replace(/<!-- FORM:(.*?) -->/g, (match) => {
    markers.push(match)
    return `__FORM_MARKER_${markers.length - 1}__`
  })

  // Headings - with special handling for Common Mistake/Misconception
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (Common Mistake.*?)$/gm, '<div class="common-mistake"><h2>$1</h2>')
  html = html.replace(/^## (Common Misconception.*?)$/gm, '<div class="common-misconception"><h2>$1</h2>')
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>')

  // Bold and italic
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')

  // Links
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')

  // Checkboxes - convert [ ] to interactive checkboxes
  html = html.replace(/^\- \[ \] (.*?)$/gm, '<li class="checkbox-item"><input type="checkbox" class="page-checkbox" data-label="$1"> <label>$1</label></li>')

  // Lists
  html = html.replace(/^\* (.*?)$/gm, '<li>$1</li>')
  html = html.replace(/^\- (.*?)$/gm, '<li>$1</li>')
  html = html.replace(/(<li[^>]*>[\s\S]*?<\/li>)/gs, '<ul>$1</ul>')

  // Line breaks for paragraphs
  html = html.replace(/\n\n/g, '</p><p>')
  html = '<p>' + html + '</p>'

  // Close Common Mistake/Misconception divs
  html = html.replace(/<\/p><div class="common-mistake">/g, '</p>\n<div class="common-mistake">')
  html = html.replace(/<\/p><div class="common-misconception">/g, '</p>\n<div class="common-misconception">')
  html = html.replace(/<p><\/div>/g, '</div>')

  // Remove empty paragraphs
  html = html.replace(/<p><\/p>/g, '')

  // Restore form markers
  markers.forEach((marker, i) => {
    html = html.replace(`__FORM_MARKER_${i}__`, marker)
  })

  // Unwrap form markers from paragraph tags
  html = html.replace(/<p>(<!-- FORM:.*? -->)<\/p>/g, '$1')

  return html
}

export default function PageComponent({ pageNumber, content, sectionTitle }) {
  const router = useRouter()
  const { getCompletionPercentage } = useCheckboxState(pageNumber)
  const [agentInfo, setAgentInfo] = useState(null)

  useEffect(() => {
    // Load agent info from localStorage
    const stored = localStorage.getItem('agentInfo')
    if (stored) {
      try {
        setAgentInfo(JSON.parse(stored))
      } catch (e) {
        console.error('Error parsing agent info:', e)
      }
    }
  }, [])

  useEffect(() => {
    // Wire up checkpoint logging to all checkboxes
    const checkboxes = document.querySelectorAll('.page-checkbox')

    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', async (e) => {
        if (e.target.checked && agentInfo) {
          const checkpointLabel = e.target.getAttribute('data-label')

          try {
            e.target.disabled = true
            e.target.style.opacity = '0.5'

            const response = await fetch('/api/log-checkpoint', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                firstName: agentInfo.firstName,
                lastName: agentInfo.lastName,
                email: agentInfo.email,
                checkpointLabel: checkpointLabel,
              }),
            })

            if (!response.ok) {
              throw new Error('Failed to log checkpoint')
            }

            e.target.style.opacity = '1'
          } catch (error) {
            console.error('Checkpoint logging error:', error)
            e.target.checked = false
            e.target.disabled = false
            e.target.style.opacity = '1'
            alert('Failed to save checkpoint. Please try again.')
          }
        }
      })
    })

    return () => {
      checkboxes.forEach(checkbox => {
        checkbox.removeEventListener('change', null)
      })
    }
  }, [agentInfo])

  const handlePrev = () => {
    if (pageNumber > 1) {
      router.push(`/page/${pageNumber - 1}`)
    }
  }

  const handleNext = () => {
    // Checkboxes are now voluntary (honor-system engagement)
    // No gating on Page 3 or any other page
    if (pageNumber < TOTAL_PAGES) {
      router.push(`/page/${pageNumber + 1}`)
    }
  }

  // Split content at form markers and render components inline
  const renderPageContent = () => {
    if (pageNumber === 1) {
      return <AgentInfoForm />
    }

    // For pages with form markers, split and inject components
    const formMarkers = {
      2: [{ marker: '<!-- FORM:emergency_contact -->', component: <EmergencyContactForm key="emergency" agentInfo={agentInfo} /> }],
      3: [
        { marker: '<!-- FORM:bio -->', component: <BioForm key="bio" agentInfo={agentInfo} /> },
        { marker: '<!-- FORM:about_you -->', component: <AboutYouForm key="about" agentInfo={agentInfo} /> },
      ],
    }

    const markers = formMarkers[pageNumber] || []

    if (markers.length === 0) {
      // No form markers, render content normally
      return <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
    }

    // Split content at markers and build JSX array
    let currentContent = content
    const elements = []

    markers.forEach((item, index) => {
      const parts = currentContent.split(item.marker)
      if (parts.length > 1) {
        // Render HTML before marker
        if (parts[0]) {
          elements.push(
            <div key={`content-${index}`} className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: parts[0] }} />
          )
        }
        // Add the form component
        elements.push(item.component)
        // Continue with remaining content
        currentContent = parts.slice(1).join(item.marker)
      }
    })

    // Render any remaining content after last marker
    if (currentContent) {
      elements.push(
        <div key="content-final" className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: currentContent }} />
      )
    }

    return elements
  }

  return (
    <Page pageNumber={pageNumber} sectionTitle={sectionTitle}>
      <main className="flex-1 max-w-4xl md:max-w-6xl mx-auto px-6 py-12">
        {renderPageContent()}
      </main>

      <Navigation
        pageNumber={pageNumber}
        onPrev={handlePrev}
        onNext={handleNext}
        totalPages={TOTAL_PAGES}
      />
    </Page>
  )
}

export async function getStaticProps({ params }) {
  const pageNumber = params.page?.[0] ? parseInt(params.page[0]) : 1

  if (pageNumber < 1 || pageNumber > TOTAL_PAGES) {
    return { notFound: true }
  }

  const contentPath = path.join(process.cwd(), 'content', `page-${pageNumber}.md`)
  const fileContent = fs.readFileSync(contentPath, 'utf-8')
  const { content, data } = matter(fileContent)
  const htmlContent = renderMarkdown(content)

  return {
    props: {
      pageNumber,
      content: htmlContent,
      sectionTitle: data.description || null,
    },
    revalidate: 3600,
  }
}

export async function getStaticPaths() {
  const paths = []
  for (let i = 1; i <= TOTAL_PAGES; i++) {
    paths.push({
      params: { page: [i.toString()] },
    })
  }

  return {
    paths,
    fallback: false,
  }
}
