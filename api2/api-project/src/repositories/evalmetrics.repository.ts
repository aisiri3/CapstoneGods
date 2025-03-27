import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {PostgresDataSource} from '../datasources/postgres-db.datasource';
import {Evalmetrics, EvalmetricsRelations} from '../models';

export class EvalmetricsRepository extends DefaultCrudRepository<
  Evalmetrics,
  number,
  EvalmetricsRelations
> {
  constructor(
    @inject('datasources.postgres') dataSource: PostgresDataSource,
  ) {
    super(Evalmetrics, dataSource);
  }
}
