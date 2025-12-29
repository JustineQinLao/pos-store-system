import { Routes } from '@angular/router';
import { ProductsComponent } from './pages/products/products.component';
import { ProductManagementComponent } from './pages/admin/product-management/product-management.component';
import { CategoryManagementComponent } from './pages/admin/category-management/category-management.component';
import { InventoryManagementComponent } from './pages/admin/inventory-management/inventory-management.component';
import { AdminDashboardComponent } from './pages/admin/dashboard/dashboard.component';
import { AdminOrdersComponent } from './pages/admin/orders/orders.component';
import { CartComponent } from './pages/cart/cart.component';
import { CashierComponent } from './pages/cashier/cashier.component';
import { TransactionHistoryComponent } from './pages/cashier/transaction-history/transaction-history.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/products', pathMatch: 'full' },
  { path: 'home', redirectTo: '/products', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'products', component: ProductsComponent },
  { path: 'cart', component: CartComponent },
  { 
    path: 'admin', 
    redirectTo: '/admin/dashboard', 
    pathMatch: 'full' 
  },
  { 
    path: 'admin/dashboard', 
    component: AdminDashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['SUPER_ADMIN', 'ADMIN'] }
  },
  { 
    path: 'admin/products', 
    component: ProductManagementComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['SUPER_ADMIN', 'ADMIN'] }
  },
  { 
    path: 'admin/categories', 
    component: CategoryManagementComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['SUPER_ADMIN', 'ADMIN'] }
  },
  { 
    path: 'admin/inventory', 
    component: InventoryManagementComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['SUPER_ADMIN', 'ADMIN'] }
  },
  { 
    path: 'admin/orders', 
    component: AdminOrdersComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['SUPER_ADMIN', 'ADMIN'] }
  },
  { 
    path: 'cashier', 
    component: CashierComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['CASHIER'] }
  },
  { 
    path: 'cashier/transactions', 
    component: TransactionHistoryComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['CASHIER'] }
  }
];
