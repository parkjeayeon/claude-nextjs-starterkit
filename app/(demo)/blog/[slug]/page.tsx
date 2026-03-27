import type { Metadata } from 'next'

import { getMetadata } from '@/lib/metadata'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return getMetadata(`/blog/${slug}`, {
    title: slug.replace(/-/g, ' '),
    description: `Blog post: ${slug}`,
  })
}

export default async function BlogPage({ params }: Props) {
  const { slug } = await params
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">
        {slug.replace(/-/g, ' ')}
      </h1>
      <p className="text-muted-foreground mt-2">
        This is a demo page showing dynamic metadata generation.
      </p>
    </div>
  )
}
