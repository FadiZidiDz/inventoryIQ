import {
    CancelOutlined,
    DeleteRounded,
    DownloadRounded,
    EditRounded,
    LibraryAddOutlined,
    RefreshOutlined,
    Inventory2Outlined
} from "@mui/icons-material";
import {
    Button,
    Card,
    CardContent,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    IconButton,
    TextField,
    Tooltip,
    Typography
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import React, { useEffect, useState } from "react";
import {
    axios_delete_header,
    axios_get_header,
    axios_patch_header,
    axios_post_header_file
} from 'utils/requests';
import { decryptAccessToken, decryptedRoleName } from "utils/auth";
import { toast } from "react-toastify";
import BreadCrumbsCmp from "components/elements/BreadcrumbsComponent";
import { inventoryCrumbs } from "utils/breadCrumbs";
import {
    get_Products,
    get_Parent_products,
    get_Product,
    update_Product,
    update_Product_quantity,
    add_Product,
    remove_Product,
    get_Suppliers,
    get_Categories,
    get_Categories_warehouses,
    get_Parent_products_exclude_self,
    download_Product_image
} from 'utils/services';
import { apiGetHelper, decimalNumRegex, fileNameSplit, firstCap, nullCheck, pathCleaner, setData, setErrorHelper, wholeNumRegex } from "utils/helper";
import AddUpdateContent from "components/pages/Inventory/Products/Add_Update";
import { ErrorColorBtn, PrimaryColorLoadingBtn } from "components/elements/ButtonsComponent";
import Remove from "components/pages/Inventory/Products/Remove";

function Products() {
    document.title = "InventoryIQ: Inventory Control - Inventory Items";
    const decrypted_access_token = decryptAccessToken();
    const role_name = decryptedRoleName();
    const isAdmin = role_name === 'Administrator';
    const try_again = 'Oops, something went wrong. Please try again later.';

    const renderActionButtons = (params) => {
        if (!isAdmin) {
            return (
                <div>
                    <IconButton onClick={() => openQtyDialog(params.value, params.row.stocks, params.row.name)} color="primary" sx={{ ml: 1 }}>
                        <Tooltip title="Update stock only" placement="bottom" arrow>
                            <Inventory2Outlined fontSize="small" />
                        </Tooltip>
                    </IconButton>
                </div>
            );
        }
        return (
            <div>
                <IconButton onClick={() => get_product(params.value, 1)} color="primary" sx={{ ml: 1 }}>
                    <Tooltip title="Edit product" placement="bottom" arrow><EditRounded fontSize="small"/></Tooltip>
                </IconButton>
                <IconButton onClick={() => get_product(params.value, 0)} color="error" sx={{ ml: 1 }}>
                    <Tooltip title="Remove product" placement="bottom" arrow><DeleteRounded fontSize="small"/></Tooltip>
                </IconButton>
                {params.row.imageUrl ? (
                    <IconButton onClick={() => download(params.value)} color="primary" sx={{ ml: 1 }}>
                        <Tooltip title="Download picture" placement="bottom" arrow><DownloadRounded fontSize="small"/></Tooltip>
                    </IconButton>
                ) : null}
            </div>
        );
    }

    const columns = [
        {
            field: 'imageUrl',
            headerName: 'Picture',
            width: 80,
            sortable: false,
            renderCell: (params) =>
                params.value ? (
                    <img src={params.value} alt="" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 4 }} />
                ) : (
                    <Typography variant="caption" color="text.secondary">—</Typography>
                ),
        },
        { field: 'name', headerName: 'Name', flex: 1, minWidth: 140 },
        { field: 'price', headerName: 'Price', width: 100 },
        { field: 'stocks', headerName: 'Stocks', width: 90 },
        { field: 'id', headerName: 'Actions', minWidth: 160, renderCell: renderActionButtons },
    ];
    
    const initialFormData = {
        image: '',
        image_name: '',
        name: '',
        stocks: 1,
        barcode: '',
        price: 1,
        description: '',
        is_variant: 0,
        parent_product_id: '',
        category_id: '',
        warehouse_id: '',
        suppliers: [],
        warranty_info: ''
    };
    const initialFormDataError = {
        image_name: false,
        name: false,
        barcode: false,
        stocks: false,
        price: false,
        is_variant: false,
        description: false,
        category_id: false,
        warehouse_id: false,
        parent_product_id: false,
        suppliers: false
    };
    const initialFormDataHelperText = {
        image_name: '',
        name: '',
        barcode: '',
        stocks: '',
        price: '',
        description: ''
    };

    const [rows, setRows] = useState([]);
    const [dialog, setDialog] = useState(false);
    const [removeDialog, setRemoveDialog] = useState(false);
    const [suppliers, setSuppliers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loadingTable, setLoadingTable] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editIndex, setEditIndex] = useState(0); // 0 = add, 1 = edit, 2 = view
    const [parentProducts, setParentProducts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [imgSrc, setImgSrc] = useState('');
    const [formData, setFormData] = useState(initialFormData);
    const [formDataError, setFormDataError] = useState(initialFormDataError);
    const [formDataHelperText, setFormDataHelperText] = useState(initialFormDataHelperText);

    // Worker-only: quantity edit dialog state
    const [qtyDialog, setQtyDialog]         = useState(false);
    const [qtyProductId, setQtyProductId]   = useState(null);
    const [qtyProductName, setQtyProductName] = useState('');
    const [qtyValue, setQtyValue]           = useState('');
    const [qtyLoading, setQtyLoading]       = useState(false);
    const [qtyError, setQtyError]           = useState('');

    const openQtyDialog = (id, currentStocks, name) => {
        setQtyProductId(id);
        setQtyProductName(name);
        setQtyValue(currentStocks);
        setQtyError('');
        setQtyDialog(true);
    };

    const handleQtySubmit = () => {
        const val = parseInt(qtyValue, 10);
        if (isNaN(val) || val < 0) {
            setQtyError('Please enter a valid non-negative whole number.');
            return;
        }
        setQtyLoading(true);
        axios_patch_header(`${update_Product_quantity}${qtyProductId}`, { stocks: val }, decrypted_access_token)
            .then(res => {
                toast.success(res.data.message);
                setQtyDialog(false);
                get_products();
            })
            .catch(err => {
                console.error(err);
                toast.error(try_again);
            })
            .finally(() => setQtyLoading(false));
    };

    // get all the products
    const get_products = () => {
        setLoadingTable(true);
        axios_get_header(get_Products, decrypted_access_token)
        .then(response => {
            setLoadingTable(false);
            const data = response.data;
            const baseImg = process.env.REACT_APP_API_BASE_IMG_URL || '';
            const transformedData = data.product_supplier.map(product_supplier => ({
                id: product_supplier?.id,
                name: product_supplier?.name,
                stocks: product_supplier?.stocks,
                price: product_supplier?.price,
                imageUrl: product_supplier?.image
                    ? `${baseImg}${pathCleaner(product_supplier.image)}`
                    : '',
            }));
            setRows(transformedData);
        })
        .catch(error => { console.log(error); setLoadingTable(false); });
    };

    /* eslint-disable */
    useEffect(() => { get_products(); }, []);
    /* eslint-disable */

    // get all suppliers list
    const get_suppliers = () => {
        apiGetHelper(get_Suppliers, setSuppliers, 'suppliers');
    };

    // get all categories
    const get_categories = () => {
        apiGetHelper(get_Categories, setCategories, 'categories');
    };

    const get_warehouses = (id) => {
        apiGetHelper(`${get_Categories_warehouses}${id}`, setWarehouses, 'warehouses');
    };

    // get the parent products if the product is a variant
    const get_parent_products = () => {
        apiGetHelper(get_Parent_products, setParentProducts, 'parent_products');
    };

    const get_parent_products_exclude_self = (id) => {
        apiGetHelper(`${get_Parent_products_exclude_self}${id}`, setParentProducts, 'parent_products');
    }

    // get the info of the selected product
    const get_product = async (param, editIndexVal) => {
        try {
            const response = await axios_get_header(`${get_Product}${param}`, decrypted_access_token)
            const data = response.data;
            const product = data.product_info;
            setEditIndex(editIndexVal);

            if (editIndexVal === 1) {
                setFormData((prevState) => ({
                    ...prevState,
                    id: product?.id,
                    name: product?.name,
                    image_name: fileNameSplit(product?.image),
                    barcode: product?.barcode,
                    price: product?.price,
                    stocks: product?.stocks,
                    description: product?.description,
                    is_variant: product?.is_variant === false ? 0 : 1,
                    parent_product_id: nullCheck(product?.parent_product_id) ? '' : product?.parent_product_id,
                    category_id: product?.category?.id ?? '',
                    warehouse_id: product?.warehouse_id ?? '',
                    warranty_info: nullCheck(product?.warranty_info) ? '' : product?.warranty_info,
                    suppliers: product?.suppliers?.map(supplier => supplier.id)
                }));
                if (product?.is_variant === true) {
                    get_parent_products_exclude_self(product?.id);
                }
                if (product?.category_id) {
                    apiGetHelper(`${get_Categories_warehouses}${product?.category_id}`, setWarehouses, 'warehouses');
                }
                setImgSrc(product?.image ? `${process.env.REACT_APP_API_BASE_IMG_URL}${pathCleaner(product.image)}` : '');
                handleDialog(true);
            } else {
                setData(setFormData, 'id', product?.id);
                setRemoveDialog(true);
            }
        } catch (error) {
            console.error('Data Fetching Error: ', error);
            throw error;
        }
    }

    const handleDialog = (open) => {
        setDialog(open);
        if (open === false) {
            setEditIndex(0);
            setFormData(initialFormData);
            setFormDataError(initialFormDataError);
            setFormDataHelperText(initialFormDataHelperText);
            setCategories([]);
            setWarehouses([]);
            setSuppliers([]);
            setImgSrc('');
        }
    }

    // update inputs
    const handleChange = (e) => {
        const { name, value, files } = e.target;
        const basicInputs = [
            'name',
            'barcode',
            'description',
            'warranty_info',
            'parent_product_id',
            'category_id',
            'warehouse_id',
            'suppliers',
        ];
        
        if (name !== 'image') {
            setData(setFormData, name, value);
            if (basicInputs.includes(name)) {
                const isOptional = name === 'description' || name === 'warranty_info';
                if (!isOptional && value === '') {
                    setErrorHelper(name, true, 'Please fill up required field', setFormDataError, setFormDataHelperText);
                } else {
                    setErrorHelper(name, false, '', setFormDataError, setFormDataHelperText);
                }
            }
        }

        if (name === 'image') {
            const file = files[0]; // Get the selected file

            // for attachments
            if (file) {
                var filereader = new FileReader();
                filereader.readAsDataURL(file);
                if (file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/jpg' || file.type === 'image/gif') {
                    if (file.size <= parseInt((5 * 1024) * 1024)) { // minimum of 5MB
                        filereader.onloadend = function(e) {
                            setImgSrc(filereader.result);
                            setData(setFormData, name, file);
                            setData(setFormData, `${name}_name`, file.name);
                            setErrorHelper(`${name}_name`, false, '', setFormDataError, setFormDataHelperText);
                        }
                    } else {
                        setData(setFormData, name, '');
                        setData(setFormData, `${name}_name`, '');
                        setErrorHelper(`${name}_name`, true, 'File size limit is 5MB, please select another file.', setFormDataError, setFormDataHelperText);
                        toast.error('File size limit is only 5MB');
                    }
                } else {
                    setData(setFormData, name, '');
                    setData(setFormData, `${name}_name`, '');
                    setErrorHelper(`${name}_name`, true, 'Please select a valid image file (png, jpg, jpeg or gif)', setFormDataError, setFormDataHelperText);
                    toast.error('.png, .jpg, .jpeg or .gif are only allowed');
                }
            }
        }

        // for stocks
        if (name === 'stocks') {
            setFormData((prevState) => ({ ...prevState, [name]: value }));
            if (value === '') {
                setErrorHelper(name, true, `${firstCap(name)} must not be empty!`, setFormDataError, setFormDataHelperText);
            } else if (!wholeNumRegex(value)) {
                setErrorHelper(name, true, `${firstCap(name)} must be greater than zero and a valid number`, setFormDataError, setFormDataHelperText);
            } else {
                setErrorHelper(name, false, '', setFormDataError, setFormDataHelperText);
            }
        }

        // for product pricing
        if (name === 'price') {
            setFormData((prevState) => ({ ...prevState, [name]: value }));
            if (decimalNumRegex(value)) {
                const numericValue = parseFloat(value);

                if (numericValue === '' || numericValue <= 0) {
                    setErrorHelper(name, true, `${firstCap(name)} must not be empty or zero value!`, setFormDataError, setFormDataHelperText);
                } else {
                    setErrorHelper(name, false, '', setFormDataError, setFormDataHelperText);
                }
            } else {
                setErrorHelper(name, true, `${firstCap(name)} must be a valid number or decimal value`, setFormDataError, setFormDataHelperText);
            }
        }

        // for variant checkbox
        if (name === 'is_variant') {
            if (value === 0) {
                setData(setFormData, 'parent_product_id', '');
                setParentProducts([]);
            } else {
                if (editIndex === 1) {
                    get_parent_products_exclude_self(formData?.id);
                } else {
                    get_parent_products();
                }
            }
        }

        if (name === 'category_id') {
            if (nullCheck(value)) {
                setData(setFormData, 'warehouse_id', '');
                setWarehouses([]);
            } else {
                get_warehouses(value);
            }
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault();

        if (nullCheck(formData.name) || formDataError.name) {
            toast.error('Product name is required.');
            return;
        }
        if (!decimalNumRegex(String(formData.price)) || parseFloat(formData.price) < 0) {
            toast.error('Enter a valid price.');
            return;
        }
        if (!wholeNumRegex(String(formData.stocks)) || parseInt(formData.stocks, 10) < 0) {
            toast.error('Enter a valid stock quantity (0 or more).');
            return;
        }

        const formDataSubmit = new FormData();
        formDataSubmit.append('name', formData.name);
        formDataSubmit.append('price', formData.price);
        formDataSubmit.append('stocks', formData.stocks);
        if (formData.image && typeof formData.image !== 'string') {
            formDataSubmit.append('image', formData.image);
        }

        setLoading(true);
        if (editIndex === 1) {
            axios_post_header_file(update_Product + formData.id, formDataSubmit, decrypted_access_token)
                .then(response => {
                    toast.success(response.data.message);
                    setLoading(false);
                    handleDialog(false);
                    get_products();
                })
                .catch(error => {
                    setLoading(false);
                    const msg = error.response?.data?.message || error.response?.data?.error_message || try_again;
                    toast.error(msg);
                });
        } else {
            axios_post_header_file(add_Product, formDataSubmit, decrypted_access_token)
                .then(response => {
                    toast.success(response.data.message);
                    setLoading(false);
                    handleDialog(false);
                    get_products();
                })
                .catch(error => {
                    setLoading(false);
                    const msg = error.response?.data?.message || error.response?.data?.error_message || try_again;
                    toast.error(msg);
                });
        }
    }

    const handleRemove = async () => {
        setLoading(true);
        axios_delete_header(`${remove_Product}${formData?.id}`, {}, decrypted_access_token)
        .then(response => {
            setLoading(false);
            toast.success(response.data.message);
            setRemoveDialog(false);
            get_products();
        })
        .catch(error => {
            console.log(error);
            setLoading(false);
            toast.error(try_again);
        });
    };

    const download = async (id) => {
        try {
            window.open(`${download_Product_image}${id}`);
        } catch (error) {
            toast.error(error);
        }
    }

    return (
        <Grid container justifyContent="flex-start" alignItems="center" sx={{ px: 2, mt: 3 }} display="flex">
            {/* create, view and update dialog */}
            <Dialog open={dialog} fullWidth maxWidth="md">
                <DialogTitle>{editIndex === 1 ? 'Update' : 'Add New'} Product</DialogTitle>
                    <Divider sx={{ mt: -1.5 }}>
                        <Typography variant="body1">Primary Information (Required)</Typography>
                    </Divider>
                <DialogContent>
                    <AddUpdateContent
                        simpleMode
                        formData={formData}
                        formDataError={formDataError}
                        formDataHelperText={formDataHelperText}
                        categories={categories}
                        warehouses={warehouses}
                        suppliers={suppliers}
                        parentProducts={parentProducts}
                        handleChange={handleChange}
                        imgSrc={imgSrc}
                    />
                </DialogContent>
                <DialogActions>
                    <Grid container justifyContent="flex-end" columnSpacing={{ lg: 1, xl: 1 }} sx={{ mr: 2, mb: 1 }}>
                        <Grid item>
                            <PrimaryColorLoadingBtn
                                displayText={editIndex === 1 && !loading ? 'Update Product'
                                : (editIndex === 1 && loading ? 'Updating Product'
                                : (editIndex === 0 && !loading ? 'Add Product'
                                : (editIndex === 0 && loading ? 'Adding Product'
                                : '')))}
                                endIcon={<LibraryAddOutlined />}
                                loading={loading}
                                onClick={handleSubmit}
                            />
                        </Grid>
                        <Grid item>
                            <ErrorColorBtn
                                displayText="Cancel"
                                endIcon={<CancelOutlined />}
                                onClick={() => handleDialog(false)}
                            />
                        </Grid>
                    </Grid>
                </DialogActions>
            </Dialog>

            {/* remove dialog for products */}
            <Remove
                removeDialog={removeDialog}
                setRemoveDialog={setRemoveDialog}
                loading={loading}
                handleRemove={handleRemove}
            />

            {/* Worker-only: Edit Quantity dialog */}
            <Dialog open={qtyDialog} onClose={() => setQtyDialog(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Edit Quantity</DialogTitle>
                <Divider />
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                        You are updating the stock quantity for: <strong>{qtyProductName}</strong>
                    </Typography>
                    <TextField
                        label="New Quantity"
                        type="number"
                        value={qtyValue}
                        onChange={e => { setQtyValue(e.target.value); setQtyError(''); }}
                        error={!!qtyError}
                        helperText={qtyError}
                        fullWidth
                        inputProps={{ min: 0 }}
                        autoFocus
                    />
                </DialogContent>
                <DialogActions sx={{ mr: 2, mb: 1 }}>
                    <PrimaryColorLoadingBtn
                        displayText={qtyLoading ? 'Saving…' : 'Save Quantity'}
                        loading={qtyLoading}
                        onClick={handleQtySubmit}
                        endIcon={<Inventory2Outlined />}
                    />
                    <ErrorColorBtn
                        displayText="Cancel"
                        endIcon={<CancelOutlined />}
                        onClick={() => setQtyDialog(false)}
                    />
                </DialogActions>
            </Dialog>

            {/* buttons and products table */}
            <Grid container justifyContent="flex-end" alignItems="center" columnSpacing={{ lg: 1, xl: 1 }} sx={{ mr: .3 }}>
                <Grid item lg={3} xl={3} sm={3} xs={12}>
                    <BreadCrumbsCmp data={inventoryCrumbs('Products')} />
                </Grid>
                <Grid item lg={9} xl={9} sm={9} xs={12}>
                    <Grid container direction="row" justifyContent="flex-end" alignItems="center" columnSpacing={{ lg: 1, xl: 1, sm: 1, xs: 1 }} rowSpacing={1.5}>
                        <Grid item justifyContent="end" display="flex">
                            <Button variant="contained" color="primary" endIcon={<RefreshOutlined fontSize="small" />} onClick={get_products}>Refresh Table</Button>
                        </Grid>
                        {isAdmin && (
                            <Grid item justifyContent="end" display="flex">
                                <Button variant="contained" color="primary" endIcon={<LibraryAddOutlined fontSize="small" />} onClick={() => handleDialog(true)}>Add Inventory Items</Button>
                            </Grid>
                        )}
                    </Grid>
                </Grid>
            </Grid>
            <Grid container justifyContent="flex-start" alignItems="center" sx={{ mt: 2 }}>
                <Grid item lg={12} xl={12}>
                    <Card raised sx={{ width: '100%' }}>
                        <CardContent>
                            <DataGrid rows={rows} columns={columns} loading={loadingTable} autoHeight={rows.length >= 1 ? false : true} getRowHeight={() => 'auto'}/>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Grid>
    );
}

export default Products;