import React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import {
  Target, Package, ArrowLeftRight, Boxes, FileText, ShieldCheck, LayoutDashboard, Users,
  LogIn, KeyRound, Navigation, Send, Lock, CheckCircle2, Database, RefreshCw,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/* SVG diagram primitives — colours come from theme CSS variables so   */
/* every diagram follows light/dark mode automatically.                */
/* ------------------------------------------------------------------ */

const INK = 'var(--text-main)';
const MUTED = 'var(--text-muted)';
const LINE = 'var(--text-dim)';
const NODE_BG = 'var(--bg-card-hover)';
const SURFACE = 'var(--bg-card)';

interface NodeProps {
  x: number; y: number; w: number; h: number;
  title: string; sub?: string[];
  accent?: string; dashed?: boolean; terminal?: boolean;
}

const Node: React.FC<NodeProps> = ({ x, y, w, h, title, sub = [], accent, dashed, terminal }) => {
  const block = 16 + sub.length * 14;
  const top = y + h / 2 - block / 2 + 12;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={10} fill={NODE_BG}
        stroke={accent ?? LINE} strokeWidth={terminal ? 2.5 : 1.5} strokeDasharray={dashed ? '5 4' : undefined} />
      {accent && <rect x={x + 10} y={y} width={w - 20} height={3} rx={1.5} fill={accent} />}
      <text x={x + w / 2} y={top} textAnchor="middle" fill={INK} fontSize={13} fontWeight={700}>{title}</text>
      {sub.map((line, i) => (
        <text key={i} x={x + w / 2} y={top + 16 + i * 14} textAnchor="middle" fill={MUTED} fontSize={11}>{line}</text>
      ))}
    </g>
  );
};

const Label: React.FC<{ x: number; y: number; children: string; anchor?: 'start' | 'middle' | 'end' }> = ({ x, y, children, anchor = 'middle' }) => (
  <text x={x} y={y} textAnchor={anchor} fill={MUTED} fontSize={11} fontWeight={600}
    stroke={SURFACE} strokeWidth={4} paintOrder="stroke" strokeLinejoin="round">{children}</text>
);

const ArrowDefs: React.FC<{ id: string }> = ({ id }) => (
  <defs>
    <marker id={`${id}-arrow`} viewBox="0 0 10 10" refX={9} refY={5} markerWidth={8} markerHeight={8} orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill={LINE} />
    </marker>
  </defs>
);

const Arrow: React.FC<{ id: string; d: string; dashed?: boolean }> = ({ id, d, dashed }) => (
  <path d={d} fill="none" stroke={LINE} strokeWidth={1.75} strokeDasharray={dashed ? '6 4' : undefined}
    markerEnd={`url(#${id}-arrow)`} strokeLinejoin="round" />
);

/** Diagrams keep their proportions; on narrow screens the box scrolls sideways instead of shrinking text. */
const DiagramFrame: React.FC<{ minWidth: number; children: React.ReactNode }> = ({ minWidth, children }) => (
  <Box sx={{ overflowX: 'auto', mx: -1, px: 1, pb: 1 }}>
    <Box sx={{ minWidth }}>{children}</Box>
  </Box>
);

const SectionTitle: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
  <Box sx={{ mb: 2 }}>
    <Typography variant="h6" sx={{ fontWeight: 800 }}>{title}</Typography>
    <Typography variant="body2" sx={{ color: 'text.secondary' }}>{subtitle}</Typography>
  </Box>
);

/* ------------------------------------------------------------------ */
/* 1. Architecture diagram                                            */
/* ------------------------------------------------------------------ */

const TIER = {
  client: 'var(--accent-cyan)',
  api: 'var(--primary)',
  data: 'var(--accent-emerald)',
};

const TierFrame: React.FC<{ x: number; w: number; label: string; color: string; details: string[] }> = ({ x, w, label, color, details }) => (
  <g>
    <rect x={x} y={10} width={w} height={354} rx={14} fill="none" stroke="var(--border-color)" strokeWidth={1.5} />
    <circle cx={x + 20} cy={34} r={5} fill={color} />
    <text x={x + 32} y={38} fill={INK} fontSize={12} fontWeight={800} letterSpacing="0.06em">{label}</text>
    {details.map((d, i) => (
      <text key={i} x={x + 18} y={236 + i * 22} fill={MUTED} fontSize={12}>
        <tspan fill={color} fontWeight={800}>•</tspan> {d}
      </text>
    ))}
  </g>
);

const ArchitectureDiagram: React.FC = () => {
  const id = 'arch';
  const rowY = 70, rowH = 74, mid = rowY + rowH / 2;
  return (
    <DiagramFrame minWidth={900}>
      <svg viewBox="0 0 1000 374" width="100%" role="img" aria-labelledby="arch-title" style={{ display: 'block' }}>
        <title id="arch-title">
          Three-tier architecture: React web admin in the browser calls the FastAPI server over REST with a JWT bearer token;
          the server authorises the request, runs business rules through SQLAlchemy and stores data in PostgreSQL or SQLite.
        </title>
        <ArrowDefs id={id} />

        <TierFrame x={10} w={320} label="CLIENT · BROWSER" color={TIER.client} details={[
          'React 19 + TypeScript + MUI 9',
          'Vite dev server & production build',
          'rbac.ts shows only allowed tabs',
          'JWT kept in localStorage',
          'Excel (CSV) & PDF (print) export',
        ]} />
        <TierFrame x={350} w={420} label="API SERVER · FASTAPI (PYTHON)" color={TIER.api} details={[
          'Uvicorn on :8000 · Swagger docs at /docs',
          'OAuth2 bearer · JWT HS256 · bcrypt passwords',
          'require_roles() → 403 when role not allowed',
          'Pydantic validation → 422 on bad input',
          'Rules: assign/return, stock checks, auto status',
          'Login / logout written to user_logs (audit)',
        ]} />
        <TierFrame x={790} w={200} label="DATA" color={TIER.data} details={[
          'PostgreSQL (primary)',
          'SQLite (inventory.db)',
          '11 tables',
          'Seed: python seed.py',
        ]} />

        {/* Request path, left → right */}
        <Node x={25} y={rowY} w={135} h={rowH} title="React Pages" sub={['Dashboard, Assets,', 'Inventory, Reports…']} accent={TIER.client} />
        <Node x={180} y={rowY} w={135} h={rowH} title="Axios Services" sub={['adds Bearer JWT', 'to every request']} accent={TIER.client} />
        <Node x={368} y={rowY} w={118} h={rowH} title="Auth & RBAC" sub={['verify JWT,', 'check role']} accent={TIER.api} />
        <Node x={506} y={rowY} w={118} h={rowH} title="13 Routers" sub={['business', 'rules']} accent={TIER.api} />
        <Node x={644} y={rowY} w={112} h={rowH} title="SQLAlchemy" sub={['ORM models', '& sessions']} accent={TIER.api} />
        <Node x={808} y={rowY} w={164} h={rowH} title="Database" sub={['PostgreSQL', 'or SQLite fallback']} accent={TIER.data} />

        <Arrow id={id} d={`M160 ${mid} H178`} />
        <Arrow id={id} d={`M315 ${mid} H366`} />
        <Arrow id={id} d={`M486 ${mid} H504`} />
        <Arrow id={id} d={`M624 ${mid} H642`} />
        <Arrow id={id} d={`M756 ${mid} H806`} />
        <Label x={341} y={mid - 12}>REST /api</Label>
        <Label x={781} y={mid - 12}>SQL</Label>

        {/* Response path, right → left */}
        <Arrow id={id} dashed d={`M890 ${rowY + rowH} V178 H92 V${rowY + rowH + 2}`} />
        <Label x={500} y={196}>JSON response → page re-renders with live data</Label>
      </svg>
    </DiagramFrame>
  );
};

/* ------------------------------------------------------------------ */
/* 2. Asset lifecycle (state diagram)                                 */
/* ------------------------------------------------------------------ */

const AssetLifecycleDiagram: React.FC = () => {
  const id = 'life';
  return (
    <DiagramFrame minWidth={860}>
      <svg viewBox="0 0 1000 262" width="100%" role="img" aria-labelledby="life-title" style={{ display: 'block' }}>
        <title id="life-title">
          Asset lifecycle: a registered asset is Available; assigning it to an active employee makes it Assigned; returning it sets it
          back to Available, Under Maintenance or Damaged; repaired assets go back to Available; retired assets become Lost or Disposed.
        </title>
        <ArrowDefs id={id} />

        {/* start */}
        <circle cx={14} cy={110} r={7} fill={INK} />
        <Arrow id={id} d="M21 110 H78" />
        <Label x={46} y={96}>Register</Label>

        <Node x={80} y={80} w={190} h={60} title="Available" sub={['ready to hand out']} accent="var(--accent-emerald)" />
        <Node x={420} y={80} w={190} h={60} title="Assigned" sub={['held by an employee']} accent="var(--accent-cyan)" />
        <Node x={700} y={30} w={190} h={60} title="Damaged" sub={['returned broken']} accent="var(--accent-rose)" />
        <Node x={700} y={150} w={190} h={60} title="Under Maintenance" sub={['being repaired']} accent="var(--accent-amber)" />
        <Node x={80} y={196} w={190} h={54} title="Lost / Disposed" sub={['end of life']} terminal />

        {/* assign / return */}
        <Arrow id={id} d="M270 98 H418" />
        <Label x={345} y={88}>① Assign · date + optional due date</Label>
        <Arrow id={id} d="M420 124 H272" />
        <Label x={345} y={146}>② Return · condition OK</Label>

        {/* return with problems */}
        <Arrow id={id} d="M610 96 C650 96, 660 60, 698 60" />
        <Label x={692} y={40} anchor="end">Return · damaged</Label>
        <Arrow id={id} d="M610 126 C650 126, 660 180, 698 180" />
        <Label x={692} y={222} anchor="end">Return · needs repair</Label>

        {/* repair bus back to Available */}
        <Arrow id={id} d="M890 60 H966 V12 H175 V78" />
        <path d="M890 180 H966 V60" fill="none" stroke={LINE} strokeWidth={1.75} />
        <Label x={570} y={16}>③ Repaired → edit status back to Available</Label>

        {/* retire */}
        <Arrow id={id} d="M175 140 V194" />
        <Label x={186} y={172} anchor="start">④ Retire (edit status)</Label>

        <text x={515} y={160} textAnchor="middle" fill={MUTED} fontSize={11} fontStyle="italic">status locked while assigned</text>
        <text x={515} y={176} textAnchor="middle" fill="var(--accent-rose)" fontSize={11} fontWeight={700}>past due date → Overdue</text>
      </svg>
    </DiagramFrame>
  );
};

/* ------------------------------------------------------------------ */
/* 3. Stock movement flow                                             */
/* ------------------------------------------------------------------ */

const StockFlowDiagram: React.FC = () => {
  const id = 'stock';
  const y = 40, h = 70, mid = y + h / 2;
  return (
    <DiagramFrame minWidth={860}>
      <svg viewBox="0 0 1000 214" width="100%" role="img" aria-labelledby="stock-title" style={{ display: 'block' }}>
        <title id="stock-title">
          Stock movement: a Stock In or Stock Out request is validated; invalid requests are rejected; valid ones update the quantity,
          recalculate the item status, are logged as a transaction and appear on the dashboard and reports.
        </title>
        <ArrowDefs id={id} />

        <Node x={10} y={y} w={140} h={h} title="Stock In / Out" sub={['qty, reference,', 'reason']} accent="var(--accent-cyan)" />

        {/* decision */}
        <polygon points={`240,${mid - 42} 300,${mid} 240,${mid + 42} 180,${mid}`} fill={NODE_BG} stroke={LINE} strokeWidth={1.5} />
        <text x={240} y={mid - 2} textAnchor="middle" fill={INK} fontSize={12} fontWeight={700}>Valid?</text>
        <text x={240} y={mid + 13} textAnchor="middle" fill={MUTED} fontSize={10}>qty &amp; stock</text>

        <Node x={330} y={y} w={130} h={h} title="Update quantity" sub={['+ for In', '− for Out']} />
        <Node x={490} y={y} w={160} h={h} title="Recalculate status" sub={['≤ 0 → Out of Stock', '< min → Low Stock']} accent="var(--accent-amber)" />
        <Node x={680} y={y} w={140} h={h} title="Log transaction" sub={['who, when,', 'how many']} />
        <Node x={850} y={y} w={140} h={h} title="Dashboard" sub={['& Reports', 'update live']} accent="var(--accent-emerald)" />
        <Node x={170} y={150} w={140} h={52} title="Rejected" sub={['400 / 422 · no change']} accent="var(--accent-rose)" dashed />

        <Arrow id={id} d={`M150 ${mid} H178`} />
        <Arrow id={id} d={`M300 ${mid} H328`} />
        <Label x={314} y={mid - 10}>yes</Label>
        <Arrow id={id} d={`M240 ${mid + 42} V148`} />
        <Label x={252} y={mid + 58} anchor="start">no</Label>
        <Arrow id={id} d={`M460 ${mid} H488`} />
        <Arrow id={id} d={`M650 ${mid} H678`} />
        <Arrow id={id} d={`M820 ${mid} H848`} />
      </svg>
    </DiagramFrame>
  );
};

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

const MODULES = [
  { icon: LayoutDashboard, title: 'Dashboard', text: 'Live KPIs, stock trend and asset status from the database.' },
  { icon: Package, title: 'Asset Management', text: 'Register laptops, printers, monitors… with category, supplier, price and condition.' },
  { icon: ArrowLeftRight, title: 'Asset Assignments', text: 'Hand assets to employees with an assigned date and optional expected return date; track returns and overdue loans.' },
  { icon: Boxes, title: 'Stock & Inventory', text: 'Consumables with Stock In / Stock Out, minimum levels and auto status.' },
  { icon: FileText, title: 'Reports', text: 'Asset history, stock movements, department value, reorder list, login audit — export Excel / PDF.' },
  { icon: Users, title: 'Organisation', text: 'Employees, departments and suppliers as master data.' },
  { icon: ShieldCheck, title: 'Access Control', text: 'User accounts, roles and per-role permissions with an audit log.' },
];

const REQUEST_STEPS = [
  { icon: LogIn, title: 'Log in', text: 'User enters username + password on the login page.' },
  { icon: KeyRound, title: 'Get token', text: 'API checks the bcrypt hash, logs the login, returns a JWT (valid 24 h).' },
  { icon: Navigation, title: 'Navigate', text: 'Sidebar shows only the tabs allowed for the user’s role.' },
  { icon: Send, title: 'Call API', text: 'Each action sends a REST request with “Authorization: Bearer <JWT>”.' },
  { icon: Lock, title: 'Authorise', text: 'Server verifies the token, the account is Active, and the role is permitted (else 401 / 403).' },
  { icon: CheckCircle2, title: 'Validate & apply rules', text: 'Pydantic checks the input; business rules run (e.g. only Available assets can be assigned).' },
  { icon: Database, title: 'Save', text: 'SQLAlchemy commits to the database; stock and assignment history keep the audit trail.' },
  { icon: RefreshCw, title: 'Show result', text: 'JSON comes back and the page, dashboard and reports reflect the new data.' },
];

const ROLE_ROWS: [string, boolean, boolean, boolean][] = [
  ['View dashboard & reports, export', true, true, true],
  ['Create / edit assets, inventory, employees, suppliers', true, true, true],
  ['Assign / return assets, Stock In / Out', true, true, true],
  ['Create / edit departments', true, true, false],
  ['Delete records', true, false, false],
  ['Manage users & roles', true, false, false],
];

const TECH = ['React 19', 'TypeScript', 'Material UI 9', 'Vite', 'Axios', 'Python 3.11', 'FastAPI', 'SQLAlchemy 2', 'Pydantic 2', 'JWT', 'bcrypt', 'PostgreSQL', 'SQLite', 'pytest'];

export const AboutPage: React.FC = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    {/* Purpose */}
    <Card sx={{ p: { xs: 2.5, md: 3.5 }, bgcolor: 'var(--kpi-red-bg)', borderColor: 'var(--kpi-red-border)' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Target size={20} color="var(--primary)" />
        <Typography variant="overline" sx={{ fontWeight: 800, color: 'primary.main', letterSpacing: '0.1em' }}>Project Purpose</Typography>
      </Box>
      <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.4rem', md: '1.9rem' }, mb: 1.5 }}>
        Inventory & Asset Management System
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 820, lineHeight: 1.7 }}>
        Organisations often track laptops, printers and office supplies in spreadsheets — so nobody is sure who holds which device,
        stock runs out without warning, and there is no audit trail. This system replaces that with one web application where staff
        register assets, hand them to employees and take them back, record every stock movement, and see live reports — with each
        user limited to what their role allows.
      </Typography>

      <Grid container spacing={2} sx={{ mt: 2 }}>
        {[
          ['Accountability', 'Know which employee holds every asset, since when, and in what condition.'],
          ['No stock-outs', 'Automatic Low / Out of Stock status and a reorder report.'],
          ['Traceability', 'Every assignment, stock movement and login is recorded.'],
          ['Security', 'Hashed passwords, token login and role-based permissions.'],
        ].map(([t, d]) => (
          <Grid key={t} size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{t}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>{d}</Typography>
          </Grid>
        ))}
      </Grid>
    </Card>

    {/* Modules */}
    <Box>
      <SectionTitle title="Modules" subtitle="What the system does, by area." />
      <Grid container spacing={2}>
        {MODULES.map(({ icon: Icon, title, text }) => (
          <Grid key={title} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card sx={{ p: 2.25, height: '100%', display: 'flex', gap: 1.5 }}>
              <Box sx={{ width: 38, height: 38, flexShrink: 0, borderRadius: 2, bgcolor: 'var(--active-pill-bg)', color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={19} />
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{title}</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>{text}</Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>

    {/* Architecture */}
    <Card sx={{ p: { xs: 2, md: 3 } }}>
      <SectionTitle title="System Architecture" subtitle="Three tiers: the browser app, the API server and the database. Solid arrows are the request, the dashed arrow is the response." />
      <ArchitectureDiagram />
    </Card>

    {/* Request lifecycle */}
    <Card sx={{ p: { xs: 2, md: 3 } }}>
      <SectionTitle title="How a Request Works" subtitle="What happens from login to seeing the result on screen." />
      <Grid container spacing={2}>
        {REQUEST_STEPS.map(({ icon: Icon, title, text }, i) => (
          <Grid key={title} size={{ xs: 12, sm: 6, md: 3 }}>
            <Box sx={{ p: 2, height: '100%', border: 1, borderColor: 'divider', borderRadius: 3, position: 'relative' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Box sx={{ width: 26, height: 26, borderRadius: '50%', bgcolor: 'primary.main', color: '#fff', fontSize: '0.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {i + 1}
                </Box>
                <Icon size={16} color="var(--text-muted)" />
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{title}</Typography>
              </Box>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>{text}</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Card>

    {/* Process flows */}
    <Card sx={{ p: { xs: 2, md: 3 } }}>
      <SectionTitle title="Process Flow · Asset Lifecycle" subtitle="How a physical asset moves between statuses. Only the Assign action can make an asset Assigned; every handover is kept on the Asset Assignments page." />
      <AssetLifecycleDiagram />
    </Card>

    <Card sx={{ p: { xs: 2, md: 3 } }}>
      <SectionTitle title="Process Flow · Stock Movement" subtitle="Every Stock In / Stock Out is checked, applied, logged and reflected in reports." />
      <StockFlowDiagram />
    </Card>

    {/* Roles + tech */}
    <Grid container spacing={2.5}>
      <Grid size={{ xs: 12, md: 7 }}>
        <Card sx={{ p: { xs: 2, md: 3 }, height: '100%' }}>
          <SectionTitle title="Who Can Do What" subtitle="Permissions are enforced by the API, not only hidden in the menu." />
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Capability</TableCell>
                  {['Admin', 'Warehouse Manager', 'Inventory Staff'].map((r) => (
                    <TableCell key={r} align="center" sx={{ fontWeight: 700, color: 'text.secondary' }}>{r}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {ROLE_ROWS.map(([cap, ...allowed]) => (
                  <TableRow key={cap}>
                    <TableCell>{cap}</TableCell>
                    {allowed.map((ok, i) => (
                      <TableCell key={i} align="center" sx={{ color: ok ? 'var(--accent-emerald)' : 'text.disabled', fontWeight: 700 }}>
                        {ok ? '✓ Yes' : '— No'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, md: 5 }}>
        <Card sx={{ p: { xs: 2, md: 3 }, height: '100%' }}>
          <SectionTitle title="Technology Stack" subtitle="Open-source tools used to build the system." />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {TECH.map((t) => <Chip key={t} label={t} variant="outlined" sx={{ fontWeight: 600 }} />)}
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 2.5, lineHeight: 1.7 }}>
            Backend: <code>python -m uvicorn app.main:app --reload</code><br />
            Frontend: <code>npm run dev</code> in <code>web-admin/</code><br />
            Tests: <code>python -m pytest tests</code>
          </Typography>
        </Card>
      </Grid>
    </Grid>
  </Box>
);
