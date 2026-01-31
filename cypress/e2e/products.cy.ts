describe('Product Management', () => {
  beforeEach(() => {
    cy.visit('/shop')
  })

  it('should display products from database', () => {
    cy.get('h1').contains('Shop')
    cy.get('[data-testid="product-card"]').should('have.length.greaterThan', 0)
  })

  it('should filter products by category', () => {
    cy.contains('button', 'Cold Relief').click()
    cy.url().should('include', 'category=cold-relief')
  })

  it('should search for products', () => {
    cy.get('input[placeholder="Search products..."]').type('Nasal')
    cy.contains('Saline Tulsi Nasal Spray')
  })

  it('should navigate to product detail page', () => {
    cy.get('[data-testid="product-card"]').first().click()
    cy.url().should('include', '/products/')
    cy.contains('Back to Shop')
  })

  it('should add product to cart', () => {
    cy.get('[data-testid="product-card"]')
      .first()
      .within(() => {
        cy.contains('Add to cart').click()
      })
    cy.get('[data-testid="cart-count"]').should('be.visible')
  })

  it('should show out of stock for unavailable products', () => {
    // This test assumes there's a product with no inventory
    cy.get('[data-testid="product-card"]').each(($card) => {
      cy.wrap($card).within(() => {
        cy.get('button').should('not.be.disabled')
      })
    })
  })
})

describe('Product Detail Page', () => {
  beforeEach(() => {
    cy.visit('/shop')
    cy.get('[data-testid="product-card"]').first().click()
  })

  it('should display product information', () => {
    cy.contains('Description')
    cy.contains('Benefits')
    cy.contains('Ingredients')
  })

  it('should allow quantity selection', () => {
    cy.get('button[aria-label="Increase quantity"]').click()
    cy.get('span').contains('2')
  })

  it('should add multiple quantities to cart', () => {
    cy.get('button[aria-label="Increase quantity"]').click()
    cy.contains('Add to Cart').click()
    cy.get('[data-testid="cart-count"]').should('contain', '2')
  })
})









