import React, { useState } from 'react';
import { FileText, Download, Filter, Calendar, Package } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { useInventory } from '../App';
import { toast } from 'sonner@2.0.3';

export function Reports() {
  const { batches, products } = useInventory();
  const [filters, setFilters] = useState({
    productId: 'all',
    startDate: '',
    endDate: '',
    batchNumber: '',
  });

  const filteredBatches = batches.filter(batch => {
    if (filters.productId !== 'all' && batch.productId !== filters.productId) {
      return false;
    }
    
    if (filters.batchNumber && !batch.batchNumber.toLowerCase().includes(filters.batchNumber.toLowerCase())) {
      return false;
    }

    if (filters.startDate) {
      const batchDate = new Date(batch.entryDate);
      const filterDate = new Date(filters.startDate);
      if (batchDate < filterDate) return false;
    }

    if (filters.endDate) {
      const batchDate = new Date(batch.entryDate);
      const filterDate = new Date(filters.endDate);
      if (batchDate > filterDate) return false;
    }

    return true;
  });

  const handleExport = () => {
    // Create CSV content
    const headers = ['Producto', 'Lote', 'Cantidad', 'Fecha Entrada', 'Fecha Vencimiento', 'Estado'];
    const rows = filteredBatches.map(batch => {
      const daysUntilExpiration = getDaysUntilExpiration(batch.expirationDate);
      const status = daysUntilExpiration <= 7 ? 'Crítico' : daysUntilExpiration <= 30 ? 'Atención' : 'Normal';
      
      return [
        batch.productName,
        batch.batchNumber,
        batch.quantity,
        new Date(batch.entryDate).toLocaleDateString('es-ES'),
        new Date(batch.expirationDate).toLocaleDateString('es-ES'),
        status
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_inventario_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Reporte exportado correctamente');
  };

  const getDaysUntilExpiration = (expirationDate: string) => {
    const today = new Date();
    const expDate = new Date(expirationDate);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpirationBadge = (days: number) => {
    if (days <= 7) return <Badge className="bg-red-500">Crítico</Badge>;
    if (days <= 30) return <Badge className="bg-orange-500">Atención</Badge>;
    return <Badge className="bg-green-500">Normal</Badge>;
  };

  // Calculate summary
  const totalValue = filteredBatches.reduce((sum, batch) => sum + batch.quantity, 0);
  const uniqueProducts = new Set(filteredBatches.map(b => b.productId)).size;
  const criticalBatches = filteredBatches.filter(b => getDaysUntilExpiration(b.expirationDate) <= 7).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-gray-900">Reportes de Inventario</h1>
            <p className="text-sm text-gray-600">Genere y exporte reportes personalizados</p>
          </div>
        </div>
        <Button
          onClick={handleExport}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          disabled={filteredBatches.length === 0}
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total de Lotes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-purple-700">{filteredBatches.length}</div>
            <p className="text-xs text-gray-500 mt-1">En el período seleccionado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Productos Únicos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-purple-700">{uniqueProducts}</div>
            <p className="text-xs text-gray-500 mt-1">Diferentes productos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Lotes Críticos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-red-700">{criticalBatches}</div>
            <p className="text-xs text-gray-500 mt-1">Vencen en 7 días o menos</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros de Búsqueda
          </CardTitle>
          <CardDescription>Personalice el reporte según sus necesidades</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filterProduct">Producto</Label>
              <Select
                value={filters.productId}
                onValueChange={(value) => setFilters({ ...filters, productId: value })}
              >
                <SelectTrigger id="filterProduct">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los productos</SelectItem>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="batchNumber">Número de Lote</Label>
              <Input
                id="batchNumber"
                placeholder="L001"
                value={filters.batchNumber}
                onChange={(e) => setFilters({ ...filters, batchNumber: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Fecha Inicio</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Fecha Fin</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setFilters({ productId: 'all', startDate: '', endDate: '', batchNumber: '' })}
            >
              Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Resultados del Reporte</CardTitle>
          <CardDescription>
            {filteredBatches.length} lote(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Fecha Entrada</TableHead>
                  <TableHead>Fecha Vencimiento</TableHead>
                  <TableHead>Días para Vencer</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBatches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                      No se encontraron lotes con los filtros seleccionados
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBatches
                    .sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime())
                    .map((batch) => {
                      const daysUntilExpiration = getDaysUntilExpiration(batch.expirationDate);
                      
                      return (
                        <TableRow key={batch.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-gray-400" />
                              {batch.productName}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono">{batch.batchNumber}</TableCell>
                          <TableCell>{batch.quantity}</TableCell>
                          <TableCell>
                            {new Date(batch.entryDate).toLocaleDateString('es-ES')}
                          </TableCell>
                          <TableCell>
                            {new Date(batch.expirationDate).toLocaleDateString('es-ES')}
                          </TableCell>
                          <TableCell>
                            <span className={
                              daysUntilExpiration <= 7 ? 'text-red-600' :
                              daysUntilExpiration <= 30 ? 'text-orange-600' :
                              'text-green-600'
                            }>
                              {daysUntilExpiration} días
                            </span>
                          </TableCell>
                          <TableCell>
                            {getExpirationBadge(daysUntilExpiration)}
                          </TableCell>
                        </TableRow>
                      );
                    })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
