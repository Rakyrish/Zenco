type ImageLoaderProps = {
  src: string
  width: number
  quality?: number
}

export default function imageLoader({ src, width, quality }: ImageLoaderProps): string {
  // For Cloudinary URLs, return as-is (already optimized by Cloudinary)
  if (src.includes('res.cloudinary.com')) {
    return src
  }
  // For all other images, use Next.js default optimization
  const params = new URLSearchParams()
  params.set('url', src)
  params.set('w', String(width))
  params.set('q', String(quality || 75))
  return `/_next/image?${params.toString()}`
}
