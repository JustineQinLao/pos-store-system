import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../services/product.service';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css'
})
export class AdminOrdersComponent implements OnInit {
  transactions: any[] = [];
  filteredTransactions: any[] = [];
  loading = false;
  error = '';
  
  // Filters
  searchTerm = '';
  statusFilter = '';
  cashierFilter = '';
  dateFilter = '';
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 20;
  totalPages = 1;
  
  // Selected transaction for details
  selectedTransaction: any = null;
  showDetailsModal = false;

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.loading = true;
    this.error = '';
    
    const params: any = {
      page: this.currentPage,
      page_size: this.itemsPerPage
    };
    
    if (this.searchTerm) params.search = this.searchTerm;
    if (this.statusFilter) params.status = this.statusFilter;
    if (this.cashierFilter) params.cashier = this.cashierFilter;
    if (this.dateFilter) params.date = this.dateFilter;
    
    this.productService.getTransactions(params).subscribe({
      next: (response: any) => {
        if (response && response.results) {
          this.filteredTransactions = response.results;
          this.totalPages = Math.ceil(response.count / this.itemsPerPage);
        } else if (Array.isArray(response)) {
          this.filteredTransactions = response;
          this.totalPages = 1;
        } else {
          this.filteredTransactions = [];
          this.totalPages = 1;
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load transactions';
        console.error('Transaction load error:', err);
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadTransactions();
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadTransactions();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadTransactions();
    }
  }

  viewTransactionDetails(transaction: any): void {
    this.selectedTransaction = transaction;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedTransaction = null;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'COMPLETED': return 'status-completed';
      case 'PENDING': return 'status-pending';
      case 'CANCELLED': return 'status-cancelled';
      case 'REFUNDED': return 'status-refunded';
      default: return '';
    }
  }

  getTotalItems(cartItems: any[]): number {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }

  getAddonsText(addons: any[]): string {
    if (!addons || addons.length === 0) return '-';
    return addons.map(a => a.name).join(', ');
  }

  exportToCSV(): void {
    const headers = ['Transaction #', 'Date', 'Cashier', 'Items', 'Subtotal', 'Tax', 'Total', 'Paid', 'Change', 'Status'];
    const rows = this.filteredTransactions.map(t => [
      t.transaction_number,
      new Date(t.created_at).toLocaleString(),
      t.cashier_name || 'N/A',
      this.getTotalItems(t.cart_items),
      t.subtotal,
      t.tax,
      t.total,
      t.amount_paid,
      t.change_given,
      t.status
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
