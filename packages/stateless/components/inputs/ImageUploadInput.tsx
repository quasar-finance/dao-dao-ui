import { useState } from 'react'

import { ImageDropInput, ImageDropInputProps } from './ImageDropInput'

export type ImageUploadInputProps = Omit<
  ImageDropInputProps,
  'onSelect' | 'loading'
> & {
  onChange: (url: string, file: File) => void | Promise<void>
  onError?: (error: unknown) => void
}

export const ImageUploadInput = ({
  onChange,
  onError,
  ...props
}: ImageUploadInputProps) => {
  const [uploading, setUploading] = useState(false)

  const uploadFile = async (file: File) => {
    setUploading(true)

    try {
      const form = new FormData()
      form.append('image', file)

      // Next.js API route.
      const response = await fetch('/api/uploadImage', {
        method: 'POST',
        body: form,
      })

      if (!response.ok) {
        const fallback = `Failed to upload image. Status: ${response.status} ${response.statusText}`
        throw new Error(
          (await response.json().catch(() => ({ error: fallback })))?.error ||
            fallback
        )
      }

      const { cid } = await response.json()
      if (!cid) {
        throw new Error('Failed to upload image')
      }

      onChange(`ipfs://${cid}`, file)
    } catch (err) {
      console.error(err)
      onError?.(err)
    } finally {
      setUploading(false)
    }
  }

  return <ImageDropInput loading={uploading} onSelect={uploadFile} {...props} />
}
