import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";

import { AppModule } from "./app.module";

async function bootstrap() {
  // rawBody: true keeps the unparsed request buffer (req.rawBody) so payment
  // webhooks can be signature-verified against the exact bytes received.
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.setGlobalPrefix("v1");
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  const origins = (process.env.CORS_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  // Allow the configured origins plus any *.vercel.app (incl. preview deploys).
  app.enableCors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // same-origin / server-to-server / curl
      try {
        const host = new URL(origin).hostname;
        if (origins.includes(origin) || host.endsWith(".vercel.app")) {
          return cb(null, true);
        }
      } catch {
        /* malformed origin → deny */
      }
      return cb(null, false);
    },
  });

  const port = process.env.PORT ? Number(process.env.PORT) : 4000;
  await app.listen(port, "0.0.0.0");
  // eslint-disable-next-line no-console
  console.log(`deft-energy-server listening on :${port}`);
}

bootstrap();
