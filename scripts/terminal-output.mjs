const reset = "\u001B[0m"
const styles = {
  cyan: "\u001B[1;36m",
  green: "\u001B[1;32m",
  red: "\u001B[1;31m",
  yellow: "\u001B[33m",
}

function paint(stream, style, message) {
  const enabled = stream.isTTY && !process.env.NO_COLOR && process.env.TERM !== "dumb"
  return enabled ? `${styles[style]}${message}${reset}` : message
}

export function section(message) {
  console.log(`\n${paint(process.stdout, "cyan", `◆ ${message}`)}`)
}

export function info(message) {
  console.log(paint(process.stdout, "cyan", `→ ${message}`))
}

export function success(message) {
  console.log(paint(process.stdout, "green", `✓ ${message}`))
}

export function warning(message) {
  console.log(paint(process.stdout, "yellow", `! ${message}`))
}

export function failure(message) {
  console.error(paint(process.stderr, "red", `✗ ${message}`))
}
