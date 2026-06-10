import { env } from "../config/env";
import { AppError } from "../middleware/error.middleware";
import { logger } from "../utils/logger";

type ContactLogPayload = {
  status: "success" | "error";
  subject: string;
  message_length: number;
  provider_status?: number | null;
  provider_error_name?: string | null;
  provider_message?: string | null;
  error_code?: string | null;
  recipient?: string | null;
};

type ContactLogOptions = {
  requestOrigin?: string | null;
  requestIp?: string | null;
};

type ContactSubmissionPayload = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

type ContactSubmissionResult = {
  messageId: string;
  providerStatus: number;
  recipient: string;
};

type ResendEmailResponse = {
  id?: string;
  error?: string;
  message?: string;
  name?: string;
  statusCode?: number;
};

type ContactFailureReason =
  | "network_error"
  | "provider_validation_rejection"
  | "provider_http_error"
  | "provider_missing_message_id"
  | "unknown";

const RESEND_API_URL = "https://api.resend.com/emails";
const RESEND_SENDER = "CodeVista <onboarding@resend.dev>";
const RESEND_TEST_RECIPIENT = "wolf.wolfy.fox@gmail.com";
const CONTACT_RECIPIENT_EMAIL =
  env.CONTACT_TO_EMAIL?.trim() || RESEND_TEST_RECIPIENT;
const DEFAULT_SUBJECT = "CodeVista support request";

const normalizeField = (value: string) => value.trim();

const maskOrigin = (origin?: string | null) => origin ?? "unknown";

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return character;
    }
  });

const normalizeSubject = (subject: string) => {
  const trimmed = normalizeField(subject);
  return trimmed || DEFAULT_SUBJECT;
};

const buildContactMessageText = (
  payload: ContactSubmissionPayload,
  subject: string
) =>
  [
    "New contact submission from CodeVista",
    "",
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
    `Subject: ${subject}`,
    "",
    "Message:",
    payload.message,
  ].join("\n");

const buildContactMessageHtml = (
  payload: ContactSubmissionPayload,
  subject: string
) => {
  const safeName = escapeHtml(payload.name);
  const safeEmail = escapeHtml(payload.email);
  const safeSubject = escapeHtml(subject);
  const safeMessage = escapeHtml(payload.message).replace(/\n/g, "<br />");

  return `
    <div style="font-family: Arial, Helvetica, sans-serif; color: #111827; line-height: 1.6;">
      <h1 style="font-size: 18px; margin: 0 0 16px;">New contact submission from CodeVista</h1>
      <p style="margin: 0 0 8px;"><strong>Name:</strong> ${safeName}</p>
      <p style="margin: 0 0 8px;"><strong>Email:</strong> ${safeEmail}</p>
      <p style="margin: 0 0 16px;"><strong>Subject:</strong> ${safeSubject}</p>
      <div style="margin: 0;">
        <p style="margin: 0 0 8px;"><strong>Message:</strong></p>
        <div style="white-space: pre-wrap;">${safeMessage}</div>
      </div>
    </div>
  `.trim();
};

const normalizeProviderMessage = (
  response: Response,
  data: ResendEmailResponse | null
) => data?.message?.trim() || data?.error?.trim() || response.statusText || null;

const normalizeProviderErrorName = (data: ResendEmailResponse | null) =>
  data?.name?.trim() || null;

type ResendDeliveryAttempt = {
  recipient: string;
  response: Response;
  data: ResendEmailResponse | null;
};

const buildContactRequestPayload = (
  payload: ContactSubmissionPayload,
  subject: string,
  recipient: string
) => ({
  from: RESEND_SENDER,
  to: [recipient],
  subject: `CodeVista contact: ${subject}`,
  html: buildContactMessageHtml(payload, subject),
  text: buildContactMessageText(payload, subject),
  headers: {
    "Reply-To": payload.email,
  },
});

const sendResendDeliveryAttempt = async (
  payload: ContactSubmissionPayload,
  subject: string,
  recipient: string
): Promise<ResendDeliveryAttempt> => {
  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildContactRequestPayload(payload, subject, recipient)),
  });

  const data = (await response.json().catch(() => null)) as
    | ResendEmailResponse
    | null;

  return {
    recipient,
    response,
    data,
  };
};

const isProviderValidationRejection = (
  attempt: Pick<ResendDeliveryAttempt, "response" | "data">
) =>
  attempt.response.status === 403 && attempt.data?.name === "validation_error";

const deriveContactFailureReason = (
  payload: Pick<
    ContactLogPayload,
    "error_code" | "provider_error_name" | "provider_status"
  >
): ContactFailureReason => {
  if (payload.error_code === "NETWORK_ERROR") {
    return "network_error";
  }

  if (payload.provider_error_name === "validation_error") {
    return "provider_validation_rejection";
  }

  if (
    typeof payload.provider_status === "number" &&
    payload.provider_status >= 400
  ) {
    return "provider_http_error";
  }

  return "unknown";
};

export const recordContactSubmissionLog = async (
  payload: ContactLogPayload,
  options: ContactLogOptions = {}
) => {
  const status = payload.status;
  const subject = normalizeField(payload.subject);
  const messageLength = payload.message_length;
  const providerStatus = payload.provider_status ?? null;
  const providerErrorName = payload.provider_error_name?.trim() || null;
  const providerMessage = payload.provider_message?.trim() || null;
  const errorCode = payload.error_code?.trim() || null;
  const recipient = payload.recipient?.trim() || null;
  const failureReason =
    status === "error"
      ? deriveContactFailureReason({
          error_code: errorCode,
          provider_error_name: providerErrorName,
          provider_status: providerStatus,
        })
      : null;

  const requestOrigin = maskOrigin(options.requestOrigin);
  const requestIp = options.requestIp ?? "unknown";

  const logMeta = {
    origin: requestOrigin,
    ip: requestIp,
    status,
    subject,
    message_length: messageLength,
    ...(providerStatus !== null ? { provider_status: providerStatus } : {}),
    ...(providerErrorName ? { provider_error_name: providerErrorName } : {}),
    ...(providerMessage ? { provider_message: providerMessage } : {}),
    ...(errorCode ? { error_code: errorCode } : {}),
    ...(recipient ? { recipient } : {}),
    ...(failureReason ? { failure_reason: failureReason } : {}),
  };

  if (status === "success") {
    logger.info("contact.message.delivered", logMeta);
  } else {
    logger.warn("contact.message.delivery_failed", logMeta);
  }

  return {
    ok: true as const,
  };
};

export const sendContactSubmissionMessage = async (
  payload: ContactSubmissionPayload,
  options: ContactLogOptions = {}
): Promise<ContactSubmissionResult> => {
  const subject = normalizeSubject(payload.subject);
  const recipients = Array.from(
    new Set([CONTACT_RECIPIENT_EMAIL, RESEND_TEST_RECIPIENT].filter(Boolean))
  );

  let lastFailure: {
    recipient: string;
    responseStatus?: number;
    providerMessage: string | null;
    providerErrorName: string | null;
    errorCode: string;
  } | null = null;

  try {
    for (let index = 0; index < recipients.length; index += 1) {
      const recipient = recipients[index]!;

      try {
        const attempt = await sendResendDeliveryAttempt(payload, subject, recipient);

        if (attempt.response.ok && attempt.data?.id) {
          await recordContactSubmissionLog(
            {
              status: "success",
              subject,
              message_length: payload.message.length,
              provider_status: attempt.response.status,
              provider_message: attempt.data.id,
              recipient,
            },
            options
          );

          return {
            messageId: attempt.data.id,
            providerStatus: attempt.response.status,
            recipient,
          };
        }

        const providerMessage = normalizeProviderMessage(
          attempt.response,
          attempt.data
        );
        const providerErrorName = normalizeProviderErrorName(attempt.data);

        await recordContactSubmissionLog(
          {
            status: "error",
            subject,
            message_length: payload.message.length,
            provider_status: attempt.response.status,
            provider_error_name: providerErrorName,
            provider_message: providerMessage,
            error_code: "RESEND_SEND_FAILED",
            recipient,
          },
          options
        );

        lastFailure = {
          recipient,
          responseStatus: attempt.response.status,
          providerMessage,
          providerErrorName,
          errorCode: "RESEND_SEND_FAILED",
        };

        const shouldRetry =
          index < recipients.length - 1 &&
          isProviderValidationRejection(attempt) &&
          recipient !== RESEND_TEST_RECIPIENT;

        if (shouldRetry) {
          logger.warn("contact.message.delivery_retry", {
            origin: maskOrigin(options.requestOrigin),
            ip: options.requestIp ?? "unknown",
            attempted_recipient: recipient,
            fallback_recipient: recipients[index + 1],
            provider_status: attempt.response.status,
            provider_error_name: providerErrorName,
            provider_message: providerMessage,
            error_code: "RESEND_SEND_FAILED",
          });

          continue;
        }

        throw new AppError(
          "CONTACT_EMAIL_SEND_FAILED",
          attempt.response.status >= 400 && attempt.response.status < 500
            ? attempt.response.status
            : 502,
          "Unable to send your message right now."
        );
      } catch (error) {
        if (error instanceof AppError && error.code === "CONTACT_EMAIL_SEND_FAILED") {
          throw error;
        }

        const providerMessage =
          error instanceof Error ? error.message : "Unknown network error";

        await recordContactSubmissionLog(
          {
            status: "error",
            subject,
            message_length: payload.message.length,
            provider_message: providerMessage,
            error_code: "NETWORK_ERROR",
            recipient,
          },
          options
        );

        lastFailure = {
          recipient,
          providerMessage,
          providerErrorName: null,
          errorCode: "NETWORK_ERROR",
        };

        const shouldRetry =
          index < recipients.length - 1 && recipient !== RESEND_TEST_RECIPIENT;

        if (shouldRetry) {
          logger.warn("contact.message.delivery_retry", {
            origin: maskOrigin(options.requestOrigin),
            ip: options.requestIp ?? "unknown",
            attempted_recipient: recipient,
            fallback_recipient: recipients[index + 1],
            provider_message: providerMessage,
            error_code: "NETWORK_ERROR",
          });

          continue;
        }

        throw new AppError(
          "CONTACT_EMAIL_SEND_FAILED",
          502,
          "Unable to send your message right now."
        );
      }
    }
  } catch (error) {
    if (error instanceof AppError && error.code === "CONTACT_EMAIL_SEND_FAILED") {
      throw error;
    }

    throw new AppError(
      "CONTACT_EMAIL_SEND_FAILED",
      502,
      "Unable to send your message right now."
    );
  }

  if (lastFailure) {
    throw new AppError(
      "CONTACT_EMAIL_SEND_FAILED",
      lastFailure.responseStatus &&
        lastFailure.responseStatus >= 400 &&
        lastFailure.responseStatus < 500
        ? lastFailure.responseStatus
        : 502,
      "Unable to send your message right now."
    );
  }

  throw new AppError(
    "CONTACT_EMAIL_SEND_FAILED",
    502,
    "Unable to send your message right now."
  );
};
