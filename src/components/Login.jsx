import "./login.css";
import { Link, useNavigate } from "react-router-dom";
import { isAdmin } from "../utils/admin";

import { FiMail, FiLock, FiArrowRight } from "react-icons/fi";

import logo from "../assets/logo.png";
import clinic from "../assets/clinic.jpg";

export default function Login() {

    const navigate = useNavigate();

    async function entrar(e) {

        e.preventDefault();

        const form = new FormData(e.currentTarget);

        const email = form.get("email").trim().toLowerCase();
        const senha = form.get("senha");

        try {

            const response = await fetch(
                `http://localhost:3000/usuarios?email=${encodeURIComponent(email)}&senha=${encodeURIComponent(senha)}`
            );

            if (!response.ok) {
                throw new Error("Erro ao consultar usuários.");
            }

            const usuarios = await response.json();

            if (usuarios.length === 0) {

                alert("E-mail ou senha incorretos.");

                return;
            }

            const usuario = usuarios[0];

            localStorage.setItem(
                "usuarioLogado",
                JSON.stringify(usuario)
            );

            // Administrador (@scmedicadmin.com) vai para o painel
            navigate(isAdmin(usuario) ? "/admin" : "/home");

        } catch (error) {

            console.error(error);

            alert(
                "Não foi possível conectar ao banco de dados. Verifique se o JSON Server está rodando."
            );

        }

    }

    return (

        <div className="auth-page">

            <div className="auth-left">

                <img
                    src={clinic}
                    alt="SC Medic"
                    className="auth-background"
                />

                <div className="auth-overlay">

                    <img
                        src={logo}
                        className="auth-logo"
                        alt="SC Medic"
                    />

                    <div className="auth-content">

                        <span className="auth-small-title">
                            SC MEDIC
                        </span>

                        <h1>
                            Beleza, saúde e tecnologia em um só lugar.
                        </h1>

                        <p>
                            A SC Medic oferece soluções completas para
                            clínicas, profissionais da estética e pacientes,
                            garantindo qualidade, segurança e inovação em
                            cada atendimento.
                        </p>

                        <div className="auth-info">

                            <div>✓ Atendimento Humanizado</div>

                            <div>✓ Tecnologia Avançada</div>

                            <div>✓ Produtos Certificados</div>

                        </div>

                    </div>

                </div>

            </div>

            <div className="auth-right">

                <div className="auth-card">

                    <span className="auth-welcome">
                        Bem-vindo
                    </span>

                    <h2>
                        Faça login
                    </h2>

                    <p className="auth-description">
                        Entre com suas credenciais para acessar sua conta.
                    </p>

                    <form onSubmit={entrar}>

                        <label htmlFor="email">
                            E-mail
                        </label>

                        <div className="auth-input">

                            <FiMail />

                            <input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="Digite seu e-mail"
                                required
                            />

                        </div>

                        <label htmlFor="senha">
                            Senha
                        </label>

                        <div className="auth-input">

                            <FiLock />

                            <input
                                id="senha"
                                name="senha"
                                type="password"
                                placeholder="Digite sua senha"
                                required
                            />

                        </div>

                        <div className="remember-row">

                            <label className="remember">

                                <input
                                    type="checkbox"
                                    name="lembrar"
                                />

                                <span>
                                    Manter conectado
                                </span>

                            </label>

                            <button
                                type="button"
                                className="forgot-button"
                                onClick={() => navigate("/recuperar-senha")}
                            >
                                Esqueci minha senha
                            </button>

                        </div>

                        <button
                            type="submit"
                            className="auth-button"
                        >
                            Entrar
                            <FiArrowRight />
                        </button>

                    </form>

                    <div className="auth-divider">
                        <span>ou</span>
                    </div>

                    <p className="auth-bottom">

                        Ainda não possui uma conta?

                        <Link to="/cadastro">
                            Criar Conta
                        </Link>

                    </p>

                </div>

            </div>

        </div>

    );
}