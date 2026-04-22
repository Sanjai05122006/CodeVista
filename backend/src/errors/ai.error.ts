import { AppError } from "../middleware/error.middleware";

export class AIServiceError extends AppError {
  constructor(
    code:
      | "AI_NETWORK_ERROR"
      | "AI_TIMEOUT_ERROR"
      | "AI_PARSE_ERROR"
      | "AI_SCHEMA_ERROR"
      | "AI_PROVIDER_ERROR",
    message: string,
    status: number = 502
  ) {
    super(code, status, message);
    this.name = "AIServiceError";
  }
}
