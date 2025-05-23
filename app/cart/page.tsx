'use client';

import { CartProvider } from '../providers/cart-provider';
import CartView from './components/cart-view';

export default function CartPage() {
  return (
    <CartProvider>
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-6">Shopping Cart</h1>
        <CartView />
      </div>
    </CartProvider>
  );
}
