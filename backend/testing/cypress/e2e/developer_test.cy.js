/*
End-to-End test suite for the Developer page using the Cypress framework:
To run tests:
  1. cd backend/testing
  2. Install the cypress package - npm install cypress (if not installed before)
  3. Ensure the backend server and frontend UI is running. 
  3. Launch the Cypress test runner UI - npx cypress open
  4. In the Cypress UI, navigate to the "e2e" test list and click on `developer_test.cy.js` to run 
     this test.
  5. Alternatively to run tests (headless mode in terminal): 
     npx cypress run --spec cypress/e2e/developer_test.cy.js

*/

describe('Developer Tools Page Tests', () => {
    const BASE_URL = 'http://localhost:3000';
    
    const email = 'testuser_318@gmail.com';
    const username = 'TestUser_318';
    const password = 'TestPassword123'; 
  
    beforeEach(() => {
      
      cy.visit(BASE_URL);
  
      cy.get('#email').type(email);
      cy.get('#password').type(Cypress.env('password') || password); // Use latest password
      cy.contains('Sign In').click();
      cy.wait(5000);
  
      
      cy.url().should('eq', `${BASE_URL}/main`, {timeout: 10000});
      
      
      cy.get('.settings-item .sidebar-icon').click();
      cy.wait(5000);
      
     
      cy.url().should('eq', `${BASE_URL}/settings`, {timeout: 20000});
      
      // From settings page, navigate to developer tools
      cy.contains('Open Developer Mode').should('be.visible').click();
      cy.wait(2000);
      cy.url().should('eq', `${BASE_URL}/developer-tools`, {timeout: 20000});
    });

    // Test 1: Ensure Developer page loads correctly:
    it('Developer Tools page loads correctly with back button', () => {
      
      cy.get('.back-button', { timeout: 10000 }).should('be.visible');
      cy.contains('Back to Settings').should('be.visible');
      
      
      cy.get('.main-form', { timeout: 10000 }).should('be.visible');
      cy.contains('Results Overview').should('be.visible');
      cy.contains('Graph of Similarity Score and Response').should('be.visible');
      cy.contains('Model Evaluation').should('be.visible');
    });


    // Test 2: Ensure results overview section displays metrics correctly
    it('Results overview section displays metrics correctly', () => {
    
      cy.get('.overview-section', { timeout: 10000 }).should('be.visible');
      cy.get('.text-cyan-400').should('exist');
      cy.get('.text-rose-400').should('exist');
      
      cy.contains('Average Similarity Score').should('be.visible');
      cy.contains('Average Response Time').should('be.visible');
    });
  
    // Test 3: Ensure chart section displays visualization
    it('Chart section displays visualization', () => {
      
      cy.get('.chart-section', { timeout: 10000 }).should('be.visible');
      cy.get('canvas').should('be.visible');
    });

    // Test 4: Ensure file upload component is present
    it('File upload component is present', () => {
      
      cy.contains('Upload Dataset Excel File Here', { timeout: 10000 }).should('be.visible');
      
      cy.get('input[type="file"]').should('exist');
    });
  
    // Test 5: Ensure persona selection dropdown works correctly
    it('Persona selection dropdown works correctly', () => {
      
      cy.contains('Select Persona', { timeout: 10000 }).should('be.visible');
      cy.get('select[name="personaId"]').should('exist');

      cy.get('select[name="personaId"]').scrollIntoView({ duration: 500 });
      cy.wait(2000);
      
    
      cy.get('select[name="personaId"] option').then($options => {
        if ($options.length > 1) {
          cy.get('select[name="personaId"]').select($options.eq(1).val(), { force: true });
        }
      });
      
      
      cy.get('select[name="personaId"] option').should('have.length.at.least', 1);
    });
  
    // Test 6: Ensure Add Entry and Start Evaluation buttons exist
    it('Add Entry and Start Evaluation buttons exist', () => {
      
      cy.contains('Add Entry', { timeout: 15000 }).should('exist');
      cy.contains('Start Evaluation', { timeout: 15000 }).should('exist');

      cy.contains('Start Evaluation').scrollIntoView({ duration: 500 });

      cy.wait(2000);

      cy.get('table.custom-table.w-full', { timeout: 10000 }).should('exist').and('be.visible');

    });
  
    // Test 7: Ensure navigation to Settings page on clicking Back button:
    it('Back button returns to Settings page', () => {
      
      cy.get('.back-button button', { timeout: 15000 }).should('exist').click({ force: true });
    
      cy.wait(5000);
      
      cy.url().should('eq', `${BASE_URL}/settings`, { timeout: 15000 });
    });
  });