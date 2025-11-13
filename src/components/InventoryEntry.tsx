import React, { useState } from 'react';
import { ArrowDownToLine, CheckCircle2, HelpCircle, Package } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { useInventory } from '../App';
import { toast } from 'sonner@2.0.3';

export function InventoryEntry() {
  const { products, batches, addBatch } = useInventory();
  const [formData, setFormData] = useState({
    productId: '',
    quantity: '',
    batchNumber: '',
    entryDate: new Date().toISOString().split('T')[0],
    expirationDate: '',
  });
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.productId || !formData.quantity || !formData.batchNumber || !formData.expirationDate) {
      toast.error('Por favor, complete todos los campos obligatorios');
      return;
    }

    const product = products.find(p => p.id === formData.productId);
    if (!product) return;

    // Find previous batch for this product (FIFO logic)
    const productBatches = batches
      .filter(b => b.productId === formData.productId)
      .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
    
    const previousBatch = productBatches[0];

    const newBatchNumber = addBatch({
      productId: formData.productId,
      productName: product.name,
      quantity: parseInt(formData.quantity),
      batchNumber: formData.batchNumber,
      entryDate: formData.entryDate,
      expirationDate: formData.expirationDate,
    });

    // Success message with FIFO context
    let message = `Lote ${formData.batchNumber} registrado correctamente`;
    if (previousBatch) {
      message += ` - Ubicado detrás del Lote ${previousBatch.batchNumber} (FIFO)`;
    } else {
      message += ` - Primer lote de este producto`;
    }

    setSuccessMessage(message);
    toast.success('Entrada registrada correctamente', {
      description: message,
    });

    // Reset form
    setFormData({
      productId: '',
      quantity: '',
      batchNumber: '',
      entryDate: new Date().toISOString().split('T')[0],
      expirationDate: '',
    });

    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const selectedProduct = products.find(p => p.id === formData.productId);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
          <ArrowDownToLine className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-gray-900">Registrar Entrada de Inventario</h1>
          <p className="text-sm text-gray-600">Registre nuevos lotes siguiendo el método FIFO</p>
        </div>
      </div>

      {/* Success Alert */}
      {successMessage && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-900">¡Lote Registrado!</AlertTitle>
          <AlertDescription className="text-green-700">{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Formulario de Entrada</CardTitle>
          <CardDescription>
            Complete los datos del nuevo lote. El sistema lo ubicará automáticamente según FIFO.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="product">Nombre del Producto *</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Seleccione el producto que está ingresando al inventario</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Select
                  value={formData.productId}
                  onValueChange={(value) => setFormData({ ...formData, productId: value })}
                >
                  <SelectTrigger id="product">
                    <SelectValue placeholder="Seleccione un producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} ({product.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="quantity">Cantidad *</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Ingrese la cantidad de unidades del lote</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  placeholder="100"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                />
                {selectedProduct && (
                  <p className="text-xs text-gray-500">Unidad: {selectedProduct.unit}</p>
                )}
              </div>

              {/* Batch Number */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="batch">Número de Lote *</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Código único para identificar este lote (ej: L001, L002)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="batch"
                  type="text"
                  placeholder="L001"
                  value={formData.batchNumber}
                  onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                />
              </div>

              {/* Entry Date */}
              <div className="space-y-2">
                <Label htmlFor="entryDate">Fecha de Entrada *</Label>
                <Input
                  id="entryDate"
                  type="date"
                  value={formData.entryDate}
                  onChange={(e) => setFormData({ ...formData, entryDate: e.target.value })}
                />
              </div>

              {/* Expiration Date */}
              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="expiration">Fecha de Vencimiento *</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Fecha en que vence el producto. El sistema alertará automáticamente cuando esté próximo a vencer.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="expiration"
                  type="date"
                  value={formData.expirationDate}
                  onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                  min={formData.entryDate}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Registrar Entrada
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFormData({
                    productId: '',
                    quantity: '',
                    batchNumber: '',
                    entryDate: new Date().toISOString().split('T')[0],
                    expirationDate: '',
                  });
                  setSuccessMessage('');
                }}
              >
                Limpiar Formulario
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* FIFO Info Card */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Método FIFO (First In, First Out)
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800">
          <p className="text-sm">
            Cada lote que registre se ubicará automáticamente después de los lotes existentes del mismo producto.
            Al despachar, siempre se sugerirá el lote más antiguo primero, asegurando una rotación óptima del inventario
            y minimizando el riesgo de vencimientos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
