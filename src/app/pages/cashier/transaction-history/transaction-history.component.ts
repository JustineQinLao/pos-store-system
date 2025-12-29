import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../services/product.service';

@Component({
  selector: 'app-transaction-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transaction-history.component.html',
  styleUrl: './transaction-history.component.css'
})
export class TransactionHistoryComponent implements OnInit {
  transactions: any[] = [];
  filteredTransactions: any[] = [];
  loading = false;
  error = '';
  
  // Filters
  searchTerm = '';
  statusFilter = '';
  dateFilter = '';
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 20;
  totalPages = 1;

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.loading = true;
    this.error = '';
    
    this.productService.getTransactions().subscribe({
      next: (response: any) => {
        if (response && response.results) {
          this.transactions = response.results;
        } else if (Array.isArray(response)) {
          this.transactions = response;
        } else {
          this.transactions = [];
        }
        this.applyFilters();
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
    this.filteredTransactions = this.transactions.filter(transaction => {
      const matchesSearch = !this.searchTerm || 
        transaction.transaction_number.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesStatus = !this.statusFilter || 
        transaction.status === this.statusFilter;
      
      const matchesDate = !this.dateFilter || 
        transaction.created_at.startsWith(this.dateFilter);
      
      return matchesSearch && matchesStatus && matchesDate;
    });
    
    this.totalPages = Math.ceil(this.filteredTransactions.length / this.itemsPerPage);
  }

  getDisplayedTransactions(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredTransactions.slice(startIndex, endIndex);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  viewTransactionDetails(transaction: any): void {
    // TODO: Implement modal or detail view
    console.log('Transaction details:', transaction);
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
}
