import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProductSearchDialog } from '@/components/blog/product-search-dialog'

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

vi.mock('@/hooks/use-debounce', () => ({
  useDebounce: (value: string) => value,
}))

const mockProducts = [
  {
    id: 'p1',
    name: 'Product One',
    slug: 'product-one',
    price: 999,
    short_description: 'First product',
    images: ['https://example.com/p1.jpg'],
    product_categories: { name: 'Category A', slug: 'category-a' },
  },
  {
    id: 'p2',
    name: 'Product Two',
    slug: 'product-two',
    price: 1499,
    short_description: 'Second product',
    images: [],
    product_categories: { name: 'Category B', slug: 'category-b' },
  },
]

describe('ProductSearchDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onSelect: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ products: [] }),
    } as Response)
  })

  it('renders dialog when open', async () => {
    render(<ProductSearchDialog {...defaultProps} />)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled()
    })

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Search & Insert Product')).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText('Search products by name, description, or SKU...')
    ).toBeInTheDocument()
  })

  it('does not render dialog when closed', () => {
    render(<ProductSearchDialog {...defaultProps} open={false} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('fetches featured products when dialog opens', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ products: mockProducts }),
    } as Response)

    render(<ProductSearchDialog {...defaultProps} />)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/products'),
        expect.any(Object)
      )
    })
    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\?featured=true&limit=12/),
      expect.any(Object)
    )
  })

  it('displays product list after fetch', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ products: mockProducts }),
    } as Response)

    render(<ProductSearchDialog {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Product One')).toBeInTheDocument()
      expect(screen.getByText('Product Two')).toBeInTheDocument()
    })

    expect(screen.getByText('₹999.00')).toBeInTheDocument()
    expect(screen.getByText('₹1,499.00')).toBeInTheDocument()
  })

  it('calls onSelect and onOpenChange when product is selected and Insert clicked', async () => {
    const user = userEvent.setup()
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ products: mockProducts }),
    } as Response)

    const onSelect = vi.fn()
    const onOpenChange = vi.fn()
    render(
      <ProductSearchDialog
        {...defaultProps}
        onSelect={onSelect}
        onOpenChange={onOpenChange}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Product One')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Product One').closest('button')!)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Insert Product' })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Insert Product' }))

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'p1',
        name: 'Product One',
        slug: 'product-one',
        price: 999,
      })
    )
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('searches products when user types in search box', async () => {
    const user = userEvent.setup()
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ products: mockProducts }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ products: [mockProducts[0]] }),
      } as Response)

    render(<ProductSearchDialog {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Product One')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(
      'Search products by name, description, or SKU...'
    )
    await user.type(searchInput, 'one')

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringMatching(/search=one/),
        expect.any(Object)
      )
    })
  })

  it('shows no products message when fetch returns empty', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ products: [] }),
    } as Response)

    render(<ProductSearchDialog {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('No products found')).toBeInTheDocument()
    })
  })

  it('shows loading state while fetching', () => {
    let resolveFetch: (value: any) => void
    const fetchPromise = new Promise<Response>((resolve) => {
      resolveFetch = resolve
    })
    vi.mocked(fetch).mockReturnValueOnce(fetchPromise)

    render(<ProductSearchDialog {...defaultProps} />)

    expect(screen.getByRole('dialog')).toBeInTheDocument()

    resolveFetch!({
      ok: true,
      json: async () => ({ products: [] }),
    } as Response)
  })
})
