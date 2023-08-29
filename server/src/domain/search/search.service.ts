import { AssetEntity } from '@app/infra/entities';
import { Inject, Injectable } from '@nestjs/common';
import { AssetResponseDto, mapAsset } from '../asset';
import { AuthUserDto } from '../auth';
import { IMachineLearningRepository, ISmartInfoRepository } from '../smart-info';
import { FeatureFlag, ISystemConfigRepository, SystemConfigCore } from '../system-config';
import { SearchDto } from './dto';
import { SearchResponseDto } from './response-dto';
import { SearchExploreItem, SearchStrategy } from './search.repository';

@Injectable()
export class SearchService {
  private configCore: SystemConfigCore;

  constructor(
    @Inject(ISystemConfigRepository) configRepository: ISystemConfigRepository,
    @Inject(IMachineLearningRepository) private machineLearning: IMachineLearningRepository,
    @Inject(ISmartInfoRepository) private smartInfoRepository: ISmartInfoRepository,
  ) {
    this.configCore = new SystemConfigCore(configRepository);
  }

  async getExploreData(authUser: AuthUserDto): Promise<SearchExploreItem<AssetResponseDto>[]> {
    return [];
  }

  async search(authUser: AuthUserDto, dto: SearchDto): Promise<SearchResponseDto> {
    const { machineLearning } = await this.configCore.getConfig();
    const hasClip = await this.configCore.hasFeature(FeatureFlag.CLIP_ENCODE);
    const query = dto.q || dto.query || '*';
    const strategy = dto.clip && hasClip ? SearchStrategy.CLIP : SearchStrategy.TEXT;

    let assets: AssetEntity[] = [];

    switch (strategy) {
      case SearchStrategy.CLIP:
        const embedding = await this.machineLearning.encodeText(machineLearning.url, query);
        assets = await this.smartInfoRepository.searchByEmbedding({
          ownerId: authUser.id,
          embedding,
          minDistance: 0.8,
        });
        break;
      case SearchStrategy.TEXT:
      default:
        break;
    }

    return {
      albums: {
        total: 0,
        count: 0,
        items: [],
        facets: [],
      },
      assets: {
        total: assets.length,
        count: assets.length,
        items: assets.map((asset) => mapAsset(asset)),
        facets: [],
      },
    };
  }
}
