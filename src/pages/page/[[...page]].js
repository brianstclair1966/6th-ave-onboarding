import { useRouter } from 'next/router'
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

  // Lists
  html = html.replace(/^\* (.*?)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*?<\/li>)/s, '<ul>$1</ul>')

  // Line breaks for paragraphs
  html = html.replace(/\n\n/g, '</p><p>')
  html = '<p>' + html + '</p>'

  return html.replace(/<p><\/p>/g, '')
}

export default function PageComponent({ pageNumber, content }) {
  const router = useRouter()

  const handlePrev = () => {
    if (pageNumber > 1) {
      router.push(`/page/${pageNumber - 1}`)
    }
  }

  const handleNext = () => {
    if (pageNumber < TOTAL_PAGES) {
      router.push(`/page/${pageNumber + 1}`)
    }
  }

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
