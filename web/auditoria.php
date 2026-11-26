<?php
require_once 'config.php';
require_once 'SupabaseClient.php';

$tituloPagina = 'Auditoria de Pendências — MA2';
require_once 'header.php';

$supabase = new SupabaseClient($supabaseUrl, $supabaseKey);

// Busca apenas registros pendentes ordenados da coleta mais antiga para a mais recente
$pendentesBrutos = $supabase->buscar(
    'controle_lupeon',
    'select=*&status=neq.SUBIU&order=data_coleta.asc&limit=500'
);

$hoje = new DateTimeImmutable('today');
$listaAuditada = [];
$totalCritico = 0; // >= 30 dias
$totalAtencao = 0; // 15 a 29 dias
$totalNormal  = 0; // < 15 dias

foreach ($pendentesBrutos as $linha) {
    if (!is_array($linha) || empty($linha['data_coleta'])) {
        continue;
    }

    $dataColeta = new DateTimeImmutable($linha['data_coleta']);
    $diasAtraso = max(0, (int) $dataColeta->diff($hoje)->format('%r%a'));

    if ($diasAtraso >= 30) {
        $nivel = 'CRÍTICO';
        $classeBadge = 'badge-critico';
        $totalCritico++;
    } elseif ($diasAtraso >= 15) {
        $nivel = 'ATENÇÃO';
        $classeBadge = 'badge-atencao';
        $totalAtencao++;
    } else {
        $nivel = 'RECENTE';
        $classeBadge = 'badge-normal';
        $totalNormal++;
    }

    $linha['dias_atraso'] = $diasAtraso;
    $linha['nivel'] = $nivel;
    $linha['classe_badge'] = $classeBadge;
    $listaAuditada[] = $linha;
}
?>

<style>
    .kpi-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 1rem;
        margin-bottom: 1.5rem;
    }
    .kpi-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 1.2rem;
    }
    .kpi-label { color: var(--muted); font-size: 0.85rem; margin-bottom: 0.35rem; }
    .kpi-value { font-size: 1.8rem; font-weight: 700; }
    .kpi-critico { border-left: 4px solid #ef4444; }
    .kpi-atencao { border-left: 4px solid #f59e0b; }
    .kpi-total   { border-left: 4px solid var(--primary); }

    .badge {
        padding: 0.25rem 0.65rem;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 600;
        display: inline-block;
    }
    .badge-critico { background: rgba(239, 68, 68, 0.15); color: #f87171; }
    .badge-atencao { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
    .badge-normal  { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
</style>

<div style="margin-bottom: 1.25rem;">
    <h1 style="font-size: 1.4rem;">Auditoria de Pendências</h1>
    <p style="color: var(--muted); font-size: 0.9rem;">Notas fiscais ainda sem status <strong>SUBIU</strong>, ordenadas pelo maior tempo de espera.</p>
</div>

<div class="kpi-grid">
    <div class="kpi-card kpi-total">
        <div class="kpi-label">Total Pendente</div>
        <div class="kpi-value"><?= count($listaAuditada) ?></div>
    </div>
    <div class="kpi-card kpi-critico">
        <div class="kpi-label">Crítico (30+ dias)</div>
        <div class="kpi-value" style="color: #f87171;"><?= $totalCritico ?></div>
    </div>
    <div class="kpi-card kpi-atencao">
        <div class="kpi-label">Atenção (15 a 29 dias)</div>
        <div class="kpi-value" style="color: #fbbf24;"><?= $totalAtencao ?></div>
    </div>
</div>

<div class="table-wrapper">
    <table>
        <thead>
            <tr>
                <th>Prioridade</th>
                <th>Atraso</th>
                <th>DT</th>
                <th>NF</th>
                <th>Evento</th>
                <th>Data Coleta</th>
                <th>Status Atual</th>
            </tr>
        </thead>
        <tbody>
            <?php if (empty($listaAuditada)): ?>
                <tr>
                    <td colspan="7" style="text-align: center; color: var(--muted); padding: 2rem;">
                        Nenhuma pendência encontrada no momento.
                    </td>
                </tr>
            <?php else: ?>
                <?php foreach ($listaAuditada as $item): ?>
                    <tr>
                        <td><span class="badge <?= $item['classe_badge'] ?>"><?= $item['nivel'] ?></span></td>
                        <td><strong><?= $item['dias_atraso'] ?> dias</strong></td>
                        <td><?= htmlspecialchars((string) ($item['dt'] ?? '-')) ?></td>
                        <td><?= htmlspecialchars((string) ($item['nf'] ?? '-')) ?></td>
                        <td><?= htmlspecialchars((string) ($item['evento'] ?? '-')) ?></td>
                        <td><?= htmlspecialchars((string) ($item['data_coleta'] ?? '-')) ?></td>
                        <td><?= htmlspecialchars((string) ($item['status'] ?? 'SEM STATUS')) ?></td>
                    </tr>
                <?php endforeach; ?>
            <?php endif; ?>
        </tbody>
    </table>
</div>

</main>
</body>
</html>