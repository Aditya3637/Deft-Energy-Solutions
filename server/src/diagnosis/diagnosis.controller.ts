import { Body, Controller, Param, Post } from "@nestjs/common";

import { CurrentOrg } from "../common/current-org.decorator";
import { DiagnosisService } from "./diagnosis.service";
import { DiagnoseDto } from "./dto/diagnose.dto";

@Controller()
export class DiagnosisController {
  constructor(private readonly diagnosis: DiagnosisService) {}

  /** Stateless: POST /v1/diagnosis { fields: [{key,value}, ...] } */
  @Post("diagnosis")
  diagnose(@Body() dto: DiagnoseDto) {
    return this.diagnosis.run(dto.fields);
  }

  /** Persisted: POST /v1/bills/:id/diagnose → runs the engine and stores it. */
  @Post("bills/:id/diagnose")
  diagnoseBill(@CurrentOrg() orgId: string, @Param("id") id: string) {
    return this.diagnosis.runForBill(orgId, id);
  }
}
