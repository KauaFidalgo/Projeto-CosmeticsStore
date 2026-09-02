import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import { AnimatePresence } from "framer-motion";

import PageTransition from "./components/PageTransition";

import Login from "./components/Login";
import Register from "./components/Register";
import ForgotPassword from "./pages/ForgotPassword";

import Home from "./pages/Home";
import Product from "./pages/Product";
import Cart from "./pages/Cart";
import Favoritos from "./pages/Favoritos";
import Identification from "./pages/Identification";
import Payment from "./pages/Payment";
import Profile from "./pages/Profile";

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>

        {/* LOGIN */}
        <Route
          path="/"
          element={
            <PageTransition>
              <Login />
            </PageTransition>
          }
        />

        {/* CADASTRO */}
        <Route
          path="/cadastro"
          element={
            <PageTransition>
              <Register />
            </PageTransition>
          }
        />

        {/* ESQUECI MINHA SENHA */}
        <Route
          path="/recuperar-senha"
          element={
            <PageTransition>
              <ForgotPassword />
            </PageTransition>
          }
        />

        {/* HOME */}
        <Route
          path="/home"
          element={
            <PageTransition>
              <Home />
            </PageTransition>
          }
        />

        {/* PRODUTO */}
        <Route
          path="/produto/:id"
          element={
            <PageTransition>
              <Product />
            </PageTransition>
          }
        />

        {/* CARRINHO */}
        <Route
          path="/carrinho"
          element={
            <PageTransition>
              <Cart />
            </PageTransition>
          }
        />

        {/* FAVORITOS */}
        <Route
          path="/favoritos"
          element={
            <PageTransition>
              <Favoritos />
            </PageTransition>
          }
        />

        {/* IDENTIFICAÇÃO */}
        <Route
          path="/identificacao"
          element={
            <PageTransition>
              <Identification />
            </PageTransition>
          }
        />

        {/* PAGAMENTO */}
        <Route
          path="/pagamento"
          element={
            <PageTransition>
              <Payment />
            </PageTransition>
          }
        />

        {/* PERFIL */}
        <Route
          path="/perfil"
          element={
            <PageTransition>
              <Profile />
            </PageTransition>
          }
        />

        {/* ROTA INVÁLIDA */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}

export default App;