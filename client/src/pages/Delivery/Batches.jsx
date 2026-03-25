import React, { useEffect, useState, useCallback } from "react";
import {
    Box, Card, CardContent, Chip, CircularProgress, Collapse,
    Grid, IconButton, Stack, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Tooltip, Typography, Paper
} from "@mui/material";
import {
    RefreshOutlined, ExpandMoreOutlined, ExpandLessOutlined,
    LocalShippingOutlined, InventoryOutlined, CheckCircleOutlined
} from "@mui/icons-material";
import { axios_get_header } from "utils/requests";
import { decryptAccessToken } from "utils/auth";
import { get_Batches, get_Batch } from "utils/services";
import { toast } from "react-toastify";
import BreadCrumbsCmp from "components/elements/BreadcrumbsComponent";
import { crumbsHelper } from "utils/helper";
import TableComponentV2 from "components/elements/Tables/TableComponentV2";
import useDebounce from "hooks/useDebounce";
import { PrimaryColorBtn } from "components/elements/ButtonsComponent";

// ── Status Chip ───────────────────────────────────────────────────────────────
function BatchStatusChip({ status }) {
    const cfg = {
        completed:  { label: "Completed",  color: "success", icon: <CheckCircleOutlined fontSize="small" /> },
        in_transit: { label: "In Transit", color: "info",    icon: <LocalShippingOutlined fontSize="small" /> },
        pending:    { label: "Pending",     color: "warning", icon: <InventoryOutlined fontSize="small" /> },
        empty:      { label: "Empty",       color: "default", icon: null },
    };
    const c = cfg[status] ?? cfg.pending;
    return <Chip label={c.label} color={c.color} size="small" icon={c.icon} sx={{ fontWeight: 600 }} />;
}

function DeliveryStatusLabel({ status }) {
    const map = { 0: ["For Pickup","warning"], 1: ["On the Way","info"], 2: ["Delivered","success"] };
    const [label, color] = map[status] ?? ["Unknown","default"];
    return <Chip label={label} color={color} size="small" />;
}

// ── Expandable detail row ─────────────────────────────────────────────────────
function BatchDetailRow({ batchId, token, open }) {
    const [detail,   setDetail]   = useState(null);
    const [loading,  setLoading]  = useState(false);

    useEffect(() => {
        if (!open || detail) return;
        setLoading(true);
        axios_get_header(get_Batch + batchId, token)
            .then(res => setDetail(res.data))
            .catch(() => toast.error("Failed to load batch details."))
            .finally(() => setLoading(false));
    }, [open]); // eslint-disable-line

    return (
        <TableRow>
            <TableCell colSpan={8} sx={{ p: 0, border: 0 }}>
                <Collapse in={open} timeout="auto" unmountOnExit>
                    <Box sx={{ mx: 3, my: 2, bgcolor: "#f9f9f9", borderRadius: 2, p: 2 }}>
                        {loading ? (
                            <CircularProgress size={24} />
                        ) : detail ? (
                            <>
                                <Stack direction="row" spacing={3} mb={1.5}>
                                    <Typography variant="caption" color="text.secondary">
                                        <b>Total Items:</b> {detail.totals.total_items}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        <b>Total Qty:</b> {detail.totals.total_qty}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        <b>Total Revenue:</b> ${parseFloat(detail.totals.total_revenue).toFixed(2)}
                                    </Typography>
                                </Stack>
                                <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e0e0e0" }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: "#eeeeee" }}>
                                                {["PO Number","Product","Customer","Qty","Price","Subtotal","Status"].map(h => (
                                                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11 }}>{h}</TableCell>
                                                ))}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {detail.batch.product_delivery?.map((item) => (
                                                <TableRow key={item.id} hover>
                                                    <TableCell sx={{ fontSize: 11 }}>{item.po_number}</TableCell>
                                                    <TableCell sx={{ fontSize: 11 }}>{item.products?.name ?? "—"}</TableCell>
                                                    <TableCell sx={{ fontSize: 11 }}>
                                                        {(item.customers?.firstname ?? "") + " " + (item.customers?.lastname ?? "")}
                                                    </TableCell>
                                                    <TableCell sx={{ fontSize: 11 }}>{item.quantity}</TableCell>
                                                    <TableCell sx={{ fontSize: 11 }}>${parseFloat(item.price).toFixed(2)}</TableCell>
                                                    <TableCell sx={{ fontSize: 11 }}>${parseFloat(item.subtotal).toFixed(2)}</TableCell>
                                                    <TableCell><DeliveryStatusLabel status={item.delivery_status} /></TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </>
                        ) : (
                            <Typography variant="body2" color="text.secondary">No details found.</Typography>
                        )}
                    </Box>
                </Collapse>
            </TableCell>
        </TableRow>
    );
}

// ── Main Batches Page ─────────────────────────────────────────────────────────
function Batches() {
    document.title = "InventoryIQ: Logistics – Batches";
    const token = decryptAccessToken();

    const [rows,        setRows]        = useState([]);
    const [loading,     setLoading]     = useState(false);
    const [expandedId,  setExpandedId]  = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [maxPage,     setMaxPage]     = useState(1);
    const [search,      setSearch]      = useState("");
    const debounceSearch = useDebounce(search, 300);

    const fetchBatches = useCallback(() => {
        setLoading(true);
        axios_get_header(
            `${get_Batches}?page=${currentPage}&per_page=${rowsPerPage}&search=${debounceSearch}`,
            token
        )
        .then(res => {
            setRows(res.data.data ?? []);
            setMaxPage(res.data.last_page ?? 1);
        })
        .catch(() => toast.error("Failed to load batches."))
        .finally(() => setLoading(false));
    }, [token, currentPage, rowsPerPage, debounceSearch]);

    /* eslint-disable */
    useEffect(() => { fetchBatches(); }, [currentPage, rowsPerPage, debounceSearch]);
    /* eslint-enable */

    const handleRefresh = () => {
        setCurrentPage(1);
        setSearch("");
        setExpandedId(null);
        fetchBatches();
    };

    // Column definitions for TableComponentV2
    const columns = [
        {
            field: "expand",
            headerName: "",
            width: 50,
            renderCell: (params) => (
                <IconButton
                    size="small"
                    onClick={() => setExpandedId(expandedId === params.row.id ? null : params.row.id)}
                >
                    {expandedId === params.row.id ? <ExpandLessOutlined /> : <ExpandMoreOutlined />}
                </IconButton>
            ),
            sortable: false,
        },
        { field: "batch_num",      headerName: "Batch Number",   flex: 1, fontWeight: 600 },
        {
            field: "overall_status",
            headerName: "Status",
            flex: 1,
            renderCell: (params) => <BatchStatusChip status={params.row.overall_status} />,
        },
        { field: "total_items",    headerName: "Total Items",    flex: 1, valueGetter: (p) => p.row.total_items ?? 0 },
        { field: "product_delivery_sum_quantity", headerName: "Total Qty", flex: 1, valueGetter: (p) => p.row.product_delivery_sum_quantity ?? 0 },
        {
            field: "product_delivery_sum_subtotal",
            headerName: "Revenue",
            flex: 1,
            valueGetter: (p) => `$${parseFloat(p.row.product_delivery_sum_subtotal ?? 0).toFixed(2)}`,
        },
        {
            field: "status_breakdown",
            headerName: "Delivery Breakdown",
            flex: 1.5,
            renderCell: (params) => {
                const b = params.row.status_breakdown ?? {};
                return (
                    <Stack direction="row" spacing={0.5}>
                        {b.for_pickup  > 0 && <Chip label={`${b.for_pickup} Pending`}    size="small" color="warning" />}
                        {b.on_the_way  > 0 && <Chip label={`${b.on_the_way} In Transit`} size="small" color="info" />}
                        {b.delivered   > 0 && <Chip label={`${b.delivered} Done`}         size="small" color="success" />}
                    </Stack>
                );
            },
            sortable: false,
        },
        {
            field: "created_at",
            headerName: "Created",
            flex: 1,
            valueGetter: (p) => new Date(p.row.created_at).toLocaleDateString(),
        },
    ];

    return (
        <Grid container justifyContent="flex-start" alignItems="flex-start" sx={{ px: 2, mt: 3 }} display="flex">
            {/* Header */}
            <Grid container direction="row" justifyContent="flex-start" alignItems="center"
                  columnSpacing={{ lg: 1, xl: 1 }} rowSpacing={2} sx={{ mr: .3, ml: 1, mb: 1 }}>
                <Grid item lg={6} xl={6} sm={6} xs={12}>
                    <BreadCrumbsCmp data={crumbsHelper("Batches", "Logistics", "../delivery")} />
                </Grid>
                <Grid item lg={6} xl={6} sm={6} xs={12}>
                    <Grid container direction="row" justifyContent="flex-end" alignItems="center">
                        <PrimaryColorBtn
                            displayText="Refresh"
                            endIcon={<RefreshOutlined fontSize="small" />}
                            onClick={handleRefresh}
                        />
                    </Grid>
                </Grid>
            </Grid>

            {/* Summary cards */}
            <Grid container spacing={2} sx={{ ml: 1, mb: 2, mr: 1 }}>
                {[
                    { label: "Total Batches",     value: rows.length > 0 ? "—" : 0, color: "#1976d2" },
                    { label: "Completed Batches", value: rows.filter(r => r.overall_status === "completed").length, color: "#2e7d32" },
                    { label: "In Transit",        value: rows.filter(r => r.overall_status === "in_transit").length, color: "#0288d1" },
                    { label: "Pending",           value: rows.filter(r => r.overall_status === "pending").length,   color: "#ed6c02" },
                ].map((s, i) => (
                    <Grid item xs={6} sm={3} key={i}>
                        <Card raised sx={{ borderRadius: 2, borderLeft: `4px solid ${s.color}` }}>
                            <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                                <Typography variant="h6" fontWeight={700} color={s.color}>{s.value}</Typography>
                                <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Custom expandable table */}
            {loading ? (
                <Grid item xs={12} display="flex" justifyContent="center" mt={4}>
                    <CircularProgress />
                </Grid>
            ) : (
                <Grid item xs={12} sx={{ mx: 1 }}>
                    <Card raised sx={{ borderRadius: 3 }}>
                        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                                            <TableCell width={50} />
                                            {["Batch Number","Status","Total Items","Total Qty","Revenue","Delivery Breakdown","Date Created"].map(h => (
                                                <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {rows.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={8} align="center" sx={{ py: 4, color: "text.secondary" }}>
                                                    No batches found. Create a delivery to see batches here.
                                                </TableCell>
                                            </TableRow>
                                        ) : rows.map((row) => (
                                            <React.Fragment key={row.id}>
                                                <TableRow hover>
                                                    <TableCell>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
                                                        >
                                                            {expandedId === row.id ? <ExpandLessOutlined /> : <ExpandMoreOutlined />}
                                                        </IconButton>
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>{row.batch_num}</TableCell>
                                                    <TableCell><BatchStatusChip status={row.overall_status} /></TableCell>
                                                    <TableCell sx={{ fontSize: 12 }}>{row.total_items ?? 0}</TableCell>
                                                    <TableCell sx={{ fontSize: 12 }}>{row.product_delivery_sum_quantity ?? 0}</TableCell>
                                                    <TableCell sx={{ fontSize: 12, fontWeight: 600, color: "#2e7d32" }}>
                                                        ${parseFloat(row.product_delivery_sum_subtotal ?? 0).toFixed(2)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                                            {(row.status_breakdown?.for_pickup > 0) && <Chip label={`${row.status_breakdown.for_pickup} Pending`} size="small" color="warning" />}
                                                            {(row.status_breakdown?.on_the_way > 0) && <Chip label={`${row.status_breakdown.on_the_way} Transit`} size="small" color="info" />}
                                                            {(row.status_breakdown?.delivered > 0) && <Chip label={`${row.status_breakdown.delivered} Done`} size="small" color="success" />}
                                                        </Stack>
                                                    </TableCell>
                                                    <TableCell sx={{ fontSize: 12 }}>
                                                        {new Date(row.created_at).toLocaleDateString()}
                                                    </TableCell>
                                                </TableRow>
                                                <BatchDetailRow
                                                    batchId={row.id}
                                                    token={token}
                                                    open={expandedId === row.id}
                                                />
                                            </React.Fragment>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>
                </Grid>
            )}
        </Grid>
    );
}

export default Batches;
