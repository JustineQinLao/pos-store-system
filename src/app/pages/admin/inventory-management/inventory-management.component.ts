import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../../../services/product.service';

interface InventoryItem {
  id: number;
  product_name: string;
  variant_name?: string;
  quantity: number;
  low_stock_threshold: number;
  is_low_stock: boolean;
}

@Component({
  selector: 'app-inventory-management',
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory-management.component.html',
  styleUrl: './inventory-management.component.css'
})
export class InventoryManagementComponent implements OnInit {
  inventory: InventoryItem[] = [];
  filteredInventory: InventoryItem[] = [];
  displayedInventory: InventoryItem[] = [];
  searchTerm = '';
  showLowStockOnly = false;
  loading = false;
  error = '';
  success = '';
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;
  
  showModal = false;
  selectedItem: InventoryItem | null = null;
  adjustmentQuantity = 0;
  adjustmentType: 'add' | 'subtract' | 'set' = 'add';

  constructor(
    private productService: ProductService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadInventory();
  }

  loadInventory(): void {
    this.loading = true;
    this.productService.getInventory().subscribe({
      next: (data: any) => {
        this.inventory = Array.isArray(data) ? data : (data.results || []);
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load inventory';
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.filteredInventory = this.inventory.filter(item => {
      const matchesSearch = !this.searchTerm || 
        item.product_name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        item.variant_name?.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesLowStock = !this.showLowStockOnly || item.is_low_stock;
      
      return matchesSearch && matchesLowStock;
    });
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredInventory.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.displayedInventory = this.filteredInventory.slice(startIndex, endIndex);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onLowStockToggle(): void {
    this.applyFilters();
  }

  openAdjustModal(item: InventoryItem): void {
    this.selectedItem = item;
    this.adjustmentQuantity = 0;
    this.adjustmentType = 'add';
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedItem = null;
    this.adjustmentQuantity = 0;
  }

  adjustInventory(): void {
    if (!this.selectedItem || this.adjustmentQuantity < 0) {
      this.error = 'Invalid adjustment quantity';
      return;
    }

    let newQuantity = this.selectedItem.quantity;
    
    if (this.adjustmentType === 'add') {
      newQuantity += this.adjustmentQuantity;
    } else if (this.adjustmentType === 'subtract') {
      newQuantity = Math.max(0, newQuantity - this.adjustmentQuantity);
    } else {
      newQuantity = this.adjustmentQuantity;
    }

    this.productService.updateInventory(this.selectedItem.id, { quantity: newQuantity }).subscribe({
      next: () => {
        this.success = 'Inventory updated successfully!';
        this.closeModal();
        this.loadInventory();
        setTimeout(() => this.success = '', 3000);
      },
      error: () => {
        this.error = 'Failed to update inventory';
      }
    });
  }

  getStockClass(item: InventoryItem): string {
    if (item.quantity === 0) return 'out-of-stock';
    if (item.is_low_stock) return 'low-stock';
    return 'in-stock';
  }

  goBack(): void {
    this.router.navigate(['/admin']);
  }
}
