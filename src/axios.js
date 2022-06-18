import axios from 'axios'

export default (store, router) => {
    const instance = axios.create();

    instance.interceptors.request.use(function (config) {
        if (router.currentRoute._value.meta.authenticated && !store.getters.tenantId) {
            router.push("/login")
            return Promise.reject(new TypeError("Unauthorized"));
        }

        config.headers['X_TENANT_ID'] = store.getters.tenantId;
        return config;
    }, function (error) {
        return Promise.reject(error);
    });

    return instance;
};