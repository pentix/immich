import { IFaceRepository } from '@app/domain';

export const newFaceRepositoryMock = (): jest.Mocked<IFaceRepository> => {
  return {
    searchByEmbedding: jest.fn().mockResolvedValue([]),
    getAll: jest.fn(),
    getByIds: jest.fn(),
    create: jest.fn(),
  };
};
