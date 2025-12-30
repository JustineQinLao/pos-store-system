import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ProductService, Product, Category } from '../../../services/product.service';

@Component({
  selector: 'app-product-management',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './product-management.component.html',
  styleUrl: './product-management.component.css'
})
export class ProductManagementComponent implements OnInit {
  products: Product[] = [];
  categories: Category[] = [];
  filteredProducts: Product[] = [];
  displayedProducts: Product[] = [];
  
  searchTerm: string = '';
  selectedCategory: string = '';
  showInactive: boolean = false;
  
  showModal: boolean = false;
  isEditMode: boolean = false;
  currentProduct: Partial<Product> = {};
  selectedImageFile: File | null = null;
  imagePreview: string | null = null;
  
  loading: boolean = false;
  error: string = '';
  success: string = '';
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;
  isLoadingMore: boolean = false;

  constructor(
    private productService: ProductService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProductsWithFilters();
    this.loadCategories();
  }

  loadProducts(page: number = 1): void {
    this.loading = true;
    this.error = '';
    
    this.productService.getProducts({ page }).subscribe({
      next: (response: any) => {
        // Handle paginated API response
        if (response && response.results) {
          this.products = response.results;
          this.totalPages = Math.ceil(response.count / this.itemsPerPage);
        } else {
          this.products = response;
          this.totalPages = 1;
        }
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load products';
        console.error('Error loading products:', err);
        this.loading = false;
      }
    });
  }

  loadCategories(): void {
    this.productService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (err) => {
        console.error('Error loading categories:', err);
      }
    });
  }

  applyFilters(): void {
    // For server-side pagination, just display the products as-is
    this.filteredProducts = this.products;
    this.displayedProducts = this.products;
  }

  updatePagination(): void {
    // Server-side pagination - no need to slice
    this.displayedProducts = this.products;
  }

  loadMoreProducts(): void {
    if (this.isLoadingMore || this.currentPage >= this.totalPages) return;
    
    this.isLoadingMore = true;
    setTimeout(() => {
      this.currentPage++;
      const startIndex = (this.currentPage - 1) * this.itemsPerPage;
      const endIndex = startIndex + this.itemsPerPage;
      const moreProducts = this.filteredProducts.slice(startIndex, endIndex);
      this.displayedProducts = [...this.displayedProducts, ...moreProducts];
      this.isLoadingMore = false;
    }, 300);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadProductsWithFilters();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadProductsWithFilters();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.loadProductsWithFilters();
  }

  onCategoryChange(): void {
    this.currentPage = 1;
    this.loadProductsWithFilters();
  }

  onShowInactiveChange(): void {
    this.currentPage = 1;
    this.loadProductsWithFilters();
  }

  loadProductsWithFilters(): void {
    const filters: any = { page: this.currentPage };
    
    if (this.searchTerm) {
      filters.search = this.searchTerm;
    }
    
    if (this.selectedCategory) {
      filters.category = this.selectedCategory;
    }
    
    // Note: showInactive filter needs backend support
    // For now, we'll filter client-side after loading
    
    this.loading = true;
    this.productService.getProducts(filters).subscribe({
      next: (response: any) => {
        if (response && response.results) {
          let products = response.results;
          
          // Client-side filter for inactive products if needed
          if (!this.showInactive) {
            products = products.filter((p: any) => p.is_active);
          }
          
          this.products = products;
          this.displayedProducts = products;
          this.totalPages = Math.ceil(response.count / this.itemsPerPage);
        } else {
          this.products = response;
          this.displayedProducts = response;
          this.totalPages = 1;
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load products';
        console.error('Error loading products:', err);
        this.loading = false;
      }
    });
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.currentProduct = {
      name: '',
      description: '',
      base_price: 0,
      sku: '',
      is_taxable: true,
      is_active: true
    };
    this.selectedImageFile = null;
    this.imagePreview = null;
    this.showModal = true;
  }

  openEditModal(product: Product): void {
    this.isEditMode = true;
    this.currentProduct = { ...product };
    this.selectedImageFile = null;
    this.imagePreview = product.image || null;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.currentProduct = {};
    this.selectedImageFile = null;
    this.imagePreview = null;
    this.error = '';
  }

  onImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        this.error = 'Image size must be less than 5MB';
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.error = 'Please select a valid image file';
        return;
      }
      
      this.selectedImageFile = file;
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(): void {
    this.selectedImageFile = null;
    this.imagePreview = null;
    this.currentProduct.image = undefined;
  }

  saveProduct(): void {
    if (!this.validateProduct()) {
      return;
    }

    this.loading = true;
    this.error = '';

    const categoryId = typeof this.currentProduct.category === 'number' 
      ? this.currentProduct.category 
      : this.currentProduct.category?.id;
    
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('name', this.currentProduct.name || '');
    formData.append('description', this.currentProduct.description || '');
    formData.append('category', categoryId?.toString() || '');
    formData.append('base_price', this.currentProduct.base_price?.toString() || '0');
    formData.append('sku', this.currentProduct.sku || '');
    formData.append('is_taxable', this.currentProduct.is_taxable ? 'true' : 'false');
    formData.append('is_active', this.currentProduct.is_active ? 'true' : 'false');
    
    if (this.selectedImageFile) {
      formData.append('image', this.selectedImageFile);
    }

    const operation = this.isEditMode
      ? this.productService.updateProductWithImage(this.currentProduct.id!, formData)
      : this.productService.createProductWithImage(formData);

    operation.subscribe({
      next: () => {
        this.success = `Product ${this.isEditMode ? 'updated' : 'created'} successfully!`;
        this.closeModal();
        this.loadProducts();
        setTimeout(() => this.success = '', 3000);
      },
      error: (err: any) => {
        this.error = `Failed to ${this.isEditMode ? 'update' : 'create'} product`;
        console.error('Error saving product:', err);
        this.loading = false;
      }
    });
  }

  deleteProduct(product: Product): void {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) {
      return;
    }

    this.loading = true;
    this.productService.deleteProduct(product.id).subscribe({
      next: () => {
        this.success = 'Product deleted successfully!';
        this.loadProducts();
        setTimeout(() => this.success = '', 3000);
      },
      error: (err: any) => {
        this.error = 'Failed to delete product';
        console.error('Error deleting product:', err);
        this.loading = false;
      }
    });
  }

  toggleProductStatus(product: Product): void {
    const categoryId = typeof product.category === 'number' 
      ? product.category 
      : product.category?.id;
    
    const updatedProduct = {
      ...product,
      is_active: !product.is_active,
      category: categoryId
    };

    this.productService.updateProduct(product.id, updatedProduct).subscribe({
      next: () => {
        product.is_active = !product.is_active;
        this.success = `Product ${product.is_active ? 'activated' : 'deactivated'} successfully!`;
        setTimeout(() => this.success = '', 3000);
      },
      error: (err) => {
        this.error = 'Failed to update product status';
        console.error('Error updating product status:', err);
      }
    });
  }

  validateProduct(): boolean {
    if (!this.currentProduct.name?.trim()) {
      this.error = 'Product name is required';
      return false;
    }
    if (!this.currentProduct.sku?.trim()) {
      this.error = 'SKU is required';
      return false;
    }
    if (!this.currentProduct.category) {
      this.error = 'Category is required';
      return false;
    }
    if (this.currentProduct.base_price === undefined || this.currentProduct.base_price < 0) {
      this.error = 'Valid price is required';
      return false;
    }
    return true;
  }

  goBack(): void {
    this.router.navigate(['/admin']);
  }
}
