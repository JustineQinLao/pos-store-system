import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  cartItemCount: number = 0;
  isMenuOpen: boolean = false;
  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to current user
    this.subscriptions.push(
      this.authService.currentUser$.subscribe(user => {
        this.currentUser = user;
      })
    );

    // Subscribe to cart changes
    this.subscriptions.push(
      this.cartService.cart$.subscribe(cart => {
        this.cartItemCount = cart.items.reduce((total, item) => total + item.quantity, 0);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        this.router.navigate(['/login']);
      }
    });
  }

  isAdmin(): boolean {
    return this.currentUser?.role === 'ADMIN' || this.currentUser?.role === 'SUPER_ADMIN';
  }

  isCashier(): boolean {
    return this.currentUser?.role === 'CASHIER';
  }

  isSuperAdmin(): boolean {
    return this.currentUser?.role === 'SUPER_ADMIN';
  }

  isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  get userRole(): string | undefined {
    return this.currentUser?.role;
  }
}
