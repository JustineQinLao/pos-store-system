import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService, Category } from '../../../services/product.service';

@Component({
  selector: 'app-category-management',
  imports: [CommonModule, FormsModule],
  templateUrl: './category-management.component.html',
  styleUrl: './category-management.component.css'
})
export class CategoryManagementComponent implements OnInit {
  categories: Category[] = [];
  filteredCategories: Category[] = [];
  displayedCategories: Category[] = [];
  showModal = false;
  isEditMode = false;
  currentCategory: Partial<Category> = {};
  loading = false;
  error = '';
  success = '';
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;

  constructor(
    private productService: ProductService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading = true;
    const params = {
      page: this.currentPage,
      page_size: this.itemsPerPage
    };
    
    this.productService.getCategories(false, params).subscribe({
      next: (response: any) => {
        if (response && response.results) {
          this.displayedCategories = response.results;
          this.totalPages = Math.ceil(response.count / this.itemsPerPage);
        } else if (Array.isArray(response)) {
          this.displayedCategories = response;
          this.totalPages = 1;
        } else {
          this.displayedCategories = [];
          this.totalPages = 1;
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load categories';
        this.loading = false;
      }
    });
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadCategories();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadCategories();
    }
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.currentCategory = { name: '', description: '', is_active: true };
    this.showModal = true;
  }

  openEditModal(category: Category): void {
    this.isEditMode = true;
    this.currentCategory = { ...category };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.currentCategory = {};
    this.error = '';
  }

  saveCategory(): void {
    if (!this.currentCategory.name?.trim()) {
      this.error = 'Category name is required';
      return;
    }

    this.loading = true;
    const operation = this.isEditMode
      ? this.productService.updateCategory(this.currentCategory.id!, this.currentCategory)
      : this.productService.createCategory(this.currentCategory);

    operation.subscribe({
      next: () => {
        this.success = `Category ${this.isEditMode ? 'updated' : 'created'} successfully!`;
        this.closeModal();
        this.loadCategories();
        setTimeout(() => this.success = '', 3000);
      },
      error: () => {
        this.error = 'Failed to save category';
        this.loading = false;
      }
    });
  }

  deleteCategory(category: Category): void {
    if (!confirm(`Delete "${category.name}"?`)) return;

    this.productService.deleteCategory(category.id).subscribe({
      next: () => {
        this.success = 'Category deleted!';
        this.loadCategories();
        setTimeout(() => this.success = '', 3000);
      },
      error: () => {
        this.error = 'Failed to delete category';
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin']);
  }
}
