import { AssetFaceId, EmbeddingSearch, IFaceRepository } from '@app/domain';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetFaceEntity } from '../entities/asset-face.entity';
import { asVector } from '../infra.utils.ts';

@Injectable()
export class FaceRepository implements IFaceRepository {
  constructor(@InjectRepository(AssetFaceEntity) private repository: Repository<AssetFaceEntity>) {}

  searchByEmbedding({ ownerId, embedding, minDistance }: EmbeddingSearch): Promise<AssetFaceEntity[]> {
    return this.repository
      .createQueryBuilder('faces')
      .leftJoinAndSelect('faces.asset', 'asset')
      .where('asset.ownerId = :ownerId', { ownerId })
      .andWhere(`(faces.embedding <=> ${asVector(embedding)}) <= :minDistance`, { minDistance })
      .orderBy(`faces.embedding <=> ${asVector(embedding)}`, 'ASC')
      .limit(5)
      .getMany();
  }

  getAll(): Promise<AssetFaceEntity[]> {
    return this.repository.find({ relations: { asset: true } });
  }

  getByIds(ids: AssetFaceId[]): Promise<AssetFaceEntity[]> {
    return this.repository.find({ where: ids, relations: { asset: true } });
  }

  async create(entity: AssetFaceEntity): Promise<AssetFaceEntity> {
    const { embedding, ...face } = entity;
    await this.repository.save(face);
    await this.repository.manager.query(
      `UPDATE "asset_faces" SET "embedding" = ${asVector(embedding)} WHERE "assetId" = $1 AND "personId" = $2`,
      [entity.assetId, entity.personId],
    );
    return this.repository.findOneByOrFail({ assetId: entity.assetId, personId: entity.personId });
  }
}
