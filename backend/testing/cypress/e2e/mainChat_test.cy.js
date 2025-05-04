/*
End-to-End test suite for the Main Chat page using the Cypress framework:
To run tests:
  1. cd backend/testing
  2. Install the cypress package - npm install cypress (if not installed before)
  3. Ensure the backend server and frontend UI is running. 
  3. Launch the Cypress test runner UI - npx cypress open
  4. In the Cypress UI, navigate to the "e2e" test list and click on `mainChat_test.cy.js` to run 
     this test.
  5. Alternatively to run tests (headless mode in terminal): 
     npx cypress run --spec cypress/e2e/mainChat_test.cy.js

*/

describe('Basic Main Page Elements Test', () => {
    const BASE_URL = 'http://localhost:3000';
    const email = 'testuser_318@gmail.com';
    const password = 'TestPassword123';
  
    // Test 1: Ensure that all UI elements exist and are functional:
    it('checks that critical UI elements exist and are functional', () => {

      cy.intercept('**/filler_*.wav', { statusCode: 404 }).as('blockAudio');
      cy.intercept('**/*_lipsync.json', { statusCode: 404 }).as('blockLipSync');
      cy.intercept('**/index.json', { statusCode: 404 }).as('blockIndex');
      
    
      cy.visit(BASE_URL);
      cy.get('#email').type(email);
      cy.get('#password').type(password);
      cy.contains('Sign In').click();
      
      
      cy.url().should('eq', `${BASE_URL}/main`, { timeout: 15000 });
      
      // TEST 1a: Avatar component exists
      cy.get('.avatar-container', { timeout: 10000 })
        .should('exist')
        .and('be.visible')
        .log('✓ Avatar component exists and is visible');
      
      // TEST 1b: 3D canvas exists in avatar container
      cy.get('.avatar-container canvas')
        .should('exist')
        .log('✓ 3D canvas exists for avatar');
      
      // TEST 1c: Chat panel exists
      cy.get('.chat-panel')
        .should('exist')
        .and('be.visible')
        .log('✓ Chat panel exists and is visible');
      
      // TEST 1d: Intro message is present
      cy.get('.outputMessage')
        .should('exist')
        .and('contain.text', 'language learning')
        .log('✓ Intro message is present');
      
      // TEST 1e: Input field exists and is enabled
      cy.get('.userInput')
        .should('exist')
        .and('be.enabled')
        .log('✓ Input field exists and is enabled');
      
      // TEST 1f: Send button exists and is clickable
      cy.get('.button')
        .contains('SEND')
        .should('exist')
        .and('be.enabled')
        .log('✓ Send button exists and is enabled');
      
      // Test completed
      cy.log('✅ All critical UI elements verified');
    });
  });