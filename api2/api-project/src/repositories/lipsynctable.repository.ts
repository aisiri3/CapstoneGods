import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {PostgresDataSource} from '../datasources/postgres-db.datasource';
import {Lipsynctable, LipsynctableRelations} from '../models';

export class LipsynctableRepository extends DefaultCrudRepository<
  Lipsynctable,
  number,
  LipsynctableRelations
> {
  constructor(
    @inject('datasources.postgres') dataSource: PostgresDataSource,
  ) {
    super(Lipsynctable, dataSource);
  }
}
