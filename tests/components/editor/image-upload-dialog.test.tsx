import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ImageUploadDialog } from '@/components/editor/image-upload-dialog'

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

vi.mock('@/components/ui/image-upload', () => ({
  ImageUpload: ({
    value,
    onChange,
  }: {
    value: string
    onChange: (url: string) => void
  }) => (
    <div data-testid="image-upload-tab">
      <span>Upload tab</span>
      <button type="button" onClick={() => onChange('https://uploaded.example.com/img.jpg')}>
        Simulate upload
      </button>
    </div>
  ),
}))

describe('ImageUploadDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onInsert: vi.fn(),
    folder: 'blog/content',
    tags: ['blog', 'content'],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders dialog when open', () => {
    render(<ImageUploadDialog {...defaultProps} />)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Insert Image' })).toBeInTheDocument()
    expect(
      screen.getByText('Upload an image or paste an image URL to insert into your content')
    ).toBeInTheDocument()
  })

  it('does not render dialog when closed', () => {
    render(<ImageUploadDialog {...defaultProps} open={false} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows Upload Image and From URL tabs', () => {
    render(<ImageUploadDialog {...defaultProps} />)

    expect(screen.getByRole('tab', { name: /upload image/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /from url/i })).toBeInTheDocument()
  })

  it('shows Upload tab content by default', () => {
    render(<ImageUploadDialog {...defaultProps} />)

    expect(screen.getByTestId('image-upload-tab')).toBeInTheDocument()
    expect(screen.getByText('Upload tab')).toBeInTheDocument()
  })

  it('switches to URL tab and shows URL input', async () => {
    const user = userEvent.setup()
    render(<ImageUploadDialog {...defaultProps} />)

    const urlTab = screen.getByRole('tab', { name: /from url/i })
    await user.click(urlTab)

    const urlInput = screen.getByPlaceholderText('https://example.com/image.jpg')
    expect(urlInput).toBeInTheDocument()
    expect(
      screen.getByText('Paste the URL of an image to insert it into your content')
    ).toBeInTheDocument()
  })

  it('calls onOpenChange(false) when Cancel is clicked', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(<ImageUploadDialog {...defaultProps} onOpenChange={onOpenChange} />)

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('Insert Image button is disabled when no image URL or upload', () => {
    render(<ImageUploadDialog {...defaultProps} />)

    const insertButton = screen.getByRole('button', { name: /insert image/i })
    expect(insertButton).toBeDisabled()
  })

  it('calls onInsert and onOpenChange when inserting from URL tab', async () => {
    const user = userEvent.setup()
    const onInsert = vi.fn()
    const onOpenChange = vi.fn()
    render(
      <ImageUploadDialog
        {...defaultProps}
        onInsert={onInsert}
        onOpenChange={onOpenChange}
      />
    )

    const urlTab = screen.getByRole('tab', { name: /from url/i })
    await user.click(urlTab)

    const urlInput = screen.getByPlaceholderText('https://example.com/image.jpg')
    await user.type(urlInput, 'https://example.com/photo.jpg')

    const insertButton = screen.getByRole('button', { name: /insert image/i })
    expect(insertButton).toBeEnabled()
    await user.click(insertButton)

    expect(onInsert).toHaveBeenCalledWith('https://example.com/photo.jpg')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('calls onInsert when inserting from Upload tab via simulated upload', async () => {
    const user = userEvent.setup()
    const onInsert = vi.fn()
    const onOpenChange = vi.fn()
    render(
      <ImageUploadDialog
        {...defaultProps}
        onInsert={onInsert}
        onOpenChange={onOpenChange}
      />
    )

    const simulateUpload = screen.getByRole('button', { name: /simulate upload/i })
    await user.click(simulateUpload)

    const insertButton = screen.getByRole('button', { name: /insert image/i })
    await user.click(insertButton)

    expect(onInsert).toHaveBeenCalledWith('https://uploaded.example.com/img.jpg')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('uses custom folder and tags when provided', () => {
    render(
      <ImageUploadDialog
        {...defaultProps}
        folder="custom/folder"
        tags={['custom', 'tag']}
      />
    )

    expect(screen.getByTestId('image-upload-tab')).toBeInTheDocument()
  })
})
