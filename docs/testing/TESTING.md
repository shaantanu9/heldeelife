# Testing Guide: heldeelife

## Test Setup

This project uses **Cypress** for end-to-end testing as per project preferences.

## Installation

```bash
npm install --save-dev cypress
```

## Running Tests

```bash
# Open Cypress Test Runner
npx cypress open

# Run tests headlessly
npx cypress run
```

## Test Structure

```
cypress/
├── e2e/
│   ├── products.cy.ts          # Product browsing and detail tests
│   ├── orders.cy.ts             # Order creation and management tests
│   └── admin-products.cy.ts     # Admin product management tests
├── support/
│   └── commands.ts              # Custom Cypress commands
└── fixtures/                    # Test data fixtures
```

## Test Coverage

### Product Tests (`products.cy.ts`)

- ✅ Display products from database
- ✅ Filter products by category
- ✅ Search for products
- ✅ Navigate to product detail page
- ✅ Add product to cart
- ✅ Handle out of stock products
- ✅ Product detail page functionality
- ✅ Quantity selection
- ✅ Multiple quantity cart addition

### Order Tests (`orders.cy.ts`)

- ✅ Create order from checkout
- ✅ Display order history
- ✅ Admin order management
- ✅ Update order status
- ✅ Filter orders by status

### Admin Product Tests (`admin-products.cy.ts`)

- ✅ Display products list
- ✅ Create new product
- ✅ Edit existing product
- ✅ Delete product
- ✅ Toggle product active status

## Writing New Tests

### Example Test Structure

```typescript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup before each test
    cy.visit('/page')
  })

  it('should do something', () => {
    // Test implementation
    cy.get('selector').should('be.visible')
  })
})
```

### Best Practices

1. **Use data-testid attributes** for stable selectors
2. **Keep tests independent** - each test should work standalone
3. **Use beforeEach** for common setup
4. **Test user flows**, not implementation details
5. **Clean up** after tests if needed

## Test Data

Test data is seeded via migrations:

- Products: 6 initial products
- Categories: 3 categories (Cold Relief, Cough Relief, Immunity Booster)
- Inventory: 100 units per product

## CI/CD Integration

Add to your CI pipeline:

```yaml
- name: Run Cypress tests
  run: |
    npm run build
    npm run start &
    npx cypress run
```

## Debugging Tests

1. Use `cy.pause()` to pause test execution
2. Use `cy.debug()` to debug current state
3. Check Cypress dashboard for detailed logs
4. Use `cy.screenshot()` for visual debugging

## Known Issues

- Authentication tests require proper setup
- Some tests may need environment variables
- Database state should be reset between test runs

---

**Last Updated**: 2025-01-27

