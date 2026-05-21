import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import Page from '@/components/Page'
import Navigation from '@/components/Navigation'
import ProgressIndicator from '@/components/ProgressIndicator'

export default function PageView({ content, frontmatter, pageNumber }) {
  const router = useRouter()

  if (router.isFallback) {
    return <div>Loading...</div>
  }

  if (!content) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <h1>Page not found</h1>
      </div>
    )
  }

  const handlePrev = () => {
    if (pageNumber > 1) {
      router.push(`/page/${pageNumber - 1}`)
    }
  }

  const handleNext = () => {
    if (pageNumber < 5) {
      router.push(`/page/${pageNumber + 1}`)
    }
  }

  return (
    <Page>
      <ProgressIndicator current={pageNumber} total={5} />

      <div className="max-w-2xl mx-auto px-6 py-12">
        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>

      <Navigation
        pageNumber={pageNumber}
        onPrev={handlePrev}
        onNext={handleNext}
        totalPages={5}
      />
    </Page>
  )
}

export async function getStaticProps({ params }) {
  const pageNum = parseInt(params.page[0])

  if (pageNum < 1 || pageNum > 5) {
    return { notFound: true }
  }

  const contentDir = path.join(process.cwd(), 'content')
  const fileName = `content_page-${pageNum}.md`
  const filePath = path.join(contentDir, fileName)

  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const { data: frontmatter, content } = matter(fileContent)

    // Simple markdown to HTML conversion (for now, we'll enhance this)
    const htmlContent = content
      .replace(/^### (.*?)$/gm, '<h3 className="text-xl font-bold mt-6 mb-3">$1</h3>')
      .replace(/^## (.*?)$/gm, '<h2 className="text-2xl font-bold mt-8 mb-4">$1</h2>')
      .replace(/^# (.*?)$/gm, '<h1 className="text-3xl font-bold mb-6">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^\- (.*?)$/gm, '<li>$1</li>')
      .split('\n\n')
      .map(p => p.trim())
      .filter(p => p)
      .join('</p><p>')

    return {
      props: {
        content: `<p>${htmlContent}</p>`,
        frontmatter,
        pageNumber: pageNum,
      },
      revalidate: 60,
    }
  } catch (error) {
    console.error('Error loading page:', error)
    return { notFound: true }
  }
}

export async function getStaticPaths() {
  return {
    paths: [
      { params: { page: ['1'] } },
      { params: { page: ['2'] } },
      { params: { page: ['3'] } },
      { params: { page: ['4'] } },
      { params: { page: ['5'] } },
    ],
    fallback: false,
  }
}
