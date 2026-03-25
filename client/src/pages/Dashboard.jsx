import React, { useEffect, useState, useCallback } from "react";
import {
    Box, Card, CardContent, Chip, CircularProgress, Divider,
    Grid, IconButton, Stack, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Tooltip, Typography
} from "@mui/material";
import {
    InventoryOutlined, LocalShippingOutlined, MonetizationOnOutlined,
    PeopleOutlined, RefreshOutlined, WarehouseOutlined,
    WarningAmberOutlined, DownloadOutlined, TrendingUpOutlined,
    InventoryRounded
} from "@mui/icons-material";
import { axios_get_header, axios_get_header_download } from "utils/requests";
import { decryptAccessToken } from "utils/auth";
import {
    get_Dashboard_stats,
    export_Dashboard_csv
} from "utils/services";
import { toast } from "react-toastify";
import BreadCrumbsCmp from "components/elements/BreadcrumbsComponent";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
    ResponsiveContainer, BarChart, Bar, Legend
} from "recharts";

// Month name helper
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color, subtitle }) {
    return (
        <Card
            raised
            sx={{
                borderRadius: 3,
                background: `linear-gradient(135deg, ${color}22 0%, ${color}11 100%)`,
                borderLeft: `5px solid ${color}`,
                transition: "transform 0.2s",
                "&:hover": { transform: "translateY(-3px)" }
            }}
        >
            <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                    <Box
                        sx={{
                            bgcolor: `${color}22`,
                            borderRadius: "50%",
                            p: 1.2,
                            display: "flex",
                            color: color
                        }}
                    >
                        {icon}
                    </Box>
                    <Box>
                        <Typography variant="h5" fontWeight={700} color={color}>
                            {value ?? "—"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" fontWeight={500}>
                            {label}
                        </Typography>
                        {subtitle && (
                            <Typography variant="caption" color="text.disabled">
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
}

// ── Status Chip ───────────────────────────────────────────────────────────────
function DeliveryChip({ status }) {
    const cfg = {
        0: { label: "For Pickup", color: "warning" },
        1: { label: "On the Way", color: "info" },
        2: { label: "Delivered",  color: "success" },
    };
    const c = cfg[status] ?? { label: "Unknown", color: "default" };
    return <Chip label={c.label} color={c.color} size="small" />;
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
function Dashboard() {
    document.title = "InventoryIQ: Dashboard";
    const token      = decryptAccessToken();
    const [stats,   setStats]   = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = useCallback(() => {
        setLoading(true);
        axios_get_header(get_Dashboard_stats, token)
            .then(res => setStats(res.data))
            .catch(err => {
                console.error(err);
                toast.error("Failed to load dashboard data.");
            })
            .finally(() => setLoading(false));
    }, [token]);

    /* eslint-disable */
    useEffect(() => { fetchStats(); }, []);
    /* eslint-enable */

    const handleExportCsv = () => {
        axios_get_header_download(export_Dashboard_csv, token)
            .then((res) => {
                const blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                const cd = res.headers["content-disposition"];
                let filename = "inventory_stock.csv";
                if (cd && cd.includes("filename=")) {
                    const m = cd.match(/filename="?([^";\n]+)"?/i);
                    if (m?.[1]) filename = m[1].trim();
                }
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
                toast.success("Stock list downloaded.");
            })
            .catch(() => toast.error("Could not download CSV. Try again."));
    };

    // Build chart data from monthly_revenue
    const chartData = stats?.monthly_revenue?.map(r => ({
        month: MONTHS[(r.month ?? 1) - 1],
        revenue: parseFloat(r.revenue ?? 0),
        orders: r.deliveries ?? 0,
    })) ?? [];

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <Stack spacing={1} alignItems="center">
                    <CircularProgress size={48} />
                    <Typography variant="body2" color="text.secondary">Loading dashboard…</Typography>
                </Stack>
            </Box>
        );
    }

    const kpis = stats?.kpis ?? {};

    return (
        <Grid container spacing={3} sx={{ px: 3, pb: 5 }} mt={{ xs: 2, sm: 0 }}>

            {/* ── Header ─ */}
            <Grid item xs={12}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <BreadCrumbsCmp data={[{ text: "Dashboard" }]} />
                    <Stack direction="row" spacing={1}>
                        <Tooltip title="Export CSV">
                            <IconButton onClick={handleExportCsv} color="primary">
                                <DownloadOutlined />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Refresh">
                            <IconButton onClick={fetchStats} color="primary">
                                <RefreshOutlined />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Stack>
            </Grid>

            {/* ── KPI Cards ─ */}
            <Grid item xs={12}>
                <Grid container spacing={2}>
                    {[
                        {
                            label: "Total Products",
                            value: kpis.total_products?.toLocaleString(),
                            icon: <InventoryOutlined />,
                            color: "#1976d2",
                            subtitle: `${kpis.out_of_stock} out of stock`
                        },
                        {
                            label: "Low Stock Items",
                            value: kpis.low_stock,
                            icon: <WarningAmberOutlined />,
                            color: "#ed6c02",
                            subtitle: "Below 20 units"
                        },
                        {
                            label: "Total Revenue",
                            value: `$${parseFloat(kpis.total_revenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                            icon: <MonetizationOnOutlined />,
                            color: "#2e7d32",
                            subtitle: "From completed deliveries"
                        },
                        {
                            label: "Pending Deliveries",
                            value: kpis.pending_deliveries,
                            icon: <LocalShippingOutlined />,
                            color: "#9c27b0",
                            subtitle: "For pickup + on the way"
                        },
                        {
                            label: "Total Batches",
                            value: kpis.total_batches,
                            icon: <InventoryRounded />,
                            color: "#0288d1",
                            subtitle: "Delivery batches created"
                        },
                        {
                            label: "Total Customers",
                            value: kpis.total_customers,
                            icon: <PeopleOutlined />,
                            color: "#c62828",
                            subtitle: "Registered customers"
                        },
                        {
                            label: "Total Suppliers",
                            value: kpis.total_suppliers,
                            icon: <WarehouseOutlined />,
                            color: "#5d4037",
                            subtitle: "Active suppliers"
                        },
                        {
                            label: "Stock Value",
                            value: `—`,
                            icon: <TrendingUpOutlined />,
                            color: "#00695c",
                            subtitle: "Go to Analytics for details"
                        },
                    ].map((card, i) => (
                        <Grid item xs={12} sm={6} md={3} key={i}>
                            <StatCard {...card} />
                        </Grid>
                    ))}
                </Grid>
            </Grid>

            {/* ── Revenue Chart ─ */}
            {chartData.length > 0 && (
                <Grid item xs={12} md={8}>
                    <Card raised sx={{ borderRadius: 3 }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight={700} mb={2}>
                                Monthly Revenue — {new Date().getFullYear()}
                            </Typography>
                            <ResponsiveContainer width="100%" height={240}>
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#1976d2" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#1976d2" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <RechartTooltip formatter={(v) => [`$${v.toFixed(2)}`, "Revenue"]} />
                                    <Area type="monotone" dataKey="revenue" stroke="#1976d2" fill="url(#revGrad)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </Grid>
            )}

            {/* ── Low Stock Alert Panel ─ */}
            <Grid item xs={12} md={chartData.length > 0 ? 4 : 12}>
                <Card raised sx={{ borderRadius: 3, maxHeight: 340, overflowY: "auto" }}>
                    <CardContent>
                        <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                            <WarningAmberOutlined sx={{ color: "#ed6c02" }} />
                            <Typography variant="h6" fontWeight={700}>Low Stock Alerts</Typography>
                        </Stack>
                        {stats?.low_stock_products?.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                                🎉 All products are well-stocked!
                            </Typography>
                        ) : (
                            stats?.low_stock_products?.map((p) => (
                                <Box key={p.id} sx={{ py: 0.8, borderBottom: "1px solid #f0f0f0" }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Box>
                                            <Typography variant="body2" fontWeight={600}>{p.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">SKU: {p.sku}</Typography>
                                        </Box>
                                        <Chip
                                            label={`${p.stocks} left`}
                                            size="small"
                                            color={p.stocks === 0 ? "error" : "warning"}
                                            sx={{ fontWeight: 700 }}
                                        />
                                    </Stack>
                                </Box>
                            ))
                        )}
                    </CardContent>
                </Card>
            </Grid>

            {/* ── Recent Deliveries Table ─ */}
            <Grid item xs={12}>
                <Card raised sx={{ borderRadius: 3 }}>
                    <CardContent>
                        <Typography variant="h6" fontWeight={700} mb={2}>
                            Recent Deliveries
                        </Typography>
                        {(stats?.recent_deliveries?.length ?? 0) === 0 ? (
                            <Typography variant="body2" color="text.secondary">No delivery records yet.</Typography>
                        ) : (
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                                            {["PO Number","Batch","Product","Customer","Qty","Subtotal","Status"].map(h => (
                                                <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {(stats?.recent_deliveries ?? []).map((d) => (
                                            <TableRow key={d.id} hover>
                                                <TableCell sx={{ fontSize: 12 }}>{d.po_number}</TableCell>
                                                <TableCell sx={{ fontSize: 12 }}>{d.batch_num}</TableCell>
                                                <TableCell sx={{ fontSize: 12 }}>{d.product_name}</TableCell>
                                                <TableCell sx={{ fontSize: 12 }}>{d.customer_name}</TableCell>
                                                <TableCell sx={{ fontSize: 12 }}>{d.quantity}</TableCell>
                                                <TableCell sx={{ fontSize: 12 }}>${parseFloat(d.subtotal).toFixed(2)}</TableCell>
                                                <TableCell><DeliveryChip status={d.delivery_status} /></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </CardContent>
                </Card>
            </Grid>

        </Grid>
    );
}

export default Dashboard;
