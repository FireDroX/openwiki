import { Injectable } from '@nestjs/common';
import { merge } from 'node-diff3';

export interface PageMergeResult {
  conflict: boolean;
  content: string;
}

@Injectable()
export class PageMergeService {
  merge(base: string, mine: string, theirs: string): PageMergeResult {
    const result = merge(mine, base, theirs, { stringSeparator: '\n' });
    return {
      conflict: result.conflict,
      content: result.result.join('\n'),
    };
  }
}
