import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {AvatarConfig} from '../models';
import {PostgresDataSource} from '../datasources/postgres-db.datasource';
export class AvatarConfigRepository extends DefaultCrudRepository<
  AvatarConfig,
  typeof AvatarConfig.prototype.id
> {
  constructor(
    @inject('datasources.postgres') dataSource: PostgresDataSource,
  ) {
    super(AvatarConfig, dataSource);
  }
}
