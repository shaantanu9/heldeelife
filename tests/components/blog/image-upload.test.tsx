import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ImageUpload } from '@/components/blog/image-upload'

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  ),
}))

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock fetch
global.fetch = vi.fn()

describe('ImageUpload', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render upload area when no image is provided', () => {
    render(<ImageUpload value="" onChange={mockOnChange} />)

    expect(
      screen.getByText('Upload an image or paste a URL')
    ).toBeInTheDocument()
    expect(screen.getByText('Upload Image')).toBeInTheDocument()
  })

  it('should display preview when image URL is provided', () => {
    const imageUrl = 'https://example.com/image.jpg'
    render(<ImageUpload value={imageUrl} onChange={mockOnChange} />)

    const img = screen.getByAltText('Preview')
    expect(img).toHaveAttribute('src', imageUrl)
  })

  it('should allow entering image URL manually', async () => {
    const user = userEvent.setup()
    render(<ImageUpload value="" onChange={mockOnChange} />)

    const urlInput = screen.getByPlaceholderText(
      'https://example.com/image.jpg'
    )
    await user.type(urlInput, 'https://example.com/test.jpg')

    expect(mockOnChange).toHaveBeenCalledWith('https://example.com/test.jpg')
  })

  it('should upload file when selected', async () => {
    const user = userEvent.setup()
    const mockFile = new File(['test content'], 'test.jpg', {
      type: 'image/jpeg',
    })

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        url: 'https://ik.imagekit.io/test/test.jpg',
        fileId: 'test-file-id',
        name: 'test.jpg',
      }),
    } as Response)

    render(<ImageUpload value="" onChange={mockOnChange} />)

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement
    expect(fileInput).toBeInTheDocument()

    await user.upload(fileInput, mockFile)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/images/upload', {
        method: 'POST',
        body: expect.any(FormData),
      })
    })
  })

  it('should validate file type before upload', async () => {
    const user = userEvent.setup()
    const { toast } = await import('sonner')
    const mockFile = new File(['test content'], 'test.pdf', {
      type: 'application/pdf',
    })

    render(<ImageUpload value="" onChange={mockOnChange} />)

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement
    await user.upload(fileInput, mockFile)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Invalid file type. Only images are allowed.'
      )
    })
  })

  it('should validate file size before upload', async () => {
    const user = userEvent.setup()
    const { toast } = await import('sonner')
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', {
      type: 'image/jpeg',
    })

    render(<ImageUpload value="" onChange={mockOnChange} />)

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement
    await user.upload(fileInput, largeFile)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('File size exceeds 10MB limit')
    })
  })

  it('should remove image when remove button is clicked', async () => {
    const user = userEvent.setup()
    const imageUrl = 'https://example.com/image.jpg'
    render(<ImageUpload value={imageUrl} onChange={mockOnChange} />)

    const removeButton = screen.getByRole('button', { name: /remove/i })
    await user.click(removeButton)

    expect(mockOnChange).toHaveBeenCalledWith('')
  })

  it('should show loading state during upload', async () => {
    const user = userEvent.setup()
    const mockFile = new File(['test content'], 'test.jpg', {
      type: 'image/jpeg',
    })

    let resolveUpload: (value: any) => void
    const uploadPromise = new Promise((resolve) => {
      resolveUpload = resolve
    })

    vi.mocked(fetch).mockReturnValueOnce(uploadPromise as Promise<Response>)

    render(<ImageUpload value="" onChange={mockOnChange} />)

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement
    await user.upload(fileInput, mockFile)

    // Check for loading state
    await waitFor(() => {
      expect(screen.getByText(/uploading/i)).toBeInTheDocument()
    })

    // Resolve the upload
    resolveUpload!({
      ok: true,
      json: async () => ({
        success: true,
        url: 'https://ik.imagekit.io/test/test.jpg',
      }),
    })

    await waitFor(() => {
      expect(screen.queryByText(/uploading/i)).not.toBeInTheDocument()
    })
  })

  it('should handle upload errors gracefully', async () => {
    const user = userEvent.setup()
    const { toast } = await import('sonner')
    const mockFile = new File(['test content'], 'test.jpg', {
      type: 'image/jpeg',
    })

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: 'Upload failed',
      }),
    } as Response)

    render(<ImageUpload value="" onChange={mockOnChange} />)

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement
    await user.upload(fileInput, mockFile)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Upload failed')
    })
  })

  it('should use custom folder and tags when provided', async () => {
    const user = userEvent.setup()
    const mockFile = new File(['test content'], 'test.jpg', {
      type: 'image/jpeg',
    })

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        url: 'https://ik.imagekit.io/test/test.jpg',
      }),
    } as Response)

    render(
      <ImageUpload
        value=""
        onChange={mockOnChange}
        folder="custom-folder"
        tags={['custom', 'tag']}
      />
    )

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement
    await user.upload(fileInput, mockFile)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled()
      const call = vi.mocked(fetch).mock.calls[0]
      const formData = call[1]?.body as FormData
      expect(formData.get('folder')).toBe('custom-folder')
      expect(formData.get('tags')).toBe('custom,tag')
    })
  })
})
