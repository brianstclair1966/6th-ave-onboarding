import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import Page from '../../components/Page'
import Navigation from '../../components/Navigation'
import AgentInfoForm from '../../components/AgentInfoForm'
import EmergencyContactForm from '../../components/EmergencyContactForm'
import BioForm from '../../components/BioForm'
import AboutYouForm from '../../components/AboutYouForm'
import BusinessCardPicker from '../../components/BusinessCardPicker'
import SummaryDownload from '../../components/SummaryDownload'
import WelcomeCelebration from '../../components/WelcomeCelebration'
import * as progress from '../../lib/progress'

const TOTAL_PAGES = 9
// Forms that count toward the progress bar (page 1 agent info + the 3 page 2-4 forms).
const TOTAL_FORMS = 4
// Single-select items that count toward the progress bar (page 3 business card).
const TOTAL_SELECTIONS = 1

// Forms (by progress-store id) that must be submitted to complete each page.
const PAGE_FORMS = { 2: ['form:emergency'], 3: ['form:about'], 4: ['form:bio'] }

// Single-select pickers (by progress-store id) required to complete each page.
const PAGE_SELECTIONS = { 3: ['cards:3'] }

// Count every `- [ ]` checkbox across all onboarding pages at build time, so the
// progress denominator stays correct automatically if checkboxes are added/removed.
function countAllCheckboxes() {
  let total = 0
  for (let i = 1; i <= TOTAL_PAGES; i++) {
    try {
      const txt = fs.readFileSync(path.join(process.cwd(), 'content', `page-${i}.md`), 'utf-8')
      total += (txt.match(/^- \[ \] /gm) || []).length
    } catch (e) {
      /* page file missing — skip */
    }
  }
  return total
}

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

  // Checkboxes - convert [ ] to interactive checkboxes. Each input gets a unique
  // id and its <label> a matching `for`, so tapping the label text toggles the box
  // (a much larger, mobile-friendly tap target than the 20px checkbox alone).
  let checkboxIndex = 0
  html = html.replace(/^\- \[ \] (.*?)$/gm, (match, label) => {
    const id = `pcb-${checkboxIndex++}`
    return `<li class="checkbox-item"><input type="checkbox" id="${id}" class="page-checkbox" data-label="${label}"> <label for="${id}">${label}</label></li>`
  })

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
  // Same for the business-card picker marker, so the split stays clean.
  html = html.replace(/<p>(<!-- CARDS -->)<\/p>/g, '$1')
  // Same for the page-8 reference-guide download marker.
  html = html.replace(/<p>(<!-- DOWNLOAD -->)<\/p>/g, '$1')
  html = html.replace(/<p>(<!-- CELEBRATE -->)<\/p>/g, '$1')

  return html
}

export default function PageComponent({ pageNumber, content, sectionTitle, totalItems }) {
  const router = useRouter()
  const [agentInfo, setAgentInfo] = useState(null)
  const [pageComplete, setPageComplete] = useState(false)

  useEffect(() => {
    // Load agent info from localStorage. Re-read on every page so registration
    // done on page 1 is picked up after client-side navigation (no full reload).
    const stored = localStorage.getItem('agentInfo')
    if (stored) {
      try {
        setAgentInfo(JSON.parse(stored))
      } catch (e) {
        console.error('Error parsing agent info:', e)
      }
    }
  }, [pageNumber])

  // Re-check registration whenever progress changes (e.g. right after the page-1
  // form saves), so the "Next" gate updates without needing a navigation.
  useEffect(() => {
    const refreshAgent = () => {
      try {
        const stored = localStorage.getItem('agentInfo')
        setAgentInfo(stored ? JSON.parse(stored) : null)
      } catch (e) {
        /* ignore */
      }
    }
    window.addEventListener(progress.PROGRESS_EVENT, refreshAgent)
    return () => window.removeEventListener(progress.PROGRESS_EVENT, refreshAgent)
  }, [])

  // Registration on page 1 is required before continuing. If someone reaches a
  // later page without registering (deep link, breadcrumb, back/forward), send
  // them back to page 1 so their work can actually be logged.
  useEffect(() => {
    if (pageNumber > 1 && typeof window !== 'undefined' && !localStorage.getItem('agentInfo')) {
      router.replace('/page/1')
    }
  }, [pageNumber, router])

  useEffect(() => {
    // Wire up checkpoint logging to all checkboxes
    const checkboxes = document.querySelectorAll('.page-checkbox')

    const idFor = (target) =>
      `cb:${pageNumber}:${Array.from(document.querySelectorAll('.page-checkbox')).indexOf(target)}`

    // Restore this session's checked state when revisiting a page (keeps the
    // checkboxes visually consistent with the progress bar within a session).
    checkboxes.forEach((checkbox, index) => {
      if (progress.isDone(`cb:${pageNumber}:${index}`)) checkbox.checked = true
    })

    // A page is "complete" (and Next unlocks) when every form on the page has been
    // submitted AND every checkbox on the page is checked. Page 1 just needs
    // registration. External links don't count — only on-page boxes and forms.
    const evaluateComplete = () => {
      if (pageNumber === 1) {
        setPageComplete(!!localStorage.getItem('agentInfo'))
        return
      }
      const requiredForms = PAGE_FORMS[pageNumber] || []
      const formsDone = requiredForms.every((id) => progress.isDone(id))
      const requiredSelections = PAGE_SELECTIONS[pageNumber] || []
      const selectionsDone = requiredSelections.every((id) => progress.isDone(id))
      const allBoxes = Array.from(document.querySelectorAll('.page-checkbox'))
      setPageComplete(formsDone && selectionsDone && allBoxes.every((cb) => cb.checked))
    }
    evaluateComplete()

    // Create handler function that can be properly removed later
    const handleCheckboxChange = async (e) => {
      const id = idFor(e.target)

      // Update the progress bar immediately (works with or without registration).
      if (e.target.checked) progress.markDone(id)
      else progress.markUndone(id)

      // Read the latest registration straight from localStorage — the captured
      // `agentInfo` state can be stale after client-side navigation from page 1.
      let liveAgent = agentInfo
      try {
        const stored = localStorage.getItem('agentInfo')
        if (stored) liveAgent = JSON.parse(stored)
      } catch (err) {
        /* fall back to state */
      }

      if (e.target.checked && liveAgent) {
        const checkpointLabel = e.target.getAttribute('data-label')

        try {
          e.target.disabled = true
          e.target.style.opacity = '0.5'

          const response = await fetch('/api/log-checkpoint', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              firstName: liveAgent.firstName,
              lastName: liveAgent.lastName,
              email: liveAgent.email,
              checkpointLabel: checkpointLabel,
              pageNumber: pageNumber,
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
          progress.markUndone(id)
          alert('Failed to save checkpoint. Please try again.')
        }
      }
    }

    // Attach listener to each checkbox
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', handleCheckboxChange)
    })

    // Re-evaluate the page-complete gate on any progress change — a checkbox
    // toggle or a form submission (forms are separate components that fire this).
    window.addEventListener(progress.PROGRESS_EVENT, evaluateComplete)

    // Cleanup: properly remove listeners using the same handler reference
    return () => {
      checkboxes.forEach(checkbox => {
        checkbox.removeEventListener('change', handleCheckboxChange)
      })
      window.removeEventListener(progress.PROGRESS_EVENT, evaluateComplete)
    }
  }, [agentInfo, pageNumber])

  const handlePrev = () => {
    if (pageNumber > 1) {
      router.push(`/page/${pageNumber - 1}`)
    }
  }

  // When the agent clicks Next on an incomplete page, take them to the first
  // thing they still need to do (and flash it) instead of doing nothing.
  const scrollToFirstIncomplete = () => {
    const main = document.querySelector('main')
    if (!main) return
    const candidates = []
    main.querySelectorAll('.page-checkbox').forEach((cb) => {
      if (!cb.checked) candidates.push(cb.closest('.checkbox-item') || cb)
    })
    // Unsubmitted forms / unselected card: white cards with fields but no green "saved" box.
    main.querySelectorAll('.shadow-md').forEach((card) => {
      const hasFields = card.querySelector('input, textarea')
      const hasSuccess = card.querySelector('.bg-green-50')
      if (hasFields && !hasSuccess) candidates.push(card)
    })
    if (!candidates.length) return
    candidates.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)
    const target = candidates[0]
    target.scrollIntoView({ behavior: 'auto', block: 'center' })
    target.classList.add('flash-missed')
    setTimeout(() => target.classList.remove('flash-missed'), 1600)
  }

  const handleNext = () => {
    // Every checkbox and form on the page must be complete before advancing.
    // If something's missing, scroll the agent to the first incomplete item.
    if (!pageComplete) {
      scrollToFirstIncomplete()
      return
    }
    if (pageNumber < TOTAL_PAGES) {
      router.push(`/page/${pageNumber + 1}`)
    }
  }

  // Split content at form markers and render components inline
  const renderPageContent = () => {
    if (pageNumber === 1) {
      return (
        <>
          <AgentInfoForm />
          <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
        </>
      )
    }

    // For pages with form markers, split and inject components
    const formMarkers = {
      2: [{ marker: '<!-- FORM:emergency_contact -->', component: <EmergencyContactForm key="emergency" agentInfo={agentInfo} /> }],
      3: [
        { marker: '<!-- FORM:about_you -->', component: <AboutYouForm key="about" agentInfo={agentInfo} /> },
        { marker: '<!-- CARDS -->', component: <BusinessCardPicker key="cards" agentInfo={agentInfo} /> },
      ],
      4: [
        { marker: '<!-- FORM:bio -->', component: <BioForm key="bio" agentInfo={agentInfo} /> },
      ],
      9: [
        { marker: '<!-- DOWNLOAD -->', component: <SummaryDownload key="download" totalItems={totalItems} /> },
        { marker: '<!-- CELEBRATE -->', component: <WelcomeCelebration key="celebrate" complete={pageComplete} /> },
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
    <Page pageNumber={pageNumber} sectionTitle={sectionTitle} totalItems={totalItems}>
      <main className="flex-1 max-w-4xl md:max-w-6xl mx-auto px-6 py-12">
        {renderPageContent()}
        {!pageComplete && (
          <p className="mt-6 text-center text-sm font-semibold text-brand-coral">
            {pageNumber === 1
              ? 'Please save your name and email above before continuing.'
              : 'Please complete every checkbox and form on this page to continue.'}
          </p>
        )}
      </main>

      <Navigation
        pageNumber={pageNumber}
        onPrev={handlePrev}
        onNext={handleNext}
        totalPages={TOTAL_PAGES}
        nextDisabled={!pageComplete}
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
      totalItems: countAllCheckboxes() + TOTAL_FORMS + TOTAL_SELECTIONS,
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
