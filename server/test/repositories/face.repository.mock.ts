import { IFaceRepository } from '@app/domain';

export const newFaceRepositoryMock = (): jest.Mocked<IFaceRepository> => {
  return {
    search: jest.fn(),
    getAll: jest.fn(),
    getByIds: jest.fn(),
    create: jest.fn(),
  };
};
