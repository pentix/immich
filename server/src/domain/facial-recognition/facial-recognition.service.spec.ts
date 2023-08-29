import {
  assetStub,
  faceStub,
  newAssetRepositoryMock,
  newFaceRepositoryMock,
  newJobRepositoryMock,
  newMachineLearningRepositoryMock,
  newMediaRepositoryMock,
  newPersonRepositoryMock,
  newStorageRepositoryMock,
  newSystemConfigRepositoryMock,
  personStub,
} from '@test';
import { IAssetRepository, WithoutProperty } from '../asset';
import { IJobRepository, JobName } from '../job';
import { IMediaRepository } from '../media';
import { IPersonRepository } from '../person';
import { IMachineLearningRepository } from '../smart-info';
import { IStorageRepository } from '../storage';
import { ISystemConfigRepository } from '../system-config';
import { IFaceRepository } from './face.repository';
import { FacialRecognitionService } from './facial-recognition.services';

const croppedFace = Buffer.from('Cropped Face');

const face = {
  start: {
    assetId: 'asset-1',
    personId: 'person-1',
    boundingBox: {
      x1: 5,
      y1: 5,
      x2: 505,
      y2: 505,
    },
    imageHeight: 1000,
    imageWidth: 1000,
  },
  middle: {
    assetId: 'asset-1',
    personId: 'person-1',
    boundingBox: {
      x1: 100,
      y1: 100,
      x2: 200,
      y2: 200,
    },
    imageHeight: 500,
    imageWidth: 400,
    embedding: [1, 2, 3, 4],
    score: 0.2,
  },
  end: {
    assetId: 'asset-1',
    personId: 'person-1',
    boundingBox: {
      x1: 300,
      y1: 300,
      x2: 495,
      y2: 495,
    },
    imageHeight: 500,
    imageWidth: 500,
  },
};

describe(FacialRecognitionService.name, () => {
  let sut: FacialRecognitionService;
  let assetMock: jest.Mocked<IAssetRepository>;
  let configMock: jest.Mocked<ISystemConfigRepository>;
  let faceMock: jest.Mocked<IFaceRepository>;
  let jobMock: jest.Mocked<IJobRepository>;
  let machineLearningMock: jest.Mocked<IMachineLearningRepository>;
  let mediaMock: jest.Mocked<IMediaRepository>;
  let personMock: jest.Mocked<IPersonRepository>;
  let storageMock: jest.Mocked<IStorageRepository>;

  beforeEach(async () => {
    assetMock = newAssetRepositoryMock();
    configMock = newSystemConfigRepositoryMock();
    faceMock = newFaceRepositoryMock();
    jobMock = newJobRepositoryMock();
    machineLearningMock = newMachineLearningRepositoryMock();
    mediaMock = newMediaRepositoryMock();
    personMock = newPersonRepositoryMock();
    storageMock = newStorageRepositoryMock();

    mediaMock.crop.mockResolvedValue(croppedFace);

    sut = new FacialRecognitionService(
      assetMock,
      configMock,
      faceMock,
      jobMock,
      machineLearningMock,
      mediaMock,
      personMock,
      storageMock,
    );
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('handleQueueRecognizeFaces', () => {
    it('should queue missing assets', async () => {
      assetMock.getWithout.mockResolvedValue({
        items: [assetStub.image],
        hasNextPage: false,
      });
      await sut.handleQueueRecognizeFaces({});

      expect(assetMock.getWithout).toHaveBeenCalledWith({ skip: 0, take: 1000 }, WithoutProperty.FACES);
      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.RECOGNIZE_FACES,
        data: { id: assetStub.image.id },
      });
    });

    it('should queue all assets', async () => {
      assetMock.getAll.mockResolvedValue({
        items: [assetStub.image],
        hasNextPage: false,
      });
      personMock.deleteAll.mockResolvedValue(5);

      await sut.handleQueueRecognizeFaces({ force: true });

      expect(assetMock.getAll).toHaveBeenCalled();
      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.RECOGNIZE_FACES,
        data: { id: assetStub.image.id },
      });
    });
  });

  describe('handleRecognizeFaces', () => {
    it('should skip when no resize path', async () => {
      assetMock.getByIds.mockResolvedValue([assetStub.noResizePath]);
      await sut.handleRecognizeFaces({ id: assetStub.noResizePath.id });
      expect(machineLearningMock.detectFaces).not.toHaveBeenCalled();
    });

    it('should handle no results', async () => {
      machineLearningMock.detectFaces.mockResolvedValue([]);
      assetMock.getByIds.mockResolvedValue([assetStub.image]);
      await sut.handleRecognizeFaces({ id: assetStub.image.id });
      expect(machineLearningMock.detectFaces).toHaveBeenCalledWith('http://immich-machine-learning:3003', {
        imagePath: assetStub.image.resizePath,
      });
      expect(faceMock.create).not.toHaveBeenCalled();
      expect(jobMock.queue).not.toHaveBeenCalled();
    });

    it('should match existing people', async () => {
      machineLearningMock.detectFaces.mockResolvedValue([face.middle]);
      faceMock.searchByEmbedding.mockResolvedValue([faceStub.face1]);
      assetMock.getByIds.mockResolvedValue([assetStub.image]);
      await sut.handleRecognizeFaces({ id: assetStub.image.id });

      expect(faceMock.create).toHaveBeenCalledWith({
        personId: 'person-1',
        assetId: 'asset-id',
        embedding: [1, 2, 3, 4],
        boundingBoxX1: 100,
        boundingBoxY1: 100,
        boundingBoxX2: 200,
        boundingBoxY2: 200,
        imageHeight: 500,
        imageWidth: 400,
      });
    });

    it('should create a new person', async () => {
      machineLearningMock.detectFaces.mockResolvedValue([face.middle]);
      faceMock.searchByEmbedding.mockResolvedValue([]);
      personMock.create.mockResolvedValue(personStub.noName);
      assetMock.getByIds.mockResolvedValue([assetStub.image]);

      await sut.handleRecognizeFaces({ id: assetStub.image.id });

      expect(personMock.create).toHaveBeenCalledWith({ ownerId: assetStub.image.ownerId });
      expect(faceMock.create).toHaveBeenCalledWith({
        personId: 'person-1',
        assetId: 'asset-id',
        embedding: [1, 2, 3, 4],
        boundingBoxX1: 100,
        boundingBoxY1: 100,
        boundingBoxX2: 200,
        boundingBoxY2: 200,
        imageHeight: 500,
        imageWidth: 400,
      });
      expect(jobMock.queue.mock.calls).toEqual([
        [
          {
            name: JobName.GENERATE_FACE_THUMBNAIL,
            data: {
              assetId: 'asset-1',
              personId: 'person-1',
              boundingBox: {
                x1: 100,
                y1: 100,
                x2: 200,
                y2: 200,
              },
              imageHeight: 500,
              imageWidth: 400,
              score: 0.2,
            },
          },
        ],
      ]);
    });
  });

  describe('handleGenerateFaceThumbnail', () => {
    it('should skip an asset not found', async () => {
      assetMock.getByIds.mockResolvedValue([]);

      await sut.handleGenerateFaceThumbnail(face.middle);

      expect(mediaMock.crop).not.toHaveBeenCalled();
    });

    it('should skip an asset without a thumbnail', async () => {
      assetMock.getByIds.mockResolvedValue([assetStub.noResizePath]);

      await sut.handleGenerateFaceThumbnail(face.middle);

      expect(mediaMock.crop).not.toHaveBeenCalled();
    });

    it('should generate a thumbnail', async () => {
      assetMock.getByIds.mockResolvedValue([assetStub.image]);

      await sut.handleGenerateFaceThumbnail(face.middle);

      expect(assetMock.getByIds).toHaveBeenCalledWith(['asset-1']);
      expect(storageMock.mkdirSync).toHaveBeenCalledWith('upload/thumbs/user-id');
      expect(mediaMock.crop).toHaveBeenCalledWith('/uploads/user-id/thumbs/path.jpg', {
        left: 95,
        top: 95,
        width: 110,
        height: 110,
      });
      expect(mediaMock.resize).toHaveBeenCalledWith(croppedFace, 'upload/thumbs/user-id/person-1.jpeg', {
        format: 'jpeg',
        size: 250,
      });
      expect(personMock.update).toHaveBeenCalledWith({
        id: 'person-1',
        thumbnailPath: 'upload/thumbs/user-id/person-1.jpeg',
      });
    });

    it('should generate a thumbnail without going negative', async () => {
      assetMock.getByIds.mockResolvedValue([assetStub.image]);

      await sut.handleGenerateFaceThumbnail(face.start);

      expect(mediaMock.crop).toHaveBeenCalledWith('/uploads/user-id/thumbs/path.jpg', {
        left: 0,
        top: 0,
        width: 510,
        height: 510,
      });
      expect(mediaMock.resize).toHaveBeenCalledWith(croppedFace, 'upload/thumbs/user-id/person-1.jpeg', {
        format: 'jpeg',
        size: 250,
      });
    });

    it('should generate a thumbnail without overflowing', async () => {
      assetMock.getByIds.mockResolvedValue([assetStub.image]);

      await sut.handleGenerateFaceThumbnail(face.end);

      expect(mediaMock.crop).toHaveBeenCalledWith('/uploads/user-id/thumbs/path.jpg', {
        left: 297,
        top: 297,
        width: 202,
        height: 202,
      });
      expect(mediaMock.resize).toHaveBeenCalledWith(croppedFace, 'upload/thumbs/user-id/person-1.jpeg', {
        format: 'jpeg',
        size: 250,
      });
    });
  });
});
