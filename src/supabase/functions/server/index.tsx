import { Hono } from 'npm:hono@4.6.14';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import * as kv from './kv_store.tsx';

const app = new Hono();

// Middleware
app.use('*', cors());
app.use('*', logger(console.log));

// Types
interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
  category: string;
  unit: string;
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

// Helper function to verify user
const verifyUser = async (sessionToken: string | null): Promise<User | null> => {
  try {
    if (!sessionToken) {
      console.log('No session token provided');
      return null;
    }
    
    console.log('Verifying session token:', sessionToken.substring(0, 10) + '...');
    
    // Try to get session directly
    const session = await kv.get(`session:${sessionToken}`);
    
    if (!session) {
      console.log('Session not found for token');
      return null;
    }
    
    console.log('Session found, user ID:', session.userId);
    const user = await kv.get(`user:${session.userId}`);
    
    if (user) {
      console.log('User found:', user.email);
    } else {
      console.log('User not found for ID:', session.userId);
    }
    
    return user as User | null;
  } catch (error) {
    console.error('Error in verifyUser:', error);
    return null;
  }
};

// Initialize default data
const initializeData = async () => {
  try {
    console.log('Checking if initialization is needed...');
    
    // Check if data already exists
    const existingUsers = await kv.getByPrefix('user:');
    
    if (existingUsers.length === 0) {
      console.log('Initializing default data...');
      
      // Create default admin users
      const admin1: User = {
        id: '1',
        name: 'Administrador 1',
        email: 'admin@scacompany.com',
        password: '1107099153',
        role: 'admin',
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      
      const admin2: User = {
        id: '2',
        name: 'Administrador 2',
        email: 'admin2@scacompany.com',
        password: '1058548629',
        role: 'admin',
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      
      await kv.set('user:1', admin1);
      await kv.set('user:2', admin2);
      console.log('Created admin users');
      
      // Create default products
      const products: Product[] = [
        { id: '1', name: 'Harina de Trigo', category: 'Materia Prima', unit: 'kg' },
        { id: '2', name: 'Azúcar Refinada', category: 'Materia Prima', unit: 'kg' },
        { id: '3', name: 'Aceite Vegetal', category: 'Materia Prima', unit: 'L' },
        { id: '4', name: 'Galletas Chocolate', category: 'Producto Terminado', unit: 'cajas' },
        { id: '5', name: 'Pan de Molde', category: 'Producto Terminado', unit: 'unidades' },
      ];
      
      for (const product of products) {
        await kv.set(`product:${product.id}`, product);
      }
      console.log('Created default products');
      
      // Create default batches (matching the report image)
      const batches: Batch[] = [
        {
          id: '1',
          productId: '1',
          productName: 'Harina de Trigo',
          batchNumber: 'L001',
          quantity: 500,
          entryDate: '2024-09-30',
          expirationDate: '2025-03-31',
        },
        {
          id: '2',
          productId: '1',
          productName: 'Harina de Trigo',
          batchNumber: 'L002',
          quantity: 300,
          entryDate: '2024-10-09',
          expirationDate: '2025-04-09',
        },
        {
          id: '3',
          productId: '2',
          productName: 'Azúcar Refinada',
          batchNumber: 'L003',
          quantity: 1000,
          entryDate: '2024-09-14',
          expirationDate: '2026-09-14',
        },
        {
          id: '4',
          productId: '4',
          productName: 'Galletas Chocolate',
          batchNumber: 'L004',
          quantity: 200,
          entryDate: '2024-10-11',
          expirationDate: '2025-01-11',
        },
        {
          id: '5',
          productId: '5',
          productName: 'Pan de Molde',
          batchNumber: 'L005',
          quantity: 150,
          entryDate: '2024-10-13',
          expirationDate: '2024-11-13',
        },
      ];
      
      for (const batch of batches) {
        await kv.set(`batch:${batch.id}`, batch);
      }
      console.log('Created default batches');
      
      console.log('Default data initialization complete');
    } else {
      console.log('Data already exists, skipping initialization');
    }
  } catch (error) {
    console.error('Error initializing data:', error);
  }
};

// Initialize data on startup
initializeData().catch(console.error);

// Diagnostic endpoint
app.get('/make-server-42477fe7/diagnostic', async (c) => {
  try {
    const users = await kv.getByPrefix('user:');
    const products = await kv.getByPrefix('product:');
    const batches = await kv.getByPrefix('batch:');
    const sessions = await kv.getByPrefix('session:');
    
    return c.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      counts: {
        users: users.length,
        products: products.length,
        batches: batches.length,
        sessions: sessions.length,
      },
      sampleData: {
        users: users.slice(0, 2).map((u: any) => ({ key: u.key, email: (u.value || u).email })),
        products: products.slice(0, 2).map((p: any) => ({ key: p.key, name: (p.value || p).name })),
      }
    });
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

// Manual init endpoint
app.post('/make-server-42477fe7/init', async (c) => {
  try {
    await initializeData();
    return c.json({ success: true, message: 'Initialization complete' });
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

// Health check
app.get('/make-server-42477fe7/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth Routes
app.post('/make-server-42477fe7/auth/login', async (c) => {
  try {
    console.log('=== LOGIN REQUEST ===');
    const { email, password } = await c.req.json();
    console.log('Login attempt for:', email);
    
    // Guest login
    if (email === 'guest' && password === 'guest') {
      console.log('Guest login');
      const token = crypto.randomUUID();
      const guestUser = {
        id: 'guest',
        name: 'Usuario Invitado',
        email: 'invitado@scacompany.com',
        role: 'user' as const,
      };
      
      // Create a guest user in the database
      await kv.set('user:guest', {
        ...guestUser,
        password: 'guest',
        status: 'active',
        createdAt: new Date().toISOString(),
      });
      
      await kv.set(`session:${token}`, {
        token,
        userId: 'guest',
        createdAt: new Date().toISOString(),
      });
      
      console.log('Guest session created with token:', token.substring(0, 10) + '...');
      return c.json({ success: true, user: guestUser, token });
    }
    
    // Find user by email
    console.log('Fetching users...');
    const usersData = await kv.getByPrefix('user:');
    console.log('Raw users data:', usersData.length, 'items');
    
    const users = usersData.map((item: any) => {
      // Handle both formats: {key, value} and direct value
      if (item.value) {
        return item.value;
      }
      return item;
    });
    
    console.log('Processed users:', users.length);
    const user = users.find((u: any) => u.email === email);
    
    if (!user) {
      console.log('User not found for email:', email);
      console.log('Available emails:', users.map((u: any) => u.email));
      return c.json({ success: false, error: 'Credenciales incorrectas' }, 401);
    }
    
    console.log('User found:', user.email);
    
    if (user.password !== password) {
      console.log('Password mismatch');
      return c.json({ success: false, error: 'Credenciales incorrectas' }, 401);
    }
    
    if (user.status === 'inactive') {
      console.log('User inactive');
      return c.json({ success: false, error: 'Usuario inactivo' }, 403);
    }
    
    // Create session
    const token = crypto.randomUUID();
    await kv.set(`session:${token}`, {
      token,
      userId: user.id,
      createdAt: new Date().toISOString(),
    });
    
    console.log('Session created for user:', user.email, 'Token:', token.substring(0, 10) + '...');
    
    const { password: _, ...userWithoutPassword } = user;
    
    return c.json({ success: true, user: userWithoutPassword, token });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ success: false, error: 'Error en el servidor', details: String(error) }, 500);
  }
});

app.post('/make-server-42477fe7/auth/logout', async (c) => {
  try {
    const sessionToken = c.req.header('X-Session-Token');
    if (!sessionToken) {
      return c.json({ success: false }, 401);
    }
    
    await kv.del(`session:${sessionToken}`);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return c.json({ success: false, error: 'Error en el servidor' }, 500);
  }
});

// Product Routes
app.get('/make-server-42477fe7/products', async (c) => {
  try {
    console.log('=== GET /products called ===');
    const sessionToken = c.req.header('X-Session-Token');
    console.log('Session token:', sessionToken ? sessionToken.substring(0, 10) + '...' : 'none');
    
    const user = await verifyUser(sessionToken);
    if (!user) {
      console.log('User verification failed');
      return c.json({ error: 'No autorizado' }, 401);
    }
    
    console.log('User verified:', user.email);
    console.log('Fetching products...');
    
    const productsData = await kv.getByPrefix('product:');
    console.log('Raw products data:', productsData.length, 'items');
    
    const products = productsData.map((item: any) => {
      if (item.value) {
        return item.value;
      }
      return item;
    });
    
    console.log('Products processed:', products.length);
    
    return c.json({ products });
  } catch (error) {
    console.error('Get products error:', error);
    return c.json({ error: 'Error al obtener productos', details: String(error) }, 500);
  }
});

app.post('/make-server-42477fe7/products', async (c) => {
  try {
    const user = await verifyUser(c.req.header('X-Session-Token'));
    if (!user || user.role !== 'admin') {
      return c.json({ error: 'No autorizado' }, 403);
    }
    
    const product = await c.req.json();
    const id = Date.now().toString();
    const newProduct = { ...product, id };
    
    await kv.set(`product:${id}`, newProduct);
    return c.json({ success: true, product: newProduct });
  } catch (error) {
    console.error('Create product error:', error);
    return c.json({ error: 'Error al crear producto', details: String(error) }, 500);
  }
});

app.put('/make-server-42477fe7/products/:id', async (c) => {
  try {
    const user = await verifyUser(c.req.header('X-Session-Token'));
    if (!user || user.role !== 'admin') {
      return c.json({ error: 'No autorizado' }, 403);
    }
    
    const id = c.req.param('id');
    const updates = await c.req.json();
    const product = await kv.get(`product:${id}`);
    
    if (!product) {
      return c.json({ error: 'Producto no encontrado' }, 404);
    }
    
    const updatedProduct = { ...product, ...updates, id };
    await kv.set(`product:${id}`, updatedProduct);
    
    return c.json({ success: true, product: updatedProduct });
  } catch (error) {
    console.error('Update product error:', error);
    return c.json({ error: 'Error al actualizar producto', details: String(error) }, 500);
  }
});

app.delete('/make-server-42477fe7/products/:id', async (c) => {
  try {
    const user = await verifyUser(c.req.header('X-Session-Token'));
    if (!user || user.role !== 'admin') {
      return c.json({ error: 'No autorizado' }, 403);
    }
    
    const id = c.req.param('id');
    
    // Delete associated batches
    const batchesData = await kv.getByPrefix('batch:');
    for (const item of batchesData) {
      const batch = item.value || item;
      if (batch.productId === id) {
        await kv.del(item.key);
      }
    }
    
    await kv.del(`product:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.error('Delete product error:', error);
    return c.json({ error: 'Error al eliminar producto', details: String(error) }, 500);
  }
});

// Batch Routes
app.get('/make-server-42477fe7/batches', async (c) => {
  try {
    console.log('=== GET /batches called ===');
    const user = await verifyUser(c.req.header('X-Session-Token'));
    if (!user) {
      console.log('User verification failed for batches');
      return c.json({ error: 'No autorizado' }, 401);
    }
    
    console.log('User verified:', user.email);
    console.log('Fetching batches...');
    
    const batchesData = await kv.getByPrefix('batch:');
    console.log('Raw batches data:', batchesData.length, 'items');
    
    const batches = batchesData.map((item: any) => {
      if (item.value) {
        return item.value;
      }
      return item;
    });
    
    console.log('Batches processed:', batches.length);
    return c.json({ batches });
  } catch (error) {
    console.error('Get batches error:', error);
    return c.json({ error: 'Error al obtener lotes', details: String(error) }, 500);
  }
});

app.post('/make-server-42477fe7/batches', async (c) => {
  try {
    const user = await verifyUser(c.req.header('X-Session-Token'));
    if (!user) {
      return c.json({ error: 'No autorizado' }, 401);
    }
    
    const batch = await c.req.json();
    const id = Date.now().toString();
    const newBatch = { ...batch, id };
    
    await kv.set(`batch:${id}`, newBatch);
    return c.json({ success: true, batch: newBatch });
  } catch (error) {
    console.error('Create batch error:', error);
    return c.json({ error: 'Error al crear lote', details: String(error) }, 500);
  }
});

app.put('/make-server-42477fe7/batches/:id', async (c) => {
  try {
    const user = await verifyUser(c.req.header('X-Session-Token'));
    if (!user) {
      return c.json({ error: 'No autorizado' }, 401);
    }
    
    const id = c.req.param('id');
    const updates = await c.req.json();
    const batch = await kv.get(`batch:${id}`);
    
    if (!batch) {
      return c.json({ error: 'Lote no encontrado' }, 404);
    }
    
    const updatedBatch = { ...batch, ...updates, id };
    await kv.set(`batch:${id}`, updatedBatch);
    
    return c.json({ success: true, batch: updatedBatch });
  } catch (error) {
    console.error('Update batch error:', error);
    return c.json({ error: 'Error al actualizar lote', details: String(error) }, 500);
  }
});

app.delete('/make-server-42477fe7/batches/:id', async (c) => {
  try {
    const user = await verifyUser(c.req.header('X-Session-Token'));
    if (!user) {
      return c.json({ error: 'No autorizado' }, 401);
    }
    
    const id = c.req.param('id');
    await kv.del(`batch:${id}`);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Delete batch error:', error);
    return c.json({ error: 'Error al eliminar lote', details: String(error) }, 500);
  }
});

// User Management Routes (Admin only)
app.get('/make-server-42477fe7/users', async (c) => {
  try {
    const user = await verifyUser(c.req.header('X-Session-Token'));
    if (!user || user.role !== 'admin') {
      return c.json({ error: 'No autorizado' }, 403);
    }
    
    const usersData = await kv.getByPrefix('user:');
    const usersWithoutPasswords = usersData.map((item: any) => {
      const userData = item.value || item;
      const { password, ...userWithoutPassword } = userData;
      return userWithoutPassword;
    });
    
    return c.json({ users: usersWithoutPasswords });
  } catch (error) {
    console.error('Get users error:', error);
    return c.json({ error: 'Error al obtener usuarios', details: String(error) }, 500);
  }
});

app.post('/make-server-42477fe7/users', async (c) => {
  try {
    const user = await verifyUser(c.req.header('X-Session-Token'));
    if (!user || user.role !== 'admin') {
      return c.json({ error: 'No autorizado' }, 403);
    }
    
    const userData = await c.req.json();
    const id = Date.now().toString();
    const newUser: User = {
      ...userData,
      id,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    
    await kv.set(`user:${id}`, newUser);
    
    const { password, ...userWithoutPassword } = newUser;
    return c.json({ success: true, user: userWithoutPassword });
  } catch (error) {
    console.error('Create user error:', error);
    return c.json({ error: 'Error al crear usuario', details: String(error) }, 500);
  }
});

app.put('/make-server-42477fe7/users/:id', async (c) => {
  try {
    const user = await verifyUser(c.req.header('X-Session-Token'));
    if (!user || user.role !== 'admin') {
      return c.json({ error: 'No autorizado' }, 403);
    }
    
    const id = c.req.param('id');
    const updates = await c.req.json();
    const existingUser = await kv.get(`user:${id}`);
    
    if (!existingUser) {
      return c.json({ error: 'Usuario no encontrado' }, 404);
    }
    
    const updatedUser = { ...existingUser, ...updates, id };
    await kv.set(`user:${id}`, updatedUser);
    
    const { password, ...userWithoutPassword } = updatedUser;
    return c.json({ success: true, user: userWithoutPassword });
  } catch (error) {
    console.error('Update user error:', error);
    return c.json({ error: 'Error al actualizar usuario', details: String(error) }, 500);
  }
});

app.delete('/make-server-42477fe7/users/:id', async (c) => {
  try {
    const user = await verifyUser(c.req.header('X-Session-Token'));
    if (!user || user.role !== 'admin') {
      return c.json({ error: 'No autorizado' }, 403);
    }
    
    const id = c.req.param('id');
    await kv.del(`user:${id}`);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return c.json({ error: 'Error al eliminar usuario', details: String(error) }, 500);
  }
});

Deno.serve(app.fetch);
