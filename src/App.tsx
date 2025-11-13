import React, { useState, createContext, useContext, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  FileText, 
  Users, 
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  HelpCircle
} from 'lucide-react';
import { LoginPage } from './components/LoginPage';
import { Dashboard } from './components/Dashboard';
import { InventoryEntry } from './components/InventoryEntry';
import { InventoryExit } from './components/InventoryExit';
import { Reports } from './components/Reports';
import { UserManagement } from './components/UserManagement';
import { ProductManagement } from './components/ProductManagement';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Toaster } from './components/ui/sonner';
import { authAPI, productsAPI, batchesAPI, getAuthToken } from './utils/api';
import { toast } from 'sonner@2.0.3';

// Types
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

interface Batch {
  id: string;
  productId: string;
  productName: string;
  batchNumber: string;
  quantity: number;
  entryDate: string;
  expirationDate: string;
}

interface Product {
  id: string;
  name: string;
  category: string;
  unit: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

interface InventoryContextType {
  batches: Batch[];
  products: Product[];
  loading: boolean;
  refreshData: () => Promise<void>;
  addBatch: (batch: Omit<Batch, 'id'>) => Promise<string>;
  removeBatchQuantity: (batchId: string, quantity: number) => Promise<boolean>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getExpiringBatches: (days: number) => Batch[];
  getOldestBatch: (productId: string) => Batch | null;
}

// Context
const AuthContext = createContext<AuthContextType | null>(null);
const InventoryContext = createContext<InventoryContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) throw new Error('useInventory must be used within InventoryProvider');
  return context;
};

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<string>('login');
  const [batches, setBatches] = useState<Batch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // Initialize app - check for existing session
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      // Try to restore session by fetching data
      refreshData().then(() => {
        // If we can fetch data, we have a valid session
        // The user info will be set when we fetch data successfully
        setInitializing(false);
      }).catch(() => {
        // Invalid session, clear it
        setCurrentUser(null);
        setCurrentPage('login');
        setInitializing(false);
      });
    } else {
      setInitializing(false);
    }
  }, []);

  const refreshData = async () => {
    try {
      setLoading(true);
      const [productsRes, batchesRes] = await Promise.all([
        productsAPI.getAll(),
        batchesAPI.getAll()
      ]);
      
      setProducts(productsRes.products || []);
      setBatches(batchesRes.batches || []);
    } catch (error) {
      console.error('Error refreshing data:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const authValue: AuthContextType = {
    user: currentUser,
    login: async (email: string, password: string) => {
      try {
        const response = await authAPI.login(email, password);
        
        if (response.success) {
          setCurrentUser(response.user);
          setCurrentPage('dashboard');
          await refreshData();
          return true;
        }
        
        toast.error(response.error || 'Error al iniciar sesión');
        return false;
      } catch (error) {
        console.error('Login error:', error);
        toast.error('Error de conexión con el servidor');
        return false;
      }
    },
    logout: async () => {
      try {
        await authAPI.logout();
      } catch (error) {
        console.error('Logout error:', error);
      }
      setCurrentUser(null);
      setCurrentPage('login');
      setBatches([]);
      setProducts([]);
    },
  };

  const inventoryValue: InventoryContextType = {
    batches,
    products,
    loading,
    refreshData,
    addBatch: async (batch) => {
      try {
        const response = await batchesAPI.create(batch);
        if (response.success) {
          await refreshData();
          return response.batch.batchNumber;
        }
        throw new Error('Error al crear lote');
      } catch (error) {
        console.error('Error adding batch:', error);
        toast.error('Error al agregar lote');
        throw error;
      }
    },
    removeBatchQuantity: async (batchId, quantity) => {
      try {
        const batch = batches.find(b => b.id === batchId);
        if (!batch) return false;
        
        const newQuantity = batch.quantity - quantity;
        
        if (newQuantity <= 0) {
          await batchesAPI.delete(batchId);
        } else {
          await batchesAPI.update(batchId, { quantity: newQuantity });
        }
        
        await refreshData();
        return true;
      } catch (error) {
        console.error('Error removing batch quantity:', error);
        toast.error('Error al actualizar lote');
        return false;
      }
    },
    addProduct: async (product) => {
      try {
        await productsAPI.create(product);
        await refreshData();
      } catch (error) {
        console.error('Error adding product:', error);
        toast.error('Error al agregar producto');
        throw error;
      }
    },
    updateProduct: async (id, updatedProduct) => {
      try {
        await productsAPI.update(id, updatedProduct);
        await refreshData();
      } catch (error) {
        console.error('Error updating product:', error);
        toast.error('Error al actualizar producto');
        throw error;
      }
    },
    deleteProduct: async (id) => {
      try {
        await productsAPI.delete(id);
        await refreshData();
      } catch (error) {
        console.error('Error deleting product:', error);
        toast.error('Error al eliminar producto');
        throw error;
      }
    },
    getExpiringBatches: (days) => {
      const today = new Date();
      const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
      
      return batches.filter(batch => {
        const expirationDate = new Date(batch.expirationDate);
        return expirationDate <= futureDate && expirationDate >= today;
      });
    },
    getOldestBatch: (productId) => {
      const productBatches = batches
        .filter(b => b.productId === productId && b.quantity > 0)
        .sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());
      
      return productBatches[0] || null;
    },
  };

  const expiringBatches = inventoryValue.getExpiringBatches(30);

  if (initializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <AuthContext.Provider value={authValue}>
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
          <LoginPage />
          <Toaster />
        </div>
      </AuthContext.Provider>
    );
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'user'] },
    { id: 'entry', label: 'Registrar Entrada', icon: ArrowDownToLine, roles: ['admin', 'user'] },
    { id: 'exit', label: 'Registrar Salida', icon: ArrowUpFromLine, roles: ['admin', 'user'] },
    { id: 'reports', label: 'Reportes', icon: FileText, roles: ['admin', 'user'] },
    { id: 'products', label: 'Gestión de Productos', icon: Package, roles: ['admin'] },
    { id: 'users', label: 'Gestión de Usuarios', icon: Users, roles: ['admin'] },
  ];

  const filteredMenuItems = menuItems.filter(item => item.roles.includes(currentUser.role));

  return (
    <AuthContext.Provider value={authValue}>
      <InventoryContext.Provider value={inventoryValue}>
        <div className="min-h-screen bg-gray-50 flex">
          {/* Mobile Overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-30 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <aside
            className={`${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            } bg-white border-r border-gray-200 transition-transform duration-300 flex flex-col fixed lg:relative h-screen z-40 w-64`}
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-green-700">SCA Company</h1>
                  <p className="text-xs text-gray-500">Sistema de Gestión</p>
                </div>
              </div>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {filteredMenuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentPage(item.id);
                      if (window.innerWidth < 1024) {
                        setSidebarOpen(false);
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm ${
                      currentPage === item.id
                        ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center gap-3 px-4 py-2 mb-2">
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-400 rounded-full flex items-center justify-center text-white">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{currentUser.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{currentUser.role}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3"
                onClick={authValue.logout}
              >
                <LogOut className="w-5 h-5" />
                Cerrar Sesión
              </Button>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 sticky top-0 z-30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="lg:hidden flex-shrink-0"
                  >
                    <Menu className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="hidden lg:flex flex-shrink-0"
                  >
                    {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </Button>
                  <div className="min-w-0">
                    <h2 className="text-gray-900 text-sm sm:text-base truncate">
                      {filteredMenuItems.find(item => item.id === currentPage)?.label || 'Dashboard'}
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">
                      Gestión de Inventario - Método FIFO
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                  {expiringBatches.length > 0 && (
                    <div className="relative">
                      <Button variant="ghost" size="icon" className="relative">
                        <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                        <Badge className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center p-0 bg-red-500 text-xs">
                          {expiringBatches.length}
                        </Badge>
                      </Button>
                    </div>
                  )}
                  <Button variant="ghost" size="icon" className="hidden sm:flex">
                    <HelpCircle className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </header>

            {/* Page Content */}
            <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
              {loading && currentPage !== 'dashboard' && (
                <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
                  <div className="bg-white p-6 rounded-lg shadow-xl">
                    <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando...</p>
                  </div>
                </div>
              )}
              {currentPage === 'dashboard' && <Dashboard />}
              {currentPage === 'entry' && <InventoryEntry />}
              {currentPage === 'exit' && <InventoryExit />}
              {currentPage === 'reports' && <Reports />}
              {currentPage === 'products' && <ProductManagement />}
              {currentPage === 'users' && <UserManagement />}
            </main>
          </div>
        </div>
        <Toaster />
      </InventoryContext.Provider>
    </AuthContext.Provider>
  );
}

export default App;
