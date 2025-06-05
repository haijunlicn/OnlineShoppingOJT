import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';


const routes: Routes = [
  {
    path: 'customer',
    loadChildren: () =>
      import('./features/customer/customer.module').then(m => m.CustomerModule),
  },
  {
    path: 'admin',
    loadChildren: () =>
      import('./features/admin/admin.module').then(m => m.AdminModule),
  },
  {
    path: '',
    redirectTo: 'customer/home',
    pathMatch: 'full',
  },
  // {
  //   path: '',
  //   component: HelloComponent,
  // },
  // {
  //   path: '**',
  //   redirectTo: 'customer/home',
  // }

];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  
  exports: [RouterModule]
})
export class AppRoutingModule { }
