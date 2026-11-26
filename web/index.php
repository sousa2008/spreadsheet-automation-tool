<?php
require_once 'config.php';
require_once 'SupabaseClient.php';
require_once 'header.php';


$busca = trim($_GET['busca'] ?? '');
$status = trim($_GET['status'] ?? '');

$porPagina = 100;
$pagina = max(1, (int) ($_GET['pagina'] ?? 1));
$offset = ($pagina - 1) * $porPagina;

$filtros = [
    'select=*',
    'order=id.desc',
    "limit={$porPagina}",
    "offset={$offset}"
];

if ($status !== '') {
    $filtros[] = 'status=eq.' . rawurlencode($status);
}

if ($busca !== '') {
    $buscaLimpa = preg_replace('/[^a-zA-Z0-9-]/', '', $busca);
    $filtros[] = "or=(dt.eq.{$buscaLimpa},nf.eq.{$buscaLimpa})";
}

$supabase = new SupabaseClient($supabaseUrl, $supabaseKey);
$dados = $supabase->buscar('controle_lupeon', implode('&', $filtros));



?>
<!-- o que é exibido em tela, fica fora do <?php ?> -->
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Controle Lupeon — MA2 Transportes</title>
    <style>
        .filter-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 10px;
            padding: 1rem;
            margin-bottom: 1.25rem;
            display: flex;
            gap: 0.75rem;
            flex-wrap: wrap;
        }
        .filter-card input,
        .filter-card select {
            background: var(--bg);
            border: 1px solid var(--border);
            color: var(--text);
            padding: 0.6rem 0.9rem;
            border-radius: 6px;
            font-size: 0.95rem;
            outline: none;
        }
        .filter-card input { flex: 2; min-width: 220px; }
        .filter-card select { flex: 1; min-width: 180px; }
        .filter-card input:focus,
        .filter-card select:focus { border-color: var(--primary); }
        .badge {
            padding: 0.25rem 0.65rem;
            border-radius: 999px;
            font-size: 0.75rem;
            font-weight: 600;
            display: inline-block;
        }
        .badge-subiu { background: rgba(34, 197, 94, 0.15); color: #4ade80; }
        .badge-falta { background: rgba(239, 68, 68, 0.15); color: #f87171; }
        .badge-nao-liberado { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
        .badge-default { background: rgba(148, 163, 184, 0.15); color: #cbd5e1; }
        .pagination {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 1rem;
            color: var(--muted);
            font-size: 0.9rem;
        }
        .pagination-actions {
            display: flex;
            gap: 0.5rem;
        }
    </style>
</head>
<body>
    <main class="container">
        <div class="header">
            <h1>Controle Lupeon — MA2 Transportes</h1>
            <span>Exibindo <strong><?= count($dados) ?></strong> registros</span>
        </div>

        <form method="GET" class="filter-card">
            <input type="text" name="busca" placeholder="Buscar por DT ou NF..." value="<?= htmlspecialchars($busca) ?>">
            <select name="status">
                <option value="" <?= $status === '' ? 'selected' : '' ?>>Todos os status</option>
                <option value="SUBIU" <?= $status === 'SUBIU' ? 'selected' : '' ?>>SUBIU</option>
                <option value="FALTA ARQUIVO" <?= $status === 'FALTA ARQUIVO' ? 'selected' : '' ?>>FALTA ARQUIVO</option>
                <option value="NÃO LIBERADO" <?= $status === 'NÃO LIBERADO' ? 'selected' : '' ?>>NÃO LIBERADO</option>
            </select>
            <button type="submit" class="btn btn-primary">Filtrar</button>
            <a href="index.php" class="btn btn-secondary">Limpar</a>
        </form>

        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>DT</th>
                        <th>NF</th>
                        <th>Evento</th>
                        <th>Coleta</th>
                        <th>Upload</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($dados)): ?>
                        <tr>
                            <td colspan="6" style="text-align: center; color: var(--muted); padding: 2rem;">
                                Nenhum registro encontrado para esse filtro.
                            </td>
                        </tr>
                    <?php else: ?>
                        <?php foreach ($dados as $linha): ?>
                            <?php
                                $statusAtual = (string) ($linha['status'] ?? '');
                                $classeBadge = match ($statusAtual) {
                                    'SUBIU' => 'badge-subiu',
                                    'FALTA ARQUIVO' => 'badge-falta',
                                    'NÃO LIBERADO' => 'badge-nao-liberado',
                                    default => 'badge-default',
                                };
                            ?>
                            <tr>
                                <td><strong><?= htmlspecialchars((string) ($linha['dt'] ?? '-')) ?></strong></td>
                                <td><?= htmlspecialchars((string) ($linha['nf'] ?? '-')) ?></td>
                                <td><?= htmlspecialchars((string) ($linha['evento'] ?? '-')) ?></td>
                                <td><?= htmlspecialchars((string) ($linha['data_coleta'] ?? '-')) ?></td>
                                <td><?= htmlspecialchars((string) ($linha['data_upload'] ?? '-')) ?></td>
                                <td><span class="badge <?= $classeBadge ?>"><?= htmlspecialchars($statusAtual) ?></span></td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
        <?php
            $queryAnterior = http_build_query(['busca' => $busca, 'status' => $status, 'pagina' => $pagina - 1]);
            $queryProxima  = http_build_query(['busca' => $busca, 'status' => $status, 'pagina' => $pagina + 1]);
        ?>
        <div class="pagination">
            <span>Página <strong><?= $pagina ?></strong></span>
            <div class="pagination-actions">
                <?php if ($pagina > 1): ?>
                    <a href="?<?= $queryAnterior ?>" class="btn btn-secondary">← Anterior</a>
                <?php endif; ?>

                <?php if (count($dados) === $porPagina): ?>
                    <a href="?<?= $queryProxima ?>" class="btn btn-secondary">Próxima →</a>
                <?php endif; ?>
            </div>
        </div>
    </main>
</body>
</html>