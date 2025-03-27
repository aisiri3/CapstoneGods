import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {Workflowtable} from '../models';
import {PostgresDataSource} from '../datasources/postgres-db.datasource';

export class WorkflowtableRepository extends DefaultCrudRepository<
  Workflowtable,
  typeof Workflowtable.prototype.id
> {
  constructor(
    @inject('datasources.postgres') dataSource: PostgresDataSource,
  ) {
    super(Workflowtable, dataSource);
  }
}
