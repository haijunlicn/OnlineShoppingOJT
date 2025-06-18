import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { RoleDTO } from "@app/core/models/roleDTO";
import { RoleService } from "@app/core/services/role.service";


@Component({
  selector: 'app-role-list',
  standalone: false,
  templateUrl: './role-list.component.html',
  styleUrls: ['./role-list.component.css']
})
export class RoleListComponent implements OnInit {
  roles: RoleDTO[] = [];

  constructor(private roleService: RoleService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.roleService.getAllRoles().subscribe({
      next: (res) => this.roles = res,
      error: (err) => console.error('Error loading roles', err)
    });
  }

  isFixedRole(id: number): boolean {
    return id === 1 || id === 2;
  }

  isSuperAdmin(): boolean {
    const roleId = Number(localStorage.getItem('role_id'));
    return roleId === 2;
  }

 editRole(role: RoleDTO): void {
  this.router.navigate(['/admin/role-update', role.id]);
}


  deleteRole(id: number): void {
    if (confirm('Are you sure to delete this role?')) {
      this.roleService.deleteRole(id).subscribe({
        next: () => this.loadRoles(),
        error: err => console.error('Delete error', err)
      });
    }
  }
}
