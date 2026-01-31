/**
 * Cypress E2E Tests for ImageKit Image Upload Functionality
 *
 * These tests verify the complete image upload flow in the blog admin interface
 */

describe('ImageKit Image Upload - Blog Admin', () => {
  beforeEach(() => {
    // Mock authentication - adjust based on your auth setup
    cy.intercept('GET', '/api/auth/session', {
      statusCode: 200,
      body: {
        user: {
          id: 'test-admin-id',
          email: 'admin@test.com',
          role: 'admin',
        },
      },
    }).as('getSession')

    // Mock successful image upload
    cy.intercept('POST', '/api/images/upload', {
      statusCode: 200,
      body: {
        success: true,
        url: 'https://ik.imagekit.io/test/uploaded-image.jpg',
        fileId: 'test-file-id',
        name: 'uploaded-image.jpg',
        width: 800,
        height: 600,
        fileSize: 102400,
      },
    }).as('uploadImage')

    // Visit admin blog page (adjust URL as needed)
    cy.visit('/admin/blog/new')
  })

  describe('Featured Image Upload', () => {
    it('should display image upload component', () => {
      cy.contains('Featured Image').should('be.visible')
      cy.contains('Upload an image or paste a URL').should('be.visible')
    })

    it('should upload image file successfully', () => {
      // Create a test image file
      cy.fixture('test-image.jpg', 'base64').then((fileContent) => {
        cy.get('input[type="file"]').then((input) => {
          const blob = Cypress.Blob.base64StringToBlob(
            fileContent,
            'image/jpeg'
          )
          const file = new File([blob], 'test-image.jpg', {
            type: 'image/jpeg',
          })
          const dataTransfer = new DataTransfer()
          dataTransfer.items.add(file)
          const fileInput = input[0] as HTMLInputElement
          fileInput.files = dataTransfer.files

          cy.wrap(input).trigger('change', { force: true })
        })
      })

      cy.wait('@uploadImage')
      cy.contains('Image uploaded successfully').should('be.visible')
      cy.get('img[alt="Preview"]').should('be.visible')
    })

    it('should allow entering image URL manually', () => {
      const testUrl = 'https://example.com/test-image.jpg'

      cy.get('input[type="url"]').type(testUrl)
      cy.get('img[alt="Preview"]').should('have.attr', 'src', testUrl)
    })

    it('should remove uploaded image', () => {
      // First upload an image
      cy.get('input[type="url"]').type('https://example.com/test.jpg')

      // Then remove it
      cy.get('button').contains('X').click()
      cy.get('img[alt="Preview"]').should('not.exist')
      cy.contains('Upload an image or paste a URL').should('be.visible')
    })

    it('should validate file type', () => {
      // Try to upload a non-image file
      cy.get('input[type="file"]').selectFile('cypress/fixtures/test.pdf', {
        force: true,
      })

      cy.contains('Invalid file type').should('be.visible')
    })

    it('should validate file size', () => {
      // Create a large file (over 10MB)
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg',
      })

      cy.get('input[type="file"]').then((input) => {
        const dataTransfer = new DataTransfer()
        dataTransfer.items.add(largeFile)
        const fileInput = input[0] as HTMLInputElement
        fileInput.files = dataTransfer.files

        cy.wrap(input).trigger('change', { force: true })
      })

      cy.contains('File size exceeds 10MB limit').should('be.visible')
    })
  })

  describe('Rich Text Editor Image Upload', () => {
    it('should upload image in editor content', () => {
      // Click the image button in the editor
      cy.get('button').contains('Image').click()

      // Upload file via file input
      cy.fixture('test-image.jpg', 'base64').then((fileContent) => {
        cy.get('input[type="file"]').then((input) => {
          const blob = Cypress.Blob.base64StringToBlob(
            fileContent,
            'image/jpeg'
          )
          const file = new File([blob], 'test-image.jpg', {
            type: 'image/jpeg',
          })
          const dataTransfer = new DataTransfer()
          dataTransfer.items.add(file)
          const fileInput = input[0] as HTMLInputElement
          fileInput.files = dataTransfer.files

          cy.wrap(input).trigger('change', { force: true })
        })
      })

      cy.wait('@uploadImage')

      // Verify image is inserted in editor
      cy.get('.ProseMirror img').should('be.visible')
    })

    it('should allow entering image URL in editor', () => {
      cy.get('button').contains('Image').click()

      // Enter URL in prompt (this will need to be handled based on your implementation)
      cy.window().then((win) => {
        cy.stub(win, 'prompt').returns('https://example.com/test.jpg')
      })

      cy.get('button').contains('Image').click()

      // Verify image is inserted
      cy.get('.ProseMirror img').should(
        'have.attr',
        'src',
        'https://example.com/test.jpg'
      )
    })
  })

  describe('Blog Post Creation with Image', () => {
    it('should create blog post with uploaded featured image', () => {
      // Fill in blog post form
      cy.get('input[name="title"]').type('Test Blog Post')
      cy.get('input[name="slug"]').should('have.value', 'test-blog-post')

      // Upload featured image
      cy.get('input[type="url"]')
        .first()
        .type('https://example.com/featured.jpg')

      // Fill content
      cy.get('.ProseMirror').type('This is test content for the blog post.')

      // Submit form
      cy.intercept('POST', '/api/blog/posts', {
        statusCode: 201,
        body: {
          post: {
            id: 'test-post-id',
            title: 'Test Blog Post',
            featured_image: 'https://example.com/featured.jpg',
          },
        },
      }).as('createPost')

      cy.get('button[type="submit"]').contains('Create Post').click()

      cy.wait('@createPost')
      cy.url().should('include', '/admin/blog/test-post-id')
    })
  })

  describe('Error Handling', () => {
    it('should handle upload API errors', () => {
      cy.intercept('POST', '/api/images/upload', {
        statusCode: 500,
        body: { error: 'Upload failed' },
      }).as('uploadError')

      cy.fixture('test-image.jpg', 'base64').then((fileContent) => {
        cy.get('input[type="file"]').then((input) => {
          const blob = Cypress.Blob.base64StringToBlob(
            fileContent,
            'image/jpeg'
          )
          const file = new File([blob], 'test-image.jpg', {
            type: 'image/jpeg',
          })
          const dataTransfer = new DataTransfer()
          dataTransfer.items.add(file)
          const fileInput = input[0] as HTMLInputElement
          fileInput.files = dataTransfer.files

          cy.wrap(input).trigger('change', { force: true })
        })
      })

      cy.wait('@uploadError')
      cy.contains('Failed to upload image').should('be.visible')
    })

    it('should handle network errors', () => {
      cy.intercept('POST', '/api/images/upload', {
        forceNetworkError: true,
      }).as('networkError')

      cy.fixture('test-image.jpg', 'base64').then((fileContent) => {
        cy.get('input[type="file"]').then((input) => {
          const blob = Cypress.Blob.base64StringToBlob(
            fileContent,
            'image/jpeg'
          )
          const file = new File([blob], 'test-image.jpg', {
            type: 'image/jpeg',
          })
          const dataTransfer = new DataTransfer()
          dataTransfer.items.add(file)
          const fileInput = input[0] as HTMLInputElement
          fileInput.files = dataTransfer.files

          cy.wrap(input).trigger('change', { force: true })
        })
      })

      cy.wait('@networkError')
      cy.contains('Failed to upload image').should('be.visible')
    })
  })

  describe('Access Control', () => {
    it('should prevent non-admin users from uploading', () => {
      cy.intercept('GET', '/api/auth/session', {
        statusCode: 200,
        body: {
          user: {
            id: 'test-user-id',
            email: 'user@test.com',
            role: 'user',
          },
        },
      })

      cy.intercept('POST', '/api/images/upload', {
        statusCode: 403,
        body: { error: 'Forbidden: Admin access required' },
      }).as('forbiddenUpload')

      cy.fixture('test-image.jpg', 'base64').then((fileContent) => {
        cy.get('input[type="file"]').then((input) => {
          const blob = Cypress.Blob.base64StringToBlob(
            fileContent,
            'image/jpeg'
          )
          const file = new File([blob], 'test-image.jpg', {
            type: 'image/jpeg',
          })
          const dataTransfer = new DataTransfer()
          dataTransfer.items.add(file)
          const fileInput = input[0] as HTMLInputElement
          fileInput.files = dataTransfer.files

          cy.wrap(input).trigger('change', { force: true })
        })
      })

      cy.wait('@forbiddenUpload')
      cy.contains('Forbidden').should('be.visible')
    })
  })
})









