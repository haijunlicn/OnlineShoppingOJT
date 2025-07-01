import { PermissionDTO } from './permissionDTO';
import { User } from './User';

export interface RoleDTO {
  id?: number;
  name: string;
  description?: string;
  type?: number;          
  del_fg?: number;      
  createdDate?: string;
  permissions?: PermissionDTO[];
  users?: User[];
}
