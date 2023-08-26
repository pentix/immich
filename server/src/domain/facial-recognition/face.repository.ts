import { AssetFaceEntity } from '@app/infra/entities';

export const IFaceRepository = 'IFaceRepository';

export interface AssetFaceId {
  assetId: string;
  personId: string;
}

export interface SearchOptions {
  ownerId: string;
  minDistance: number;
}

export interface IFaceRepository {
  search(query: number[], filters: SearchOptions): Promise<AssetFaceEntity[]>;
  getAll(): Promise<AssetFaceEntity[]>;
  getByIds(ids: AssetFaceId[]): Promise<AssetFaceEntity[]>;
  create(entity: Partial<AssetFaceEntity>): Promise<AssetFaceEntity>;
}
