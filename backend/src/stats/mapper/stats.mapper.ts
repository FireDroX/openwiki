import { ResponseDto } from '../../common/dto/response.dto.js';
import { FollowedPageDto } from '../dto/out/followed-page.dto.js';
import { PopularPageDto } from '../dto/out/popular-page.dto.js';
import { PublicStatsResponseDto } from '../dto/out/public-stats-response.dto.js';
import { StatsResponseDto } from '../dto/out/stats-response.dto.js';

export class StatsMapper {
  static toResponse(stats: StatsResponseDto): ResponseDto<StatsResponseDto> {
    return new ResponseDto(stats);
  }

  static toPublicResponse(
    stats: PublicStatsResponseDto,
  ): ResponseDto<PublicStatsResponseDto> {
    return new ResponseDto(stats);
  }

  static toPopularPagesResponse(
    pages: PopularPageDto[],
  ): ResponseDto<PopularPageDto[]> {
    return new ResponseDto(pages);
  }

  static toFollowedPagesResponse(
    pages: FollowedPageDto[],
  ): ResponseDto<FollowedPageDto[]> {
    return new ResponseDto(pages);
  }
}
