'use client';

import { useCart } from '@/app/providers/cart-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CartSummary() {
  const { cartSummary } = useCart();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cart Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Netto Total:</span>
            <span className="font-medium">€{cartSummary.nettoTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Average Markup:</span>
            <span className="font-medium">{cartSummary.avgMarkupPct.toFixed(2)}%</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="text-sm font-semibold">Brutto Total:</span>
            <span className="font-bold text-lg">€{cartSummary.bruttoTotal.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
