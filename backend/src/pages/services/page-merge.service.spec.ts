import { describe, expect, it } from 'vitest';
import { PageMergeService } from './page-merge.service.js';

describe('PageMergeService', () => {
  const service = new PageMergeService();

  it('merges disjoint line edits without conflict', () => {
    const base = 'Line 1\nLine 2\nLine 3';
    const mine = 'Line 1 edited by me\nLine 2\nLine 3';
    const theirs = 'Line 1\nLine 2\nLine 3 edited by them';

    const result = service.merge(base, mine, theirs);

    expect(result.conflict).toBe(false);
    expect(result.content).toBe(
      'Line 1 edited by me\nLine 2\nLine 3 edited by them',
    );
  });

  it('flags a conflict when both sides edit the same line', () => {
    const base = 'Line 1\nLine 2\nLine 3';
    const mine = 'Line 1\nLine 2 edited by me\nLine 3';
    const theirs = 'Line 1\nLine 2 edited by them\nLine 3';

    const result = service.merge(base, mine, theirs);

    expect(result.conflict).toBe(true);
    expect(result.content).toContain('<<<<<<<');
    expect(result.content).toContain('Line 2 edited by me');
    expect(result.content).toContain('=======');
    expect(result.content).toContain('Line 2 edited by them');
    expect(result.content).toContain('>>>>>>>');
  });

  it('returns the original content untouched when nothing changed', () => {
    const base = 'Line 1\nLine 2\nLine 3';

    const result = service.merge(base, base, base);

    expect(result.conflict).toBe(false);
    expect(result.content).toBe(base);
  });
});
