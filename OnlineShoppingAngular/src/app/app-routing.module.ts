import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/customer/auth/customer-auth/customer-auth.module').then(m => m.CustomerAuthModule),
  },
  {
    path: 'admin-auth',
    loadChildren: () =>
      import('./features/admin/admin-auth/admin-auth.module').then(m => m.AdminAuthModule),
  },
  // other routes ...
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
