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
  import {Evalmetrics} from '../models';
  import {EvalmetricsRepository} from '../repositories';
  
  export class EvalmetricsController {
    constructor(
      @repository(EvalmetricsRepository)
      public evalmetricsRepository : EvalmetricsRepository,
    ) {}
  
    @post('/evalmetrics')
    @response(200, {
      description: 'Evalmetrics model instance',
      content: {'application/json': {schema: getModelSchemaRef(Evalmetrics)}},
    })
    async create(
      @requestBody({
        content: {
          'application/json': {
            schema: getModelSchemaRef(Evalmetrics, {
              title: 'NewEvalmetrics',
              exclude: ['id'],
            }),
          },
        },
      })
      evalmetrics: Omit<Evalmetrics, 'id'>,
    ): Promise<Evalmetrics> {
      return this.evalmetricsRepository.create(evalmetrics);
    }
  
    @get('/evalmetrics/count')
    @response(200, {
      description: 'Evalmetrics model count',
      content: {'application/json': {schema: CountSchema}},
    })
    async count(
      @param.where(Evalmetrics) where?: Where<Evalmetrics>,
    ): Promise<Count> {
      return this.evalmetricsRepository.count(where);
    }
  
    @get('/evalmetrics')
    @response(200, {
      description: 'Array of Evalmetrics model instances',
      content: {
        'application/json': {
          schema: {
            type: 'array',
            items: getModelSchemaRef(Evalmetrics, {includeRelations: true}),
          },
        },
      },
    })
    async find(
      @param.filter(Evalmetrics) filter?: Filter<Evalmetrics>,
    ): Promise<Evalmetrics[]> {
      return this.evalmetricsRepository.find(filter);
    }
  
    @patch('/evalmetrics')
    @response(200, {
      description: 'Evalmetrics PATCH success count',
      content: {'application/json': {schema: CountSchema}},
    })
    async updateAll(
      @requestBody({
        content: {
          'application/json': {
            schema: getModelSchemaRef(Evalmetrics, {partial: true}),
          },
        },
      })
      evalmetrics: Evalmetrics,
      @param.where(Evalmetrics) where?: Where<Evalmetrics>,
    ): Promise<Count> {
      return this.evalmetricsRepository.updateAll(evalmetrics, where);
    }
  
    @get('/evalmetrics/{id}')
    @response(200, {
      description: 'Evalmetrics model instance',
      content: {
        'application/json': {
          schema: getModelSchemaRef(Evalmetrics, {includeRelations: true}),
        },
      },
    })
    async findById(
      @param.path.number('id') id: number,
      @param.filter(Evalmetrics, {exclude: 'where'}) filter?: FilterExcludingWhere<Evalmetrics>
    ): Promise<Evalmetrics> {
      return this.evalmetricsRepository.findById(id, filter);
    }
  
    @patch('/evalmetrics/{id}')
    @response(204, {
      description: 'Evalmetrics PATCH success',
    })
    async updateById(
      @param.path.number('id') id: number,
      @requestBody({
        content: {
          'application/json': {
            schema: getModelSchemaRef(Evalmetrics, {partial: true}),
          },
        },
      })
      evalmetrics: Partial<Evalmetrics>,
    ): Promise<void> {
      await this.evalmetricsRepository.updateById(id, evalmetrics);
    }
  
    @put('/evalmetrics/{id}')
    @response(204, {
      description: 'Evalmetrics PUT success',
    })
    async replaceById(
      @param.path.number('id') id: number,
      @requestBody() evalmetrics: Evalmetrics,
    ): Promise<void> {
      await this.evalmetricsRepository.replaceById(id, evalmetrics);
    }
  
    @del('/evalmetrics/{id}')
    @response(204, {
      description: 'Evalmetrics DELETE success',
    })
    async deleteById(@param.path.number('id') id: number): Promise<void> {
      await this.evalmetricsRepository.deleteById(id);
    }
  }