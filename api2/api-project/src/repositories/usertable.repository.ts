import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {PostgresDataSource} from '../datasources/postgres-db.datasource';
import {Usertable, UsertableRelations} from '../models';

export class UsertableRepository extends DefaultCrudRepository<
  Usertable,
  number,
  UsertableRelations
> {
  constructor(
    @inject('datasources.postgres') dataSource: PostgresDataSource,
  ) {
    super(Usertable, dataSource);
  }
}
