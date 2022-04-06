import {
  ConnectionArguments,
  ConnectionCursor,
  fromGlobalId,
} from 'graphql-relay';
import { Field, ArgsType } from '@nestjs/graphql';

type PagingMeta =
  | { pagingType: 'forward'; after?: string; limit: number }
  | { pagingType: 'backward'; before?: string; limit: number }
  | { pagingType: 'none' };

function checkPagingSanity(args: ConnectionArgs): PagingMeta {
  const { limit = 0, after, before } = args;

  // console.log(after, before);

  const isForwardPaging = !!after || (!after && !before);
  const isBackwardPaging = !!before;
  if (isForwardPaging && isBackwardPaging) {
    throw new Error('Relay pagination cannot be forwards AND backwards!');
  }
  if ((isForwardPaging && before) || (isBackwardPaging && after)) {
    throw new Error('Paging must use either after or before!');
  }
  if ((isForwardPaging && limit < 0) || (isBackwardPaging && limit < 0)) {
    throw new Error('Paging limit must be positive!');
  }

  // eslint-disable-next-line no-nested-ternary
  return isForwardPaging
    ? { pagingType: 'forward', after, limit }
    : isBackwardPaging
    ? { pagingType: 'backward', before, limit }
    : { pagingType: 'none' };
}

function getId(cursor: ConnectionCursor) {
  const id = fromGlobalId(cursor).id;
  return parseInt(id, 10);
}

function nextId(cursor: ConnectionCursor) {
  return getId(cursor) + 1;
}

function getPagingParameters(args: ConnectionArgs) {
  const meta = checkPagingSanity(args);

  switch (meta.pagingType) {
    case 'forward': {
      return {
        limit: meta.limit,
        offset: meta.after ? nextId(meta.after) : 0,
      };
    }
    case 'backward': {
      const { before } = meta;
      let { limit } = meta;
      let offset = getId(before) - limit;

      if (offset < 0) {
        limit = Math.max(limit + offset, 0);
        offset = 0;
      }

      return { offset, limit };
    }
    default:
      return {};
  }
}

@ArgsType()
export default class ConnectionArgs implements ConnectionArguments {
  @Field({ nullable: true, description: 'Paginate before opaque cursor' })
  public before?: ConnectionCursor;

  @Field({ nullable: true, description: 'Paginate after opaque cursor' })
  public after?: ConnectionCursor;

  @Field({ nullable: true, description: 'Pagination limit' })
  public limit?: number;

  pagingParams() {
    return getPagingParameters(this);
  }
}
