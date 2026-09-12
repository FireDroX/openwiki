import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListMediaDto {
  @ApiPropertyOptional({
    description: 'Identifiant de la page (mode page unique)',
  })
  pageId?: string;

  @ApiPropertyOptional({
    description: 'Filtre par nom de fichier (mode médiathèque uniquement)',
  })
  search?: string;

  @ApiPropertyOptional({
    description: '"image" ou "file" (mode médiathèque uniquement)',
  })
  type?: string;

  @ApiPropertyOptional({
    description: 'Numéro de page, défaut 1 (mode médiathèque uniquement)',
  })
  page?: number;

  @ApiPropertyOptional({
    description:
      'Taille de page, défaut 20, max 100 (mode médiathèque uniquement)',
  })
  limit?: number;
}
