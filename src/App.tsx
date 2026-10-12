import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { AppRoutes } from './routes/AppRoutes';

// Estilos de Bootstrap y CSS original de EduSaldo
import 'bootstrap/dist/css/bootstrap.min.css';
import '../assets/css/style.css';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <CartProvider>
        <div className="d-flex flex-column min-vh-100 bg-light">
          <Navbar />
          <main className="flex-grow-1">
            <AppRoutes />
          </main>
          <Footer />
        </div>
      </CartProvider>
    </BrowserRouter>
  );
};

export default App;
