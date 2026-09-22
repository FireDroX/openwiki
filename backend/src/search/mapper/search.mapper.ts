import { ResponseDto } from '../../common/dto/response.dto.js';
import { SearchResponseDto } from '../dto/out/paginated-search-response.dto.js';
import { SearchResultDto } from '../dto/out/search-result.dto.js';
import { SearchMatch } from '../persistence/search.repository.js';

const EXCERPT_LENGTH = 160;
const EXCERPT_RADIUS = Math.floor(EXCERPT_LENGTH / 2);
const ELLIPSIS = '…';

export class SearchMapper {
  static toResultDto(match: SearchMatch, query: string): SearchResultDto {
    return {
      pageId: match.pageId,
      slug: match.slug,
      title: match.title,
      excerpt: SearchMapper.buildExcerpt(match.content, query),
      score: match.score,
      tags: match.tags,
    };
  }

  static toResponse(
    matches: SearchMatch[],
    total: number,
    query: string,
  ): ResponseDto<SearchResponseDto> {
    return new ResponseDto({
      results: matches.map((match) => SearchMapper.toResultDto(match, query)),
      total,
    });
  }

  private static buildExcerpt(content: string, query: string): string {
    const plain = content.replace(/\s+/g, ' ').trim();
    const matchIndex = plain.toLowerCase().indexOf(query.toLowerCase());

    if (matchIndex === -1) {
      return plain.length > EXCERPT_LENGTH
        ? `${plain.slice(0, EXCERPT_LENGTH)}${ELLIPSIS}`
        : plain;
    }

    const start = Math.max(0, matchIndex - EXCERPT_RADIUS);
    const end = Math.min(
      plain.length,
      matchIndex + query.length + EXCERPT_RADIUS,
    );
    const prefix = start > 0 ? ELLIPSIS : '';
    const suffix = end < plain.length ? ELLIPSIS : '';

    return `${prefix}${plain.slice(start, end)}${suffix}`;
  }
}
