import {Entity, model, property} from '@loopback/repository';

@model({
  name: 'Lipsynctable',
  settings: {
    strict: false,
    postgresql: {schema: 'public', table: 'lipsynctable'}
  }
})
export class Lipsynctable extends Entity {
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
    type: 'object',
    postgresql: {
      columnName: 'mouthcues',
      dataType: 'jsonb',
    },
  })
  mouthcues: object;


  @property({
    type: 'date',
    postgresql: {
      columnName: 'datetime',
      dataType: 'timestamp without time zone',
    },
  })
  datetime: Date;


  @property({
    type: 'number',
    postgresql: {
      columnName: 'promptid',
      dataType: 'integer',
    },
  })
  promptid: number;


  constructor(data?: Partial<Lipsynctable>) {
    super(data);
  }
}

export interface LipsynctableRelations {
  // define navigational properties here
}

export type LipsynctableWithRelations = Lipsynctable & LipsynctableRelations;
