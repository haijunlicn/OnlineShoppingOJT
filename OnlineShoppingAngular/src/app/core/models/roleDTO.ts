import { PermissionDTO } from './permissionDTO';

export interface RoleDTO {
  id?: number;
  name: string;
  description?: string;
  type?: number;          
  del_fg?: number;      
  createdDate?: string;
  permissions?: PermissionDTO[];
}
