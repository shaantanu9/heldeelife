# Editor and Blog Flow Test Suite

This document describes the test coverage for the blog editor components and the full create/edit blog post flow.

## Test Files

| File | Scope |
|------|--------|
| `tests/components/editor/rich-text-editor.test.tsx` | RichTextEditor (TipTap) unit tests |
| `tests/components/editor/image-upload-dialog.test.tsx` | ImageUploadDialog unit tests |
| `tests/components/blog/product-search-dialog.test.tsx` | ProductSearchDialog unit tests |
| `tests/lib/utils/blog.test.ts` | Blog utils (generateSlug, generateKeywords, extractExcerpt, calculateReadingTime) |
| `tests/app/admin/blog/blog-post-form-flow.test.tsx` | New blog post form flow (validation, slug, submit) |

## RichTextEditor Tests

- **Loading / ready**: Shows "Loading editor..." before mount; shows toolbar and editor content when ready.
- **onChange**: Calls `onChange` when editor content updates.
- **Toolbar**: Bold button triggers `editor.chain().focus().toggleBold().run()`.
- **Image dialog**: Image button opens ImageUploadDialog; inserting from dialog calls `setImage` and shows toast.
- **Product dialog**: Product button opens ProductSearchDialog; selecting a product inserts product embed HTML and shows toast.
- **Placeholder**: Custom placeholder is passed to TipTap config.
- **Content sync**: When `content` prop changes externally, editor content is updated via `setContent`.

TipTap is mocked (`@tiptap/react`): `useEditor` returns a fake editor with `chain`, `getHTML`, `commands`, `isActive`, `can`, `getAttributes`, and `EditorContent` renders a simple div.

## ImageUploadDialog Tests

- Renders dialog when open; does not render when closed.
- Shows "Upload Image" and "From URL" tabs; default tab is Upload.
- URL tab: input for image URL; Insert and Cancel buttons.
- Cancel calls `onOpenChange(false)`.
- Insert button disabled when no URL and no upload.
- Insert from URL: typing URL, then Insert, calls `onInsert(url)` and `onOpenChange(false)`.
- Insert from Upload tab: mock ImageUpload has "Simulate upload"; after simulate, Insert calls `onInsert` with uploaded URL.
- Custom `folder` and `tags` are passed through.

## ProductSearchDialog Tests

- Renders when open; fetches featured products on open (`/api/products?featured=true&limit=12`).
- Displays product list after fetch; shows product name and price.
- Select product then "Insert Product": calls `onSelect(product)` and `onOpenChange(false)`.
- Search: typing in search box triggers fetch with `search=` query.
- Empty state: "No products found" when fetch returns empty.
- `fetch` is mocked in `beforeEach`; tests override with `mockResolvedValueOnce` where needed.
- `useDebounce` is mocked to return the value immediately (no delay).

## Blog Utils Tests

- **generateSlug**: Lowercase, spaces to hyphens, strip special chars, trim/collapse hyphens, empty string.
- **generateKeywords**: Extracts keywords, excludes stop words, respects `maxKeywords`, frequency order, empty input.
- **extractExcerpt**: Short content unchanged, truncation at length/sentence, HTML stripped, default maxLength 160.
- **calculateReadingTime**: Word count → minutes, round up, short content, empty content (0 or 1).

## Blog Post Form Flow Tests (New Post)

- **Render**: Form has title, slug, excerpt, content (RichTextEditor), featured image, status, category, tags, SEO, Create Post button.
- **Slug**: Typing title auto-fills slug (e.g. "My First Blog Post" → "my-first-blog-post").
- **Validation**: Empty title shows "Title is required"; short content shows "Content must be at least 100 characters".
- **Submit**: Valid form calls `POST /api/blog/posts` with title, slug, status (draft), etc.
- **Fetch**: On mount, fetches `/api/blog/categories` and `/api/blog/tags`.

Mocks: `next/navigation`, `next-auth/react`, `@tiptap/react` (same editor mock as RichTextEditor tests, including `getAttributes`), `sonner`, and global `fetch` for categories, tags, and posts.

## Running the Tests

```bash
# All editor and blog flow tests
npm run test:run -- tests/components/editor tests/components/blog/product-search-dialog.test.tsx tests/lib/utils/blog.test.ts tests/app/admin/blog

# Single file
npm run test:run -- tests/components/editor/rich-text-editor.test.tsx
```

For full run (including existing ecommerce, API, etc.):

```bash
npm run test:run
```

## E2E (Cypress)

Editor and image upload in the blog admin are also covered by Cypress in `tests/e2e/imagekit-upload.cy.ts` (featured image upload, rich text editor image upload, blog post creation with image).
