<?php
session_start();
require_once 'config.php';

$erro = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $senhaDigitada = $_POST['senha'] ?? '';

    if (hash_equals($senhaPainel, $senhaDigitada)) {
        $_SESSION['autenticado'] = true;
        header('Location: index.php');
        exit;
    }

    $erro = 'Senha incorreta.';
}
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Acesso Restrito — MA2 Lupeon</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #0f172a;
            color: #f1f5f9;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
        }
        .login-card {
            background: #1e293b;
            border: 1px solid #334155;
            border-radius: 10px;
            padding: 2rem;
            width: 100%;
            max-width: 360px;
        }
        h1 { font-size: 1.25rem; margin-bottom: 0.4rem; }
        p { color: #94a3b8; font-size: 0.9rem; margin-bottom: 1.25rem; }
        input {
            width: 100%;
            box-sizing: border-box;
            background: #0f172a;
            border: 1px solid #334155;
            color: #f1f5f9;
            padding: 0.7rem 0.9rem;
            border-radius: 6px;
            margin-bottom: 1rem;
            font-size: 0.95rem;
        }
        button {
            width: 100%;
            background: #3b82f6;
            color: #fff;
            border: none;
            padding: 0.7rem;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
        }
        button:hover { background: #2563eb; }
        .erro { color: #f87171; font-size: 0.85rem; margin-bottom: 0.9rem; }
    </style>
</head>
<body>
    <form method="POST" class="login-card">
        <h1>MA2 <span style="color: #a855f7;">Lupeon</span></h1>
        <p>Digite a senha de acesso ao painel.</p>
        <?php if ($erro !== ''): ?>
            <div class="erro"><?= htmlspecialchars($erro) ?></div>
        <?php endif; ?>
        <input type="password" name="senha" placeholder="Senha..." required autofocus>
        <button type="submit">Entrar</button>
    </form>
</body>
</html>