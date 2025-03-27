import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {PostgresDataSource} from '../datasources/postgres-db.datasource';
import {Chattable, ChattableRelations} from '../models';

export class ChattableRepository extends DefaultCrudRepository<
  Chattable,
  number,
  ChattableRelations
> {
  constructor(
    @inject('datasources.postgres') dataSource: PostgresDataSource,
  ) {
    super(Chattable, dataSource);
  }
}
