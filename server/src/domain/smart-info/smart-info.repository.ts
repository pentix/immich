import { AssetEntity, SmartInfoEntity } from '@app/infra/entities';
import { EmbeddingSearch } from '../facial-recognition';

export const ISmartInfoRepository = 'ISmartInfoRepository';

export interface ISmartInfoRepository {
  searchByEmbedding(search: EmbeddingSearch): Promise<AssetEntity[]>;
  upsert(info: Partial<SmartInfoEntity>): Promise<void>;
}
