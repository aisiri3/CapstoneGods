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
  import {AvatarConfig} from '../models';
  import {AvatarConfigRepository} from '../repositories';
  
  export class AvatarConfigController {
    constructor(
      @repository(AvatarConfigRepository)
      public avatarConfigRepository : AvatarConfigRepository,
    ) {}
  
    @post('/avatar-configs')
    @response(200, {
      description: 'AvatarConfig model instance',
      content: {'application/json': {schema: getModelSchemaRef(AvatarConfig)}},
    })
    async create(
      @requestBody({
        content: {
          'application/json': {
            schema: getModelSchemaRef(AvatarConfig, {
              title: 'NewAvatarConfig',
              exclude: ['id'],
            }),
          },
        },
      })
      avatarConfig: Omit<AvatarConfig, 'id'>,
    ): Promise<AvatarConfig> {
      return this.avatarConfigRepository.create(avatarConfig);
    }
  
    @get('/avatar-configs/count')
    @response(200, {
      description: 'AvatarConfig model count',
      content: {'application/json': {schema: CountSchema}},
    })
    async count(
      @param.where(AvatarConfig) where?: Where<AvatarConfig>,
    ): Promise<Count> {
      return this.avatarConfigRepository.count(where);
    }
  
    @get('/avatar-configs')
    @response(200, {
      description: 'Array of AvatarConfig model instances',
      content: {
        'application/json': {
          schema: {
            type: 'array',
            items: getModelSchemaRef(AvatarConfig, {includeRelations: true}),
          },
        },
      },
    })
    async find(
      @param.filter(AvatarConfig) filter?: Filter<AvatarConfig>,
    ): Promise<AvatarConfig[]> {
      return this.avatarConfigRepository.find(filter);
    }
  
    @patch('/avatar-configs')
    @response(200, {
      description: 'AvatarConfig PATCH success count',
      content: {'application/json': {schema: CountSchema}},
    })
    async updateAll(
      @requestBody({
        content: {
          'application/json': {
            schema: getModelSchemaRef(AvatarConfig, {partial: true}),
          },
        },
      })
      avatarConfig: AvatarConfig,
      @param.where(AvatarConfig) where?: Where<AvatarConfig>,
    ): Promise<Count> {
      return this.avatarConfigRepository.updateAll(avatarConfig, where);
    }
  
    @get('/avatar-configs/{id}')
    @response(200, {
      description: 'AvatarConfig model instance',
      content: {
        'application/json': {
          schema: getModelSchemaRef(AvatarConfig, {includeRelations: true}),
        },
      },
    })
    async findById(
      @param.path.number('id') id: number,
      @param.filter(AvatarConfig, {exclude: 'where'}) filter?: FilterExcludingWhere<AvatarConfig>
    ): Promise<AvatarConfig> {
      return this.avatarConfigRepository.findById(id, filter);
    }
  
    @patch('/avatar-configs/{id}')
    @response(204, {
      description: 'AvatarConfig PATCH success',
    })
    async updateById(
      @param.path.number('id') id: number,
      @requestBody({
        content: {
          'application/json': {
            schema: getModelSchemaRef(AvatarConfig, {partial: true}),
          },
        },
      })
      avatarConfig: AvatarConfig,
    ): Promise<void> {
      await this.avatarConfigRepository.updateById(id, avatarConfig);
    }
  
    @put('/avatar-configs/{id}')
    @response(204, {
      description: 'AvatarConfig PUT success',
    })
    async replaceById(
      @param.path.number('id') id: number,
      @requestBody() avatarConfig: AvatarConfig,
    ): Promise<void> {
      await this.avatarConfigRepository.replaceById(id, avatarConfig);
    }
  
    @del('/avatar-configs/{id}')
    @response(204, {
      description: 'AvatarConfig DELETE success',
    })
    async deleteById(@param.path.number('id') id: number): Promise<void> {
      await this.avatarConfigRepository.deleteById(id);
    }
    
    @get('/avatar-configs/find-by-prompt-id/{promptId}')
    @response(200, {
      description: 'AvatarConfig model instance by prompt_id',
      content: {
        'application/json': {
          schema: getModelSchemaRef(AvatarConfig, {includeRelations: true}),
        },
      },
    })
    async findByPromptId(
      @param.path.string('promptId') promptId: string,
    ): Promise<AvatarConfig | null> {
      return this.avatarConfigRepository.findOne({
        where: {prompt_id: promptId},
      });
    }
    
    @get('/avatar-configs/find-by-criteria')
    @response(200, {
      description: 'Find AvatarConfig by gender, persona, and language',
      content: {
        'application/json': {
          schema: getModelSchemaRef(AvatarConfig, {includeRelations: true}),
        },
      },
    })
    async findByCriteria(
      @param.query.string('gender') gender: string,
      @param.query.string('persona') persona: string,
      @param.query.string('language') language: string,
    ): Promise<AvatarConfig | null> {
      return this.avatarConfigRepository.findOne({
        where: {
          gender: gender,
          persona: persona,
          language: language,
        },
      });
    }
  }