import { ResponseDto } from '../../common/dto/response.dto.js';
import { StatsResponseDto } from '../dto/out/stats-response.dto.js';

export class StatsMapper {
  static toResponse(stats: StatsResponseDto): ResponseDto<StatsResponseDto> {
    return new ResponseDto(stats);
  }
}
