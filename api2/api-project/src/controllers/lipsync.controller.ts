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
  import {Lipsynctable} from '../models';
  import {LipsynctableRepository} from '../repositories';
  
  export class LipsynctableController {
    constructor(
      @repository(LipsynctableRepository)
      public lipsynctableRepository : LipsynctableRepository,
    ) {}
  
    @post('/lipsynctables')
    @response(200, {
      description: 'Lipsynctable model instance',
      content: {'application/json': {schema: getModelSchemaRef(Lipsynctable)}},
    })
    async create(
      @requestBody({
        content: {
          'application/json': {
            schema: getModelSchemaRef(Lipsynctable, {
              title: 'NewLipsynctable',
              exclude: ['id'],
            }),
          },
        },
      })
      lipsynctable: Omit<Lipsynctable, 'id'>,
    ): Promise<Lipsynctable> {
      return this.lipsynctableRepository.create(lipsynctable);
    }
  
    @get('/lipsynctables/count')
    @response(200, {
      description: 'Lipsynctable model count',
      content: {'application/json': {schema: CountSchema}},
    })
    async count(
      @param.where(Lipsynctable) where?: Where<Lipsynctable>,
    ): Promise<Count> {
      return this.lipsynctableRepository.count(where);
    }
  
    @get('/lipsynctables')
    @response(200, {
      description: 'Array of Lipsynctable model instances',
      content: {
        'application/json': {
          schema: {
            type: 'array',
            items: getModelSchemaRef(Lipsynctable, {includeRelations: true}),
          },
        },
      },
    })
    async find(
      @param.filter(Lipsynctable) filter?: Filter<Lipsynctable>,
    ): Promise<Lipsynctable[]> {
      return this.lipsynctableRepository.find(filter);
    }
  
    @patch('/lipsynctables')
    @response(200, {
      description: 'Lipsynctable PATCH success count',
      content: {'application/json': {schema: CountSchema}},
    })
    async updateAll(
      @requestBody({
        content: {
          'application/json': {
            schema: getModelSchemaRef(Lipsynctable, {partial: true}),
          },
        },
      })
      lipsynctable: Lipsynctable,
      @param.where(Lipsynctable) where?: Where<Lipsynctable>,
    ): Promise<Count> {
      return this.lipsynctableRepository.updateAll(lipsynctable, where);
    }
  
    @get('/lipsynctables/{id}')
    @response(200, {
      description: 'Lipsynctable model instance',
      content: {
        'application/json': {
          schema: getModelSchemaRef(Lipsynctable, {includeRelations: true}),
        },
      },
    })
    async findById(
      @param.path.number('id') id: number,
      @param.filter(Lipsynctable, {exclude: 'where'}) filter?: FilterExcludingWhere<Lipsynctable>
    ): Promise<Lipsynctable> {
      return this.lipsynctableRepository.findById(id, filter);
    }
  
    @patch('/lipsynctables/{id}')
    @response(204, {
      description: 'Lipsynctable PATCH success',
    })
    async updateById(
      @param.path.number('id') id: number,
      @requestBody({
        content: {
          'application/json': {
            schema: getModelSchemaRef(Lipsynctable, {partial: true}),
          },
        },
      })
      lipsynctable: Partial<Lipsynctable>,
    ): Promise<void> {
      await this.lipsynctableRepository.updateById(id, lipsynctable);
    }
  
    @put('/lipsynctables/{id}')
    @response(204, {
      description: 'Lipsynctable PUT success',
    })
    async replaceById(
      @param.path.number('id') id: number,
      @requestBody() lipsynctable: Lipsynctable,
    ): Promise<void> {
      await this.lipsynctableRepository.replaceById(id, lipsynctable);
    }
  
    @del('/lipsynctables/{id}')
    @response(204, {
      description: 'Lipsynctable DELETE success',
    })
    async deleteById(@param.path.number('id') id: number): Promise<void> {
      await this.lipsynctableRepository.deleteById(id);
    }
  
    @get('/lipsynctables/byPrompt/{promptid}')
    @response(200, {
      description: 'Array of Lipsynctable model instances by prompt ID',
      content: {
        'application/json': {
          schema: {
            type: 'array',
            items: getModelSchemaRef(Lipsynctable, {includeRelations: true}),
          },
        },
      },
    })
    async findByPromptId(
      @param.path.number('promptid') promptid: number,
      @param.filter(Lipsynctable) filter?: Filter<Lipsynctable>,
    ): Promise<Lipsynctable[]> {
      return this.lipsynctableRepository.find({
        ...filter,
        where: {
          ...filter?.where,
          promptid,
        },
      });
    }
  
    @get('/lipsynctables/byDate/{startDate}/{endDate}')
    @response(200, {
      description: 'Array of Lipsynctable model instances by date range',
      content: {
        'application/json': {
          schema: {
            type: 'array',
            items: getModelSchemaRef(Lipsynctable, {includeRelations: true}),
          },
        },
      },
    })
    async findByDateRange(
      @param.path.string('startDate') startDate: string,
      @param.path.string('endDate') endDate: string,
      @param.filter(Lipsynctable) filter?: Filter<Lipsynctable>,
    ): Promise<Lipsynctable[]> {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      return this.lipsynctableRepository.find({
        ...filter,
        where: {
          ...filter?.where,
          datetime: {
            between: [start, end],
          },
        },
      });
    }
  }