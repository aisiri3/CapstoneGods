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
  import {Sessiontable} from '../models';
  import {SessiontableRepository} from '../repositories';
  
  export class SessiontableController {
    constructor(
      @repository(SessiontableRepository)
      public sessiontableRepository : SessiontableRepository,
    ) {}
  
    @post('/sessions')
    @response(200, {
      description: 'Sessiontable model instance',
      content: {'application/json': {schema: getModelSchemaRef(Sessiontable)}},
    })
    async create(
      @requestBody({
        content: {
          'application/json': {
            schema: getModelSchemaRef(Sessiontable, {
              title: 'NewSessiontable',
              exclude: ['sessionid'],
            }),
          },
        },
      })
      sessiontable: Omit<Sessiontable, 'sessionid'>,
    ): Promise<Sessiontable> {
      return this.sessiontableRepository.create(sessiontable);
    }
  
    @get('/sessions/count')
    @response(200, {
      description: 'Sessiontable model count',
      content: {'application/json': {schema: CountSchema}},
    })
    async count(
      @param.where(Sessiontable) where?: Where<Sessiontable>,
    ): Promise<Count> {
      return this.sessiontableRepository.count(where);
    }
  
    @get('/sessions')
    @response(200, {
      description: 'Array of Sessiontable model instances',
      content: {
        'application/json': {
          schema: {
            type: 'array',
            items: getModelSchemaRef(Sessiontable, {includeRelations: true}),
          },
        },
      },
    })
    async find(
      @param.filter(Sessiontable) filter?: Filter<Sessiontable>,
    ): Promise<Sessiontable[]> {
      return this.sessiontableRepository.find(filter);
    }
  
    @patch('/sessions')
    @response(200, {
      description: 'Sessiontable PATCH success count',
      content: {'application/json': {schema: CountSchema}},
    })
    async updateAll(
      @requestBody({
        content: {
          'application/json': {
            schema: getModelSchemaRef(Sessiontable, {partial: true}),
          },
        },
      })
      sessiontable: Sessiontable,
      @param.where(Sessiontable) where?: Where<Sessiontable>,
    ): Promise<Count> {
      return this.sessiontableRepository.updateAll(sessiontable, where);
    }
  
    @get('/sessions/{id}')
    @response(200, {
      description: 'Sessiontable model instance',
      content: {
        'application/json': {
          schema: getModelSchemaRef(Sessiontable, {includeRelations: true}),
        },
      },
    })
    async findById(
      @param.path.number('id') id: number,
      @param.filter(Sessiontable, {exclude: 'where'}) filter?: FilterExcludingWhere<Sessiontable>
    ): Promise<Sessiontable> {
      return this.sessiontableRepository.findById(id, filter);
    }
  
    @patch('/sessions/{id}')
    @response(204, {
      description: 'Sessiontable PATCH success',
    })
    async updateById(
      @param.path.number('id') id: number,
      @requestBody({
        content: {
          'application/json': {
            schema: getModelSchemaRef(Sessiontable, {partial: true}),
          },
        },
      })
      sessiontable: Partial<Sessiontable>,
    ): Promise<void> {
      await this.sessiontableRepository.updateById(id, sessiontable);
    }
  
    @put('/sessions/{id}')
    @response(204, {
      description: 'Sessiontable PUT success',
    })
    async replaceById(
      @param.path.number('id') id: number,
      @requestBody() sessiontable: Sessiontable,
    ): Promise<void> {
      await this.sessiontableRepository.replaceById(id, sessiontable);
    }
  
    @del('/sessions/{id}')
    @response(204, {
      description: 'Sessiontable DELETE success',
    })
    async deleteById(@param.path.number('id') id: number): Promise<void> {
      await this.sessiontableRepository.deleteById(id);
    }
  
    @get('/sessions/byPrompt/{promptid}')
    @response(200, {
      description: 'Array of Sessiontable model instances by prompt ID',
      content: {
        'application/json': {
          schema: {
            type: 'array',
            items: getModelSchemaRef(Sessiontable, {includeRelations: true}),
          },
        },
      },
    })
    async findByPromptId(
      @param.path.string('promptid') promptid: string, // Changed from number to string
      @param.filter(Sessiontable) filter?: Filter<Sessiontable>,
    ): Promise<Sessiontable[]> {
      return this.sessiontableRepository.find({
        ...filter,
        where: {
          ...filter?.where,
          promptid,
        },
      });
    }
  
    @get('/sessions/search/{query}')
    @response(200, {
      description: 'Array of Sessiontable model instances matching the prompt or response search',
      content: {
        'application/json': {
          schema: {
            type: 'array',
            items: getModelSchemaRef(Sessiontable, {includeRelations: true}),
          },
        },
      },
    })
    async searchPromptAndResponse(
      @param.path.string('query') query: string,
      @param.filter(Sessiontable) filter?: Filter<Sessiontable>,
    ): Promise<Sessiontable[]> {
      return this.sessiontableRepository.find({
        ...filter,
        where: {
          or: [
            {
              prompt: {
                like: `%${query}%`,
              },
            },
            {
              response: {
                like: `%${query}%`,
              },
            },
          ],
        },
      });
    }
  
    @get('/sessions/byDate/{startDate}/{endDate}')
    @response(200, {
      description: 'Array of Sessiontable model instances by date range',
      content: {
        'application/json': {
          schema: {
            type: 'array',
            items: getModelSchemaRef(Sessiontable, {includeRelations: true}),
          },
        },
      },
    })
    async findByDateRange(
      @param.path.string('startDate') startDate: string,
      @param.path.string('endDate') endDate: string,
      @param.filter(Sessiontable) filter?: Filter<Sessiontable>,
    ): Promise<Sessiontable[]> {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      return this.sessiontableRepository.find({
        ...filter,
        where: {
          ...filter?.where,
          createddatetime: {
            between: [start, end],
          },
        },
      });
    }
  }