/**
 * Structured Logging Service
 * In production: Outputs machine-readable JSON logs.
 * In development: Outputs clean, readable console logs.
 */

const isProd = process.env.NODE_ENV === "production";

function log(level: "info" | "warn" | "error" | "debug", message: string, context?: Record<string, any>) {
  if (level === "debug" && !isProd) return; // skip debug messages in non-verbose dev mode

  const timestamp = new Date().toISOString();
  
  if (isProd) {
    // Production format: JSON string
    console.log(
      JSON.stringify({
        timestamp,
        level,
        message,
        ...context,
      })
    );
  } else {
    // Development format: Colorful & readable console printing
    const levelColors = {
      info: "\x1b[36mINFO\x1b[0m",
      warn: "\x1b[33mWARN\x1b[0m",
      error: "\x1b[31mERROR\x1b[0m",
      debug: "\x1b[90mDEBUG\x1b[0m",
    };

    const color = levelColors[level];
    console.log(`[${timestamp}] ${color}: ${message}`);
    if (context && Object.keys(context).length > 0) {
      console.dir(context, { depth: null, colors: true });
    }
  }
}

export const logger = {
  info: (message: string, context?: Record<string, any>) => log("info", message, context),
  warn: (message: string, context?: Record<string, any>) => log("warn", message, context),
  error: (message: string, context?: Record<string, any> | Error) => {
    if (context instanceof Error) {
      log("error", message, { error: context.message, stack: context.stack });
    } else {
      log("error", message, context);
    }
  },
  debug: (message: string, context?: Record<string, any>) => log("debug", message, context),
};

export default logger;
