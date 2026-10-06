import { Navigate } from "react-router-dom";
import { getUsuarioLogado, isAdmin } from "../../utils/admin";

export default function AdminRoute({ children }) {
  const usuario = getUsuarioLogado();

  if (!usuario) return <Navigate to="/" replace />;
  if (!isAdmin(usuario)) return <Navigate to="/home" replace />;

  return children;
}