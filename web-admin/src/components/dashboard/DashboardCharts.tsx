import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import CircularProgress from '@mui/material/CircularProgress';
import type { DashboardStats, StockTrendPoint } from '../../services/dashboardService';

const fmt = (n: number) => n.toLocaleString();

/** Round the axis max up to 1/2/5 × 10^k so gridlines land on readable numbers. */
const niceStep = (max: number, ticks: number) => {
  const raw = Math.max(max, 1) / ticks;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const unit = [1, 2, 5, 10].find((u) => u * pow >= raw) ?? 10;
  return unit * pow;
};

const SERIES = [
  { key: 'stock_in' as const, label: 'Stock In', color: 'var(--viz-stock-in)' },
  { key: 'stock_out' as const, label: 'Stock Out', color: 'var(--viz-stock-out)' },
];

const Legend: React.FC = () => (
  <Box sx={{ display: 'flex', gap: 2 }}>
    {SERIES.map((s) => (
      <Box key={s.key} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: s.color }} />
        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>{s.label}</Typography>
      </Box>
    ))}
  </Box>
);

const Centered: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box sx={{ height: 210, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
    {children}
  </Box>
);

export const StockTrendChart: React.FC<{ data?: StockTrendPoint[]; loading: boolean }> = ({ data = [], loading }) => {
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const TICKS = 4;
  const PLOT_H = 170;
  const max = Math.max(0, ...data.flatMap((d) => [d.stock_in, d.stock_out]));
  const step = niceStep(max, TICKS);
  const axisMax = step * TICKS;
  const isEmpty = data.length === 0 || max === 0;
  const totalIn = data.reduce((s, d) => s + d.stock_in, 0);
  const totalOut = data.reduce((s, d) => s + d.stock_out, 0);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Stock In vs Stock Out</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Units moved per month · last {data.length || 6} months
            {!loading && !isEmpty && ` · ${fmt(totalIn)} in / ${fmt(totalOut)} out`}
          </Typography>
        </Box>
        <ToggleButtonGroup size="small" exclusive value={view} onChange={(_, v) => v && setView(v)}>
          <ToggleButton value="chart" sx={{ px: 1.5, py: 0.25, fontSize: '0.75rem' }}>Chart</ToggleButton>
          <ToggleButton value="table" sx={{ px: 1.5, py: 0.25, fontSize: '0.75rem' }}>Table</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {loading ? (
        <Centered><CircularProgress size={24} /></Centered>
      ) : isEmpty ? (
        <Centered><Typography variant="body2">No stock movements recorded in the last 6 months.</Typography></Centered>
      ) : view === 'table' ? (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Month</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary' }}>Stock In</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary' }}>Stock Out</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary' }}>Net</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((d) => (
              <TableRow key={d.month}>
                <TableCell>{d.label}</TableCell>
                <TableCell align="right">{fmt(d.stock_in)}</TableCell>
                <TableCell align="right">{fmt(d.stock_out)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>{d.stock_in - d.stock_out > 0 ? '+' : ''}{fmt(d.stock_in - d.stock_out)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <>
          <Legend />
          <Box sx={{ position: 'relative', height: PLOT_H + 24, pl: 5 }}>
            {/* Recessive gridlines + y-axis labels */}
            {Array.from({ length: TICKS + 1 }, (_, i) => {
              const value = axisMax - i * step;
              return (
                <Box key={i} sx={{ position: 'absolute', top: (i / TICKS) * PLOT_H, left: 0, right: 0, display: 'flex', alignItems: 'center', gap: 1, transform: 'translateY(-50%)' }}>
                  <Typography variant="caption" sx={{ width: 32, color: 'text.secondary', textAlign: 'right', fontSize: '0.7rem' }}>{fmt(value)}</Typography>
                  <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
                </Box>
              );
            })}

            {/* Bars */}
            <Box sx={{ position: 'absolute', left: 48, right: 0, top: 0, height: PLOT_H, display: 'flex', alignItems: 'flex-end' }}>
              {data.map((d) => (
                <Tooltip
                  key={d.month}
                  arrow
                  placement="top"
                  title={
                    <Box sx={{ p: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>{d.label}</Typography>
                      {SERIES.map((s) => (
                        <Box key={s.key} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: s.color }} />
                          <Typography variant="caption">{s.label}: <strong>{fmt(d[s.key])}</strong> units</Typography>
                        </Box>
                      ))}
                    </Box>
                  }
                >
                  {/* Whole month column is the hit target, larger than the bars */}
                  <Box sx={{ flex: 1, height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '2px', cursor: 'default', borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}>
                    {SERIES.map((s) => {
                      const v = d[s.key];
                      const h = v > 0 ? Math.max(2, (v / axisMax) * PLOT_H) : 0;
                      return <Box key={s.key} sx={{ width: 14, height: h, bgcolor: s.color, borderRadius: '4px 4px 0 0' }} />;
                    })}
                  </Box>
                </Tooltip>
              ))}
            </Box>

            {/* X-axis labels */}
            <Box sx={{ position: 'absolute', left: 48, right: 0, top: PLOT_H + 6, display: 'flex' }}>
              {data.map((d) => (
                <Typography key={d.month} variant="caption" sx={{ flex: 1, textAlign: 'center', fontSize: '0.7rem', color: 'text.secondary', fontWeight: 500 }}>
                  {d.label.split(' ')[0]}
                </Typography>
              ))}
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
};

export const AssetStatusChart: React.FC<{ summary?: DashboardStats['asset_summary']; loading: boolean }> = ({ summary, loading }) => {
  const total = summary?.total_assets ?? 0;
  const rows = summary
    ? [
        { label: 'Available', value: summary.available_assets },
        { label: 'Assigned', value: summary.assigned_assets },
        { label: 'Under Maintenance', value: summary.under_maintenance_assets },
        { label: 'Damaged', value: summary.damaged_assets },
        { label: 'Lost / Disposed / Other', value: summary.other_assets ?? 0 },
      ]
    : [];
  const max = Math.max(1, ...rows.map((r) => r.value));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>Asset Status</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {loading ? 'Loading…' : `${fmt(total)} physical assets by current status`}
        </Typography>
      </Box>

      {loading ? (
        <Centered><CircularProgress size={24} /></Centered>
      ) : total === 0 ? (
        <Centered><Typography variant="body2">No assets registered yet.</Typography></Centered>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75, flex: 1, justifyContent: 'center' }}>
          {rows.map((r) => {
            const pct = Math.round((r.value / total) * 100);
            return (
              <Tooltip key={r.label} arrow placement="top" title={`${r.label}: ${fmt(r.value)} of ${fmt(total)} assets (${pct}%)`}>
                <Box sx={{ cursor: 'default' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary' }}>{r.label}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      <strong style={{ color: 'inherit' }}>{fmt(r.value)}</strong> · {pct}%
                    </Typography>
                  </Box>
                  <Box sx={{ height: 8, borderRadius: '4px', bgcolor: 'action.hover', overflow: 'hidden' }}>
                    <Box sx={{ height: '100%', width: `${(r.value / max) * 100}%`, bgcolor: 'var(--viz-stock-in)', borderRadius: '4px' }} />
                  </Box>
                </Box>
              </Tooltip>
            );
          })}
        </Box>
      )}
    </Box>
  );
};
