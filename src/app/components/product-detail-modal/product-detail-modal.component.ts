import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product, Variant, AddOn } from '../../services/product.service';
import { ProductService } from '../../services/product.service';
import { PricingService } from '../../services/pricing.service';

@Component({
  selector: 'app-product-detail-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './product-detail-modal.component.html',
  styleUrl: './product-detail-modal.component.css'
})
export class ProductDetailModalComponent implements OnInit, OnChanges {
  @Input() product!: Product;
  @Input() show: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() addToCart = new EventEmitter<{product: Product, variant?: Variant, addons: AddOn[], quantity: number}>();

  variants: Variant[] = [];
  addons: AddOn[] = [];
  selectedVariant?: Variant;
  selectedAddons: AddOn[] = [];
  quantity: number = 1;
  loading: boolean = false;

  constructor(
    private productService: ProductService,
    private pricingService: PricingService
  ) {}

  ngOnInit(): void {
    if (this.product) {
      this.loadVariantsAndAddons();
    }
  }

  ngOnChanges(): void {
    if (this.product && this.show) {
      this.loadVariantsAndAddons();
      this.resetSelection();
    }
  }

  loadVariantsAndAddons(): void {
    this.loading = true;
    
    this.productService.getVariants(this.product.id).subscribe({
      next: (variants) => {
        this.variants = variants;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading variants:', err);
        this.loading = false;
      }
    });

    this.productService.getAddOns(this.product.id).subscribe({
      next: (addons) => {
        this.addons = addons;
      },
      error: (err) => {
        console.error('Error loading add-ons:', err);
      }
    });
  }

  resetSelection(): void {
    this.selectedVariant = undefined;
    this.selectedAddons = [];
    this.quantity = 1;
  }

  selectVariant(variant: Variant): void {
    this.selectedVariant = variant;
  }

  toggleAddon(addon: AddOn): void {
    const index = this.selectedAddons.findIndex(a => a.id === addon.id);
    if (index > -1) {
      this.selectedAddons.splice(index, 1);
    } else {
      this.selectedAddons.push(addon);
    }
  }

  isAddonSelected(addon: AddOn): boolean {
    return this.selectedAddons.some(a => a.id === addon.id);
  }

  incrementQuantity(): void {
    if (this.quantity < this.product.current_stock) {
      this.quantity++;
    }
  }

  decrementQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  calculateTotalPrice(): number {
    return this.pricingService.calculateItemPrice(
      this.product,
      this.selectedVariant,
      this.selectedAddons,
      this.quantity
    );
  }

  onAddToCart(): void {
    this.addToCart.emit({
      product: this.product,
      variant: this.selectedVariant,
      addons: this.selectedAddons,
      quantity: this.quantity
    });
    this.onClose();
  }

  onClose(): void {
    this.resetSelection();
    this.close.emit();
  }
}
