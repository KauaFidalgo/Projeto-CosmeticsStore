import "./register.css";

import { Link, useNavigate } from "react-router-dom";

import {
    FiUser,
    FiMail,
    FiLock,
    FiPhone,
    FiCalendar,
    FiCreditCard,
    FiArrowRight,
    FiArrowLeft
} from "react-icons/fi";

import logo from "../assets/logo.png";
import clinic from "../assets/clinic.jpg";

export default function Register() {

    const navigate = useNavigate();

    async function cadastrar(e) {

        e.preventDefault();

        const form = new FormData(e.currentTarget);

        const nome = form.get("nome").trim();
        const cpf = form.get("cpf").trim();
        const nascimento = form.get("nascimento");
        const telefone = form.get("telefone").trim();
        const email = form.get("email").trim().toLowerCase();
        const senha = form.get("senha");
        const confirmarSenha = form.get("confirmarSenha");

        if (senha !== confirmarSenha) {

            alert("As senhas não são iguais.");

            return;
        }

        try {

            const verificacao = await fetch(
                `http://localhost:3000/usuarios?email=${encodeURIComponent(email)}`
            );

            if (!verificacao.ok) {
                throw new Error("Erro ao verificar e-mail.");
            }

            const usuariosExistentes = await verificacao.json();

            if (usuariosExistentes.length > 0) {

                alert("Já existe uma conta cadastrada com este e-mail.");

                return;
            }

            const novoUsuario = {

                nome,
                cpf,
                nascimento,
                telefone,
                email,
                senha

            };

            const response = await fetch(
                "/usuarios",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(novoUsuario)
                }
            );

            if (!response.ok) {
                throw new Error("Não foi possível cadastrar o usuário.");
            }

            const usuarioCriado = await response.json();

            localStorage.setItem(
                "usuarioLogado",
                JSON.stringify(usuarioCriado)
            );

            alert(`Conta criada com sucesso, ${nome}!`);

            navigate("/home");

        } catch (error) {

            console.error(error);

            alert(
                "Não foi possível criar sua conta. " 
            );

        }

    }

    return (

        <div className="register-page">

            <div className="register-left">

                <img
                    src={clinic}
                    alt="SC Medic"
                    className="register-background"
                />

                <div className="register-overlay">

                    <img
                        src={logo}
                        alt="SC Medic"
                        className="register-logo"
                    />

                    <div className="register-content">

                        <span className="register-small-title">
                            SC MEDIC
                        </span>

                        <h1>
                            Crie sua conta e faça parte da SC Medic.
                        </h1>

                        <p>
                            Tenha acesso aos melhores produtos,
                            acompanhe seus pedidos, salve favoritos
                            e aproveite uma experiência exclusiva.
                        </p>

                        <div className="register-info">

                            <div>
                                ✓ Compra rápida e segura
                            </div>

                            <div>
                                ✓ Atendimento personalizado
                            </div>

                            <div>
                                ✓ Produtos certificados
                            </div>

                        </div>

                    </div>

                </div>

            </div>

            <div className="register-right">

                <div className="register-card">

                    <Link
                        className="register-back"
                        to="/"
                    >
                        <FiArrowLeft />
                        Voltar ao Login
                    </Link>

                    
                    <br/>

                    <span className="register-welcome">
                        Cadastro
                    </span>

                    <h2>
                        Criar Conta
                    </h2>

                    <p className="register-description">
                        Preencha seus dados para começar.
                    </p>

                    <form onSubmit={cadastrar}>

                        <label>
                            Nome completo
                        </label>

                        <div className="register-input">

                            <FiUser />

                            <input
                                name="nome"
                                type="text"
                                placeholder="Digite seu nome completo"
                                required
                            />

                        </div>

                        <div className="register-double">

                            <div>

                                <label>
                                    CPF
                                </label>

                                <div className="register-input">

                                    <FiCreditCard />

                                    <input
                                        name="cpf"
                                        type="text"
                                        placeholder="000.000.000-00"
                                        required
                                    />

                                </div>

                            </div>

                            <div>

                                <label>
                                    Nascimento
                                </label>

                                <div className="register-input">

                                    <FiCalendar />

                                    <input
                                        name="nascimento"
                                        type="date"
                                        required
                                    />

                                </div>

                            </div>

                        </div>

                        <label>
                            Telefone
                        </label>

                        <div className="register-input">

                            <FiPhone />

                            <input
                                name="telefone"
                                type="tel"
                                placeholder="(00) 00000-0000"
                                required
                            />

                        </div>

                        <label>
                            E-mail
                        </label>

                        <div className="register-input">

                            <FiMail />

                            <input
                                name="email"
                                type="email"
                                placeholder="Digite seu e-mail"
                                required
                            />

                        </div>

                        <label>
                            Senha
                        </label>

                        <div className="register-input">

                            <FiLock />

                            <input
                                name="senha"
                                type="password"
                                placeholder="Crie uma senha"
                                minLength="6"
                                required
                            />

                        </div>

                        <label>
                            Confirmar senha
                        </label>

                        <div className="register-input">

                            <FiLock />

                            <input
                                name="confirmarSenha"
                                type="password"
                                placeholder="Digite a senha novamente"
                                minLength="6"
                                required
                            />

                        </div>

                        <button
                            type="submit"
                            className="register-button"
                        >

                            Criar Conta

                            <FiArrowRight />

                        </button>

                    </form>

                    <p className="register-bottom">

                        Já possui conta?

                        <Link to="/">
                            Entrar
                        </Link>

                    </p>

                </div>

            </div>

        </div>

    );
}