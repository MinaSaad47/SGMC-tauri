export class PagingParams {
  page: number = 1;
  pageSize: number = 20;

  constructor(init?: Partial<PagingParams>) {
    Object.assign(this, init);
  }

  get offset(): number {
    return (this.page - 1) * this.pageSize;
  }

  get limit(): number {
    return this.pageSize;
  }
}

export interface PagingInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  total: number;
  page: number;
  pageSize: number;
}

export class PagedList<T> {
  items: T[];
  pagingInfo: PagingInfo;

  constructor(items: T[], params: PagingParams, total: number) {
    this.items = items;
    this.pagingInfo = {
      hasNextPage: params.page * params.pageSize < total,
      hasPreviousPage: params.page > 1,
      total: total,
      page: params.page,
      pageSize: params.pageSize,
    };
  }
}
