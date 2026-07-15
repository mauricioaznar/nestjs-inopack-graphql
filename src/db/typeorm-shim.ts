export interface QueryRunner {
    query(query: string, parameters?: any[]): Promise<any>;
}

export interface MigrationInterface {
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
