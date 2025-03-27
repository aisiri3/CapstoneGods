import {Entity, model, property} from '@loopback/repository';

@model({
  name: 'Personas',
  settings: {
    strict: false,
    postgresql: {schema: 'public', table: 'personas'}
  }
})
export class Personas extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
    required: true,
    postgresql: {
      columnName: 'persona_id',
      dataType: 'integer',
    },
  })
  personaId: number;


  @property({
    type: 'string',
    postgresql: {
      columnName: 'name',
      dataType: 'character varying',
    },
  })
  name: string;


  @property({
    type: 'string',
    postgresql: {
      columnName: 'persona_description',
      dataType: 'text',
    },
  })
  personaDescription: string;


  constructor(data?: Partial<Personas>) {
    super(data);
  }
}

export interface PersonasRelations {
  // define navigational properties here
}

export type PersonasWithRelations = Personas & PersonasRelations;
