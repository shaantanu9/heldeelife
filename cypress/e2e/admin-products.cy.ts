describe('Admin Product Management', () => {
  beforeEach(() => {
    // Login as admin
    cy.visit('/auth/signin')
    // Add admin login steps
  })

  it('should display products list', () => {
    cy.visit('/admin/products')
    cy.get('table').should('be.visible')
    cy.contains('Product Management')
  })

  it('should create new product', () => {
    cy.visit('/admin/products')
    cy.contains('Add Product').click()

    cy.get('input[name="name"]').type('Test Product')
    cy.get('input[name="price"]').type('99.99')
    cy.get('input[name="sku"]').type('TEST-001')
    cy.get('textarea[name="description"]').type('Test product description')

    cy.contains('Save').click()

    cy.contains('Test Product')
  })

  it('should edit existing product', () => {
    cy.visit('/admin/products')
    cy.get('button[aria-label="Edit"]').first().click()

    cy.get('input[name="name"]').clear().type('Updated Product Name')
    cy.contains('Save').click()

    cy.contains('Updated Product Name')
  })

  it('should delete product', () => {
    cy.visit('/admin/products')
    cy.get('button[aria-label="Delete"]').first().click()
    cy.on('window:confirm', () => true)

    // Verify product is removed
    cy.get('table tbody tr').should('have.length.lessThan', 1)
  })

  it('should toggle product active status', () => {
    cy.visit('/admin/products')
    cy.get('button[aria-label="Edit"]').first().click()

    cy.get('input[type="checkbox"][name="is_active"]').uncheck()
    cy.contains('Save').click()

    cy.get('table tbody tr').first().should('contain', 'Inactive')
  })
})









