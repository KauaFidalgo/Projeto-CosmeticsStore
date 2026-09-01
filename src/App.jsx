import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./components/Login";
import Register from "./components/Register";

import Home from "./pages/Home";
import Product from "./pages/Product";
import Cart from "./pages/Cart";
import Favoritos from "./pages/Favoritos";
import Identification from "./pages/Identification";
import Payment from "./pages/Payment";

function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* LOGIN */}

        <Route
          path="/"
          element={<Login />}
        />

        {/* CADASTRO */}

        <Route
          path="/cadastro"
          element={<Register />}
        />

        {/* HOME */}

        <Route
          path="/home"
          element={<Home />}
        />

        {/* PRODUTO */}

        <Route
          path="/produto/:id"
          element={<Product />}
        />

        {/* CARRINHO */}

        <Route
          path="/carrinho"
          element={<Cart />}
        />

        {/* FAVORITOS */}

        <Route
          path="/favoritos"
          element={<Favoritos />}
        />

        {/* IDENTIFICAÇÃO */}

        <Route
          path="/identificacao"
          element={<Identification />}
        />

        {/* PAGAMENTO */}

        <Route
          path="/pagamento"
          element={<Payment />}
        />

        {/* ROTA INVÁLIDA */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;