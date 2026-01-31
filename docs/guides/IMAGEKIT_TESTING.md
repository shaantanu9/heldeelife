# ImageKit Image Upload - Test Suite Documentation

## Overview

This document describes the comprehensive test suite for the ImageKit image upload functionality in the blog system. The tests cover unit, integration, component, and end-to-end scenarios.

## Test Structure

```
tests/
├── setup.ts                          # Global test configuration
├── lib/
│   └── imagekit-service.test.ts      # ImageKitService unit tests
├── api/
│   └── images/
│       └── upload.test.ts            # Upload API integration tests
├── components/
│   └── blog/
│       └── image-upload.test.tsx    # ImageUpload component tests
└── e2e/
    └── imagekit-upload.cy.ts          # Cypress E2E tests
```

## Running Tests

### Unit & Integration Tests (Vitest)

```bash
# Watch mode (recommended for development)
npm test

# Run once
npm run test:run

# With UI
npm run test:ui

# With coverage report
npm run test:coverage
```

### End-to-End Tests (Cypress)

```bash
# Interactive mode
npx cypress open

# Headless mode
npx cypress run
```

## Test Coverage

### 1. ImageKitService Unit Tests

**File**: `tests/lib/imagekit-service.test.ts`

Tests the core ImageKit service functionality:

- ✅ Client initialization with credentials
- ✅ Image upload from buffer
- ✅ Image upload from URL
- ✅ Image deletion
- ✅ Image details retrieval
- ✅ URL generation with transformations
- ✅ Thumbnail generation
- ✅ Error handling

**Key Test Cases**:

- Initializes with correct credentials
- Throws error on missing credentials
- Returns singleton instance
- Uploads images with correct parameters
- Handles upload errors gracefully
- Generates URLs with transformations

### 2. Upload API Integration Tests

**File**: `tests/api/images/upload.test.ts`

Tests the `/api/images/upload` endpoint:

- ✅ Authentication (401 for unauthenticated)
- ✅ Authorization (403 for non-admin)
- ✅ File validation (type, size)
- ✅ Successful upload flow
- ✅ Error handling
- ✅ Default folder and tags

**Key Test Cases**:

- Rejects unauthenticated requests
- Rejects non-admin users
- Validates file types (JPEG, PNG, WebP, GIF)
- Rejects files over 10MB
- Uploads successfully with correct parameters
- Handles ImageKit service errors

### 3. ImageUpload Component Tests

**File**: `tests/components/blog/image-upload.test.tsx`

Tests the React component:

- ✅ Renders upload area
- ✅ Displays image preview
- ✅ Manual URL input
- ✅ File upload functionality
- ✅ File validation
- ✅ Image removal
- ✅ Loading states
- ✅ Error handling
- ✅ Custom folder and tags

**Key Test Cases**:

- Shows upload UI when no image
- Displays preview when URL provided
- Allows manual URL entry
- Uploads files successfully
- Validates file type and size
- Shows loading during upload
- Handles errors gracefully

### 4. End-to-End Tests (Cypress)

**File**: `tests/e2e/imagekit-upload.cy.ts`

Tests complete user workflows:

- ✅ Featured image upload in blog admin
- ✅ Rich text editor image upload
- ✅ Blog post creation with images
- ✅ File validation
- ✅ Error handling
- ✅ Access control

**Key Test Scenarios**:

- Admin can upload featured images
- Images appear in preview
- Images can be removed
- Invalid files are rejected
- Large files are rejected
- Non-admin users cannot upload
- Images upload in rich text editor

## Test Data

### Mock Files

- `tests/fixtures/test-image.jpg` - Placeholder for test image (replace with actual JPEG)

### Mock Responses

All tests use mocked responses to avoid actual API calls:

```typescript
// Successful upload response
{
  success: true,
  url: 'https://ik.imagekit.io/test/image.jpg',
  fileId: 'test-file-id',
  name: 'image.jpg',
  width: 800,
  height: 600,
  fileSize: 102400
}
```

## Environment Setup

### Required Variables

Create `.env.test` for test environment:

```env
IMAGEKIT_PUBLIC_KEY=test-public-key
IMAGEKIT_PRIVATE_KEY=test-private-key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/test
```

### Mocking Strategy

1. **ImageKit SDK**: Fully mocked to return predictable responses
2. **NextAuth**: Mocked session with admin user
3. **Fetch API**: Mocked for component tests
4. **Next.js Router**: Mocked navigation functions

## Writing New Tests

### Unit Test Template

```typescript
import { describe, it, expect, vi } from 'vitest'
import { MyService } from '@/lib/my-service'

describe('MyService', () => {
  it('should do something', () => {
    // Arrange
    const input = 'test'

    // Act
    const result = MyService.doSomething(input)

    // Assert
    expect(result).toBe('expected')
  })
})
```

### Component Test Template

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MyComponent } from '@/components/my-component'

describe('MyComponent', () => {
  it('should handle user interaction', async () => {
    const user = userEvent.setup()
    render(<MyComponent />)

    await user.click(screen.getByRole('button'))
    expect(screen.getByText('Success')).toBeInTheDocument()
  })
})
```

## Best Practices

1. **Isolation**: Each test is independent
2. **Mocking**: External dependencies are mocked
3. **Coverage**: Aim for >80% coverage on critical paths
4. **Readability**: Clear test descriptions
5. **Performance**: Fast execution (<1s per test)

## Troubleshooting

### Common Issues

**Tests failing due to missing mocks**

- Ensure all mocks are set up in `tests/setup.ts`
- Check individual test files for specific mocks

**ImageKit service tests failing**

- Verify environment variables are set
- Check ImageKit SDK is properly mocked

**Component tests not finding elements**

- Use `screen.debug()` to inspect rendered output
- Adjust selectors to match actual DOM structure

**Cypress tests timing out**

- Increase timeout values
- Use proper waiting strategies (`cy.wait()`, `cy.contains()`)

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:run
      - run: npm run test:coverage
```

## Coverage Goals

- **Unit Tests**: >90% coverage
- **Integration Tests**: >80% coverage
- **Component Tests**: >85% coverage
- **E2E Tests**: Critical user flows

## Maintenance

### Regular Updates

- Update tests when features change
- Add tests for new features
- Review and update mocks as needed
- Keep dependencies up to date

### Test Review Checklist

- [ ] All tests pass
- [ ] Coverage meets goals
- [ ] Tests are readable and maintainable
- [ ] Mocks are properly configured
- [ ] E2E tests cover critical flows

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Cypress Documentation](https://docs.cypress.io/)
- [ImageKit Documentation](https://docs.imagekit.io/)

