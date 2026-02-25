import { Injectable } from '@nestjs/common';

@Injectable()
export class IndexerService {
  getHello(): string {
    return 'Hello World!';
  }
}
