import axios from 'axios';

const buildFallbackApiUrl = (url) => {
    if (typeof url !== 'string' || !url.startsWith('/api/')) return null;
    const host =
        typeof window !== 'undefined' && window.location?.hostname
            ? window.location.hostname
            : null;
    if (!host) return null;
    return `http://${host}:8000${url}`;
};

const requestWithFallback = async (config) => {
    try {
        return await axios(config);
    } catch (error) {
        const fallbackUrl = buildFallbackApiUrl(config.url);
        // Retry only when request failed at network layer (no HTTP response)
        if (!error?.response && fallbackUrl && fallbackUrl !== config.url) {
            return axios({ ...config, url: fallbackUrl });
        }
        throw error;
    }
};

export const axios_post = (url, payload) => {
    return requestWithFallback({
        method: "POST",
        url: url,
        data: payload
    });
}

export const axios_post_header = (url, payload, token) => {
    return axios({
        headers: {
            Authorization: "Bearer " + token
        },
        method: "POST",
        url: url,
        data: payload
    });
}

export const axios_get_header = (url, token) => {
    return requestWithFallback({
        headers: { Authorization: "Bearer " + token },
        method: "GET",
        url: url
    });
}

export const axios_patch_header = (url, payload, token) => {
    return axios({
        headers: { Authorization: "Bearer " + token },
        method: "PATCH",
        url: url,
        data: payload
    });
}

export const axios_put_header = (url, payload, token) => {
    return axios({
        headers: { Authorization: "Bearer " + token },
        method: "PUT",
        url: url,
        data: payload
    });
}

export const axios_post_header_file = (url, payload, token) => {
    return axios({
        headers: {
            Authorization: "Bearer " + token,
            'Content-Type': 'multipart/form-data'
        },
        method: "POST",
        url: url,
        data: payload,
    });
}

export const axios_delete_header = (url, payload, token) => {
    return axios({
        headers: { Authorization: "Bearer " + token },
        method: "DELETE",
        url: url,
        data: payload
    });
}

export const axios_get_header_download = (url, token) => {
    return axios({
        url,
        headers: { Authorization: "Bearer " + token },
        method: "GET",
        responseType: 'blob',
    });
}