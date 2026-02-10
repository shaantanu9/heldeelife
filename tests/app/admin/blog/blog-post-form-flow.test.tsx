/**
 * Blog post form flow tests: new post and edit post
 * Covers validation, slug auto-fill, content length, and submit flow.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NewBlogPostPage from '@/app/admin/blog/new/page'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'admin',
      },
    },
    status: 'authenticated',
  }),
}))

vi.mock('@/lib/utils/auth', () => ({
  hasAdminRole: () => true,
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

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

const mockEditor = {
  getHTML: vi.fn().mockReturnValue('<p></p>'),
  getAttributes: vi.fn().mockReturnValue({ href: '' }),
  chain: vi.fn().mockReturnValue(mockChain),
  commands: { setContent: vi.fn() },
  isActive: vi.fn().mockReturnValue(false),
  isEditable: true,
  can: vi.fn().mockReturnValue({
    undo: vi.fn().mockReturnValue(true),
    redo: vi.fn().mockReturnValue(true),
  }),
}

vi.mock('@tiptap/react', () => ({
  useEditor: vi.fn((config: { onUpdate?: (args: { editor: typeof mockEditor }) => void }) => {
    if (config?.onUpdate) {
      setTimeout(() => config.onUpdate!({ editor: mockEditor }), 0)
    }
    return mockEditor
  }),
  EditorContent: () => <div data-testid="editor-content" />,
}))

vi.mock('@/components/editor/image-upload-dialog', () => ({
  ImageUploadDialog: () => null,
}))
vi.mock('@/components/blog/product-search-dialog', () => ({
  ProductSearchDialog: () => null,
}))
vi.mock('@/components/blog/image-upload', () => ({
  ImageUpload: ({ value, onChange }: { value: string; onChange: (u: string) => void }) => (
    <div data-testid="featured-image-upload">
      <input
        type="url"
        placeholder="https://example.com/image.jpg"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Featured image URL"
      />
    </div>
  ),
}))
vi.mock('@/components/blog/seo-analyzer', () => ({
  SEOAnalyzer: () => <div data-testid="seo-analyzer">SEO</div>,
}))
vi.mock('@/components/blog/content-templates', () => ({
  ContentTemplates: () => <div data-testid="content-templates">Templates</div>,
}))
vi.mock('@/components/blog/blog-preview', () => ({
  BlogPreview: () => <div data-testid="blog-preview">Preview</div>,
}))

describe('New Blog Post Form Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockEditor.getHTML.mockReturnValue('<p></p>')
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/blog/categories'))
        return Promise.resolve({
          ok: true,
          json: async () => ({ categories: [] }),
        } as Response)
      if (url.includes('/api/blog/tags'))
        return Promise.resolve({
          ok: true,
          json: async () => ({ tags: [] }),
        } as Response)
      return Promise.resolve({ ok: false, json: async () => ({}) } as Response)
    })
  })

  it('renders new blog post form with required fields', async () => {
    render(<NewBlogPostPage />)

    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/slug/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/excerpt/i)).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: /create post/i })).toBeInTheDocument()
    expect(screen.getByText('Back to Blog Management')).toBeInTheDocument()
  })

  it('auto-generates slug from title', async () => {
    const user = userEvent.setup()
    render(<NewBlogPostPage />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter post title')).toBeInTheDocument()
    })

    const titleInput = screen.getByPlaceholderText('Enter post title')
    await user.type(titleInput, 'My First Blog Post')

    await waitFor(() => {
      const slugInput = screen.getByPlaceholderText('post-url-slug')
      expect(slugInput).toHaveValue('my-first-blog-post')
    })
  })

  it('shows validation error when title is empty on submit', async () => {
    const user = userEvent.setup()
    render(<NewBlogPostPage />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter post title')).toBeInTheDocument()
    })

    const titleInput = screen.getByPlaceholderText('Enter post title')
    await user.clear(titleInput)

    const submitButton = screen.getByRole('button', { name: /create post/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument()
    })
  })

  it('shows validation error when content is too short', async () => {
    const user = userEvent.setup()
    mockEditor.getHTML.mockReturnValue('<p>Short.</p>')

    render(<NewBlogPostPage />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter post title')).toBeInTheDocument()
    })

    await user.type(screen.getByPlaceholderText('Enter post title'), 'Valid Title')
    await user.type(screen.getByPlaceholderText('post-url-slug'), 'valid-title')

    const submitButton = screen.getByRole('button', { name: /create post/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/content must be at least 100 characters/i)).toBeInTheDocument()
    })
  })

  it('submits form and calls POST /api/blog/posts when valid', async () => {
    const user = userEvent.setup()

    vi.mocked(fetch).mockImplementation((url: string) => {
      if (url.includes('/api/blog/categories'))
        return Promise.resolve({
          ok: true,
          json: async () => ({ categories: [] }),
        } as Response)
      if (url.includes('/api/blog/tags'))
        return Promise.resolve({
          ok: true,
          json: async () => ({ tags: [] }),
        } as Response)
      if (url.includes('/api/blog/posts'))
        return Promise.resolve({
          ok: true,
          json: async () => ({ post: { id: 'new-post-1' } }),
        } as Response)
      return Promise.resolve({ ok: false, json: async () => ({}) } as Response)
    })

    const longContent =
      '<p>' + 'This is the minimum required content length for the blog post. '.repeat(3) + '</p>'
    mockEditor.getHTML.mockReturnValue(longContent)

    render(<NewBlogPostPage />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter post title')).toBeInTheDocument()
    })

    await user.type(screen.getByPlaceholderText('Enter post title'), 'Full Post Title')
    await waitFor(() => {
      expect(screen.getByPlaceholderText('post-url-slug')).toHaveValue('full-post-title')
    })

    await user.click(screen.getByRole('button', { name: /create post/i }))

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/blog/posts',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      )
    })

    const postCall = vi.mocked(fetch).mock.calls.find((c) => c[0] === '/api/blog/posts')
    if (postCall) {
      const body = JSON.parse(postCall[1]?.body as string)
      expect(body.title).toBe('Full Post Title')
      expect(body.slug).toBe('full-post-title')
      expect(body.status).toBe('draft')
    }
  })

  it('fetches categories and tags on mount', async () => {
    vi.mocked(fetch).mockImplementation((url: string) => {
      if (url.includes('/api/blog/categories'))
        return Promise.resolve({
          ok: true,
          json: async () => ({ categories: [{ id: 'c1', name: 'Wellness' }] }),
        } as Response)
      if (url.includes('/api/blog/tags'))
        return Promise.resolve({
          ok: true,
          json: async () => ({ tags: [{ id: 't1', name: 'health' }] }),
        } as Response)
      return Promise.resolve({ ok: false, json: async () => ({}) } as Response)
    })

    render(<NewBlogPostPage />)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/blog/categories')
      expect(fetch).toHaveBeenCalledWith('/api/blog/tags')
    })
  })
})
