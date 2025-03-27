import {Entity, model, property} from '@loopback/repository';

@model({
  name: 'Usertable',
  settings: {
    strict: false,
    postgresql: {schema: 'public', table: 'usertable'}
  }
})
export class Usertable extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
    required: false,
    postgresql: {
      columnName: 'id',
      dataType: 'integer',
    },
  })
  id: number;


  @property({
    type: 'string',
    required: true,
    postgresql: {
      columnName: 'username',
      dataType: 'character varying',
    },
  })
  username: string;


  @property({
    type: 'string',
    required: true,
    postgresql: {
      columnName: 'email',
      dataType: 'character varying',
    },
  })
  email: string;


  @property({
    type: 'string',
    required: true,
    postgresql: {
      columnName: 'password',
      dataType: 'character varying',
    },
  })
  password: string;


  @property({
    type: 'string',
    required: true,
    postgresql: {
      columnName: 'role',
      dataType: 'character varying',
    },
  })
  role: string;


  constructor(data?: Partial<Usertable>) {
    super(data);
  }
}

export interface UsertableRelations {
  // define navigational properties here
}

export type UsertableWithRelations = Usertable & UsertableRelations;
