import {Entity, model, property} from '@loopback/repository';

@model({
  name: 'Evalmetrics',
  settings: {
    strict: false,
    postgresql: {schema: 'public', table: 'evalmetrics'}
  }
})
export class Evalmetrics extends Entity {
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
    postgresql: {
      columnName: 'sampleresponse',
      dataType: 'text',
    },
  })
  sampleresponse: string;


  @property({
    type: 'string',
    postgresql: {
      columnName: 'actualresponse',
      dataType: 'text',
    },
  })
  actualresponse: string;


  @property({
    type: 'number',
    postgresql: {
      columnName: 'responsetime',
      dataType: 'double precision',
    },
  })
  responsetime: number;


  @property({
    type: 'number',
    postgresql: {
      columnName: 'similarityscore',
      dataType: 'double precision',
    },
  })
  similarityscore: number;


  @property({
    type: 'number',
    postgresql: {
      columnName: 'persona_id',
      dataType: 'integer',
    },
  })
  personaId: number;


  constructor(data?: Partial<Evalmetrics>) {
    super(data);
  }
}

export interface EvalmetricsRelations {
  // define navigational properties here
}

export type EvalmetricsWithRelations = Evalmetrics & EvalmetricsRelations;
