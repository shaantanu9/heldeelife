import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/images/upload/route'
import { getServerSession } from 'next-auth'
import { ImageKitService } from '@/lib/imagekit-service'

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createSupabaseAdminClient: vi.fn(),
}))

// Mock auth-options
vi.mock('@/lib/auth-options', () => ({
  authOptions: {},
}))

// Mock ImageKitService
vi.mock('@/lib/imagekit-service', () => ({
  ImageKitService: {
    uploadImage: vi.fn(),
  },
}))

describe('POST /api/images/upload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const createMockRequest = (file: File, folder?: string, tags?: string) => {
    const formData = new FormData()
    formData.append('file', file)
    if (folder) formData.append('folder', folder)
    if (tags) formData.append('tags', tags)

    return new NextRequest('http://localhost:3000/api/images/upload', {
      method: 'POST',
      body: formData,
    })
  }

  const createMockFile = (name: string, type: string, size: number) => {
    // Create a blob with the specified size
    const content = new Array(size).fill('a').join('')
    const blob = new Blob([content], { type })
    const file = new File([blob], name, { type })
    // Ensure the file has the correct size
    Object.defineProperty(file, 'size', {
      value: size,
      writable: false,
    })
    return file
  }

  describe('Authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null)

      const file = createMockFile('test.jpg', 'image/jpeg', 1024)
      const request = createMockRequest(file)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 403 if user is not admin', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: 'user-id',
          email: 'user@example.com',
          role: 'user',
        },
      } as any)

      const file = createMockFile('test.jpg', 'image/jpeg', 1024)
      const request = createMockRequest(file)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Forbidden: Admin access required')
    })
  })

  describe('File Validation', () => {
    beforeEach(() => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: 'admin',
        },
      } as any)
    })

    it('should return 400 if no file is provided', async () => {
      const formData = new FormData()
      const request = new NextRequest(
        'http://localhost:3000/api/images/upload',
        {
          method: 'POST',
          body: formData,
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('No file provided')
    })

    it('should return 400 if file type is invalid', async () => {
      const file = createMockFile('test.pdf', 'application/pdf', 1024)
      const request = createMockRequest(file)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid file type. Only images are allowed.')
    })

    it('should accept valid image types', async () => {
      const validTypes = [
        { type: 'image/jpeg', name: 'test.jpg' },
        { type: 'image/png', name: 'test.png' },
        { type: 'image/webp', name: 'test.webp' },
        { type: 'image/gif', name: 'test.gif' },
      ]

      for (const { type, name } of validTypes) {
        vi.mocked(ImageKitService.uploadImage).mockResolvedValue({
          fileId: 'test-id',
          name,
          url: `https://ik.imagekit.io/test/${name}`,
          fileType: type,
        })

        const file = createMockFile(name, type, 1024)
        const request = createMockRequest(file)

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
      }
    })

    it('should return 400 if file size exceeds 10MB', async () => {
      const file = createMockFile('large.jpg', 'image/jpeg', 11 * 1024 * 1024)
      const request = createMockRequest(file)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('File size exceeds 10MB limit')
    })
  })

  describe('Successful Upload', () => {
    beforeEach(() => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: 'admin',
        },
      } as any)
    })

    it('should upload image successfully', async () => {
      const mockResult = {
        fileId: 'test-file-id',
        name: '1234567890-test.jpg',
        url: 'https://ik.imagekit.io/test/1234567890-test.jpg',
        fileType: 'image/jpeg',
        fileSize: 1024,
        width: 800,
        height: 600,
      }

      vi.mocked(ImageKitService.uploadImage).mockResolvedValue(mockResult)

      const file = createMockFile('test.jpg', 'image/jpeg', 1024)
      const request = createMockRequest(file, 'heldeelife', 'blog,featured')

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.url).toBe(mockResult.url)
      expect(data.fileId).toBe(mockResult.fileId)
      expect(data.width).toBe(mockResult.width)
      expect(data.height).toBe(mockResult.height)

      // Verify the upload was called with correct parameters
      expect(ImageKitService.uploadImage).toHaveBeenCalled()
      const callArgs = vi.mocked(ImageKitService.uploadImage).mock.calls[0]
      expect(callArgs[0]).toBeInstanceOf(Buffer)
      // Filename format: `${timestamp}-${file.name}` where file.name might be 'blob' in test environment
      // Just verify it's a string with timestamp prefix
      expect(typeof callArgs[1]).toBe('string')
      expect(callArgs[1]).toMatch(/^\d+-/)
      expect(callArgs[2]).toBe('heldeelife')
      // Tags are split from comma-separated string: 'blog,featured' -> ['blog', 'featured']
      expect(callArgs[3]).toEqual(['blog', 'featured'])
    })

    it('should use default folder and tags if not provided', async () => {
      const mockResult = {
        fileId: 'test-file-id',
        name: '1234567890-test.jpg',
        url: 'https://ik.imagekit.io/test/1234567890-test.jpg',
        fileType: 'image/jpeg',
      }

      vi.mocked(ImageKitService.uploadImage).mockResolvedValue(mockResult)

      const file = createMockFile('test.jpg', 'image/jpeg', 1024)
      const request = createMockRequest(file)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(ImageKitService.uploadImage).toHaveBeenCalledWith(
        expect.any(Buffer),
        expect.any(String),
        'heldeelife',
        expect.arrayContaining(['blog'])
      )
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: 'admin',
        },
      } as any)
    })

    it('should return 500 if upload fails', async () => {
      vi.mocked(ImageKitService.uploadImage).mockRejectedValue(
        new Error('Upload failed')
      )

      const file = createMockFile('test.jpg', 'image/jpeg', 1024)
      const request = createMockRequest(file)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Upload failed')
    })

    it('should handle ImageKit service errors', async () => {
      vi.mocked(ImageKitService.uploadImage).mockRejectedValue(
        new Error('ImageKit API error')
      )

      const file = createMockFile('test.jpg', 'image/jpeg', 1024)
      const request = createMockRequest(file)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('ImageKit API error')
    })
  })
})
