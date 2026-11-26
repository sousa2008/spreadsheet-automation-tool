<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($tituloPagina ?? 'Controle Lupeon — MA2') ?></title>
    <style>
        :root {
            --bg: #0f172a;
            --surface: #1e293b;
            --surface-hover: #263348;
            --border: #334155;
            --text: #f1f5f9;
            --muted: #94a3b8;
            --primary: #3b82f6;
            --primary-hover: #2563eb;
            --accent: #a855f7;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background-color: var(--bg);
            color: var(--text);
            line-height: 1.5;
        }
        .navbar {
            background: var(--surface);
            border-bottom: 1px solid var(--border);
            padding: 0.9rem 1.5rem;
            margin-bottom: 2rem;
        }
        .navbar-inner {
            max-width: 1150px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .brand { font-weight: 700; font-size: 1.05rem; color: var(--text); text-decoration: none; }
        .brand span { color: var(--accent); }
        .nav-links { display: flex; gap: 1rem; }
        .nav-links a {
            color: var(--muted);
            text-decoration: none;
            font-size: 0.92rem;
            padding: 0.4rem 0.8rem;
            border-radius: 6px;
        }
        .nav-links a:hover, .nav-links a.active {
            background: var(--bg);
            color: var(--text);
        }
        .container { max-width: 1150px; margin: 0 auto; padding: 0 1rem 2rem; }
        .card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 10px;
            padding: 1.25rem;
            margin-bottom: 1.25rem;
        }
        input, select, textarea {
            background: var(--bg);
            border: 1px solid var(--border);
            color: var(--text);
            padding: 0.65rem 0.9rem;
            border-radius: 6px;
            font-size: 0.95rem;
            font-family: inherit;
            width: 100%;
        }
        input:focus, select:focus, textarea:focus { outline: none; border-color: var(--primary); }
        .btn {
            padding: 0.6rem 1.2rem;
            border-radius: 6px;
            font-size: 0.95rem;
            font-weight: 500;
            cursor: pointer;
            text-decoration: none;
            border: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }
        .btn-primary { background: var(--primary); color: #fff; }
        .btn-primary:hover { background: var(--primary-hover); }
        .btn-secondary { background: transparent; border: 1px solid var(--border); color: var(--muted); }
        .btn-secondary:hover { color: var(--text); border-color: var(--muted); }
        .table-wrapper { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; text-align: left; }
        th { background: #162032; color: var(--muted); font-size: 0.78rem; text-transform: uppercase; padding: 0.9rem 1rem; border-bottom: 1px solid var(--border); }
        td { padding: 0.85rem 1rem; border-bottom: 1px solid var(--border); font-size: 0.92rem; }
        tbody tr:hover { background: var(--surface-hover); }
    </style>
</head>
<body>
    <nav class="navbar">
        <div class="navbar-inner">
            <a href="index.php" class="brand">MA2 <span>Lupeon</span></a>
            <div class="nav-links">
                <a href="index.php">Painel de Registros</a>
                <a href="auditoria.php">Auditoria de Pendências</a>
                <a href="sla.php">Análise de SLA</a>
            </div>
        </div>
    </nav>
    <main class="container">