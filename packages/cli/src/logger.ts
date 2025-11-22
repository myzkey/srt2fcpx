import chalk from 'chalk'

let quietMode = false

export function setQuiet(quiet: boolean): void {
  quietMode = quiet
}

export function isQuiet(): boolean {
  return quietMode
}

export const logger = {
  info: (message: string, ...args: unknown[]): void => {
    if (!quietMode) {
      console.log(chalk.blue(message), ...args)
    }
  },

  success: (message: string, ...args: unknown[]): void => {
    if (!quietMode) {
      console.log(chalk.green(message), ...args)
    }
  },

  warn: (message: string, ...args: unknown[]): void => {
    if (!quietMode) {
      console.warn(chalk.yellow(message), ...args)
    }
  },

  error: (message: string, ...args: unknown[]): void => {
    // Error messages should always be shown, even in quiet mode
    console.error(chalk.red(message), ...args)
  },

  debug: (message: string, ...args: unknown[]): void => {
    if (!quietMode) {
      console.log(chalk.gray(message), ...args)
    }
  },
}
