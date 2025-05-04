/*
End-to-End test suite for the Persona page using the Cypress framework:
To run tests:
  1. cd backend/testing
  2. Install the cypress package - npm install cypress (if not installed before)
  3. Ensure the backend server and frontend UI is running. 
  3. Launch the Cypress test runner UI - npx cypress open
  4. In the Cypress UI, navigate to the "e2e" test list and click on `persona_test.cy.js` to run 
     this test.
  5. Alternatively to run tests (headless mode in terminal): 
     npx cypress run --spec cypress/e2e/persona_test.cy.js

*/

describe('Persona Evaluation Dashboard Tests', () => {
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
      
      
      cy.contains('Open Developer Mode').should('be.visible').click();
      cy.wait(3000);
      cy.url().should('eq', `${BASE_URL}/developer-tools`, {timeout: 20000});

      cy.contains('button', 'Add a Persona')
        .scrollIntoView()
        .should('be.visible')
        .click();
      cy.wait(1000);
      cy.url().should('eq', `${BASE_URL}/persona-developer-tools`, {timeout: 20000});
    });
  
    afterEach(() => {
      cy.wait(1500); 
    });
  
    // Test 1: Ensure we can successfully navigate to Persona Dashboard
    it('Loads the Persona Evaluation Dashboard', () => {
      cy.url().should('eq', `${BASE_URL}/persona-developer-tools`);
      cy.contains('Add Persona').should('exist');
      cy.get('input[name="name"]').should('exist');
      cy.get('textarea[name="description"]').should('exist');
      cy.contains('Existing Personas').should('exist');
    });

    // Test 2: Successfully adds a new persona
    it('Adds a new persona successfully', () => {
        cy.intercept('POST', '/api/personas').as('addPersona');
    

        const randomSuffix = Math.floor(Math.random() * 1000);
        const personaName = `TestPersona_${randomSuffix}`;
        const description = `This is a test persona added by Cypress_${randomSuffix}`;

        cy.get('input[name="name"]').type(personaName, { force: true });
        cy.get('textarea[name="description"]').type(description, { force: true });
        cy.get('button:contains("Add Persona")').click({ force: true });

        cy.wait('@addPersona').then(({ request, response }) => {
            expect(request.body.name).to.eq(personaName);
            expect(request.body.persona_description).to.eq(description);
            expect(response.statusCode).to.be.oneOf([200, 201]);
        });

        cy.on('window:alert', (txt) => {
            expect(txt).to.contains('Persona added successfully');
        });


        cy.contains(personaName).should('exist');
        });
    
  
    // Test 3: Fails to add persona with empty fields
    it('Fails to submit form with empty fields', () => {
        cy.get('input[name="name"]').type('temp', { force: true }).clear({ force: true });
        cy.get('textarea[name="description"]').type('temp', { force: true }).clear({ force: true });

        cy.get('textarea[name="description"]').blur();

        cy.wait(500);
       
        cy.get('button:contains("Add Persona")').click({ force: true });

        cy.contains('Persona name is required').should('exist');
        cy.contains('Persona description is required').should('exist');
    });
  

  
    // Test 4: Renders existing personas and prevents duplicate names 
    it('Renders existing personas and prevents duplicate personas', () => {
        
        cy.contains('Existing Personas').should('exist');
        cy.get('.main-form')
        .find('.grid > div')
        .should('have.length.greaterThan', 0)
        .first()
        .as('firstPersonaCard');
    
        cy.get('@firstPersonaCard')
        .find('h3')
        .invoke('text')
        .then((existingName) => {
            cy.get('input[name="name"]').type(existingName, { force: true });
            cy.get('textarea[name="description"]')
            .type('Trying to add a duplicate persona', { force: true });
    
            cy.contains('button', 'Add Persona').click({ force: true });
    
            cy.contains('Persona with this name already exists').should('be.visible');
        });
        });
});
  

  