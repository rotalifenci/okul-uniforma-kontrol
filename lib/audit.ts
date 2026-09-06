import prisma from './prisma';

interface LogActionParams {
  userId?: string | null;
  action: string;
  entityType: 'STUDENT' | 'VIOLATION' | 'USER' | 'SETTING' | 'IMPORT' | 'AUTH';
  entityId?: string | null;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function logAuditEvent({
  userId,
  action,
  entityType,
  entityId,
  oldValue,
  newValue,
  ipAddress,
  userAgent,
}: LogActionParams) {
  try {
    await prisma.auditLog.create({
      data: {
        user_id: userId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        old_value: oldValue ? JSON.stringify(oldValue) : null,
        new_value: newValue ? JSON.stringify(newValue) : null,
        ip_address: ipAddress,
        user_agent: userAgent,
      },
    });
  } catch (error) {
    console.error('Audit log failed:', error);
    // Silent fail so we don't break main operations
  }
}
