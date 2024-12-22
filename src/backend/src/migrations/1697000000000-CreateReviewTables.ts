import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateReviewTables1697000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create reviews table
    await queryRunner.createTable(
      new Table({
        name: 'reviews',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'escort_id',
            type: 'uuid',
          },
          {
            name: 'client_id',
            type: 'uuid',
          },
          {
            name: 'booking_id',
            type: 'uuid',
            isUnique: true,
          },
          {
            name: 'rating',
            type: 'jsonb',
          },
          {
            name: 'content',
            type: 'text',
          },
          {
            name: 'photos',
            type: 'text',
            isArray: true,
            isNullable: true,
          },
          {
            name: 'is_public',
            type: 'boolean',
            default: true,
          },
          {
            name: 'is_anonymous',
            type: 'boolean',
            default: false,
          },
          {
            name: 'is_verified',
            type: 'boolean',
            default: false,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create review_responses table
    await queryRunner.createTable(
      new Table({
        name: 'review_responses',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'review_id',
            type: 'uuid',
            isUnique: true,
          },
          {
            name: 'escort_id',
            type: 'uuid',
          },
          {
            name: 'content',
            type: 'text',
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add foreign key constraints
    await queryRunner.createForeignKey(
      'reviews',
      new TableForeignKey({
        columnNames: ['escort_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'reviews',
      new TableForeignKey({
        columnNames: ['client_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'reviews',
      new TableForeignKey({
        columnNames: ['booking_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'bookings',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'review_responses',
      new TableForeignKey({
        columnNames: ['review_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'reviews',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'review_responses',
      new TableForeignKey({
        columnNames: ['escort_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX idx_reviews_escort_id_created_at ON reviews (escort_id, created_at DESC);
      CREATE INDEX idx_reviews_client_id_created_at ON reviews (client_id, created_at DESC);
      CREATE INDEX idx_reviews_is_public ON reviews (is_public) WHERE is_public = true;
      CREATE INDEX idx_reviews_is_verified ON reviews (is_verified) WHERE is_verified = true;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes first
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_reviews_escort_id_created_at;
      DROP INDEX IF EXISTS idx_reviews_client_id_created_at;
      DROP INDEX IF EXISTS idx_reviews_is_public;
      DROP INDEX IF EXISTS idx_reviews_is_verified;
    `);

    // Drop foreign keys
    const reviewsTable = await queryRunner.getTable('reviews');
    const reviewResponsesTable = await queryRunner.getTable('review_responses');

    if (reviewsTable) {
      const foreignKeys = reviewsTable.foreignKeys;
      for (const foreignKey of foreignKeys) {
        await queryRunner.dropForeignKey('reviews', foreignKey);
      }
    }

    if (reviewResponsesTable) {
      const foreignKeys = reviewResponsesTable.foreignKeys;
      for (const foreignKey of foreignKeys) {
        await queryRunner.dropForeignKey('review_responses', foreignKey);
      }
    }

    // Drop tables
    await queryRunner.dropTable('review_responses');
    await queryRunner.dropTable('reviews');
  }
}