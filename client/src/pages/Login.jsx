import React, { useState, useEffect } from "react";
import { Button, Card, CardActions, CardContent, CardHeader, Divider, Grid, TextField, Typography } from '@mui/material';
import { RefreshOutlined, VpnKeyRounded } from "@mui/icons-material";
import { LoadingButton } from '@mui/lab';
import { axios_get_header, axios_post } from "../utils/requests";
import { AES, enc } from 'crypto-js';
import AppbarComponent from "../components/elements/AppbarComponent";
import { toast } from "react-toastify";
import ToastCmp from "../components/elements/ToastComponent";
import { useNavigate } from "react-router-dom";
import Cookies from 'js-cookie';
import { login, checkAuth } from 'utils/services';
import { nullCheck } from "utils/helper";
import { SECRET_KEY, decryptedRoleName } from "utils/auth";

function Login() {
    document.title = 'InventoryIQ: Log In';
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [formDataError, setFormDataError] = useState({
        email: false,
        password: false,
    });
    const [formDataHelperText, setFormDataHelperText] = useState({
        email: '',
        password: ''
    });

    useEffect(() => {
        const access_token = Cookies.get('access_token');
        if (!nullCheck(access_token)) {
            try {
                const decryptedToken = AES.decrypt(access_token, SECRET_KEY).toString(enc.Utf8);
                axios_get_header(checkAuth, decryptedToken)
                .then(() => {
                    const dest = decryptedRoleName() === "Administrator"
                        ? "/main/page/dashboard"
                        : "/main/page/inventory/products-list";
                    navigate(dest);
                })
                .catch(error => {
                    console.log(error);
                    localStorage.clear();
                    navigate("/");
                });
            } catch (e) {
                localStorage.clear();
                navigate("/");
            }
        }
    }, [navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevState) => ({ ...prevState, [name]: value }));

        if (value === '') {
            setFormDataError((prevError) => ({ ...prevError, [name]: true }));
            setFormDataHelperText((prevText) => ({ ...prevText, [name]: 'Please fill up required field!' }));
        } else {
            setFormDataError((prevError) => ({ ...prevError, [name]: false }));
            setFormDataHelperText((prevText) => ({ ...prevText, [name]: '' }));
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);

        axios_post(login, formData)
        .then(response => {
            const data = response.data;

            if (!data.user.roles || data.user.roles.length === 0) {
                setLoading(false);
                toast.error("Account Error: No role assigned to this user.");
                return;
            }

            toast.success(data.message);

            const expirationMinutes = response.data.expire_at || 180;
            const expirationTime = expirationMinutes * 60000;
            const now = new Date().getTime();
            const futureTimestamp = now + expirationTime;
            const threeHrsFraction = 3 / 24;

            localStorage.setItem('expire_at', futureTimestamp);
            localStorage.setItem('previousIndex', 1);
            localStorage.setItem('selectedIndex', 1);

            const userRole = data.user.roles[0];

            // CRITICAL FIX: sameSite: 'none' and secure: true allows the browser to read cookies across Render subdomains
            const cookieConfig = { expires: threeHrsFraction, sameSite: 'none', secure: true };

            Cookies.set('isLoggedIn', 1, cookieConfig);
            Cookies.set('access_token', AES.encrypt(data.access_token, SECRET_KEY).toString(), cookieConfig);
            Cookies.set('email_token', AES.encrypt(data.user.email, SECRET_KEY).toString(), cookieConfig);
            Cookies.set('auth_id', AES.encrypt(data.user.id, SECRET_KEY).toString(), cookieConfig);
            Cookies.set('role_id', AES.encrypt(userRole.id.toString(), SECRET_KEY).toString(), cookieConfig);
            Cookies.set('role_name', AES.encrypt(userRole.role_name, SECRET_KEY).toString(), cookieConfig);
            
            setTimeout(() => {
                setLoading(false);
                const dest = userRole.role_name === "Administrator"
                    ? "/main/page/dashboard"
                    : "/main/page/inventory/products-list";
                window.location = dest;
            }, 2000);
        })
        .catch(error => {
            setLoading(false);
            console.error("Login Error:", error);
            if (error?.response?.data?.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error('Login failed. Please check your credentials.');
            }
        });
    }

    return(
        <Grid container direction="row" justifyContent="center" sx={{ minHeight: '100vh' }}>
            <AppbarComponent />
            <ToastCmp />
            <Grid item lg={5} xs={12} sm={12} xl={5} pt={{ lg: 10, xl: 15, sm: 10, xs: 10 }} sx={{ background: '#fafafa' }}>
                <Grid container direction="column" justifyContent="center" alignItems="center">
                    <Grid item lg={12} xs={12} sm={8} xl={12}>
                        <img src="/logoV2/logo-transparent.png" style={{ height: '200px' }} alt="Logo" />
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Web Inventory Management App</Typography>
                    </Grid>
                </Grid>
            </Grid>
            <Grid item lg={7} xs={12} sm={12} xl={7} pt={{ lg: 20, xl: 20, sm: 5, xs: 5 }} px={{ xs: 5 }} sx={{ background: '#fefefe'}}>
                <Grid container direction="row" justifyContent="center" alignItems="center">
                    <Grid item lg={7} xs={12} sm={8} xl={5}>
                        <Card elevation={12}>
                            <CardHeader title="Log In" titleTypographyProps={{ variant: "h5", fontWeight: 'bold' }} sx={{ pl: 2.5 }} />
                            <Divider />
                            <form onSubmit={handleSubmit}>
                                <CardContent>
                                    <Grid container direction="column" rowSpacing={2}>
                                        <Grid item>
                                            <TextField
                                                autoFocus
                                                required
                                                name="email"
                                                label="E-mail"
                                                variant="outlined"
                                                type="email"
                                                value={formData.email}
                                                error={formDataError.email}
                                                helperText={formDataHelperText.email}
                                                onChange={handleChange}
                                                fullWidth
                                            />
                                        </Grid>
                                        <Grid item>
                                            <TextField
                                                required
                                                name="password"
                                                label="Password"
                                                variant="outlined"
                                                type="password"
                                                value={formData.password}
                                                error={formDataError.password}
                                                helperText={formDataHelperText.password}
                                                onChange={handleChange}
                                                fullWidth
                                            />
                                        </Grid>
                                        <Grid item mt={2}>
                                            <LoadingButton
                                                fullWidth
                                                type="submit"
                                                loading={loading}
                                                loadingPosition="start"
                                                startIcon={<VpnKeyRounded />}
                                                variant="contained"
                                            >
                                                Log In
                                            </LoadingButton>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </form>
                        </Card>
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    );
}

export default Login;
