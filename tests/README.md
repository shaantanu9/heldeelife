# ImageKit Image Upload Test Suite

This directory contains comprehensive tests for the ImageKit image upload functionality in the blog system.

## Test Structure

```
tests/
├── setup.ts                          # Test configuration and mocks
├── lib/
│   └── imagekit-service.test.ts      # Unit tests for ImageKitService
├── api/
│   └── images/
│       └── upload.test.ts            # Integration tests for upload API
├── components/
│   └── blog/
│       └── image-upload.test.tsx    # Component tests for ImageUpload
└── e2e/
    └── imagekit-upload.cy.ts        # Cypress E2E tests
```

## Running Tests

### Unit and Integration Tests (Vitest)

```bash
# Run tests in watch mode
npm test

# Run tests with UI
npm run test:ui

# Run tests once
npm run test:run

# Run tests with coverage
npm run test:coverage
```

### End-to-End Tests (Cypress)

```bash
# Open Cypress UI
npx cypress open

# Run Cypress tests headlessly
npx cypress run
```

## Test Coverage

### Unit Tests (`lib/imagekit-service.test.ts`)

- ✅ ImageKit client initialization
- ✅ Image upload functionality
- ✅ Image upload from URL
- ✅ Image deletion
- ✅ Image details retrieval
- ✅ URL generation with transformations
- ✅ Thumbnail generation
- ✅ Error handling

### Integration Tests (`api/images/upload.test.ts`)

- ✅ Authentication and authorization
- ✅ File type validation
- ✅ File size validation
- ✅ Successful upload flow
- ✅ Error handling
- ✅ Default folder and tags

### Component Tests (`components/blog/image-upload.test.tsx`)

- ✅ Component rendering
- ✅ Image preview display
- ✅ Manual URL input
- ✅ File upload functionality
- ✅ File validation (type and size)
- ✅ Image removal
- ✅ Loading states
- ✅ Error handling
- ✅ Custom folder and tags

### E2E Tests (`e2e/imagekit-upload.cy.ts`)

- ✅ Featured image upload in blog admin
- ✅ Rich text editor image upload
- ✅ Blog post creation with images
- ✅ File validation
- ✅ Error handling
- ✅ Access control

## Test Environment Setup

### Required Environment Variables

For tests to run properly, ensure these environment variables are set in `.env.test`:

```env
IMAGEKIT_PUBLIC_KEY=test-public-key
IMAGEKIT_PRIVATE_KEY=test-private-key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/test
```

### Mocking

The test suite uses extensive mocking to avoid actual API calls:

- **ImageKit SDK**: Mocked to return predictable responses
- **NextAuth**: Mocked session data
- **Fetch API**: Mocked for component tests
- **Next.js Navigation**: Mocked router functions

## Writing New Tests

### Unit Test Example

```typescript
import { describe, it, expect, vi } from 'vitest'
import { ImageKitService } from '@/lib/imagekit-service'

describe('MyFeature', () => {
  it('should do something', () => {
    // Test implementation
  })
})
```

### Component Test Example

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MyComponent } from '@/components/my-component'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

### E2E Test Example

```typescript
describe('My Feature', () => {
  it('should work end-to-end', () => {
    cy.visit('/my-page')
    cy.get('button').click()
    cy.contains('Success').should('be.visible')
  })
})
```

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Mocking**: Mock external dependencies (APIs, services, etc.)
3. **Coverage**: Aim for high test coverage, especially for critical paths
4. **Readability**: Write clear test descriptions and use descriptive assertions
5. **Performance**: Keep tests fast by using mocks and avoiding real I/O

## Troubleshooting

### Tests failing due to missing mocks

Ensure all required mocks are set up in `tests/setup.ts` or in individual test files.

### ImageKit service tests failing

Check that environment variables are properly set and ImageKit SDK is correctly mocked.

### Component tests not finding elements

Use `screen.debug()` to see the rendered output and adjust selectors accordingly.

### Cypress tests timing out

Increase timeout values or ensure proper waiting for async operations using `cy.wait()` or `cy.contains()`.

## Continuous Integration

These tests are designed to run in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run tests
  run: |
    npm run test:run
    npm run test:coverage
```

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [Cypress Documentation](https://docs.cypress.io/)









