import { newMachineLearningRepositoryMock, newSearchRepositoryMock, newSystemConfigRepositoryMock } from '@test';
import { plainToInstance } from 'class-transformer';
import { ISystemConfigRepository } from '../index';
import { IMachineLearningRepository } from '../smart-info';
import { SearchDto } from './dto';
import { ISearchRepository } from './search.repository';
import { SearchService } from './search.service';

jest.useFakeTimers();

describe(SearchService.name, () => {
  let sut: SearchService;
  let configMock: jest.Mocked<ISystemConfigRepository>;
  let machineMock: jest.Mocked<IMachineLearningRepository>;
  let searchMock: jest.Mocked<ISearchRepository>;

  beforeEach(() => {
    configMock = newSystemConfigRepositoryMock();
    machineMock = newMachineLearningRepositoryMock();
    searchMock = newSearchRepositoryMock();
    sut = new SearchService(configMock, machineMock, searchMock);
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('request dto', () => {
    it('should convert smartInfo.tags to a string list', () => {
      const instance = plainToInstance(SearchDto, { 'smartInfo.tags': 'a,b,c' });
      expect(instance['smartInfo.tags']).toEqual(['a', 'b', 'c']);
    });

    it('should handle empty smartInfo.tags', () => {
      const instance = plainToInstance(SearchDto, {});
      expect(instance['smartInfo.tags']).toBeUndefined();
    });

    it('should convert smartInfo.objects to a string list', () => {
      const instance = plainToInstance(SearchDto, { 'smartInfo.objects': 'a,b,c' });
      expect(instance['smartInfo.objects']).toEqual(['a', 'b', 'c']);
    });

    it('should handle empty smartInfo.objects', () => {
      const instance = plainToInstance(SearchDto, {});
      expect(instance['smartInfo.objects']).toBeUndefined();
    });
  });
});
