import { createParamDecorator, ExecutionContext } from "@nestjs/common";

import { DEMO_ORG_ID } from "./constants";

/**
 * Resolves the tenant for the request. Until real auth (Stage F) it reads the
 * `x-org-id` header and falls back to the demo org. With auth, this comes from
 * the verified JWT.
 */
export const CurrentOrg = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest();
    const header = req.headers?.["x-org-id"];
    return (typeof header === "string" && header) || DEMO_ORG_ID;
  },
);
