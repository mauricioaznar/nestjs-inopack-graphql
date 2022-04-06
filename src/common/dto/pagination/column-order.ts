import { registerEnumType } from '@nestjs/graphql';

export enum ColumnOrder {
  asc = 'asc',
  desc = 'desc',
}

registerEnumType(ColumnOrder, { name: 'ColumnOrder' });
