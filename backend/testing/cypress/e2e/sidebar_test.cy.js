/*
End-to-End test suite for the Sidebar Tab using the Cypress framework:
To run tests:
  1. cd backend/testing
  2. Install the cypress package - npm install cypress (if not installed before)
  3. Ensure the backend server and frontend UI is running. 
  3. Launch the Cypress test runner UI - npx cypress open
  4. In the Cypress UI, navigate to the "e2e" test list and click on `sidebar_test.cy.js` to run 
     this test.
  5. Alternatively to run tests (headless mode in terminal): 
     npx cypress run --spec cypress/e2e/sidebar_test.cy.js

*/


describe('Sidebar Tests', () => {
    const BASE_URL = 'http://localhost:3000';
    const email = 'testuser_318@gmail.com';
    const password = 'TestPassword123';

    beforeEach(() => {
        // Login and access sidebar via main chat page
        cy.visit(BASE_URL);
        cy.get('#email').type(email);
        cy.get('#password').type(password);
        cy.contains('Sign In').click();
        cy.wait(6000);

        
        cy.url().should('eq', `${BASE_URL}/main`, { timeout: 15000 });
        cy.wait(5000);
    });


    // Test 1: Ensure sidebar is present and can be expanded/collapsed:
    it('Sidebar is present and can be expanded/collapsed', () => {
        cy.get('.sidebar-container', { timeout: 10000 }).should('exist');
        cy.get('.expand-button').click();
        cy.get('.sidebar.expanded', { timeout: 10000 }).should('exist');
        cy.get('.expand-button').click();
        cy.get('.sidebar.collapsed').should('exist');
    });


    // Test 2: Ensure all required UI elements are successfully rendered:
    it('Sidebar contains required UI elements', () => {
        cy.get('.expand-button').click();
        cy.contains('Customize',{ timeout: 10000 }).should('be.visible');
        cy.contains('Select Gender').should('be.visible');
        cy.contains('Select Persona').should('be.visible');
        cy.contains('Select Language').should('be.visible');
        cy.contains('Settings').should('be.visible');
    });

    // Test 3: Ensure the user can customize gender, persona and language through the Sidebar:
    it('Allows customization of gender, persona, and language', () => {
        cy.get('.expand-button').click({ force: true });
        cy.wait(2000);
        
        cy.contains('Select Gender').click({ force: true });
        cy.contains('Male').click({ force: true });
        cy.get('.submenu-item.selected').should('contain', 'Male');
        cy.contains('Female').click({ force: true });
        cy.get('.submenu-item.selected').should('contain', 'Female');
                

        cy.contains('Select Persona').click({ force: true });
        cy.contains('Casual').click({ force: true });
        cy.get('.submenu-item.selected').should('contain', 'Casual');
        cy.contains('Professional').click({ force: true });
        cy.get('.submenu-item.selected').should('contain', 'Professional');
        
        cy.contains('Select Language').click({ force: true });
        cy.contains('English').click({ force: true });
        cy.get('.submenu-item.selected').should('contain', 'English');
        cy.contains('Malay').click({ force: true });
        cy.get('.submenu-item.selected').should('contain', 'Malay');
    });


    // Test 4: Ensure the user can click on 'Complete Selection' and save choices:
    it('Clicking Complete Selection confirms and saves choices', () => {
        const gender = 'Female';
        const persona = 'Professional';
        const language = 'Malay';

        cy.get('.expand-button').click({ force: true });
        
        cy.contains('Select Gender').click({ force: true });
        cy.contains(gender).click();


        cy.contains('Select Persona').click({ force: true });
        cy.contains(persona).click({ force: true });


        cy.contains('Select Language').click({ force: true });
        cy.contains(language).click({ force: true });

        cy.wait(5000);
        
        cy.contains('Complete Selection').click({ force: true });

        cy.on('window:alert', (text) => {
            expect(text).to.contain('Your selection has been saved');
        });
    });

    // Test 5: Ensure sidebar maintains state (same preferences) after navigation:
    it('Sidebar maintains state after navigation', () => {
        const gender = 'Female';
        const persona = 'Casual';
        const language = 'English';

        cy.get('.expand-button').click({ force: true });
        cy.contains('Select Gender').click({ force: true });
        cy.contains(gender).click({ force: true });
        
        cy.contains('Select Persona').click({ force: true });
        cy.contains(persona).click({ force: true });


        cy.contains('Select Language').click({ force: true });
        cy.contains(language).click({ force: true });

        cy.wait(2000);
        cy.contains('Complete Selection').click({ force: true });
        cy.wait(7000);

        cy.get('.expand-button').click({ force: true });
        cy.wait(3000);
        cy.contains('Settings').click({ force: true });
        cy.wait(5000);
        cy.url().should('eq', `${BASE_URL}/settings`, {timeout:10000});
        

        cy.contains('Back to Main Page').click();
        cy.wait(2000);
        cy.url().should('eq', `${BASE_URL}/main`);
        cy.wait(2000);
        
        cy.get('.expand-button').click();
        cy.wait(3000);

        // Ensure previous selections persist
        cy.window().then((win) => {
            const savedSelections = JSON.parse(win.localStorage.getItem("userSelections"));
            expect(savedSelections.gender).to.equal("Female");
            expect(savedSelections.persona).to.equal("Casual");
            expect(savedSelections.language).to.equal("English");
        });
    });

    // Test 6: Ensure the API endpoint sends the correct selection data:
    it('API endpoint sends correct selection data', () => {
        const gender = 'Male';
        const persona = 'Professional';
        const language = 'Malay';

        cy.get('.expand-button').click({ force: true });
        cy.wait(2000);
        cy.contains('Select Gender').click({ force: true });
        cy.contains(gender).click({ force: true });
        
        cy.contains('Select Persona').click({ force: true });
        cy.contains(persona).click({ force: true });


        cy.contains('Select Language').click({ force: true });
        cy.contains(language).click({ force: true });

        cy.wait(2000);
        
        cy.intercept('POST', '/api/send-selections').as('sendSelections');
        
        cy.contains('Complete Selection').click({ force: true });
        
        cy.wait('@sendSelections').then(({ request, response }) => {
            expect(request.body).to.deep.equal({
                gender: gender,
                persona: persona,
                language: language
            });
            expect(response.statusCode).to.eq(200);
        });
    });

});