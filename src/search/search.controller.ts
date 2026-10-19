import { Controller, DefaultValuePipe, Get, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { Public, Roles } from '../common/decorators/public.decorator';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Full-text search over published posts' })
  search(@Query('q') query: string, @Query('tag') tag?: string, @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1) {
    return this.searchService.searchPosts(query || '', tag, page);
  }

  @Post('reindex')
  @ApiBearerAuth()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Rebuild the Elasticsearch index from the database' })
  reindex() {
    return this.searchService.reindex();
  }
}
