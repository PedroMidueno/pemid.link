import { PartialType } from '@nestjs/mapped-types'
import { PaginationDto } from 'src/common/dto/pagination.dto'

export class GetUrlsDto extends PartialType(PaginationDto) {}
