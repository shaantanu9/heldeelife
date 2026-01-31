/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to login as a user
       * @example cy.login('user@example.com', 'password')
       */
      login(email: string, password: string): Chainable<void>

      /**
       * Custom command to login as admin
       * @example cy.loginAsAdmin()
       */
      loginAsAdmin(): Chainable<void>

      /**
       * Custom command to add product to cart
       * @example cy.addToCart('product-id')
       */
      addToCart(productId: string): Chainable<void>
    }
  }
}

export {}









