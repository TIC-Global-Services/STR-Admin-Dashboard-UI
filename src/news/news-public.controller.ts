import { Controller, Get } from "@nestjs/common";
import { NewsService } from "./news.service";
import { Public } from "src/common/decorators/public.decorator";

@Controller('news')
export class NewsPublicController {
  constructor(private readonly service: NewsService) {}

  @Public()
  @Get()
  findPublished() {
    return this.service.findPublished();
  }
}
