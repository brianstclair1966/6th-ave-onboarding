import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import Page from '../../components/Page'
import Navigation from '../../components/Navigation'
import ProgressIndicator from '../../components/ProgressIndicator'

const TOTAL_PAGES = 5

function renderMarkdown(content) {
  let html = content

  // Headings
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>')
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
  html = html.replace(/(<li[^>]*>.*?<\/li>)/s, '<ul>$1</ul>')

  // Line breaks for paragraphs
  html = html.replace(/\n\n/g, '</p><p>')
  html = '<p>' + html + '</p>'

  return html.replace(/<p><\/p>/g, '')
}

export default function PageComponent({ pageNumber, content }) {
  const router = useRouter()
  const [checkboxStates, setCheckboxStates] = useState({})
  const [allCheckboxesChecked, setAllCheckboxesChecked] = useState(false)

  useEffect(() => {
    // Check if page has checkboxes and update state
    const checkboxes = document.querySelectorAll('.page-checkbox')
    const hasCheckboxes = checkboxes.length > 0

    if (hasCheckboxes) {
      const updateCheckedState = () => {
        const states = {}
        checkboxes.forEach((checkbox, index) => {
          states[index] = checkbox.checked
        })
        setCheckboxStates(states)

        // Check if all are checked
        const allChecked = Object.values(states).every(state => state === true)
        setAllCheckboxesChecked(allChecked)
      }

      checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateCheckedState)
      })

      return () => {
        checkboxes.forEach(checkbox => {
          checkbox.removeEventListener('change', updateCheckedState)
        })
      }
    }
  }, [content])

  const handlePrev = () => {
    if (pageNumber > 1) {
      router.push(`/page/${pageNumber - 1}`)
    }
  }

  const handleNext = () => {
    // Page 3 requires all checkboxes to be checked
    if (pageNumber === 3 && !allCheckboxesChecked) {
      alert('Please complete all items before moving forward.')
      return
    }

    if (pageNumber < TOTAL_PAGES) {
      router.push(`/page/${pageNumber + 1}`)
    }
  }

  const nextButtonDisabled = pageNumber === 3 && !allCheckboxesChecked

  return (
    <Page>
      <ProgressIndicator current={pageNumber} total={TOTAL_PAGES} />

      <main className="flex-1 max-w-4xl mx-auto px-6 py-12">
        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </main>

      <Navigation
        pageNumber={pageNumber}
        onPrev={handlePrev}
        onNext={handleNext}
        totalPages={TOTAL_PAGES}
        nextDisabled={nextButtonDisabled}
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
  const { content } = matter(fileContent)
  const htmlContent = renderMarkdown(content)

  return {
    props: {
      pageNumber,
      content: htmlContent,
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
