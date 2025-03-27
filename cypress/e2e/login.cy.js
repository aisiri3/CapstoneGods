// cypress/e2e/login.cy.js

describe('Login Page', () => {
    beforeEach(() => {
      // Visit the login page before each test
      cy.visit('http://localhost:3000/');
    });
  
    it('should display the login form', () => {
      // Check that all elements are visible
      cy.contains('h1', 'Welcome back!').should('be.visible');
      cy.contains('p', 'Sign in to your account').should('be.visible');
      cy.get('label[for="email"]').should('contain', 'Email');
      cy.get('input[name="email"]').should('be.visible');
      cy.get('label[for="password"]').should('contain', 'Password');
      cy.get('input[name="password"]').should('be.visible');
      cy.get('button[type="submit"]').should('contain', 'Sign In');
      cy.contains('a', 'Register here').should('be.visible');
    });
  
    it('should show error with invalid credentials', () => {
      // Intercept API call - matching your actual backend response
      cy.intercept('POST', '/api/login', {
        statusCode: 401,
        body: { error: 'Invalid password' }
      }).as('loginFailed');
  
      // Fill in login form with invalid credentials
      cy.get('input[name="email"]').type('wrong@example.com');
      cy.get('input[name="password"]').type('wrongpassword');
      cy.get('button[type="submit"]').click();
  
      // Verify API call was made and error is displayed
      cy.wait('@loginFailed');
      cy.get('.text-red-700').should('exist');
    });
  
    it('should log in with specific credentials and redirect to main page', () => {
      // Use the specific login credentials
      const email = 'cap@gmail.com';
      const password = '12345678';
      
      // Don't mock the API response - test with real backend
      // Fill in login form with the specified credentials
      cy.get('input[name="email"]').type(email);
      cy.get('input[name="password"]').type(password);
      cy.get('button[type="submit"]').click();
      
      // Verify redirect to main page
      cy.url().should('eq', 'http://localhost:3000/main');
      
      // Optional: verify user is logged in by checking for elements on the main page
      // This depends on what elements are on your main page
      // For example:
      // cy.get('header').should('contain', 'Welcome');
    });
  
    it('should navigate to register page when clicking register link', () => {
      cy.contains('a', 'Register here').click();
      cy.url().should('include', '/auth/register');
      // Navigate back to login page for subsequent tests
      cy.visit('http://localhost:3000/');
    });
  
    it('should handle server errors', () => {
      // Intercept API call and simulate server error
      cy.intercept('POST', '/api/login', {
        statusCode: 500,
        body: { error: "Server error" }
      }).as('serverError');
  
      // Fill in login form
      cy.get('input[name="email"]').type('test@example.com');
      cy.get('input[name="password"]').type('password123');
      cy.get('button[type="submit"]').click();
  
      // Wait for the intercepted request
      cy.wait('@serverError');
      
      // Verify an error is displayed (matching how your frontend handles errors)
      cy.get('.text-red-700').should('exist');
    });
  });