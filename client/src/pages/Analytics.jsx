import React, { useEffect, useState, useCallback } from "react";
import {
    Box, Card, CardContent, Chip, CircularProgress, Divider,
    Grid, IconButton, Stack, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Tooltip, Typography, Tab, Tabs, Alert, AlertTitle
} from "@mui/material";
import {
    RefreshOutlined, TrendingUpOutlined, InventoryOutlined,
    WarningAmberOutlined, BarChartOutlined, LockOutlined, ScheduleOutlined
} from "@mui/icons-material";
import { axios_get_header } from "utils/requests";
import { decryptAccessToken, decryptedRoleName } from "utils/auth";
import {
    get_Analytics_revenue,
    get_Analytics_top_products,
    get_Analytics_low_stock,
    get_Analytics_summary,
    get_Analytics_near_expiry,
} from "utils/services";
import { toast } from "react-toastify";
import BreadCrumbsCmp from "components/elements/BreadcrumbsComponent";
import {
    ComposedChart, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, Legend,
    XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
    ResponsiveContainer
} from "recharts";

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const PIE_COLORS  = ["#1976d2","#ed6c02","#2e7d32","#9c27b0","#c62828","#0288d1","#5d4037","#00695c"];

// ── Tab Panel helper ────────────────────────────────────────────────────────
function TabPanel({ children, value, index }) {
    return value === index ? <Box pt={2}>{children}</Box> : null;
}

// ── Bar custom label ────────────────────────────────────────────────────────
const CustomBarLabel = ({ x, y, width, value }) => (
    <text x={x + width / 2} y={y - 4} fill="#555" textAnchor="middle" fontSize={11}>
        {value}
    </text>
);

function Analytics() {
    document.title = "InventoryIQ: Analytics";
    const token     = decryptAccessToken();
    const role_name = decryptedRoleName();
    const isWorker  = role_name === 'Staff';

    const [tab, setTab]           = useState(0);
    const [revenue,  setRevenue]  = useState([]);
    const [topProds, setTopProds] = useState([]);
    const [lowStock, setLowStock] = useState([]);
    const [summary,  setSummary]  = useState(null);
    const [nearExpiry, setNearExpiry] = useState([]);
    const [loading,  setLoading]  = useState(true);

    const fetchAll = useCallback(() => {
        if (isWorker) return;
        setLoading(true);
        Promise.allSettled([
            axios_get_header(get_Analytics_revenue,      token),
            axios_get_header(get_Analytics_top_products, token),
            axios_get_header(get_Analytics_low_stock,    token),
            axios_get_header(get_Analytics_summary,      token),
            axios_get_header(get_Analytics_near_expiry,  token),
        ]).then(([rev, top, low, sum, near]) => {
            if (rev.status === "fulfilled") setRevenue(rev.value?.data?.revenue ?? []); else { console.warn("revenue failed", rev.reason); toast.warning("Could not load revenue data."); }
            if (top.status === "fulfilled") setTopProds(top.value?.data?.top_products ?? []); else { console.warn("top_products failed", top.reason); toast.warning("Could not load top products."); }
            if (low.status === "fulfilled") setLowStock(low.value?.data?.low_stock ?? []); else { console.warn("low_stock failed", low.reason); toast.warning("Could not load low stock."); }
            if (sum.status === "fulfilled") setSummary(sum.value?.data ?? null); else { console.warn("summary failed", sum.reason); toast.warning("Could not load summary."); }
            if (near.status === "fulfilled") setNearExpiry(near.value?.data?.near_expiry ?? []); else { console.warn("near_expiry failed", near.reason); setNearExpiry([]); }
        }).finally(() => setLoading(false));
    }, [token, isWorker]);

    /* eslint-disable */
    useEffect(() => { fetchAll(); }, []);
    /* eslint-enable */

    // Chart-ready data
    const revenueChart = revenue.map(r => ({
        month: MONTH_NAMES[(r.month ?? 1) - 1],
        revenue: parseFloat(r.total_revenue ?? 0),
        orders:  r.total_orders ?? 0,
    }));

    const topChart = topProds.map(p => ({
        name:    p.name.length > 15 ? p.name.substring(0, 15) + "…" : p.name,
        sold:    p.total_sold,
        revenue: parseFloat(p.total_revenue ?? 0),
    }));

    const catChart = (summary?.by_category ?? []).map((c, i) => ({
        name:  c.category,
        value: c.total_stock,
        fill:  PIE_COLORS[i % PIE_COLORS.length],
    }));

    if (isWorker) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <Alert severity="warning" icon={<LockOutlined />} sx={{ maxWidth: 500, borderRadius: 3 }}>
                    <AlertTitle sx={{ fontWeight: 700 }}>Access Restricted</AlertTitle>
                    The Analytics module is only available to <strong>Boss (Administrator / Staff Manager)</strong> accounts.
                    Please contact your administrator for access.
                </Alert>
            </Box>
        );
    }

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <Stack spacing={1} alignItems="center">
                    <CircularProgress size={48} />
                    <Typography variant="body2" color="text.secondary">Loading analytics…</Typography>
                </Stack>
            </Box>
        );
    }

    return (
        <Grid container spacing={3} sx={{ px: 3, pb: 5 }} mt={{ xs: 2, sm: 0 }}>

            {/* ── Header ─ */}
            <Grid item xs={12}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <BreadCrumbsCmp data={[{ text: "Dashboard", link: "../dashboard" }, { text: "Reports", link: "../reports" }, { text: "Analytics" }]} />
                    <Tooltip title="Refresh">
                        <IconButton onClick={fetchAll} color="primary">
                            <RefreshOutlined />
                        </IconButton>
                    </Tooltip>
                </Stack>
            </Grid>

            {/* ── Summary KPIs ─ */}
            {summary && (
                <Grid item xs={12}>
                    <Grid container spacing={2}>
                        {[
                            { label: "Total Products",    value: summary.summary.total_products,                          icon: <InventoryOutlined />,   color: "#1976d2" },
                            { label: "Inventory Value",   value: `$${parseFloat(summary.summary.total_value).toLocaleString(undefined,{minimumFractionDigits:2})}`, icon: <TrendingUpOutlined />, color: "#2e7d32" },
                            { label: "Total Revenue",     value: `$${parseFloat(summary.summary.total_revenue).toLocaleString(undefined,{minimumFractionDigits:2})}`, icon: <BarChartOutlined />, color: "#9c27b0" },
                            { label: "Avg Order Value",   value: `$${parseFloat(summary.summary.avg_order_value).toFixed(2)}`, icon: <TrendingUpOutlined />, color: "#ed6c02" },
                        ].map((kpi, i) => (
                            <Grid item xs={12} sm={6} md={3} key={i}>
                                <Card raised sx={{ borderRadius: 3, borderLeft: `5px solid ${kpi.color}`, background: `linear-gradient(135deg, ${kpi.color}15 0%, ${kpi.color}05 100%)` }}>
                                    <CardContent>
                                        <Stack direction="row" alignItems="center" spacing={2}>
                                            <Box sx={{ bgcolor: `${kpi.color}22`, borderRadius: "50%", p: 1.2, color: kpi.color }}>
                                                {kpi.icon}
                                            </Box>
                                            <Box>
                                                <Typography variant="h6" fontWeight={700} color={kpi.color}>{kpi.value}</Typography>
                                                <Typography variant="body2" color="text.secondary">{kpi.label}</Typography>
                                            </Box>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Grid>
            )}

            {/* ── Tabs ─ */}
            <Grid item xs={12}>
                <Card raised sx={{ borderRadius: 3 }}>
                    <CardContent>
                        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: "1px solid #e0e0e0" }}>
                            <Tab label="Revenue Trend"   icon={<TrendingUpOutlined />} iconPosition="start" />
                            <Tab label="Top Products"    icon={<BarChartOutlined />}   iconPosition="start" />
                            <Tab label="Stock by Category" icon={<InventoryOutlined />} iconPosition="start" />
                        </Tabs>

                        {/* Revenue Trend */}
                        <TabPanel value={tab} index={0}>
                            <Typography variant="body2" color="text.secondary" mb={2}>
                                Monthly delivered revenue for {new Date().getFullYear()}
                            </Typography>
                            {revenueChart.length === 0 ? (
                                <Typography color="text.secondary">No delivery revenue data yet.</Typography>
                            ) : (
                                <ResponsiveContainer width="100%" height={320}>
                                    <ComposedChart data={revenueChart}>
                                        <defs>
                                            <linearGradient id="revColor" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%"  stopColor="#1976d2" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#1976d2" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <RechartTooltip formatter={(v, n) => [`$${v.toFixed(2)}`, n === "revenue" ? "Revenue" : "Orders"]} />
                                        <Legend />
                                        <Area type="monotone" dataKey="revenue" stroke="#1976d2" fill="url(#revColor)" strokeWidth={2} name="Revenue" />
                                        <Bar dataKey="orders" fill="#ed6c02" name="Orders" />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            )}
                        </TabPanel>

                        {/* Top Products */}
                        <TabPanel value={tab} index={1}>
                            <Typography variant="body2" color="text.secondary" mb={2}>
                                Top 10 best-selling products by quantity delivered
                            </Typography>
                            {topChart.length === 0 ? (
                                <Typography color="text.secondary">No delivery data yet.</Typography>
                            ) : (
                                <ResponsiveContainer width="100%" height={320}>
                                    <BarChart data={topChart} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis type="number" />
                                        <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                                        <RechartTooltip />
                                        <Bar dataKey="sold" fill="#1976d2" name="Units Sold" label={<CustomBarLabel />} radius={[0,4,4,0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </TabPanel>

                        {/* Stock by Category */}
                        <TabPanel value={tab} index={2}>
                            <Typography variant="body2" color="text.secondary" mb={2}>
                                Current stock levels grouped by product category
                            </Typography>
                            {catChart.length === 0 ? (
                                <Typography color="text.secondary">No category data yet.</Typography>
                            ) : (
                                <Grid container spacing={2} alignItems="center">
                                    <Grid item xs={12} md={5}>
                                        <ResponsiveContainer width="100%" height={280}>
                                            <PieChart>
                                                <Pie data={catChart} dataKey="value" nameKey="name" outerRadius={100} labelLine={false}>
                                                    {catChart.map((c, i) => (
                                                        <Cell key={i} fill={c.fill} />
                                                    ))}
                                                </Pie>
                                                <RechartTooltip />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </Grid>
                                    <Grid item xs={12} md={7}>
                                        <TableContainer>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                                                        <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                                                        <TableCell sx={{ fontWeight: 700 }}>Products</TableCell>
                                                        <TableCell sx={{ fontWeight: 700 }}>Total Stock</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {summary?.by_category?.map((c, i) => (
                                                        <TableRow key={i} hover>
                                                            <TableCell>
                                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                                    <Box sx={{ width:12, height:12, borderRadius:2, bgcolor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                                                    <Typography variant="body2">{c.category}</Typography>
                                                                </Stack>
                                                            </TableCell>
                                                            <TableCell>{c.product_count}</TableCell>
                                                            <TableCell>{parseInt(c.total_stock).toLocaleString()}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Grid>
                                </Grid>
                            )}
                        </TabPanel>
                    </CardContent>
                </Card>
            </Grid>

            {/* ── Restock Recommendations ─ */}
            <Grid item xs={12}>
                <Card raised sx={{ borderRadius: 3 }}>
                    <CardContent>
                        <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                            <WarningAmberOutlined sx={{ color: "#ed6c02" }} />
                            <Typography variant="h6" fontWeight={700}>Restock Recommendations</Typography>
                            <Chip label={`${lowStock.length} products`} size="small" color="warning" />
                        </Stack>
                        {lowStock.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                                🎉 All products are well-stocked! No restocking needed.
                            </Typography>
                        ) : (
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: "#fff3e0" }}>
                                            {["Product","SKU","Category","Current Stock","Recommended Restock","Restock Cost"].map(h => (
                                                <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {lowStock.map((p) => (
                                            <TableRow key={p.id} hover>
                                                <TableCell sx={{ fontWeight: 600 }}>{p.name}</TableCell>
                                                <TableCell sx={{ fontSize: 12, color: "text.secondary" }}>{p.sku}</TableCell>
                                                <TableCell><Chip label={p.category} size="small" variant="outlined" /></TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={p.stocks}
                                                        size="small"
                                                        color={p.stocks === 0 ? "error" : "warning"}
                                                        sx={{ fontWeight: 700 }}
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 600, color: "#1976d2" }}>
                                                    +{p.recommended_restock} units
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 600, color: "#2e7d32" }}>
                                                    ${parseFloat(p.restock_cost).toFixed(2)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </CardContent>
                </Card>
            </Grid>

            {/* ── Near Expiry (supplier contracts) ─ */}
            <Grid item xs={12}>
                <Card raised sx={{ borderRadius: 3 }}>
                    <CardContent>
                        <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                            <ScheduleOutlined sx={{ color: "#c62828" }} />
                            <Typography variant="h6" fontWeight={700}>Near Expiry</Typography>
                            <Chip label="Supplier contracts within 30 days" size="small" variant="outlined" />
                        </Stack>
                        {nearExpiry.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                                No supplier contracts expiring in the next 30 days.
                            </Typography>
                        ) : (
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: "#ffebee" }}>
                                            <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Supplier</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Contact</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Expiry Date</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Days Left</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Status</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {nearExpiry.map((row) => (
                                            <TableRow key={row.id} hover>
                                                <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                                                <TableCell sx={{ fontSize: 12, color: "text.secondary" }}>{row.contact}</TableCell>
                                                <TableCell sx={{ fontSize: 12 }}>{row.expiry_date}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={row.days_left <= 0 ? "Expired" : `${row.days_left} days`}
                                                        size="small"
                                                        color={row.status === "expired" ? "error" : row.status === "soon" ? "warning" : "default"}
                                                        sx={{ fontWeight: 700 }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={row.status === "expired" ? "EXPIRED" : row.status === "soon" ? "SOON" : "WARNING"}
                                                        size="small"
                                                        color={row.status === "expired" ? "error" : "warning"}
                                                        variant="filled"
                                                    />
                                                </TableCell>
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

export default Analytics;
