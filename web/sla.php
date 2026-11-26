<?php
require_once 'config.php';
require_once 'SupabaseClient.php';

$tituloPagina = 'Análise de SLA — MA2';
require_once 'header.php';

$supabase = new SupabaseClient($supabaseUrl, $supabaseKey);

// Busca apenas as 3 colunas necessárias dos registros já concluídos
// 1. Filtra no próprio Supabase apenas coletas a partir de 2025
$concluidos = $supabase->buscarTodos(
    'controle_lupeon',
    'select=evento,data_coleta,data_upload&status=eq.SUBIU&data_coleta=gte.2025-01-01'
);

$tempoPorEvento = [];
$totalGeralConcluido = 0;
$somaGeralDias = 0;

foreach ($concluidos as $linha) {
    if (empty($linha['data_coleta']) || empty($linha['data_upload'])) {
        continue;
    }

    $dataColeta = new DateTimeImmutable($linha['data_coleta']);
    $dataUpload = new DateTimeImmutable($linha['data_upload']);

    if ($dataColeta->format('Y') < '2025' || $dataUpload->format('Y') < '2025') {
        continue;
    }

    $dias = (int) $dataColeta->diff($dataUpload)->format('%r%a');
    if ($dias < 0) {
        continue;
    }

    $evento = strtoupper(trim((string) ($linha['evento'] ?? 'SEM EVENTO')));
    $tempoPorEvento[$evento][] = $dias;

    $totalGeralConcluido++;
    $somaGeralDias += $dias;
}

$metricas = [];
foreach ($tempoPorEvento as $evento => $tempos) {
    $qtd = count($tempos);
    $metricas[] = [
        'evento' => $evento,
        'totalConcluido' => $qtd,
        'menorTempo' => min($tempos),
        'maiorTempo' => max($tempos),
        'mediaDias' => round(array_sum($tempos) / $qtd, 1),
    ];
}

// Ordena do evento com maior volume para o menor
usort($metricas, fn($a, $b) => $b['totalConcluido'] <=> $a['totalConcluido']);

$mediaGeral = $totalGeralConcluido > 0
    ? round($somaGeralDias / $totalGeralConcluido, 1)
    : 0;
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
    .kpi-primary { border-left: 4px solid var(--primary); }
    .kpi-accent  { border-left: 4px solid var(--accent); }
    .pill-media {
        background: rgba(168, 85, 247, 0.15);
        color: #c084fc;
        padding: 0.25rem 0.65rem;
        border-radius: 999px;
        font-weight: 600;
        font-size: 0.85rem;
    }
</style>

<div style="margin-bottom: 1.25rem;">
    <h1 style="font-size: 1.4rem;">Análise de SLA por Evento</h1>
    <p style="color: var(--muted); font-size: 0.9rem;">Tempo médio entre a <strong>Data de Coleta</strong> e o <strong>Upload</strong> para registros com status <strong>SUBIU</strong>.</p>
</div>

<div class="kpi-grid">
    <div class="kpi-card kpi-primary">
        <div class="kpi-label">Total Analisado (SUBIU)</div>
        <div class="kpi-value"><?= $totalGeralConcluido ?></div>
    </div>
    <div class="kpi-card kpi-accent">
        <div class="kpi-label">Média Geral de Upload</div>
        <div class="kpi-value" style="color: #c084fc;"><?= number_format($mediaGeral, 1, ',', '.') ?> dias</div>
    </div>
</div>

<div class="table-wrapper">
    <table>
        <thead>
            <tr>
                <th>Evento</th>
                <th>Concluídos</th>
                <th>Média de Dias</th>
                <th>Menor Tempo</th>
                <th>Maior Tempo</th>
            </tr>
        </thead>
        <tbody>
            <?php if (empty($metricas)): ?>
                <tr>
                    <td colspan="5" style="text-align: center; color: var(--muted); padding: 2rem;">
                        Sem métricas concluídas para análise.
                    </td>
                </tr>
            <?php else: ?>
                <?php foreach ($metricas as $m): ?>
                    <tr>
                        <td><strong><?= htmlspecialchars($m['evento']) ?></strong></td>
                        <td><?= $m['totalConcluido'] ?></td>
                        <td><span class="pill-media"><?= number_format($m['mediaDias'], 1, ',', '.') ?> dias</span></td>
                        <td><?= $m['menorTempo'] ?> d</td>
                        <td><?= $m['maiorTempo'] ?> d</td>
                    </tr>
                <?php endforeach; ?>
            <?php endif; ?>
        </tbody>
    </table>
</div>

</main>
</body>
</html>