import { DetailComponent } from './detail.component';

export const routes = [
  { path: '', 
    component: DetailComponent,
    children: [
      { path: 'child-detail', loadChildren: './+child-detail#ChildDetailModule' }
    ]
  },
];
