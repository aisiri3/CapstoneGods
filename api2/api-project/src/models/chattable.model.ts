import {Entity, model, property} from '@loopback/repository';

@model({
  name: 'Chattable',
  settings: {
    strict: false,
    postgresql: {schema: 'public', table: 'chattable'}
  }
})
export class Chattable extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
    required: true,
    postgresql: {
      columnName: 'id',
      dataType: 'integer',
    },
  })
  id: number;


  @property({
    type: 'number',
    required: true,
    postgresql: {
      columnName: 'userid',
      dataType: 'integer',
    },
  })
  userid: number;


  @property({
    type: 'number',
    required: true,
    postgresql: {
      columnName: 'sessionid',
      dataType: 'integer',
    },
  })
  sessionid: number;


  constructor(data?: Partial<Chattable>) {
    super(data);
  }
}

export interface ChattableRelations {
  // define navigational properties here
}

export type ChattableWithRelations = Chattable & ChattableRelations;
