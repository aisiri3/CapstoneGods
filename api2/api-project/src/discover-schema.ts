import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import {juggler} from '@loopback/repository';
import {Pool} from 'pg';

// Load environment variables
dotenv.config();
// Create a PostgreSQL connection pool directly
// Create a PostgreSQL connection pool directly
const pool = new Pool({
    host: '10.46.28.223',
    port: parseInt('5432'),
    user: 'postgres',
    password: 'Password01',
    database: 'bahasabuddy',
    // Use schema in queries if needed, but not needed for connection
  });
// Tables to discover - replace with your actual table names
const tablesToDiscover = ['avatar_config']; // Replace with your table names

// Function to convert snake_case to PascalCase
function toPascalCase(str: string): string {
  return str
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

// Map PostgreSQL data types to LoopBack/TypeScript types
function mapPostgresType(pgType: string): { lbType: string; tsType: string } {
  const typeMap: { [key: string]: { lbType: string; tsType: string } } = {
    'character varying': { lbType: 'string', tsType: 'string' },
    'varchar': { lbType: 'string', tsType: 'string' },
    'text': { lbType: 'string', tsType: 'string' },
    'char': { lbType: 'string', tsType: 'string' },
    'integer': { lbType: 'number', tsType: 'number' },
    'bigint': { lbType: 'number', tsType: 'number' },
    'smallint': { lbType: 'number', tsType: 'number' },
    'decimal': { lbType: 'number', tsType: 'number' },
    'numeric': { lbType: 'number', tsType: 'number' },
    'real': { lbType: 'number', tsType: 'number' },
    'double precision': { lbType: 'number', tsType: 'number' },
    'boolean': { lbType: 'boolean', tsType: 'boolean' },
    'date': { lbType: 'date', tsType: 'Date' },
    'timestamp': { lbType: 'date', tsType: 'Date' },
    'timestamp with time zone': { lbType: 'date', tsType: 'Date' },
    'timestamp without time zone': { lbType: 'date', tsType: 'Date' },
    'time': { lbType: 'string', tsType: 'string' },
    'json': { lbType: 'object', tsType: 'object' },
    'jsonb': { lbType: 'object', tsType: 'object' },
    'uuid': { lbType: 'string', tsType: 'string' },
  };

  // Default to string if type not found
  return typeMap[pgType.toLowerCase()] || { lbType: 'string', tsType: 'any' };
}

// Function to directly query PostgreSQL system tables
async function getTableColumns(tableName: string, schemaName: string = 'public'): Promise<any[]> {
  const query = `
    SELECT 
      c.column_name, 
      c.data_type, 
      c.is_nullable,
      c.column_default,
      CASE 
        WHEN pk.column_name IS NOT NULL THEN true 
        ELSE false 
      END as is_primary_key
    FROM 
      information_schema.columns c
    LEFT JOIN (
      SELECT 
        kcu.column_name
      FROM 
        information_schema.table_constraints tc
      JOIN 
        information_schema.key_column_usage kcu 
        ON kcu.constraint_name = tc.constraint_name
      WHERE 
        tc.constraint_type = 'PRIMARY KEY' 
        AND tc.table_name = $1
        AND tc.table_schema = $2
    ) pk ON pk.column_name = c.column_name
    WHERE 
      c.table_name = $1
      AND c.table_schema = $2
    ORDER BY 
      c.ordinal_position;
  `;

  try {
    const result = await pool.query(query, [tableName, schemaName]);
    return result.rows;
  } catch (err) {
    console.error('Error executing query:', err);
    throw err;
  }
}

// Generate model file content
function generateModelFile(tableName: string, className: string, columns: any[], schemaName: string): string {
  let modelContent = `import {Entity, model, property} from '@loopback/repository';

@model({
  name: '${tableName}',
  settings: {
    postgresql: {schema: '${schemaName}', table: '${tableName}'},
  },
})
export class ${className} extends Entity {
`;

  for (const column of columns) {
    const { lbType, tsType } = mapPostgresType(column.data_type);
    const isId = column.is_primary_key;
    const isGenerated = column.column_default && 
                       (column.column_default.includes('nextval') || 
                        column.column_default.includes('uuid_generate'));
    const isRequired = column.is_nullable === 'NO' && !column.column_default;

    modelContent += `  @property({
    type: '${lbType}',${isId ? '\n    id: true,' : ''}${
      isGenerated ? '\n    generated: true,' : ''
    }${isRequired ? '\n    required: true,' : ''}
  })
  ${column.column_name}${isRequired ? '' : '?'}: ${tsType};

`;
  }

  modelContent += `  constructor(data?: Partial<${className}>) {
    super(data);
  }
}
`;

  return modelContent;
}

// Generate repository file
function generateRepositoryFile(className: string, idColumnName: string): string {
  return `import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {${className}} from '../models';
import {PostgresDataSource} from '../datasources';

export class ${className}Repository extends DefaultCrudRepository<
  ${className},
  typeof ${className}.prototype.${idColumnName}
> {
  constructor(
    @inject('datasources.postgres') dataSource: PostgresDataSource,
  ) {
    super(${className}, dataSource);
  }
}
`;
}

// Main function to discover and generate files
async function discoverAndGenerate() {
  try {
    for (const tableName of tablesToDiscover) {
      console.log(`Processing table: ${tableName}`);
      
      // Get schema name from env or default to public
      const schemaName = process.env.DB_SCHEMA || 'public';
      
      // Get table columns
      const columns = await getTableColumns(tableName, schemaName);
      
      if (!columns || columns.length === 0) {
        console.error(`No columns found for table ${tableName} in schema ${schemaName}`);
        continue;
      }
      
      console.log(`Found ${columns.length} columns for table ${tableName}`);
      
      // Convert table name to class name
      const className = toPascalCase(tableName);
      
      // Find primary key column name
      const pkColumn = columns.find(col => col.is_primary_key);
      const idColumnName = pkColumn ? pkColumn.column_name : 'id';
      
      // Determine destination directory - adjust if needed
      // If this script is in src/, model files should be created directly in src/models/
      // If this script is in project root, model files should be created in src/models/
      const projectRoot = __dirname;
      const modelsDir = path.join(projectRoot, 'models');
      
      // Create models directory if it doesn't exist
      if (!fs.existsSync(modelsDir)) {
        fs.mkdirSync(modelsDir, {recursive: true});
      }
      
      // Generate and write model file
      const modelFilePath = path.join(modelsDir, `${tableName.replace(/_/g, '-')}.model.ts`);
      fs.writeFileSync(
        modelFilePath,
        generateModelFile(tableName, className, columns, schemaName)
      );
      console.log(`Generated model file: ${modelFilePath}`);
      
      // Create repositories directory if it doesn't exist
      const reposDir = path.join(projectRoot, 'repositories');
      if (!fs.existsSync(reposDir)) {
        fs.mkdirSync(reposDir, {recursive: true});
      }
      
      // Generate and write repository file
      const repoFilePath = path.join(reposDir, `${tableName.replace(/_/g, '-')}.repository.ts`);
      fs.writeFileSync(
        repoFilePath,
        generateRepositoryFile(className, idColumnName)
      );
      console.log(`Generated repository file: ${repoFilePath}`);
      
      // Append export statement to index.ts files
      try {
        // Models index
        const modelsIndexPath = path.join(modelsDir, 'index.ts');
        if (fs.existsSync(modelsIndexPath)) {
          fs.appendFileSync(
            modelsIndexPath,
            `export * from './${tableName.replace(/_/g, '-')}.model';\n`
          );
          console.log(`Updated models index file`);
        }
        
        // Repositories index
        const reposIndexPath = path.join(reposDir, 'index.ts');
        if (fs.existsSync(reposIndexPath)) {
          fs.appendFileSync(
            reposIndexPath,
            `export * from './${tableName.replace(/_/g, '-')}.repository';\n`
          );
          console.log(`Updated repositories index file`);
        }
      } catch (err) {
        console.error('Error updating index files:', err);
      }
    }
    
    console.log('Discovery and generation completed successfully');
  } catch (err) {
    console.error('Error during discovery and generation:', err);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the discovery and generation
discoverAndGenerate().then(() => {
  console.log('Process completed');
  process.exit(0);
}).catch(err => {
  console.error('Process failed:', err);
  process.exit(1);
});