import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductService } from '../../../services/product.service';

interface DashboardStats {
  totalProducts: number;
  totalCategories: number;
  lowStockItems: number;
  totalTransactions: number;
  todayRevenue: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  stats: DashboardStats = {
    totalProducts: 0,
    totalCategories: 0,
    lowStockItems: 0,
    totalTransactions: 0,
    todayRevenue: 0
  };
  
  loading = false;
  error = '';

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.loadDashboardStats();
  }

  loadDashboardStats(): void {
    this.loading = true;
    this.error = '';

    // Load products count
    this.productService.getProducts().subscribe({
      next: (response: any) => {
        if (response && response.count) {
          this.stats.totalProducts = response.count;
        } else if (Array.isArray(response)) {
          this.stats.totalProducts = response.length;
        }
      },
      error: (err) => {
        console.error('Failed to load products:', err);
        if (err.status === 401) {
          this.error = 'Authentication required. Please log in again.';
        } else {
          this.error = 'Failed to load dashboard statistics';
        }
      }
    });

    // Load categories count
    this.productService.getCategories().subscribe({
      next: (categories) => {
        this.stats.totalCategories = categories.length;
      },
      error: (err) => {
        console.error('Failed to load categories:', err);
      }
    });

    // Load inventory for low stock count
    this.productService.getInventory().subscribe({
      next: (response: any) => {
        const inventory = response.results || response;
        if (Array.isArray(inventory)) {
          this.stats.lowStockItems = inventory.filter((item: any) => item.is_low_stock).length;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load inventory:', err);
        this.loading = false;
      }
    });

    // Load transactions (requires authentication)
    this.productService.getTransactions().subscribe({
      next: (response: any) => {
        const transactions = response.results || response;
        if (Array.isArray(transactions)) {
          this.stats.totalTransactions = transactions.length;
          
          // Calculate today's revenue
          const today = new Date().toISOString().split('T')[0];
          this.stats.todayRevenue = transactions
            .filter((t: any) => t.created_at.startsWith(today) && t.status === 'COMPLETED')
            .reduce((sum: number, t: any) => sum + parseFloat(t.total), 0);
        }
      },
      error: (err) => {
        console.error('Failed to load transactions:', err);
        if (err.status === 401) {
          console.warn('Not authenticated - transactions unavailable');
          // Don't show error for transactions if user just needs to log in
        }
      }
    });
  }
}
