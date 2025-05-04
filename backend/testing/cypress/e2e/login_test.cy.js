/*
End-to-End test suite for the Login page using the Cypress framework:
To run tests:
  1. cd backend/testing
  2. Install the cypress package - npm install cypress (if not installed before)
  3. Ensure the backend server and frontend UI is running. 
  3. Launch the Cypress test runner UI - npx cypress open
  4. In the Cypress UI, navigate to the "e2e" test list and click on `login_test.cy.js` to run 
     this test.
  5. Alternatively to run tests (headless mode in terminal): 
     npx cypress run --spec cypress/e2e/login_test.cy.js

*/

describe('Login Page', () => {
    beforeEach(() => {
      // Visit the login page before each test
      cy.visit('http://localhost:3000/');
    });


    // Test 1: Ensure all required UI elements are successfully rendered:
    it('should display the login form', () => {
      
      cy.contains('h1', 'Welcome back!').should('be.visible');
      cy.contains('p', 'Sign in to your account').should('be.visible');
      cy.get('label[for="email"]').should('contain', 'Email');
      cy.get('input[name="email"]').should('be.visible');
      cy.get('label[for="password"]').should('contain', 'Password');
      cy.get('input[name="password"]').should('be.visible');
      cy.get('button[type="submit"]').should('contain', 'Sign In');
      cy.contains('a', 'Register here').should('be.visible');
    });
  
    // Test 2: Ensure it throws error with invalid credentials
    it('should show error with invalid credentials', () => {
      
      cy.intercept('POST', '/api/login', {
        statusCode: 401,
        body: { error: 'Invalid password' }
      }).as('loginFailed');
  
      
      cy.get('input[name="email"]').type('wrong@example.com');
      cy.get('input[name="password"]').type('wrongpassword');
      cy.get('button[type="submit"]').click();
      cy.wait(2000);
  
      
      cy.wait('@loginFailed');
      cy.get('.text-red-700').should('exist');
    });
  
    // Test 3: Ensure successful login with valid credentials:
    it('should log in with specific credentials and redirect to main page', () => {
      
      const email = 'testuser_318@gmail.com';
      const password = 'TestPassword123';
      

      cy.get('input[name="email"]').type(email);
      cy.get('input[name="password"]').type(password);
      
      cy.get('button[type="submit"]').click();
      cy.wait(2000);
      
      
      cy.url().should('eq', 'http://localhost:3000/main');
      cy.wait(2000);
      
    });
  
    // Test 4: Successfully navigate to Register Page:
    it('should navigate to register page when clicking register link', () => {
      cy.contains('a', 'Register here').click();
      cy.wait(2000);
      cy.url().should('include', '/auth/register');
      
      cy.visit('http://localhost:3000/');
    });
  
    // Test 5: Ensure API servers are handled gracefully:
    it('should handle server errors', () => {
      
      cy.intercept('POST', '/api/login', {
        statusCode: 500,
        body: { error: "Server error" }
      }).as('serverError');
  
      
      cy.get('input[name="email"]').type('test@example.com');
      cy.get('input[name="password"]').type('password123');
      cy.get('button[type="submit"]').click();
  
      
      cy.wait('@serverError');
      
      
      cy.get('.text-red-700').should('exist');
    });
  });