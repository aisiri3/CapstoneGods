import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {PostgresDataSource} from '../datasources/postgres-db.datasource';
import {Sessiontable, SessiontableRelations} from '../models';

export class SessiontableRepository extends DefaultCrudRepository<
  Sessiontable,
  number,
  SessiontableRelations
> {
  constructor(
    @inject('datasources.postgres') dataSource: PostgresDataSource,
  ) {
    super(Sessiontable, dataSource);
  }
}
