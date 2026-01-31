import ImageKit from 'imagekit'

export interface ImageKitUploadResult {
  fileId: string
  name: string
  url: string
  thumbnailUrl?: string
  fileType: string
  fileSize?: number
  height?: number
  width?: number
}

export class ImageKitService {
  private static imagekit: InstanceType<typeof ImageKit>

  /**
   * Initialize ImageKit client
   */
  static initialize() {
    if (!this.imagekit) {
      const publicKey = process.env.IMAGEKIT_PUBLIC_KEY
      const privateKey = process.env.IMAGEKIT_PRIVATE_KEY
      const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT

      if (!publicKey || !privateKey || !urlEndpoint) {
        throw new Error(
          'ImageKit credentials are missing. Please check your environment variables.'
        )
      }

      // Remove trailing slash from urlEndpoint if present
      const cleanUrlEndpoint = urlEndpoint.replace(/\/$/, '')

      this.imagekit = new ImageKit({
        publicKey,
        privateKey,
        urlEndpoint: cleanUrlEndpoint,
      })
    }
    return this.imagekit
  }

  /**
   * Upload image buffer to ImageKit
   * @param imageBuffer - Image file as Buffer
   * @param filename - Name for the uploaded file
   * @param folder - Folder path in ImageKit (optional)
   * @param tags - Tags for organization (optional)
   * @returns Upload result with URL and file ID
   */
  static async uploadImage(
    imageBuffer: Buffer,
    filename: string,
    folder: string = 'heldeelife',
    tags: string[] = []
  ): Promise<ImageKitUploadResult> {
    try {
      const imagekit = this.initialize()

      return new Promise((resolve, reject) => {
        imagekit.upload(
          {
            file: imageBuffer,
            fileName: filename,
            folder: folder,
            tags: tags.join(','),
            useUniqueFileName: true, // Prevents overwriting files with same name
          },
          (error: any, result: any) => {
            if (error) {
              reject(error)
            } else {
              resolve(result as ImageKitUploadResult)
            }
          }
        )
      })
    } catch (error) {
      console.error('Error uploading to ImageKit:', error)
      throw error
    }
  }

  /**
   * Upload image from URL to ImageKit
   * @param imageUrl - URL of the image to upload
   * @param filename - Name for the uploaded file
   * @param folder - Folder path in ImageKit (optional)
   * @param tags - Tags for organization (optional)
   * @returns Upload result with URL and file ID
   */
  static async uploadFromUrl(
    imageUrl: string,
    filename: string,
    folder: string = 'heldeelife',
    tags: string[] = []
  ): Promise<ImageKitUploadResult> {
    try {
      // Fetch the image from the URL
      const response = await fetch(imageUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`)
      }

      const imageBuffer = Buffer.from(await response.arrayBuffer())

      // Upload to ImageKit
      return await this.uploadImage(imageBuffer, filename, folder, tags)
    } catch (error) {
      console.error('Error uploading from URL to ImageKit:', error)
      throw error
    }
  }

  /**
   * Delete image from ImageKit
   * @param fileId - ImageKit file ID
   * @returns Success status
   */
  static async deleteImage(fileId: string): Promise<boolean> {
    try {
      const imagekit = this.initialize()

      return new Promise((resolve, reject) => {
        imagekit.deleteFile(fileId, (error: any, result: any) => {
          if (error) {
            reject(error)
          } else {
            resolve(true)
          }
        })
      })
    } catch (error) {
      console.error('Error deleting image from ImageKit:', error)
      return false
    }
  }

  /**
   * Get image details from ImageKit
   * @param fileId - ImageKit file ID
   * @returns Image details or null if not found
   */
  static async getImageDetails(
    fileId: string
  ): Promise<ImageKitUploadResult | null> {
    try {
      const imagekit = this.initialize()

      return new Promise((resolve, reject) => {
        imagekit.getFileDetails(fileId, (error: any, result: any) => {
          if (error) {
            reject(error)
          } else {
            resolve(result as ImageKitUploadResult)
          }
        })
      })
    } catch (error) {
      console.error('Error getting image details:', error)
      return null
    }
  }

  /**
   * Generate ImageKit URL with transformations
   * @param fileId - ImageKit file ID or file path
   * @param transformations - Image transformation options
   * @returns Transformed image URL
   */
  static getImageUrl(
    fileId: string,
    transformations?: {
      width?: number
      height?: number
      quality?: number
      format?: string
      crop?: string
      focus?: string
    }
  ): string {
    const imagekit = this.initialize()

    return imagekit.url({
      src: fileId,
      transformation: transformations
        ? [
            {
              width: transformations.width?.toString(),
              height: transformations.height?.toString(),
              quality: transformations.quality?.toString(),
              format: transformations.format,
              crop: transformations.crop,
              focus: transformations.focus,
            },
          ]
        : undefined,
    })
  }

  /**
   * Generate thumbnail URL
   * @param fileId - ImageKit file ID
   * @param width - Thumbnail width (default: 200)
   * @param height - Thumbnail height (default: 200)
   * @returns Thumbnail URL
   */
  static getThumbnailUrl(
    fileId: string,
    width: number = 200,
    height: number = 200
  ): string {
    return this.getImageUrl(fileId, {
      width,
      height,
      quality: 80,
      format: 'auto',
      crop: 'maintain_ratio',
    })
  }
}
