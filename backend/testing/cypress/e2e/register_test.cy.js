/*
End-to-End test suite for the Register page using the Cypress framework:
To run tests:
  1. cd backend/testing
  2. Install the cypress package - npm install cypress (if not installed before)
  3. Ensure the backend server and frontend UI is running. 
  3. Launch the Cypress test runner UI - npx cypress open
  4. In the Cypress UI, navigate to the "e2e" test list and click on `register.cy.js` to run 
     this test.
  5. Alternatively to run tests (headless mode in terminal): 
     npx cypress run --spec cypress/e2e/register_test.cy.js

*/

describe('Registration Page Tests', () => {
  const BASE_URL = 'http://localhost:3000';

  beforeEach(() => {
    // Access the Register page by clicking the 'Register here' button from the landing page:
    cy.visit(BASE_URL);
    cy.wait(2000);
    cy.contains('Register here').click();
    cy.wait(3000);

  });

  afterEach(() => {
    cy.wait(2000); 
  });

  // Test 1: Ensure we can successfully navigate to Register page and the URL is correct
  it('Navigates to Register Page', () => {
    cy.url().should('eq', `${BASE_URL}/auth/register`);
  });


  // Test 2: Ensure all required UI elements are successfully rendered:
  it('Checks Required UI Elements', () => {
    cy.get('.logo').should('be.visible');
    cy.contains('Create an Account');
    cy.contains('Enter your information here');
    cy.get('#name').should('exist');
    cy.get('#email').should('exist');
    cy.get('#password').should('exist');
    cy.contains('Register').should('exist');
    cy.contains('Sign In').should('exist');
  });


  // Test 3: Registers a new user successfully
  it('Registers a New User Successfully', () => {
    cy.intercept('POST', '/api/register').as('registerRequest'); // Test the API endpoints

    // Add a random suffix to ensure we dont register an existing account:
    const randomSuffix = Math.floor(Math.random() * 1000);
    const username = `TestUser_${randomSuffix}`;
    const email = `testuser_${randomSuffix}@gmail.com`;
    const password = 'TestPassword123'

    cy.get('#name').type(username);
    cy.get('#email').type(email);
    cy.get('#password').type(password);
    cy.contains('Register').click();

    
    cy.wait('@registerRequest').then(({ request, response }) => {
      expect(request.body).to.deep.equal({
        username: username,
        email: email,
        password: password,
      });
      expect(response.statusCode).to.be.oneOf([200, 201]);
      expect(response.body.message).to.eq('User registered successfully');
    });

    // Ensure successful registration redirects to the Sign in page:
    cy.url().should('eq', `${BASE_URL}/auth/signin`);
  });


  // Test 4: Ensure registration fails with empty fields with appropriate error messages on UI and API:
  it('Fails Registration with Empty Fields', () => {
    cy.intercept('POST', '/api/register').as('registerRequest');

    cy.get('#name').clear();
    cy.get('#email').clear();
    cy.get('#password').clear();
    cy.contains('Register').click();

    
    cy.contains('Missing required fields').should('be.visible');

    cy.wait('@registerRequest').then(({ request, response }) => {
      expect(response.statusCode).to.eq(400); 
      expect(response.body.error).to.eq('Missing required fields'); 
    });
    
  });

  // Test 5: Ensure registration fails with invalid email format with appropriate error messages:
  it('Fails Registration with Invalid Email', () => {
    cy.intercept('POST', '/api/register').as('registerRequest');

    cy.get('#name').type('InvalidUser');
    cy.get('#email').type('invalid-email');
    cy.get('#password').type('TestPassword123');
    cy.contains('Register').click();

    
    cy.contains('Invalid email').should('be.visible');

    
    cy.wait('@registerRequest').then(({ response }) => {
      expect(response.statusCode).to.eq(400);
      expect(response.body.error).to.eq('Invalid email');
    });

  });

  // Test 6: Ensure registration fails with short password:
  it('Fails Registration with Short Password', () => {
    cy.intercept('POST', '/api/register').as('registerRequest');

    cy.get('#name').type('ShortPwdUser');
    cy.get('#email').type('shortpwduser@gmail.com');
    cy.get('#password').type('12345'); 
    cy.contains('Register').click();

    
    cy.contains('Password must be at least 8 characters').should('be.visible');

    
    cy.wait('@registerRequest').then(({ response }) => {
      expect(response.statusCode).to.eq(400);
      expect(response.body.error).to.eq('Password must be at least 8 characters');
    });
  });


  // Test 7: Successfully navigate to Sign in Page:
  it('Navigates to Sign In Page', () => {

    // Type empty values to trigger validation
    cy.get('#name').type(' ');
    cy.get('#name').clear();

    cy.get('#email').type(' ');
    cy.get('#email').clear();

    cy.get('#password').type(' ');
    cy.get('#password').clear();

    cy.contains('Sign In').click();
    cy.url().should('eq', `${BASE_URL}/auth/signin`);
  });

});
