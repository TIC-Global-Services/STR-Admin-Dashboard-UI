import { SetMetadata } from '@nestjs/common';

export const AUDIT_KEY = 'audit';

export function Audit(action: {
  action: string;
  entity: string;
}) {
  return SetMetadata(AUDIT_KEY, action);
}
