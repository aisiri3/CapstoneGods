import {inject} from '@loopback/core';
import {
  AnyObject,
  Count,
  DataObject,
  DefaultCrudRepository,
  Entity,
  Filter,
  FilterExcludingWhere,
  Options,
  Where,
} from '@loopback/repository';

/**
 * Enhanced Generic service class for model operations
 * Provides CRUD operations with additional features like transaction support,
 * filtering options, and bulk operations
 */
export class GenericModelService<
  T extends Entity,
  ID,
  Relations extends object = {},
> {
  constructor(
    @inject('repositories.repository')
    protected repository: DefaultCrudRepository<T, ID, Relations>,
  ) {}

  /**
   * Create a new entity
   * @param data - Data for the new entity
   * @param options - Options for the operation
   */
  async create(data: DataObject<T>, options?: Options): Promise<T> {
    return this.repository.create(data, options);
  }

  /**
   * Create multiple entities
   * @param dataList - List of entity data
   * @param options - Options for the operation
   */
  async createAll(dataList: DataObject<T>[], options?: Options): Promise<T[]> {
    return this.repository.createAll(dataList, options);
  }

  /**
   * Find entity by ID
   * @param id - Entity ID
   * @param filter - Filter to apply
   * @param options - Options for the operation
   */
  async findById(
    id: ID,
    filter?: FilterExcludingWhere<T>,
    options?: Options,
  ): Promise<T & Relations> {
    return this.repository.findById(id, filter, options);
  }

  /**
   * Find entities matching the filter
   * @param filter - Filter to apply
   * @param options - Options for the operation
   */
  async find(
    filter?: Filter<T>,
    options?: Options,
  ): Promise<(T & Relations)[]> {
    return this.repository.find(filter, options);
  }

  /**
   * Find a single entity matching the filter
   * @param filter - Filter to apply
   * @param options - Options for the operation
   */
  async findOne(
    filter?: Filter<T>,
    options?: Options,
  ): Promise<(T & Relations) | null> {
    return this.repository.findOne(filter, options);
  }

  /**
   * Update an entity by ID
   * @param id - Entity ID
   * @param data - Data to update
   * @param options - Options for the operation
   */
  async updateById(
    id: ID,
    data: DataObject<T>,
    options?: Options,
  ): Promise<void> {
    await this.repository.updateById(id, data, options);
  }

  /**
   * Update all entities matching the where clause
   * @param data - Data to update
   * @param where - Where clause
   * @param options - Options for the operation
   */
  async updateAll(
    data: DataObject<T>,
    where?: Where<T>,
    options?: Options,
  ): Promise<Count> {
    return this.repository.updateAll(data, where, options);
  }

  /**
   * Replace an entity by ID
   * @param id - Entity ID
   * @param data - Data to replace with
   * @param options - Options for the operation
   */
  async replaceById(
    id: ID,
    data: DataObject<T>,
    options?: Options,
  ): Promise<void> {
    await this.repository.replaceById(id, data, options);
  }

  /**
   * Delete an entity by ID
   * @param id - Entity ID
   * @param options - Options for the operation
   */
  async deleteById(id: ID, options?: Options): Promise<void> {
    await this.repository.deleteById(id, options);
  }

  /**
   * Delete all entities matching the where clause
   * @param where - Where clause
   * @param options - Options for the operation
   */
  async deleteAll(where?: Where<T>, options?: Options): Promise<Count> {
    return this.repository.deleteAll(where, options);
  }

  /**
   * Count entities matching the where clause
   * @param where - Where clause
   * @param options - Options for the operation
   */
  async count(where?: Where<T>, options?: Options): Promise<Count> {
    return this.repository.count(where, options);
  }

  /**
   * Check if entity exists by ID
   * @param id - Entity ID
   * @param options - Options for the operation
   */
  async exists(id: ID, options?: Options): Promise<boolean> {
    return this.repository.exists(id, options);
  }

  /**
   * Execute a custom query with pagination, sorting and filtering
   * @param filter - Filter for the query
   * @param customQuery - Custom query function
   */
  async executeQuery<R>(
    filter?: Filter<T>,
    customQuery?: (filter: Filter<T>) => Promise<R>,
  ): Promise<R> {
    if (!customQuery) {
      throw new Error('Custom query function is required');
    }
    return customQuery(filter || {});
  }

  /**
   * Get the repository instance
   * For advanced operations not covered by this service
   */
  getRepository(): DefaultCrudRepository<T, ID, Relations> {
    return this.repository;
  }
}