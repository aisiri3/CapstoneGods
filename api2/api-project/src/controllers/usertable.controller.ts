import {authenticate, TokenService} from '@loopback/authentication';
import {
  Credentials,
  MyUserService,
  TokenServiceBindings,
  User,
  UserRepository,
  UserServiceBindings,
} from '@loopback/authentication-jwt';
import {inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {
  get,
  getModelSchemaRef,
  post,
  requestBody,
  SchemaObject,
  HttpErrors,
  param,
  patch,
  del,
} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {genSalt, hash, compare} from 'bcryptjs';
import {Usertable, UsertableWithRelations} from '../models/usertable.model';
import {UsertableRepository} from '../repositories/usertable.repository';

const CredentialsSchema: SchemaObject = {
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email: {
      type: 'string',
      format: 'email',
    },
    password: {
      type: 'string',
      minLength: 8,
    },
  },
};

export const CredentialsRequestBody = {
  description: 'The input of login function',
  required: true,
  content: {
    'application/json': {schema: CredentialsSchema},
  },
};

export class UserController {
  constructor(
    @repository(UsertableRepository)
    public usertableRepository: UsertableRepository,
    @inject(TokenServiceBindings.TOKEN_SERVICE)
    public jwtService: TokenService,
    @inject(UserServiceBindings.USER_SERVICE)
    public userService: MyUserService,
    @inject(SecurityBindings.USER, {optional: true})
    public user: UserProfile,
  ) {}

  @post('/users/register', {
    responses: {
      '200': {
        description: 'User registration successful',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
  })
  async register(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Usertable, {
            title: 'NewUser',
            exclude: ['id'],
          }),
        },
      },
    })
    userData: Omit<Usertable, 'id'>,
  ): Promise<{token: string}> {
    // Check if email already exists
    const existingUser = await this.usertableRepository.findOne({
      where: {email: userData.email},
    });
    if (existingUser) {
      throw new HttpErrors.Conflict('Email already exists');
    }

    // Check if username already exists
    const existingUsername = await this.usertableRepository.findOne({
      where: {username: userData.username},
    });
    if (existingUsername) {
      throw new HttpErrors.Conflict('Username already exists');
    }

    // Hash password
    const salt = await genSalt(10);
    const hashedPassword = await hash(userData.password, salt);
    userData.password = hashedPassword;

    // If role is not specified, set a default role
    if (!userData.role) {
      userData.role = 'user';
    }

    const savedUser = await this.usertableRepository.create(userData);

    // Create user credentials for JWT
    const userProfile = this.userProfileFromUser(savedUser);
    const token = await this.jwtService.generateToken(userProfile);

    return {token};
  }

  @post('/users/login', {
    responses: {
      '200': {
        description: 'Token',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                },
                user: {
                  type: 'object',
                  properties: {
                    id: {type: 'number'},
                    email: {type: 'string'},
                    username: {type: 'string'},
                    role: {type: 'string'},
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  async login(
    @requestBody(CredentialsRequestBody) credentials: Credentials,
  ): Promise<{token: string; user: Partial<Usertable>}> {
    // Find user by email
    const user = await this.usertableRepository.findOne({
      where: {email: credentials.email},
    });
    if (!user) {
      throw new HttpErrors.Unauthorized('Invalid email or password');
    }

    // Verify password
    const passwordMatched = await compare(
      credentials.password,
      user.password,
    );
    if (!passwordMatched) {
      throw new HttpErrors.Unauthorized('Invalid email or password');
    }

    // Create user profile for JWT
    const userProfile = this.userProfileFromUser(user);
    const token = await this.jwtService.generateToken(userProfile);

    // Return token and user info (excluding password)
    const {password, ...userWithoutPassword} = user;
    return {
      token,
      user: userWithoutPassword,
    };
  }

  @authenticate('jwt')
  @get('/users/me', {
    responses: {
      '200': {
        description: 'The current user profile',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                id: {type: 'number'},
                email: {type: 'string'},
                username: {type: 'string'},
                role: {type: 'string'},
              },
            },
          },
        },
      },
    },
  })
  async whoAmI(): Promise<Partial<Usertable>> {
    // Get the current user id from the security context
    const userId = this.user[securityId];
    
    // Fetch the user by id
    const userDb = await this.usertableRepository.findById(parseInt(userId));
    
    // Return user info (excluding password)
    const {password, ...userWithoutPassword} = userDb;
    return userWithoutPassword;
  }

  @authenticate('jwt')
  @get('/users', {
    responses: {
      '200': {
        description: 'Array of Usertable model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Usertable, {
                includeRelations: true,
                exclude: ['password'],
              }),
            },
          },
        },
      },
    },
  })
  async find(): Promise<Partial<UsertableWithRelations>[]> {
    // Check if the current user has admin role
    if (this.user.role !== 'admin') {
      throw new HttpErrors.Forbidden('Access denied. Admin role required.');
    }
    
    const users = await this.usertableRepository.find();
    
    // Return users without passwords
    return users.map(user => {
      const {password, ...userWithoutPassword} = user;
      return userWithoutPassword;
    });
  }

  @authenticate('jwt')
  @get('/users/{id}', {
    responses: {
      '200': {
        description: 'Usertable model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Usertable, {
              includeRelations: true,
              exclude: ['password'],
            }),
          },
        },
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
  ): Promise<Partial<UsertableWithRelations>> {
    // Check if the current user is admin or is requesting their own profile
    const userId = parseInt(this.user[securityId]);
    if (this.user.role !== 'admin' && userId !== id) {
      throw new HttpErrors.Forbidden('Access denied');
    }
    
    const user = await this.usertableRepository.findById(id);
    
    // Return user without password
    const {password, ...userWithoutPassword} = user;
    return userWithoutPassword;
  }

  @authenticate('jwt')
  @patch('/users/{id}', {
    responses: {
      '204': {
        description: 'Usertable PATCH success',
      },
    },
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Usertable, {
            partial: true,
            exclude: ['id'], // Prevent changing the ID
          }),
        },
      },
    })
    usertable: Partial<Usertable>,
  ): Promise<void> {
    // Check if the current user is admin or is updating their own profile
    const userId = parseInt(this.user[securityId]);
    if (this.user.role !== 'admin' && userId !== id) {
      throw new HttpErrors.Forbidden('Access denied');
    }
    
    // If password is being updated, hash it
    if (usertable.password) {
      const salt = await genSalt(10);
      usertable.password = await hash(usertable.password, salt);
    }
    
    // Regular users should not be able to update their role
    if (this.user.role !== 'admin' && usertable.role) {
      delete usertable.role;
    }
    
    await this.usertableRepository.updateById(id, usertable);
  }

  @authenticate('jwt')
  @del('/users/{id}', {
    responses: {
      '204': {
        description: 'Usertable DELETE success',
      },
    },
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    // Only admin can delete users
    if (this.user.role !== 'admin') {
      throw new HttpErrors.Forbidden('Access denied. Admin role required.');
    }
    
    await this.usertableRepository.deleteById(id);
  }

  // Helper function to convert Usertable to UserProfile for JWT
  private userProfileFromUser(user: Usertable): UserProfile {
    return {
      [securityId]: user.id.toString(),
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };
  }
}