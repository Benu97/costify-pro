'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LogoutButton from '@/app/components/LogoutButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  ShoppingCart, 
  Utensils, 
  Wheat,
  TrendingUp,
  Clock,
  User
} from 'lucide-react';

interface DashboardContentProps {
  userEmail: string;
  stats: {
    ingredients: number;
    meals: number;
    packets: number;
  };
}

export default function DashboardContent({ userEmail, stats }: DashboardContentProps) {
  const router = useRouter();

  const navigationCards = [
    {
      title: 'Ingredients',
      description: 'Manage your raw materials and their costs',
      icon: Wheat,
      href: '/dashboard/ingredients',
      count: stats.ingredients,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950/20'
    },
    {
      title: 'Meals',
      description: 'Create and manage your dishes',
      icon: Utensils,
      href: '/dashboard/meals',
      count: stats.meals,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20'
    },
    {
      title: 'Packets',
      description: 'Bundle meals into catering packages',
      icon: Package,
      href: '/dashboard/packets',
      count: stats.packets,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20'
    },
    {
      title: 'Shopping Cart',
      description: 'Create quotes with custom markup',
      icon: ShoppingCart,
      href: '/cart',
      count: null,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-950/20'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Costify Pro</h1>
              <p className="text-sm text-muted-foreground">Food Costing & Catering Management</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {userEmail}
                </p>
                <p className="text-xs text-muted-foreground">Administrator</p>
              </div>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back!</h2>
          <p className="text-muted-foreground">
            Manage your ingredients, create meals, and generate quotes with dynamic pricing.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.ingredients + stats.meals + stats.packets}
              </div>
              <p className="text-xs text-muted-foreground">
                Across all categories
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Ingredients</CardTitle>
              <Wheat className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.ingredients}</div>
              <p className="text-xs text-muted-foreground">
                Raw materials in system
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Meals</CardTitle>
              <Utensils className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.meals}</div>
              <p className="text-xs text-muted-foreground">
                Dishes configured
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Catering Packets</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.packets}</div>
              <p className="text-xs text-muted-foreground">
                Bundled packages
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {navigationCards.map((card) => (
            <Link key={card.href} href={card.href}>
              <Card className="h-full transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${card.bgColor} flex items-center justify-center mb-4`}>
                    <card.icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{card.title}</CardTitle>
                    {card.count !== null && (
                      <span className="text-2xl font-bold text-muted-foreground">
                        {card.count}
                      </span>
                    )}
                  </div>
                  <CardDescription>{card.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks to get you started</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push('/dashboard/ingredients')}
              >
                Add New Ingredient
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push('/dashboard/meals')}
              >
                Create New Meal
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push('/dashboard/packets')}
              >
                Build New Packet
              </Button>
              <Button 
                size="sm"
                onClick={() => router.push('/cart')}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Go to Cart
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity (placeholder for future enhancement) */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest updates and changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Activity tracking coming soon</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
} 