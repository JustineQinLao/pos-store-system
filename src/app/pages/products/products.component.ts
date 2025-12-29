import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService, Product, Category, ProductFilters, Variant, AddOn } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { ProductDetailModalComponent } from '../../components/product-detail-modal/product-detail-modal.component';

@Component({
  selector: 'app-products',
  imports: [CommonModule, FormsModule, ProductDetailModalComponent],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css'
})
export class ProductsComponent implements OnInit {
  products: Product[] = [];
  categories: Category[] = [];
  filteredProducts: Product[] = [];
  loading = false;
  error: string | null = null;
  successMessage: string | null = null;
  cartItemCount = 0;
  
  showProductModal = false;
  selectedProduct: Product | null = null;

  // Filters
  filters: ProductFilters = {
    category: undefined,
    min_price: undefined,
    max_price: undefined,
    in_stock: undefined,
    search: ''
  };

  // Pagination
  currentPage = 1;
  itemsPerPage = 12;
  totalPages = 1;
  isLoadingMore = false;
  hasMoreProducts = true;

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
    
    // Subscribe to cart changes
    this.cartService.cart$.subscribe(cart => {
      this.cartItemCount = cart.itemCount;
    });
  }

  loadCategories(): void {
    this.productService.getCategories(true).subscribe({
      next: (categories) => {
        this.categories = Array.isArray(categories) ? categories : [];
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  loadProducts(): void {
    this.loading = true;
    this.error = null;

    const filtersWithPage = {
      ...this.filters,
      page: this.currentPage,
      page_size: this.itemsPerPage
    };

    this.productService.getProducts(filtersWithPage).subscribe({
      next: (response: any) => {
        // Handle paginated API response
        if (response && response.results) {
          this.products = response.results;
          this.filteredProducts = this.products;
          this.totalPages = Math.ceil(response.count / this.itemsPerPage);
          
          // Check if there's a next page
          this.hasMoreProducts = !!response.next;
        } else {
          // Handle non-paginated response
          this.products = Array.isArray(response) ? response : [];
          this.applyPagination();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.error = 'Failed to load products. Please try again.';
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.hasMoreProducts = true;
    this.loadProducts();
  }

  clearFilters(): void {
    this.filters = {
      category: undefined,
      min_price: undefined,
      max_price: undefined,
      in_stock: undefined,
      search: ''
    };
    this.loadProducts();
  }

  applyPagination(): void {
    this.totalPages = Math.ceil(this.products.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.filteredProducts = this.products.slice(startIndex, endIndex);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.applyPagination();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.applyPagination();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.applyPagination();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  loadMoreProducts(): void {
    if (this.isLoadingMore || !this.hasMoreProducts) return;
    
    this.isLoadingMore = true;
    this.currentPage++;
    
    const filtersWithPage = {
      ...this.filters,
      page: this.currentPage,
      page_size: this.itemsPerPage
    };
    
    this.productService.getProducts(filtersWithPage).subscribe({
      next: (response: any) => {
        if (response && response.results) {
          // Append new products to existing list
          this.products = [...this.products, ...response.results];
          this.filteredProducts = [...this.filteredProducts, ...response.results];
          
          // Check if there are more products
          if (!response.next) {
            this.hasMoreProducts = false;
          }
        }
        this.isLoadingMore = false;
      },
      error: (error) => {
        console.error('Error loading more products:', error);
        this.isLoadingMore = false;
      }
    });
  }

  getStockStatus(product: Product): string {
    if (product.current_stock <= 0) {
      return 'Out of Stock';
    } else if (product.current_stock < 10) {
      return 'Low Stock';
    }
    return 'In Stock';
  }

  getStockClass(product: Product): string {
    if (product.current_stock <= 0) {
      return 'out-of-stock';
    } else if (product.current_stock < 10) {
      return 'low-stock';
    }
    return 'in-stock';
  }

  getImageUrl(product: Product): string {
    if (product.image) {
      return product.image.startsWith('http') 
        ? product.image 
        : `http://localhost:8083${product.image}`;
    }
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%23f3f4f6" width="200" height="200"/%3E%3Cpath fill="%239ca3af" d="M100 85c-8.3 0-15 6.7-15 15s6.7 15 15 15 15-6.7 15-15-6.7-15-15-15zm0 25c-5.5 0-10-4.5-10-10s4.5-10 10-10 10 4.5 10 10-4.5 10-10 10z"/%3E%3Cpath fill="%239ca3af" d="M150 60H50c-5.5 0-10 4.5-10 10v60c0 5.5 4.5 10 10 10h100c5.5 0 10-4.5 10-10V70c0-5.5-4.5-10-10-10zm5 70c0 2.8-2.2 5-5 5H50c-2.8 0-5-2.2-5-5V70c0-2.8 2.2-5 5-5h100c2.8 0 5 2.2 5 5v60z"/%3E%3C/svg%3E';
  }

  getCategoryName(product: Product): string {
    if (typeof product.category === 'object') {
      return product.category.name;
    }
    return product.category_name || 'Uncategorized';
  }

  openProductDetail(product: Product): void {
    this.selectedProduct = product;
    this.showProductModal = true;
  }

  closeProductModal(): void {
    this.showProductModal = false;
    this.selectedProduct = null;
  }

  handleAddToCart(data: {product: Product, variant?: Variant, addons: AddOn[], quantity: number}): void {
    this.cartService.addToCart(data.product, data.variant, data.addons, data.quantity);
    this.successMessage = `${data.product.name} added to cart!`;
    setTimeout(() => this.successMessage = null, 3000);
  }

  addToCart(product: Product): void {
    if (product.current_stock <= 0) {
      this.error = 'This product is out of stock';
      setTimeout(() => this.error = null, 3000);
      return;
    }

    this.cartService.addToCart(product, undefined, [], 1);
    this.successMessage = `${product.name} added to cart!`;
    setTimeout(() => this.successMessage = null, 3000);
  }

  viewCart(): void {
    this.router.navigate(['/cart']);
  }
}
