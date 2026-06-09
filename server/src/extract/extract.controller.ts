import {
  Controller,
  HttpException,
  HttpStatus,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";

import { ExtractService } from "./extract.service";
import { ExtractionError, UnsupportedMediaError } from "./extract-core";

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB — comfortably covers multi-page scans.

@Controller("extract")
export class ExtractController {
  constructor(private readonly svc: ExtractService) {}

  /**
   * POST /v1/extract — multipart upload of one electricity bill (field name
   * `file`). Returns the 42 fields (key/label/group/unit/value/confidence)
   * ready to drop into the review screen.
   */
  @Post()
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX_BYTES } }))
  async extract(@UploadedFile() file?: Express.Multer.File) {
    if (!this.svc.isConfigured()) {
      throw new HttpException(
        "Bill extraction is not configured on this server (ANTHROPIC_API_KEY unset).",
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    if (!file?.buffer?.length) {
      throw new HttpException("No file uploaded (expected multipart field 'file').", HttpStatus.BAD_REQUEST);
    }

    try {
      return await this.svc.extract({ buffer: file.buffer, mimetype: file.mimetype });
    } catch (err) {
      if (err instanceof UnsupportedMediaError) {
        throw new HttpException(err.message, HttpStatus.UNSUPPORTED_MEDIA_TYPE);
      }
      if (err instanceof ExtractionError) {
        const status =
          err.status === 503 ? HttpStatus.SERVICE_UNAVAILABLE : HttpStatus.BAD_GATEWAY;
        throw new HttpException(err.message, status);
      }
      throw new HttpException("Extraction failed unexpectedly.", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
