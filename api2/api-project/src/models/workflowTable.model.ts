import {Entity, model, property} from '@loopback/repository';

@model({
  name: 'workflowTable',
  settings: {
    postgresql: {schema: 'public', table: 'workflowTable'},
  },
})
export class Workflowtable extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
  })
  status?: string;

  @property({
    type: 'string',
  })
  currentstep?: string;

  @property({
    type: 'string',
  })
  promptid?: string;

  @property({
    type: 'number',
  })
  sessionid?: number;

  @property({
    type: 'string',
  })
  lipsyncid?: string;

  constructor(data?: Partial<Workflowtable>) {
    super(data);
  }
}
