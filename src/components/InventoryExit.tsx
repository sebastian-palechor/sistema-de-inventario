import React, { useState } from 'react';
import { ArrowUpFromLine, Package, AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { useInventory } from '../App';
import { toast } from 'sonner@2.0.3';

export function InventoryExit() {
  const { products, batches, removeBatchQuantity, getOldestBatch } = useInventory();
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantityToDispatch, setQuantityToDispatch] = useState('');
  const [dispatchSuccess, setDispatchSuccess] = useState(false);

  const suggestedBatch = selectedProductId ? getOldestBatch(selectedProductId) : null;
  const selectedProduct = products.find(p => p.id === selectedProductId);

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProductId || !quantityToDispatch || !suggestedBatch) {
      toast.error('Por favor, complete todos los campos');
      return;
    }

    const quantity = parseInt(quantityToDispatch);
    
    if (quantity > suggestedBatch.quantity) {
      toast.error(`La cantidad a despachar (${quantity}) supera la disponible en el lote (${suggestedBatch.quantity})`);
      return;
    }

    removeBatchQuantity(suggestedBatch.id, quantity);
    
    toast.success('Despacho registrado correctamente', {
      description: `${quantity} ${selectedProduct?.unit} despachados del lote ${suggestedBatch.batchNumber}`,
    });

    setDispatchSuccess(true);
    setQuantityToDispatch('');
    
    setTimeout(() => {
      setDispatchSuccess(false);
    }, 3000);
  };

  const getDaysUntilExpiration = (expirationDate: string) => {
    const today = new Date();
    const expDate = new Date(expirationDate);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpirationStatus = (days: number) => {
    if (days <= 7) return { color: 'bg-red-500', text: 'Crítico', textColor: 'text-red-600' };
    if (days <= 15) return { color: 'bg-orange-500', text: 'Urgente', textColor: 'text-orange-600' };
    if (days <= 30) return { color: 'bg-yellow-500', text: 'Atención', textColor: 'text-yellow-600' };
    return { color: 'bg-green-500', text: 'Normal', textColor: 'text-green-600' };
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
          <ArrowUpFromLine className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-gray-900">Registrar Salida de Inventario</h1>
          <p className="text-sm text-gray-600">Despache productos usando el lote más antiguo (FIFO)</p>
        </div>
      </div>

      {/* Success Alert */}
      {dispatchSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-900">¡Despacho Exitoso!</AlertTitle>
          <AlertDescription className="text-green-700">
            El inventario se ha actualizado correctamente
          </AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Formulario de Salida</CardTitle>
          <CardDescription>
            Seleccione el producto y el sistema sugerirá automáticamente el lote más antiguo (FIFO)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleDispatch} className="space-y-6">
            {/* Product Selection */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="product">Producto a Despachar *</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Seleccione el producto que desea despachar. El sistema mostrará el lote más antiguo disponible.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select
                value={selectedProductId}
                onValueChange={(value) => {
                  setSelectedProductId(value);
                  setQuantityToDispatch('');
                  setDispatchSuccess(false);
                }}
              >
                <SelectTrigger id="product">
                  <SelectValue placeholder="Seleccione un producto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => {
                    const productBatches = batches.filter(b => b.productId === product.id && b.quantity > 0);
                    const totalQuantity = productBatches.reduce((sum, b) => sum + b.quantity, 0);
                    
                    return (
                      <SelectItem key={product.id} value={product.id} disabled={totalQuantity === 0}>
                        {product.name} - {totalQuantity > 0 ? `${totalQuantity} ${product.unit} disponibles` : 'Sin stock'}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Suggested Batch Card */}
            {suggestedBatch && selectedProduct && (
              <div className="space-y-4">
                <Alert className="border-blue-200 bg-blue-50">
                  <Package className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-900">Lote Sugerido (FIFO)</AlertTitle>
                  <AlertDescription className="text-blue-700">
                    El siguiente lote es el más antiguo y debe despacharse primero
                  </AlertDescription>
                </Alert>

                <Card className="border-2 border-blue-200">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-lg flex items-center justify-center text-white">
                              <Package className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="text-gray-900">Lote {suggestedBatch.batchNumber}</p>
                              <p className="text-sm text-gray-600">{suggestedBatch.productName}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 pt-2">
                            <div>
                              <p className="text-xs text-gray-500">Cantidad Disponible</p>
                              <p className="text-gray-900">
                                {suggestedBatch.quantity} {selectedProduct.unit}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Fecha de Entrada</p>
                              <p className="text-gray-900">
                                {new Date(suggestedBatch.entryDate).toLocaleDateString('es-ES')}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Fecha de Vencimiento</p>
                              <p className="text-gray-900">
                                {new Date(suggestedBatch.expirationDate).toLocaleDateString('es-ES')}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Días hasta Vencer</p>
                              <div className="flex items-center gap-2">
                                <p className={getExpirationStatus(getDaysUntilExpiration(suggestedBatch.expirationDate)).textColor}>
                                  {getDaysUntilExpiration(suggestedBatch.expirationDate)} días
                                </p>
                                <Badge className={`${getExpirationStatus(getDaysUntilExpiration(suggestedBatch.expirationDate)).color} text-white`}>
                                  {getExpirationStatus(getDaysUntilExpiration(suggestedBatch.expirationDate)).text}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quantity Input */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="quantity">Cantidad a Despachar *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Ingrese la cantidad que desea despachar. No puede superar la cantidad disponible en el lote.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max={suggestedBatch.quantity}
                    placeholder={`Máximo: ${suggestedBatch.quantity}`}
                    value={quantityToDispatch}
                    onChange={(e) => setQuantityToDispatch(e.target.value)}
                  />
                  {quantityToDispatch && (
                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Cantidad actual: {suggestedBatch.quantity}</span>
                        <span className="text-gray-600">Después del despacho: {suggestedBatch.quantity - parseInt(quantityToDispatch || '0')}</span>
                      </div>
                      <Progress 
                        value={((suggestedBatch.quantity - parseInt(quantityToDispatch || '0')) / suggestedBatch.quantity) * 100} 
                        className="h-2"
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Confirmar Despacho
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSelectedProductId('');
                      setQuantityToDispatch('');
                      setDispatchSuccess(false);
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {selectedProductId && !suggestedBatch && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Sin Stock Disponible</AlertTitle>
                <AlertDescription>
                  No hay lotes disponibles para este producto. Registre una entrada primero.
                </AlertDescription>
              </Alert>
            )}
          </form>
        </CardContent>
      </Card>

      {/* FIFO Explanation */}
      <Card className="border-purple-200 bg-purple-50/50">
        <CardHeader>
          <CardTitle className="text-purple-900">¿Cómo funciona el despacho FIFO?</CardTitle>
        </CardHeader>
        <CardContent className="text-purple-800">
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>Siempre se despacha el lote con la fecha de entrada más antigua</li>
            <li>Esto asegura que los productos no permanezcan mucho tiempo en inventario</li>
            <li>Reduce el riesgo de vencimientos y pérdidas</li>
            <li>Si el lote se agota completamente, el siguiente más antiguo pasa a ser prioritario</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
