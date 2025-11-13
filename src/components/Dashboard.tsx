import React from 'react';
import { 
  Package, 
  Layers,
  AlertTriangle, 
  AlertCircle,
  Clock,
  BoxIcon
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useInventory } from '../App';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export function Dashboard() {
  const { batches, products } = useInventory();

  // Calculate metrics
  const today = new Date();
  const date30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  const date7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  // Active batches: have quantity > 0
  const activeBatches = batches.filter(batch => batch.quantity > 0);
  
  // Critical batches: expiring in 0-7 days with quantity > 0
  const criticalBatches = activeBatches.filter(batch => {
    const expirationDate = new Date(batch.expirationDate);
    return expirationDate >= today && expirationDate <= date7Days;
  });
  
  // Expiring batches: expiring in 8-30 days with quantity > 0 (not critical yet)
  const expiringBatches = activeBatches.filter(batch => {
    const expirationDate = new Date(batch.expirationDate);
    return expirationDate > date7Days && expirationDate <= date30Days;
  });

  // Stats for cards
  const stats = [
    {
      title: 'Total de Productos',
      value: products.length,
      description: 'Productos registrados',
      icon: Package,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      iconBorder: 'border-green-100',
    },
    {
      title: 'Lotes Activos',
      value: activeBatches.length,
      description: 'Lotes en inventario',
      icon: Layers,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      iconBorder: 'border-blue-100',
    },
    {
      title: 'Por Vencer (30 días)',
      value: expiringBatches.length,
      description: 'Lotes próximos a vencer',
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      iconBorder: 'border-orange-100',
    },
    {
      title: 'Críticos (7 días)',
      value: criticalBatches.length,
      description: 'Requieren atención urgente',
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      iconBorder: 'border-red-100',
    },
  ];

  // Chart data - Inventory by product
  const productData = products.map(product => {
    const productBatches = activeBatches.filter(b => b.productId === product.id);
    const total = productBatches.reduce((sum, b) => sum + b.quantity, 0);
    return {
      name: product.name.length > 15 ? product.name.substring(0, 15) + '...' : product.name,
      cantidad: total,
    };
  }).filter(p => p.cantidad > 0);

  // Category data for pie chart
  const categoryData = products.reduce((acc: any[], product) => {
    const productBatches = activeBatches.filter(b => b.productId === product.id);
    const total = productBatches.reduce((sum, b) => sum + b.quantity, 0);
    
    if (total > 0) {
      const existing = acc.find(item => item.name === product.category);
      if (existing) {
        existing.value += total;
      } else {
        acc.push({ name: product.category, value: total });
      }
    }
    return acc;
  }, []);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="border-gray-200 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-2">{stat.title}</p>
                  <h3 className="text-3xl text-gray-900 mb-1">{stat.value}</h3>
                  <p className="text-xs text-gray-500">{stat.description}</p>
                </div>
                <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center flex-shrink-0 border ${stat.iconBorder}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Expiration Alerts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Expiring Soon (8-30 days) */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                Próximos a Vencer (30 días)
              </CardTitle>
              <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                {expiringBatches.length} lotes
              </Badge>
            </div>
            <CardDescription>Productos que vencen en 8-30 días</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {expiringBatches.length > 0 ? (
                expiringBatches
                  .sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime())
                  .map((batch) => {
                    const daysUntilExpiration = Math.ceil(
                      (new Date(batch.expirationDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                    );
                    return (
                      <div key={batch.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100">
                        <div className="flex-1">
                          <p className="text-gray-900">{batch.productName}</p>
                          <p className="text-sm text-gray-600">Lote: {batch.batchNumber}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                            {daysUntilExpiration} días
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">{batch.quantity} {batch.productName.includes('kg') || batch.productName.includes('L') ? 'unidades' : 'unidades'}</p>
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No hay lotes próximos a vencer en este rango</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Critical (0-7 days) */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                Críticos (7 días)
              </CardTitle>
              <Badge variant="destructive">{criticalBatches.length} lotes</Badge>
            </div>
            <CardDescription>Requieren atención inmediata (7 días o menos)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {criticalBatches.length > 0 ? (
                criticalBatches
                  .sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime())
                  .map((batch) => {
                    const daysUntilExpiration = Math.ceil(
                      (new Date(batch.expirationDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                    );
                    return (
                      <div key={batch.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                        <div className="flex-1">
                          <p className="text-gray-900">{batch.productName}</p>
                          <p className="text-sm text-gray-600">Lote: {batch.batchNumber}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="destructive">
                            {daysUntilExpiration} {daysUntilExpiration === 1 ? 'día' : 'días'}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">{batch.quantity} unidades</p>
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No hay lotes críticos</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {productData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Inventario por Producto</CardTitle>
              <CardDescription>Cantidades actuales en stock</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={productData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="cantidad" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pie Chart */}
          {categoryData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Distribución por Categoría</CardTitle>
                <CardDescription>Inventario dividido por tipo de producto</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Lotes Recientes</CardTitle>
          <CardDescription>Últimos lotes añadidos al inventario</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activeBatches
              .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime())
              .slice(0, 5)
              .map((batch) => (
                <div key={batch.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                  <div className="flex-1">
                    <p className="text-gray-900">{batch.productName}</p>
                    <p className="text-sm text-gray-600">Lote: {batch.batchNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-900">{batch.quantity} unidades</p>
                    <p className="text-xs text-gray-500">
                      {new Date(batch.entryDate).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>
              ))}
            {activeBatches.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <BoxIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No hay lotes en el inventario</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
