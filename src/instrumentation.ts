import { logs, SeverityNumber } from "@opentelemetry/api-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { BatchLogRecordProcessor, LoggerProvider } from "@opentelemetry/sdk-logs";

const projectToken = process.env["NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN"];
const apiHost = process.env["NEXT_PUBLIC_POSTHOG_HOST"];

let loggerProvider: LoggerProvider | null = null;

if (!projectToken || !apiHost) {
  const missingVariable = projectToken
    ? "NEXT_PUBLIC_POSTHOG_HOST"
    : "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN";

  if (process.env.NODE_ENV !== "production") {
    throw new Error(
      `${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`,
    );
  }
} else {
  loggerProvider = new LoggerProvider({
    resource: resourceFromAttributes({ "service.name": "flowboc" }),
    processors: [
      new BatchLogRecordProcessor({
        exporter: new OTLPLogExporter({
          url: `${apiHost.replace(/\/$/, "")}/i/v1/logs`,
          headers: {
            Authorization: `Bearer ${projectToken}`,
            "Content-Type": "application/json",
          },
        }),
      }),
    ],
  });
}

export { loggerProvider, SeverityNumber };

export function getPostHogLogger() {
  return loggerProvider?.getLogger("flowboc.posthog") ?? null;
}

export function register() {
  if (process.env["NEXT_RUNTIME"] === "nodejs" && loggerProvider) {
    logs.setGlobalLoggerProvider(loggerProvider);
  }
}
