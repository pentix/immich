import { Inject, Injectable } from '@nestjs/common';
import { AssetResponseDto } from '../asset';
import { AuthUserDto } from '../auth';
import { IMachineLearningRepository } from '../smart-info';
import { FeatureFlag, ISystemConfigRepository, SystemConfigCore } from '../system-config';
import { SearchDto } from './dto';
import { SearchResponseDto } from './response-dto';
import { ISearchRepository, SearchExploreItem, SearchStrategy } from './search.repository';

@Injectable()
export class SearchService {
  private configCore: SystemConfigCore;

  constructor(
    @Inject(ISystemConfigRepository) configRepository: ISystemConfigRepository,
    @Inject(IMachineLearningRepository) private machineLearning: IMachineLearningRepository,
    @Inject(ISearchRepository) private searchRepository: ISearchRepository,
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

    switch (strategy) {
      case SearchStrategy.CLIP:
        const clip = await this.machineLearning.encodeText(machineLearning.url, query);
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
        total: 0,
        count: 0,
        items: [],
        facets: [],
      },
    };
  }
}
