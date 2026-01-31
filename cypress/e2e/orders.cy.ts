describe('Order Management', () => {
  beforeEach(() => {
    // Login as user (you'll need to set up auth)
    cy.visit('/auth/signin')
    // Add login steps here
  })

  it('should create order from checkout', () => {
    cy.visit('/shop')
    cy.get('[data-testid="product-card"]')
      .first()
      .within(() => {
        cy.contains('Add to cart').click()
      })

    cy.visit('/checkout')

    // Fill checkout form
    cy.get('input[name="name"]').type('Test User')
    cy.get('input[name="email"]').type('test@example.com')
    cy.get('input[name="phone"]').type('1234567890')
    cy.get('input[name="address"]').type('123 Test Street')
    cy.get('input[name="city"]').type('Test City')
    cy.get('input[name="state"]').type('Test State')
    cy.get('input[name="pincode"]').type('123456')

    cy.contains('Place Order').click()

    cy.url().should('include', '/checkout')
    cy.contains('Order placed successfully')
  })

  it('should display order history', () => {
    cy.visit('/profile')
    cy.contains('Order History').click()
    cy.get('[data-testid="order-item"]').should('have.length.greaterThan', 0)
  })
})

describe('Admin Order Management', () => {
  beforeEach(() => {
    // Login as admin
    cy.visit('/auth/signin')
    // Add admin login steps
  })

  it('should display all orders', () => {
    cy.visit('/admin/orders')
    cy.get('table').should('be.visible')
    cy.contains('Order Number')
  })

  it('should update order status', () => {
    cy.visit('/admin/orders')
    cy.get('select').first().select('confirmed')
    cy.contains('Order updated successfully')
  })

  it('should filter orders by status', () => {
    cy.visit('/admin/orders')
    cy.get('select[data-testid="status-filter"]').select('pending')
    cy.get('table tbody tr').each(($row) => {
      cy.wrap($row).should('contain', 'pending')
    })
  })
})









