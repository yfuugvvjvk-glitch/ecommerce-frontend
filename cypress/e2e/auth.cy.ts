describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000');
  });

  it('should display login page', () => {
    cy.visit('/login');
    cy.contains('Login').should('be.visible');
    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
  });

  it('should login successfully with valid credentials', () => {
    cy.visit('/login');
    
    cy.get('input[type="email"]').type('admin@example.com');
    cy.get('input[type="password"]').type('Admin1234');
    cy.get('button[type="submit"]').click();

    // Should redirect to dashboard
    cy.url().should('include', '/dashboard');
    cy.contains('Dashboard').should('be.visible');
  });

  it('should show error with invalid credentials', () => {
    cy.visit('/login');
    
    cy.get('input[type="email"]').type('wrong@example.com');
    cy.get('input[type="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();

    // Should show error message
    cy.contains('Invalid email or password').should('be.visible');
  });

  it('should register new user', () => {
    cy.visit('/register');
    
    const randomEmail = `test${Date.now()}@example.com`;
    
    cy.get('input[name="name"]').type('Test User');
    cy.get('input[type="email"]').type(randomEmail);
    cy.get('input[type="password"]').type('Password123');
    cy.get('button[type="submit"]').click();

    // Should show success message
    cy.contains('Registration Successful').should('be.visible');
  });

  it('should logout successfully', () => {
    // Login first
    cy.visit('/login');
    cy.get('input[type="email"]').type('admin@example.com');
    cy.get('input[type="password"]').type('Admin1234');
    cy.get('button[type="submit"]').click();

    // Wait for dashboard
    cy.url().should('include', '/dashboard');

    // Click logout
    cy.contains('Logout').click();

    // Should redirect to login
    cy.url().should('include', '/login');
  });
});
