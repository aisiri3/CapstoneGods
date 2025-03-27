import {BootMixin} from '@loopback/boot';
import {ApplicationConfig} from '@loopback/core';
import {
  RestExplorerBindings,
  RestExplorerComponent,
} from '@loopback/rest-explorer';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication} from '@loopback/rest';
import {ServiceMixin} from '@loopback/service-proxy';
import path from 'path';
import {MySequence} from './sequence';
import {
  AuthenticationComponent,
  registerAuthenticationStrategy,
} from '@loopback/authentication';
import {
  JWTAuthenticationComponent,
  SECURITY_SCHEME_SPEC,
  UserServiceBindings,
  TokenServiceBindings,  // Add this import
} from '@loopback/authentication-jwt';
import { PostgresDataSource } from './datasources/postgres-db.datasource';
import cors from 'cors';
export {ApplicationConfig};

export class Bahasabuddy extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {
  constructor(options: ApplicationConfig = {}) {
    super(options);
    

    this.sequence(MySequence);
    
    // Set up authentication
    this.component(AuthenticationComponent);
    this.component(JWTAuthenticationComponent);
    this.dataSource(PostgresDataSource, UserServiceBindings.DATASOURCE_NAME);
    
    // Add these crucial JWT bindings
    this.bind(TokenServiceBindings.TOKEN_SECRET).to('myjwtsecretkey123456789');
    this.bind(TokenServiceBindings.TOKEN_EXPIRES_IN).to('36000');
    
    // Set up default home page
    this.static('/', path.join(__dirname, '../public'));

    // Add security spec
    this.api({
      openapi: '3.0.0',
      info: {
        title: 'Bahasabuddy API',
        version: '1.0.0',
      },
      paths: {},
      components: {securitySchemes: SECURITY_SCHEME_SPEC},
      security: [
        {
          // Use JWT authentication
          jwt: [],
        },
      ],
    });

    // Customize @loopback/rest-explorer configuration here
    this.configure(RestExplorerBindings.COMPONENT).to({
      path: '/explorer',
    });
    this.component(RestExplorerComponent);

    this.projectRoot = __dirname;
    // Customize @loopback/boot Booter Conventions here
    this.bootOptions = {
      controllers: {
        // Customize ControllerBooter Conventions here
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };
  }
}