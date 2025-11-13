describe('Products and Shopping Cart', () => {
  beforeEach(() => {
    // Login before each test
    cy.visit('/login');
    cy.get('input[type="email"]').type('admin@example.com');
    cy.get('input[type="password"]').type('Admin1234');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
  });

  it('should display products page', () => {
    cy.visit('/products');
    cy.contains('Produse').should('be.visible');
    cy.get('[data-testid="product-card"]').should('have.length.greaterThan', 0);
  });

  it('should add product to cart', () => {
    cy.visit('/products');
    
    // Click first "Add to Cart" button
    cy.contains('Adaugă în coș').first().click();
    
    // Should show success message
    cy.contains('Produs adăugat în coș').should('be.visible');
  });

  it('should view cart', () => {
    cy.visit('/cart');
    cy.contains('Coș').should('be.visible');
  });

  it('should complete checkout process', () => {
    // Add product to cart
    cy.visit('/products');
    cy.contains('Adaugă în coș').first().click();
    cy.wait(1000);

    // Go to cart
    cy.visit('/cart');
    cy.contains('Finalizează comanda').click();

    // Fill checkout form
    cy.url().should('include', '/checkout');
    cy.get('textarea[placeholder*="adresa"]').type('Str. Test nr. 1, București');
    
    // Place order
    cy.contains('Plasează comanda').click();

    // Should redirect to orders
    cy.url().should('include', '/orders');
  });

  it('should filter products by category', () => {
    cy.visit('/products');
    
    // Click on a category filter
    cy.contains('Electronice').click();
    
    // Products should be filtered
    cy.get('[data-testid="product-card"]').should('exist');
  });
});
