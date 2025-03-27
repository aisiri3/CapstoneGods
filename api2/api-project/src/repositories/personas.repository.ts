import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {PostgresDataSource} from '../datasources/postgres-db.datasource';
import {Personas, PersonasRelations} from '../models';

export class PersonasRepository extends DefaultCrudRepository<
  Personas,
  number,
  PersonasRelations
> {
  constructor(
    @inject('datasources.postgres') dataSource: PostgresDataSource,
  ) {
    super(Personas, dataSource);
  }
}
