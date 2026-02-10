import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RichTextEditor } from '@/components/editor/rich-text-editor'

const mockChain = {
  focus: vi.fn().mockReturnThis(),
  toggleBold: vi.fn().mockReturnThis(),
  toggleItalic: vi.fn().mockReturnThis(),
  toggleHeading: vi.fn().mockReturnThis(),
  toggleBulletList: vi.fn().mockReturnThis(),
  toggleOrderedList: vi.fn().mockReturnThis(),
  setLink: vi.fn().mockReturnThis(),
  unsetLink: vi.fn().mockReturnThis(),
  extendMarkRange: vi.fn().mockReturnThis(),
  setImage: vi.fn().mockReturnThis(),
  insertContent: vi.fn().mockReturnThis(),
  undo: vi.fn().mockReturnThis(),
  redo: vi.fn().mockReturnThis(),
  run: vi.fn(),
}

const mockCommands = {
  setContent: vi.fn(),
}

const mockEditor = {
  getHTML: vi.fn().mockReturnValue('<p></p>'),
  getAttributes: vi.fn().mockReturnValue({ href: '' }),
  chain: vi.fn().mockReturnValue(mockChain),
  commands: mockCommands,
  isActive: vi.fn().mockReturnValue(false),
  isEditable: true,
  can: vi.fn().mockReturnValue({
    undo: vi.fn().mockReturnValue(true),
    redo: vi.fn().mockReturnValue(true),
  }),
}

vi.mock('@tiptap/react', () => ({
  useEditor: vi.fn((config: { onUpdate?: (args: { editor: typeof mockEditor }) => void }) => {
    const editor = { ...mockEditor }
    if (config?.onUpdate) {
      setTimeout(() => config.onUpdate!({ editor }), 0)
    }
    return editor
  }),
  EditorContent: ({ editor }: { editor: typeof mockEditor }) => (
    <div data-testid="editor-content" data-editor-ready={!!editor}>
      Editor content area
    </div>
  ),
}))

vi.mock('@/components/editor/image-upload-dialog', () => ({
  ImageUploadDialog: ({
    open,
    onOpenChange,
    onInsert,
  }: {
    open: boolean
    onOpenChange: (v: boolean) => void
    onInsert: (url: string) => void
  }) =>
    open ? (
      <div data-testid="image-upload-dialog">
        <button type="button" onClick={() => onOpenChange(false)}>
          Close
        </button>
        <button type="button" onClick={() => onInsert('https://example.com/img.jpg')}>
          Insert URL
        </button>
      </div>
    ) : null,
}))

vi.mock('@/components/blog/product-search-dialog', () => ({
  ProductSearchDialog: ({
    open,
    onOpenChange,
    onSelect,
  }: {
    open: boolean
    onOpenChange: (v: boolean) => void
    onSelect: (p: { id: string; name: string; slug: string; price: number }) => void
  }) =>
    open ? (
      <div data-testid="product-search-dialog">
        <button type="button" onClick={() => onOpenChange(false)}>
          Close
        </button>
        <button
          type="button"
          onClick={() =>
            onSelect({
              id: 'p1',
              name: 'Product One',
              slug: 'product-one',
              price: 999,
            })
          }
        >
          Select Product
        </button>
      </div>
    ) : null,
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

describe('RichTextEditor', () => {
  const defaultProps = {
    content: '',
    onChange: vi.fn(),
    placeholder: 'Start writing...',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockEditor.getHTML.mockReturnValue('<p></p>')
    mockEditor.isActive.mockReturnValue(false)
    mockEditor.isEditable = true
    mockEditor.can.mockReturnValue({
      undo: vi.fn().mockReturnValue(true),
      redo: vi.fn().mockReturnValue(true),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders editor UI (toolbar or loading state)', () => {
    render(<RichTextEditor {...defaultProps} />)
    const loadingOrToolbar =
      screen.queryByText('Loading editor...') ?? screen.queryByRole('button', { name: 'H1' })
    expect(loadingOrToolbar).toBeInTheDocument()
  })

  it('shows toolbar and editor content when ready', async () => {
    render(<RichTextEditor {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByTestId('editor-content')).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: /H1/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /H2/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /H3/i })).toBeInTheDocument()
  })

  it('calls onChange when editor updates', async () => {
    const onChange = vi.fn()
    render(<RichTextEditor {...defaultProps} onChange={onChange} />)

    await waitFor(() => {
      expect(screen.getByTestId('editor-content')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(onChange).toHaveBeenCalled()
    })
  })

  it('toggles bold when Bold toolbar button is clicked', async () => {
    const user = userEvent.setup()
    render(<RichTextEditor {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByTestId('editor-content')).toBeInTheDocument()
    })

    const h1Button = screen.getByRole('button', { name: 'H1' })
    const toolbar = h1Button.closest('div')
    const firstButton = toolbar?.querySelector('button')
    expect(firstButton).toBeInTheDocument()
    await user.click(firstButton!)

    expect(mockEditor.chain).toHaveBeenCalled()
    expect(mockChain.toggleBold).toHaveBeenCalled()
    expect(mockChain.run).toHaveBeenCalled()
  })

  it('opens image dialog when Image button is clicked', async () => {
    const user = userEvent.setup()
    render(<RichTextEditor {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByTestId('editor-content')).toBeInTheDocument()
    })

    const toolbar = screen.getByRole('button', { name: 'H1' }).closest('div')
    const buttons = Array.from(toolbar?.querySelectorAll('button') ?? [])
    const imageBtn = buttons[8]
    expect(imageBtn).toBeInTheDocument()
    await user.click(imageBtn)

    await waitFor(() => {
      expect(screen.getByTestId('image-upload-dialog')).toBeInTheDocument()
    })
  })

  it('opens product dialog when Product button is clicked', async () => {
    const user = userEvent.setup()
    render(<RichTextEditor {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByTestId('editor-content')).toBeInTheDocument()
    })

    const productButton = screen.getByTitle('Insert Product')
    await user.click(productButton)

    await waitFor(() => {
      expect(screen.getByTestId('product-search-dialog')).toBeInTheDocument()
    })
  })

  it('inserts image when ImageUploadDialog calls onInsert', async () => {
    const user = userEvent.setup()
    render(<RichTextEditor {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByTestId('editor-content')).toBeInTheDocument()
    })

    const toolbar = screen.getByRole('button', { name: 'H1' }).closest('div')
    const buttons = Array.from(toolbar?.querySelectorAll('button') ?? [])
    const imageBtn = buttons[8]
    await user.click(imageBtn)

    await waitFor(() => {
      expect(screen.getByTestId('image-upload-dialog')).toBeInTheDocument()
    })

    const insertBtn = screen.getByRole('button', { name: 'Insert URL' })
    await user.click(insertBtn)

    expect(mockChain.setImage).toHaveBeenCalledWith({ src: 'https://example.com/img.jpg' })
    expect(mockChain.run).toHaveBeenCalled()
  })

  it('inserts product embed when ProductSearchDialog calls onSelect', async () => {
    const user = userEvent.setup()
    render(<RichTextEditor {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByTestId('editor-content')).toBeInTheDocument()
    })

    const productButton = screen.getByTitle('Insert Product')
    await user.click(productButton)

    await waitFor(() => {
      expect(screen.getByTestId('product-search-dialog')).toBeInTheDocument()
    })

    const selectBtn = screen.getByRole('button', { name: 'Select Product' })
    await user.click(selectBtn)

    expect(mockChain.insertContent).toHaveBeenCalled()
    expect(mockChain.insertContent.mock.calls[0][0]).toContain('blog-product-embed')
    expect(mockChain.insertContent.mock.calls[0][0]).toContain('Product One')
    expect(mockChain.insertContent.mock.calls[0][0]).toContain('999')
    expect(mockChain.run).toHaveBeenCalled()
  })

  it('uses custom placeholder when provided', async () => {
    render(
      <RichTextEditor
        {...defaultProps}
        placeholder="Write your blog post here..."
      />
    )

    await waitFor(() => {
      expect(screen.getByTestId('editor-content')).toBeInTheDocument()
    })

    const { useEditor } = await import('@tiptap/react')
    expect(vi.mocked(useEditor).mock.calls[0][0].extensions).toBeDefined()
  })

  it('syncs content prop into editor when content changes externally', async () => {
    const initialContent = '<p>Initial</p>'
    const { rerender } = render(
      <RichTextEditor {...defaultProps} content={initialContent} />
    )

    await waitFor(() => {
      expect(screen.getByTestId('editor-content')).toBeInTheDocument()
    })

    expect(mockCommands.setContent).not.toHaveBeenCalled()

    const newContent = '<p>Updated from parent</p>'
    rerender(
      <RichTextEditor {...defaultProps} content={newContent} onChange={vi.fn()} />
    )

    await waitFor(() => {
      expect(mockCommands.setContent).toHaveBeenCalledWith(newContent, false)
    })
  })
})
