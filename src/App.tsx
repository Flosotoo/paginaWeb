import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AppRoutes } from './routes/AppRoutes';

// Estilo soberano original de EduSaldo
import '../assets/css/style.css';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <CartProvider>
        <AppRoutes />
      </CartProvider>
    </BrowserRouter>
  );
};

export default App;
