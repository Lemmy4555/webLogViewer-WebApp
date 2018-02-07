import { BarrelComponent } from './barrel.component';

export const routes = [
  { path: '', 
    component: BarrelComponent,
    children: [
    { path: 'child-barrel', loadChildren: './+child-barrel#ChildBarrelModule' }
  ]},
];
