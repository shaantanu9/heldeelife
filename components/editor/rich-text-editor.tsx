'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { Button } from '@/components/ui/button'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo,
  Redo,
  Package,
} from 'lucide-react'
import { useCallback, useState, useEffect, useRef } from 'react'
import { ImageUploadDialog } from './image-upload-dialog'
import { ProductSearchDialog } from '@/components/blog/product-search-dialog'
import { toast } from 'sonner'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Start writing...',
}: RichTextEditorProps) {
  const [imageDialogOpen, setImageDialogOpen] = useState(false)
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const lastContentRef = useRef<string>(content || '')

  // Ensure component only renders on client side
  useEffect(() => {
    setMounted(true)
  }, [])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: false,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: mounted && content ? content : '', // Only set content after mount and if it exists
    immediatelyRender: false, // Required for SSR in Next.js
    editorProps: {
      attributes: {
        class:
          'prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[400px] px-4 py-3',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      // Only call onChange if content actually changed
      if (html !== lastContentRef.current) {
        onChange(html)
        lastContentRef.current = html
      }
    },
    // Enable all editor features
    enableContentCheck: true,
    enablePasteRules: true,
    enableInputRules: true,
  })

  // Sync content when prop changes from outside (e.g., loading a post)
  // We use a ref to track the last synced content to avoid loops
  useEffect(() => {
    if (!editor || !mounted) return

    const currentContent = editor.getHTML()
    const normalizedContent = content || ''
    const normalizedCurrent = currentContent || ''

    // Only update if:
    // 1. Content prop changed from last known value (external change)
    // 2. Content is different from current editor content
    // This prevents updating when user is typing (onChange -> content prop update -> this effect)
    if (
      normalizedContent !== lastContentRef.current &&
      normalizedContent !== normalizedCurrent &&
      normalizedContent !== undefined &&
      normalizedContent !== null &&
      normalizedContent !== ''
    ) {
      try {
        editor.commands.setContent(normalizedContent, false) // false = don't add to history
        lastContentRef.current = normalizedContent
      } catch (error) {
        console.error('Error setting editor content:', error)
      }
    } else if (normalizedContent === normalizedCurrent) {
      // Keep ref in sync when content matches (user finished editing)
      lastContentRef.current = normalizedContent
    }
  }, [content, editor, mounted])

  const setLink = useCallback(() => {
    if (!editor) return

    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)

    if (url === null) {
      return
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  const handleInsertImage = useCallback(
    (url: string) => {
      if (!editor || !url.trim()) return

      // Insert image at current cursor position
      editor.chain().focus().setImage({ src: url.trim() }).run()
      toast.success('Image inserted successfully')
    },
    [editor]
  )

  const addImage = useCallback(() => {
    if (!editor) return
    setImageDialogOpen(true)
  }, [editor])

  const handleInsertProduct = useCallback(
    (product: {
      id: string
      name: string
      slug: string
      price: number
      images?: string[]
      short_description?: string
      product_categories?: { name: string }
    }) => {
      if (!editor) return

      // Create product embed HTML
      const productImage = product.images?.[0] || ''
      const productCategory = product.product_categories?.name || ''
      const productDescription = product.short_description || ''

      const productHtml = `
        <div 
          class="blog-product-embed" 
          data-product-id="${product.id}"
          data-product-name="${product.name}"
          data-product-slug="${product.slug}"
          data-product-price="${product.price}"
          data-product-image="${productImage}"
          data-product-description="${productDescription}"
          data-product-category="${productCategory}"
        >
          <div class="product-embed-placeholder">
            <p><strong>${product.name}</strong></p>
            <p>₹${Number(product.price).toFixed(2)}</p>
            <p><a href="/products/${product.slug}">View Product →</a></p>
          </div>
        </div>
      `

      // Insert product embed at current cursor position
      editor.chain().focus().insertContent(productHtml).run()
      toast.success('Product inserted successfully')
    },
    [editor]
  )

  const addProduct = useCallback(() => {
    if (!editor) return
    setProductDialogOpen(true)
  }, [editor])

  // Don't render until mounted on client
  if (!mounted) {
    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="border-b bg-muted/50 p-2 flex items-center gap-2 flex-wrap">
          <div className="h-10 w-10 bg-muted animate-pulse rounded" />
          <div className="h-10 w-10 bg-muted animate-pulse rounded" />
          <div className="h-10 w-10 bg-muted animate-pulse rounded" />
        </div>
        <div className="min-h-[400px] bg-muted/20 flex items-center justify-center">
          <p className="text-muted-foreground">Loading editor...</p>
        </div>
      </div>
    )
  }

  // Show loading state if editor not ready
  if (!editor) {
    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="border-b bg-muted/50 p-2 flex items-center gap-2 flex-wrap">
          <div className="h-10 w-10 bg-muted animate-pulse rounded" />
          <div className="h-10 w-10 bg-muted animate-pulse rounded" />
          <div className="h-10 w-10 bg-muted animate-pulse rounded" />
        </div>
        <div className="min-h-[400px] bg-muted/20 flex items-center justify-center">
          <p className="text-muted-foreground">Initializing editor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="border-b bg-muted/50 p-2 flex items-center gap-2 flex-wrap">
        <Button
          type="button"
          variant={editor.isActive('bold') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.isEditable}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('italic') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.isEditable}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          type="button"
          variant={
            editor.isActive('heading', { level: 1 }) ? 'default' : 'ghost'
          }
          size="sm"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          disabled={!editor.isEditable}
        >
          H1
        </Button>
        <Button
          type="button"
          variant={
            editor.isActive('heading', { level: 2 }) ? 'default' : 'ghost'
          }
          size="sm"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          disabled={!editor.isEditable}
        >
          H2
        </Button>
        <Button
          type="button"
          variant={
            editor.isActive('heading', { level: 3 }) ? 'default' : 'ghost'
          }
          size="sm"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          disabled={!editor.isEditable}
        >
          H3
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          type="button"
          variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          disabled={!editor.isEditable}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          disabled={!editor.isEditable}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={setLink}
          disabled={!editor.isEditable}
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addImage}
          disabled={!editor.isEditable}
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addProduct}
          disabled={!editor.isEditable}
          title="Insert Product"
        >
          <Package className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo() || !editor.isEditable}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo() || !editor.isEditable}
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>
      <EditorContent
        editor={editor}
        className="min-h-[400px] max-h-[800px] overflow-y-auto"
      />

      <ImageUploadDialog
        open={imageDialogOpen}
        onOpenChange={setImageDialogOpen}
        onInsert={handleInsertImage}
        folder="blog/content"
        tags={['blog', 'content']}
      />

      <ProductSearchDialog
        open={productDialogOpen}
        onOpenChange={setProductDialogOpen}
        onSelect={handleInsertProduct}
      />
    </div>
  )
}
