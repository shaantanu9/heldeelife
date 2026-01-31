import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ImageKitService } from '@/lib/imagekit-service'

// Mock ImageKit instance methods
const mockImageKitInstance = {
  upload: vi.fn(),
  deleteFile: vi.fn(),
  getFileDetails: vi.fn(),
  url: vi.fn(),
}

// Mock ImageKit module
vi.mock('imagekit', () => {
  // Create a mock class inside the factory
  class MockImageKit {
    constructor() {
      return mockImageKitInstance
    }
  }

  return {
    default: MockImageKit,
  }
})

describe('ImageKitService', () => {
  beforeEach(() => {
    // Reset environment variables
    process.env.IMAGEKIT_PUBLIC_KEY = 'test-public-key'
    process.env.IMAGEKIT_PRIVATE_KEY = 'test-private-key'
    process.env.IMAGEKIT_URL_ENDPOINT = 'https://ik.imagekit.io/test'

    // Clear all mocks
    vi.clearAllMocks()

    // Reset the singleton instance
    ;(ImageKitService as any).imagekit = undefined
  })

  afterEach(() => {
    // Restore environment variables
    process.env.IMAGEKIT_PUBLIC_KEY = 'test-public-key'
    process.env.IMAGEKIT_PRIVATE_KEY = 'test-private-key'
    process.env.IMAGEKIT_URL_ENDPOINT = 'https://ik.imagekit.io/test'
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initialize', () => {
    it('should initialize ImageKit client with correct credentials', () => {
      const instance = ImageKitService.initialize()

      expect(instance).toBe(mockImageKitInstance)
    })

    it('should throw error if credentials are missing', () => {
      delete process.env.IMAGEKIT_PUBLIC_KEY

      expect(() => ImageKitService.initialize()).toThrow(
        'ImageKit credentials are missing'
      )
    })

    it('should return the same instance on multiple calls', () => {
      const instance1 = ImageKitService.initialize()
      const instance2 = ImageKitService.initialize()

      expect(instance1).toBe(instance2)
      expect(instance1).toBe(mockImageKitInstance)
    })
  })

  describe('uploadImage', () => {
    it('should upload image successfully', async () => {
      const mockResult = {
        fileId: 'test-file-id',
        name: 'test-image.jpg',
        url: 'https://ik.imagekit.io/test/test-image.jpg',
        fileType: 'image/jpeg',
        fileSize: 1024,
        width: 800,
        height: 600,
      }

      mockImageKitInstance.upload.mockImplementation((options, callback) => {
        callback(null, mockResult)
      })

      const buffer = Buffer.from('test-image-data')
      const result = await ImageKitService.uploadImage(
        buffer,
        'test-image.jpg',
        'heldeelife',
        ['blog']
      )

      expect(result).toEqual(mockResult)
      expect(mockImageKitInstance.upload).toHaveBeenCalledWith(
        {
          file: buffer,
          fileName: 'test-image.jpg',
          folder: 'heldeelife',
          tags: 'blog',
          useUniqueFileName: true,
        },
        expect.any(Function)
      )
    })

    it('should use default folder if not provided', async () => {
      const mockResult = {
        fileId: 'test-file-id',
        name: 'test-image.jpg',
        url: 'https://ik.imagekit.io/test/test-image.jpg',
        fileType: 'image/jpeg',
      }

      mockImageKitInstance.upload.mockImplementation((options, callback) => {
        callback(null, mockResult)
      })

      const buffer = Buffer.from('test-image-data')
      await ImageKitService.uploadImage(buffer, 'test-image.jpg')

      expect(mockImageKitInstance.upload).toHaveBeenCalledWith(
        expect.objectContaining({
          folder: 'heldeelife',
        }),
        expect.any(Function)
      )
    })

    it('should handle upload errors', async () => {
      const mockError = new Error('Upload failed')

      mockImageKitInstance.upload.mockImplementation((options, callback) => {
        callback(mockError, null)
      })

      const buffer = Buffer.from('test-image-data')

      await expect(
        ImageKitService.uploadImage(buffer, 'test-image.jpg')
      ).rejects.toThrow('Upload failed')
    })
  })

  describe('uploadFromUrl', () => {
    it('should upload image from URL successfully', async () => {
      const mockImageData = Buffer.from('image-data')
      const mockResult = {
        fileId: 'test-file-id',
        name: 'external-image.jpg',
        url: 'https://ik.imagekit.io/test/external-image.jpg',
        fileType: 'image/jpeg',
      }

      // Mock fetch
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => mockImageData.buffer,
      } as Response)

      mockImageKitInstance.upload.mockImplementation((options, callback) => {
        callback(null, mockResult)
      })

      const result = await ImageKitService.uploadFromUrl(
        'https://example.com/image.jpg',
        'external-image.jpg',
        'heldeelife',
        ['external']
      )

      expect(result).toEqual(mockResult)
      expect(global.fetch).toHaveBeenCalledWith('https://example.com/image.jpg')
    })

    it('should handle fetch errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        statusText: 'Not Found',
      } as Response)

      await expect(
        ImageKitService.uploadFromUrl(
          'https://example.com/image.jpg',
          'external-image.jpg'
        )
      ).rejects.toThrow('Failed to fetch image: Not Found')
    })
  })

  describe('deleteImage', () => {
    it('should delete image successfully', async () => {
      mockImageKitInstance.deleteFile.mockImplementation((fileId, callback) => {
        callback(null, { success: true })
      })

      const result = await ImageKitService.deleteImage('test-file-id')

      expect(result).toBe(true)
      expect(mockImageKitInstance.deleteFile).toHaveBeenCalledWith(
        'test-file-id',
        expect.any(Function)
      )
    })

    it('should return false on delete error', async () => {
      mockImageKitInstance.deleteFile.mockImplementation((fileId, callback) => {
        callback(new Error('Delete failed'), null)
      })

      // The service catches errors and returns false
      const result = await ImageKitService.deleteImage('test-file-id').catch(
        () => false
      )

      expect(result).toBe(false)
    })
  })

  describe('getImageDetails', () => {
    it('should get image details successfully', async () => {
      const mockResult = {
        fileId: 'test-file-id',
        name: 'test-image.jpg',
        url: 'https://ik.imagekit.io/test/test-image.jpg',
        fileType: 'image/jpeg',
        fileSize: 1024,
        width: 800,
        height: 600,
      }

      mockImageKitInstance.getFileDetails.mockImplementation(
        (fileId, callback) => {
          callback(null, mockResult)
        }
      )

      const result = await ImageKitService.getImageDetails('test-file-id')

      expect(result).toEqual(mockResult)
      expect(mockImageKitInstance.getFileDetails).toHaveBeenCalledWith(
        'test-file-id',
        expect.any(Function)
      )
    })

    it('should return null on error', async () => {
      mockImageKitInstance.getFileDetails.mockImplementation(
        (fileId, callback) => {
          callback(new Error('Not found'), null)
        }
      )

      // The service catches errors and returns null
      const result = await ImageKitService.getImageDetails('invalid-id').catch(
        () => null
      )

      expect(result).toBeNull()
    })
  })

  describe('getImageUrl', () => {
    it('should generate image URL without transformations', () => {
      mockImageKitInstance.url.mockReturnValue(
        'https://ik.imagekit.io/test/image.jpg'
      )

      const url = ImageKitService.getImageUrl('test-file-id')

      expect(url).toBe('https://ik.imagekit.io/test/image.jpg')
      expect(mockImageKitInstance.url).toHaveBeenCalledWith({
        src: 'test-file-id',
        transformation: undefined,
      })
    })

    it('should generate image URL with transformations', () => {
      mockImageKitInstance.url.mockReturnValue(
        'https://ik.imagekit.io/test/image.jpg?tr=w-800,h-600,q-90'
      )

      const url = ImageKitService.getImageUrl('test-file-id', {
        width: 800,
        height: 600,
        quality: 90,
        format: 'webp',
      })

      expect(url).toBe(
        'https://ik.imagekit.io/test/image.jpg?tr=w-800,h-600,q-90'
      )
      expect(mockImageKitInstance.url).toHaveBeenCalledWith({
        src: 'test-file-id',
        transformation: [
          {
            width: '800',
            height: '600',
            quality: '90',
            format: 'webp',
            crop: undefined,
            focus: undefined,
          },
        ],
      })
    })
  })

  describe('getThumbnailUrl', () => {
    it('should generate thumbnail URL with default dimensions', () => {
      mockImageKitInstance.url.mockReturnValue(
        'https://ik.imagekit.io/test/image.jpg?tr=w-200,h-200,q-80'
      )

      const url = ImageKitService.getThumbnailUrl('test-file-id')

      expect(url).toBe(
        'https://ik.imagekit.io/test/image.jpg?tr=w-200,h-200,q-80'
      )
      expect(mockImageKitInstance.url).toHaveBeenCalledWith({
        src: 'test-file-id',
        transformation: [
          {
            width: '200',
            height: '200',
            quality: '80',
            format: 'auto',
            crop: 'maintain_ratio',
            focus: undefined,
          },
        ],
      })
    })

    it('should generate thumbnail URL with custom dimensions', () => {
      mockImageKitInstance.url.mockReturnValue(
        'https://ik.imagekit.io/test/image.jpg?tr=w-150,h-150,q-80'
      )

      const url = ImageKitService.getThumbnailUrl('test-file-id', 150, 150)

      expect(mockImageKitInstance.url).toHaveBeenCalledWith({
        src: 'test-file-id',
        transformation: [
          {
            width: '150',
            height: '150',
            quality: '80',
            format: 'auto',
            crop: 'maintain_ratio',
            focus: undefined,
          },
        ],
      })
    })
  })
})
