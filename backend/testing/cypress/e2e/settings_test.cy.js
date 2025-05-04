/*
End-to-End test suite for the Settings page using the Cypress framework:
To run tests:
  1. cd backend/testing
  2. Install the cypress package - npm install cypress (if not installed before)
  3. Ensure the backend server and frontend UI is running. 
  3. Launch the Cypress test runner UI - npx cypress open
  4. In the Cypress UI, navigate to the "e2e" test list and click on `settings_test.cy.js` to run 
     this test.
  5. Alternatively to run tests (headless mode in terminal): 
     npx cypress run --spec cypress/e2e/settings_test.cy.js

*/

describe('Settings Page Tests', () => {
    const BASE_URL = 'http://localhost:3000';
    // Valid credentials to login before accessing the Settings page
    const email = 'testuser_948@gmail.com'
    const username = 'TestUser_948'
    const password = 'TestPassword123' // Ensure correct password before logging in

  
    beforeEach(() => {
        cy.visit(BASE_URL);

        cy.get('#email').type(email);
        cy.get('#password').type(Cypress.env('password') || password); // Use latest password
        cy.contains('Sign In').click();
        cy.wait(7000);

        cy.url().should('eq', `${BASE_URL}/main`, {timeout:10000});
    
        cy.get('.settings-item .sidebar-icon').click();
        cy.wait(5000);
  
    });
  
    afterEach(() => {
      cy.wait(2000);
    });

    // Test 1: Ensure we can successfully navigate to Settings page
    it('Navigates to Settings Page', () => {
      cy.wait(2000); 
      cy.url().should('eq', `${BASE_URL}/settings`, {timeout:20000});
    });
  
    // Test 2: Ensure all required UI elements are successfully rendered:
    it('Checks Required UI Elements', () => {
        cy.wait(2000); 
        cy.url().should('eq', `${BASE_URL}/settings`, {timeout:20000});

        cy.get('.back-button button').should('be.visible').contains('Back to Main Page');
    
        cy.get('.logo').should('be.visible');
    
        cy.contains('Profile Information').should('be.visible');
        cy.get('.user-placeholder').should('be.visible');
        cy.get('.left-content .font-bold.text-xl').should('exist');
       
        cy.contains('Log Out').should('be.visible');
    
        cy.contains('Open Developer Mode').should('be.visible');
    
        cy.contains('User Settings').should('exist');
        cy.contains('Change Password').should('be.visible');
    
        cy.get('#new-password').should('exist');
        cy.get('#confirm-password').should('exist');
        cy.get('.password-toggle-btn').should('exist');
    
        cy.contains('Save New Password').should('be.visible');
    });


    // Test 3: Ensure User Information is displayed correctly:
    it('Displays User Information Correctly', () => {
        
        cy.url().should('eq', `${BASE_URL}/settings`, {timeout:20000});
        cy.contains(username).should('be.visible');
        cy.contains(email).should('be.visible');
    });

    // Test 4: Ensure ChangePassword rejects short password:
    it('ChangePassword - Handles Password Length Validation', () => {
        cy.url().should('eq', `${BASE_URL}/settings`, {timeout:20000});

        cy.get('#new-password').type('12345');
        cy.get('#confirm-password').type('12345');
        cy.contains('Save New Password').click({ force: true });
        cy.contains('Password must be at least 8 characters long').should('be.visible');
    });


    // Test 5: Ensure ChangePassword prevents mismatched passwords:
    it('ChangePassword - Prevents Mismatched Passwords', () => {
        cy.url().should('eq', `${BASE_URL}/settings`, {timeout:20000});

        cy.get('#new-password').type('ValidPassword123');
        cy.get('#confirm-password').type('DifferentPassword123');
        cy.contains('Save New Password').click({ force: true });
        cy.contains('Passwords do not match').should('be.visible');
    });
    
    // Test 6: Ensure we can successfully update password
    it('ChangePassword - Successfully Updates Password', () => {
      cy.url().should('eq', `${BASE_URL}/settings`, {timeout:20000});

      cy.intercept('POST', '/api/verify-password').as('VerifyPassword'); // Add this
      cy.intercept('POST', '/api/change-password').as('ChangePassword');

      const currentPassword = Cypress.env('password') || password;
      const newPassword = 'NewPassword123'; 

      cy.window().then((win) => {
          const user = JSON.parse(win.localStorage.getItem('user'));
          if (user) {
              Cypress.env('user_id', user.user_id);
          }
      });

      cy.get('#current-password').type(currentPassword);
      cy.contains('Verify').click();
      
      cy.wait('@VerifyPassword').then(({ response }) => {
          expect(response.statusCode).to.eq(200);
      });
      
      cy.contains('Current password entered is correct!').should('be.visible');
      
      cy.get('#new-password').type(newPassword);
      cy.get('#confirm-password').type(newPassword);
      cy.contains('Save New Password').click({ force: true });

      Cypress.env('password', newPassword);

      cy.wait('@ChangePassword').then(({ request, response }) => {
        expect(request.body).to.deep.equal({
          user_id: Cypress.env('user_id'),
          current_password: currentPassword,
          new_password: newPassword,
        });
        expect(response.statusCode).to.eq(200);
        expect(response.body.message).to.eq('Password updated successfully');
      });

      cy.contains('Password updated successfully!').should('be.visible');
    });


    // Test 7: Ensure API error on ChangePassword is handled properly:
    it('ChangePassword - Handles API Error on Password Update', () => {
      cy.url().should('eq', `${BASE_URL}/settings`, {timeout:20000});

      cy.intercept('POST', '/api/verify-password', {
        statusCode: 200,
        body: { message: 'Password verified successfully' }
      }).as('verifyPassword');
      
      cy.intercept('POST', '/api/change-password', {
        statusCode: 400,
        body: { error: 'Password update failed' },
      }).as('changePassword');
      
      const currentPassword = Cypress.env('password') || password;
      
      cy.get('#current-password').type(currentPassword);
      cy.contains('Verify').click();
      
      cy.wait('@verifyPassword');
      cy.contains('Current password entered is correct!').should('be.visible');
      
      cy.get('#new-password').type('ValidPassword123');
      cy.get('#confirm-password').type('ValidPassword123');
      cy.contains('Save New Password').click({ force: true });
      
      cy.wait('@changePassword');
      cy.contains('Password update failed').should('be.visible');
    });


    // Test 8: Ensure the user can successfully log out:
    it('Logs the User Out Successfully', () => {
        cy.url().should('eq', `${BASE_URL}/settings`, {timeout:20000});
        cy.contains('Log Out').click();
        cy.url().should('eq', `${BASE_URL}/auth/signin`);
        cy.should(() => {
          expect(localStorage.getItem('user')).to.be.null;
        });
    });


    // Test 9: Ensure the user can navigate back to the Main page
    it('Navigates Back to Main Page', () => {
        cy.url().should('eq', `${BASE_URL}/settings`, {timeout:20000});
        cy.contains('Back to Main Page').click();
        cy.url().should('eq', `${BASE_URL}/main`);
    });
  
  });
  
