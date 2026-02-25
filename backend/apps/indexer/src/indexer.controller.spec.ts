import { Test, TestingModule } from '@nestjs/testing';
import { IndexerController } from './indexer.controller';
import { IndexerService } from './indexer.service';

describe('IndexerController', () => {
  let indexerController: IndexerController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [IndexerController],
      providers: [IndexerService],
    }).compile();

    indexerController = app.get<IndexerController>(IndexerController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(indexerController.getHello()).toBe('Hello World!');
    });
  });
});
