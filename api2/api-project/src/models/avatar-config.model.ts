import {Entity, model, property} from '@loopback/repository';

@model({
  name: 'avatar_config',
  settings: {
    postgresql: {schema: 'public', table: 'avatar_config'},
  },
})
export class AvatarConfig extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
    required: true,
  })
  gender: string;

  @property({
    type: 'string',
    required: true,
  })
  persona: string;

  @property({
    type: 'string',
    required: true,
  })
  language: string;

  @property({
    type: 'string',
    required: true,
  })
  prompt_id: string;

  constructor(data?: Partial<AvatarConfig>) {
    super(data);
  }
}
