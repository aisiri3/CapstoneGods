import {Entity, model, property} from '@loopback/repository';

@model({
  name: 'Sessiontable',
  settings: {
    strict: false,
    postgresql: {schema: 'public', table: 'sessiontable'}
  }
})
export class Sessiontable extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
    required: false,
    postgresql: {
      columnName: 'sessionid',
      dataType: 'integer',
    },
  })
  sessionid: number;


  @property({
    type: 'string',
    postgresql: {
      columnName: 'promptid',
      dataType: 'text',
    },
  })
  promptid: string;


  @property({
    type: 'string',
    required: true,
    postgresql: {
      columnName: 'prompt',
      dataType: 'text',
    },
  })
  prompt: string;


  @property({
    type: 'string',
    required: false,
    postgresql: {
      columnName: 'response',
      dataType: 'text',
    },
  })
  response: string;


  @property({
    type: 'date',
    postgresql: {
      columnName: 'createddatetime',
      dataType: 'timestamp without time zone',
    },
  })
  createddatetime: Date;


  constructor(data?: Partial<Sessiontable>) {
    super(data);
  }
}

export interface SessiontableRelations {
  // define navigational properties here
}

export type SessiontableWithRelations = Sessiontable & SessiontableRelations;
