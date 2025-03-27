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
  import {Workflowtable} from '../models';
  import {WorkflowtableRepository} from '../repositories';
  
  export class WorkflowtableController {
    constructor(
      @repository(WorkflowtableRepository)
      public workflowtableRepository: WorkflowtableRepository,
    ) {}
  
    @post('/workflow')
    @response(200, {
      description: 'Workflowtable model instance',
      content: {'application/json': {schema: getModelSchemaRef(Workflowtable)}},
    })
    async create(
      @requestBody({
        content: {
          'application/json': {
            schema: getModelSchemaRef(Workflowtable, {
              title: 'NewWorkflowtable',
              exclude: ['id'],
            }),
          },
        },
      })
      workflowtable: Omit<Workflowtable, 'id'>,
    ): Promise<Workflowtable> {
      return this.workflowtableRepository.create(workflowtable);
    }
  
    @get('/workflow/count')
    @response(200, {
      description: 'Workflowtable model count',
      content: {'application/json': {schema: CountSchema}},
    })
    async count(
      @param.where(Workflowtable) where?: Where<Workflowtable>,
    ): Promise<Count> {
      return this.workflowtableRepository.count(where);
    }
  
    @get('/workflow')
    @response(200, {
      description: 'Array of Workflowtable model instances',
      content: {
        'application/json': {
          schema: {
            type: 'array',
            items: getModelSchemaRef(Workflowtable, {includeRelations: true}),
          },
        },
      },
    })
    async find(
      @param.filter(Workflowtable) filter?: Filter<Workflowtable>,
    ): Promise<Workflowtable[]> {
      return this.workflowtableRepository.find(filter);
    }
  
    @patch('/workflow')
    @response(200, {
      description: 'Workflowtable PATCH success count',
      content: {'application/json': {schema: CountSchema}},
    })
    async updateAll(
      @requestBody({
        content: {
          'application/json': {
            schema: getModelSchemaRef(Workflowtable, {partial: true}),
          },
        },
      })
      workflowtable: Workflowtable,
      @param.where(Workflowtable) where?: Where<Workflowtable>,
    ): Promise<Count> {
      return this.workflowtableRepository.updateAll(workflowtable, where);
    }
  
    @get('/workflow/{id}')
    @response(200, {
      description: 'Workflowtable model instance',
      content: {
        'application/json': {
          schema: getModelSchemaRef(Workflowtable, {includeRelations: true}),
        },
      },
    })
    async findById(
      @param.path.number('id') id: number,
      @param.filter(Workflowtable, {exclude: 'where'}) filter?: FilterExcludingWhere<Workflowtable>
    ): Promise<Workflowtable> {
      return this.workflowtableRepository.findById(id, filter);
    }
  
    @patch('/workflow/{id}')
    @response(204, {
      description: 'Workflowtable PATCH success',
    })
    async updateById(
      @param.path.number('id') id: number,
      @requestBody({
        content: {
          'application/json': {
            schema: getModelSchemaRef(Workflowtable, {partial: true}),
          },
        },
      })
      workflowtable: Workflowtable,
    ): Promise<void> {
      await this.workflowtableRepository.updateById(id, workflowtable);
    }
  
    @put('/workflow/{id}')
    @response(204, {
      description: 'Workflowtable PUT success',
    })
    async replaceById(
      @param.path.number('id') id: number,
      @requestBody() workflowtable: Workflowtable,
    ): Promise<void> {
      await this.workflowtableRepository.replaceById(id, workflowtable);
    }
  
    @del('/workflow/{id}')
    @response(204, {
      description: 'Workflowtable DELETE success',
    })
    async deleteById(@param.path.number('id') id: number): Promise<void> {
      await this.workflowtableRepository.deleteById(id);
    }
  
    // Custom endpoint - find by session ID
    @get('/workflow/session/{sessionId}')
    @response(200, {
      description: 'Array of Workflowtable instances by sessionId',
      content: {
        'application/json': {
          schema: {
            type: 'array',
            items: getModelSchemaRef(Workflowtable, {includeRelations: true}),
          },
        },
      },
    })
    async findBySessionId(
      @param.path.string('sessionId') sessionId: number,
    ): Promise<Workflowtable[]> {
      return this.workflowtableRepository.find({
        where: {sessionid: sessionId},
      });
    }
  
    // Custom endpoint - find by status
    @get('/workflow/status/{status}')
    @response(200, {
      description: 'Array of Workflowtable instances by status',
      content: {
        'application/json': {
          schema: {
            type: 'array',
            items: getModelSchemaRef(Workflowtable, {includeRelations: true}),
          },
        },
      },
    })
    async findByStatus(
      @param.path.string('status') status: string,
    ): Promise<Workflowtable[]> {
      return this.workflowtableRepository.find({
        where: {status: status},
      });
    }
  
    // Custom endpoint - find by prompt ID
    @get('/workflow/prompt/{promptId}')
    @response(200, {
    description: 'Array of Workflowtable instances by promptId',
    content: {
        'application/json': {
        schema: {
            type: 'array',
            items: getModelSchemaRef(Workflowtable, {includeRelations: true}),
        },
        },
    },
    })
    async findByPromptId(
    @param.path.string('promptId') promptId: string,
    ): Promise<Workflowtable[]> {
    return this.workflowtableRepository.find({
        where: {promptid: promptId},
    });
    }
  }