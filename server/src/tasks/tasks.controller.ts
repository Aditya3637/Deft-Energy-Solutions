import { Body, Controller, Get, Post } from "@nestjs/common";

import { CurrentOrg } from "../common/current-org.decorator";
import { TasksService } from "./tasks.service";
import { CreateTaskDto } from "./dto/create-task.dto";

@Controller("tasks")
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  list(@CurrentOrg() orgId: string) {
    return this.tasks.list(orgId);
  }

  /** POST /v1/tasks — create a task (e.g. from a diagnosis finding). */
  @Post()
  create(@CurrentOrg() orgId: string, @Body() dto: CreateTaskDto) {
    return this.tasks.create(orgId, dto);
  }
}
