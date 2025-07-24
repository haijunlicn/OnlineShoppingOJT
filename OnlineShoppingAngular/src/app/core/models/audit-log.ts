export interface AuditLog {
  action: string;
  entityType: string;
  entityId: number;
  changedData: any;
  userId: number;
  username: string;      
  userType: string;
  ipAddress: string;
  userAgent: string;
}
