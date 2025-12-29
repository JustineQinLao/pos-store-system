import { Injectable } from '@angular/core';
import { Product, Variant, AddOn } from './product.service';

export interface PriceBreakdown {
  basePrice: number;
  variantAdjustment: number;
  addonsTotal: number;
  subtotal: number;
  taxAmount: number;
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class PricingService {
  private readonly TAX_RATE = 0.10; // 10% tax rate

  constructor() { }

  calculateItemPrice(
    product: Product, 
    variant?: Variant, 
    addons: AddOn[] = [], 
    quantity: number = 1
  ): number {
    let price = Number(product.base_price) || 0;
    
    if (variant) {
      price = Number(variant.final_price) || 0;
    }
    
    const addonsTotal = addons.reduce((sum, addon) => sum + (Number(addon.price) || 0), 0);
    
    return (price + addonsTotal) * quantity;
  }

  calculatePriceBreakdown(
    product: Product,
    variant?: Variant,
    addons: AddOn[] = [],
    quantity: number = 1
  ): PriceBreakdown {
    const basePrice = Number(product.base_price) || 0;
    const variantAdjustment = variant ? (Number(variant.final_price) || 0) - basePrice : 0;
    const addonsTotal = addons.reduce((sum, addon) => sum + (Number(addon.price) || 0), 0);
    
    const subtotal = (basePrice + variantAdjustment + addonsTotal) * quantity;
    const taxAmount = product.is_taxable ? subtotal * this.TAX_RATE : 0;
    const total = subtotal + taxAmount;

    return {
      basePrice,
      variantAdjustment,
      addonsTotal,
      subtotal,
      taxAmount,
      total
    };
  }

  calculateSubtotal(items: Array<{
    product: Product;
    variant?: Variant;
    addons: AddOn[];
    quantity: number;
  }>): number {
    return items.reduce((sum, item) => {
      return sum + this.calculateItemPrice(item.product, item.variant, item.addons, item.quantity);
    }, 0);
  }

  calculateTax(items: Array<{
    product: Product;
    variant?: Variant;
    addons: AddOn[];
    quantity: number;
  }>): number {
    return items.reduce((sum, item) => {
      if (item.product.is_taxable) {
        const itemPrice = this.calculateItemPrice(item.product, item.variant, item.addons, item.quantity);
        return sum + (itemPrice * this.TAX_RATE);
      }
      return sum;
    }, 0);
  }

  calculateTotal(items: Array<{
    product: Product;
    variant?: Variant;
    addons: AddOn[];
    quantity: number;
  }>): number {
    const subtotal = this.calculateSubtotal(items);
    const tax = this.calculateTax(items);
    return subtotal + tax;
  }

  applyFixedDiscount(amount: number, discount: number): number {
    return Math.max(0, amount - discount);
  }

  applyPercentageDiscount(amount: number, percentage: number): number {
    return amount * (1 - percentage / 100);
  }

  formatPrice(price: number): string {
    return price.toFixed(2);
  }
}
