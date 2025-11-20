let quietMode = false

export function setQuiet(quiet: boolean): void {
  quietMode = quiet
}

export function isQuiet(): boolean {
  return quietMode
}

export const logger = {
  info: (_message: string, ..._args: unknown[]): void => {
    if (!quietMode) {
    }
  },

  success: (_message: string, ..._args: unknown[]): void => {
    if (!quietMode) {
    }
  },

  warn: (_message: string, ..._args: unknown[]): void => {
    if (!quietMode) {
    }
  },

  error: (_message: string, ..._args: unknown[]): void => {},

  debug: (_message: string, ..._args: unknown[]): void => {
    if (!quietMode) {
    }
  },
}
