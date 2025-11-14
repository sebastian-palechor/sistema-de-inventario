import React, { useState } from 'react';
import { Package, AlertCircle, Activity } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { useAuth } from '../App';
import { toast } from 'sonner@2.0.3';


export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const runDiagnostic = async () => {
    try {
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-42477fe7/diagnostic`;
      console.log('Running diagnostic:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('Diagnostic results:', data);
      toast.success(`Servidor OK - Usuarios: ${data.counts?.users || 0}, Productos: ${data.counts?.products || 0}`);
    } catch (error) {
      console.error('Diagnostic error:', error);
      toast.error('Error al conectar con el servidor');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Por favor, complete todos los campos');
      return;
    }

    const success = await login(email, password);
    if (!success) {
      setError('Credenciales incorrectas. Intente nuevamente.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-2xl flex items-center justify-center">
              <Package className="w-10 h-10 text-white" />
            </div>
          </div>
          <div className="text-center">
            <CardTitle className="text-green-700">SCA Company</CardTitle>
            <CardDescription>
              Sistema de Gestión de Inventario para Fábrica de Alimentos
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex justify-end">
              <Button variant="link" type="button" className="px-0 text-green-600">
                ¿Olvidó su contraseña?
              </Button>
            </div>

            <Button type="submit" className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
              Iniciar Sesión
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">O</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={async () => {
                setEmail('guest');
                setPassword('guest');
                await login('guest', 'guest');
              }}
            >
              Ingresar como Invitado
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full mt-4 text-xs"
              onClick={runDiagnostic}
            >
              <Activity className="w-4 h-4 mr-2" />
              Verificar Estado del Servidor
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
