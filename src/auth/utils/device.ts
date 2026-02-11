import { UAParser } from 'ua-parser-js';

export function parseDevice(userAgent?: string) {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  return {
    deviceType: result.device.type || 'web',
    os: result.os.name,
    browser: result.browser.name,
  };
}
