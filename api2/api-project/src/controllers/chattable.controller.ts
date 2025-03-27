import {
    Count,
    CountSchema,
    Filter,
    FilterExcludingWhere,
    repository,
    Where,
  } from '@loopback/repository';
  import {
    post,
    param,
    get,
    getModelSchemaRef,
    patch,
    put,
    del,
    requestBody,
    response,
  } from '@loopback/rest';
  import {Chattable} from '../models';
  import {ChattableRepository} from '../repositories';
  
  export class ChattableController {
    constructor(
      @repository(ChattableRepository)
      public chattableRepository : ChattableRepository,
    ) {}
  
    @post('/chattables')
    @response(200, {
      description: 'Chattable model instance',
      content: {'application/json': {schema: getModelSchemaRef(Chattable)}},
    })
    async create(
      @requestBody({
        content: {
          'application/json': {
            schema: getModelSchemaRef(Chattable, {
              title: 'NewChattable',
              exclude: ['id'],
            }),
          },
        },
      })
      chattable: Omit<Chattable, 'id'>,
    ): Promise<Chattable> {
      return this.chattableRepository.create(chattable);
    }
  
    @get('/chattables/count')
    @response(200, {
      description: 'Chattable model count',
      content: {'application/json': {schema: CountSchema}},
    })
    async count(
      @param.where(Chattable) where?: Where<Chattable>,
    ): Promise<Count> {
      return this.chattableRepository.count(where);
    }
  
    @get('/chattables')
    @response(200, {
      description: 'Array of Chattable model instances',
      content: {
        'application/json': {
          schema: {
            type: 'array',
            items: getModelSchemaRef(Chattable, {includeRelations: true}),
          },
        },
      },
    })
    async find(
      @param.filter(Chattable) filter?: Filter<Chattable>,
    ): Promise<Chattable[]> {
      return this.chattableRepository.find(filter);
    }
  
    @patch('/chattables')
    @response(200, {
      description: 'Chattable PATCH success count',
      content: {'application/json': {schema: CountSchema}},
    })
    async updateAll(
      @requestBody({
        content: {
          'application/json': {
            schema: getModelSchemaRef(Chattable, {partial: true}),
          },
        },
      })
      chattable: Chattable,
      @param.where(Chattable) where?: Where<Chattable>,
    ): Promise<Count> {
      return this.chattableRepository.updateAll(chattable, where);
    }
  
    @get('/chattables/{id}')
    @response(200, {
      description: 'Chattable model instance',
      content: {
        'application/json': {
          schema: getModelSchemaRef(Chattable, {includeRelations: true}),
        },
      },
    })
    async findById(
      @param.path.number('id') id: number,
      @param.filter(Chattable, {exclude: 'where'}) filter?: FilterExcludingWhere<Chattable>
    ): Promise<Chattable> {
      return this.chattableRepository.findById(id, filter);
    }
  
    @patch('/chattables/{id}')
    @response(204, {
      description: 'Chattable PATCH success',
    })
    async updateById(
      @param.path.number('id') id: number,
      @requestBody({
        content: {
          'application/json': {
            schema: getModelSchemaRef(Chattable, {partial: true}),
          },
        },
      })
      chattable: Partial<Chattable>,
    ): Promise<void> {
      await this.chattableRepository.updateById(id, chattable);
    }
  
    @put('/chattables/{id}')
    @response(204, {
      description: 'Chattable PUT success',
    })
    async replaceById(
      @param.path.number('id') id: number,
      @requestBody() chattable: Chattable,
    ): Promise<void> {
      await this.chattableRepository.replaceById(id, chattable);
    }
  
    @del('/chattables/{id}')
    @response(204, {
      description: 'Chattable DELETE success',
    })
    async deleteById(@param.path.number('id') id: number): Promise<void> {
      await this.chattableRepository.deleteById(id);
    }
  
    @get('/chattables/byUser/{userid}')
    @response(200, {
      description: 'Array of Chattable model instances by user ID',
      content: {
        'application/json': {
          schema: {
            type: 'array',
            items: getModelSchemaRef(Chattable, {includeRelations: true}),
          },
        },
      },
    })
    async findByUserId(
      @param.path.number('userid') userid: number,
      @param.filter(Chattable) filter?: Filter<Chattable>,
    ): Promise<Chattable[]> {
      return this.chattableRepository.find({
        ...filter,
        where: {
          ...filter?.where,
          userid,
        },
      });
    }
  
    @get('/chattables/bySession/{sessionid}')
    @response(200, {
      description: 'Array of Chattable model instances by session ID',
      content: {
        'application/json': {
          schema: {
            type: 'array',
            items: getModelSchemaRef(Chattable, {includeRelations: true}),
          },
        },
      },
    })
    async findBySessionId(
      @param.path.number('sessionid') sessionid: number,
      @param.filter(Chattable) filter?: Filter<Chattable>,
    ): Promise<Chattable[]> {
      return this.chattableRepository.find({
        ...filter,
        where: {
          ...filter?.where,
          sessionid,
        },
      });
    }
  }