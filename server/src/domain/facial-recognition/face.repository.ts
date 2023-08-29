import { AssetFaceEntity } from '@app/infra/entities';

export const IFaceRepository = 'IFaceRepository';

export interface AssetFaceId {
  assetId: string;
  personId: string;
}

export interface EmbeddingSearch {
  ownerId: string;
  embedding: number[];
  minDistance: number;
}

export interface IFaceRepository {
  searchByEmbedding(search: EmbeddingSearch): Promise<AssetFaceEntity[]>;
  getAll(): Promise<AssetFaceEntity[]>;
  getByIds(ids: AssetFaceId[]): Promise<AssetFaceEntity[]>;
  create(entity: Partial<AssetFaceEntity>): Promise<AssetFaceEntity>;
}
