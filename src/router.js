import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';

export default (store) => {

    const routes = [
        {
            path: '/',
            name: 'app',
            component: App,
            children: [
                {
                    path: '',
                    name: 'dashboard',
                    redirect: '/files'
                },
                {
                    path: '/files/:id',
                    meta: {
                        authenticated: true
                    },
                    component: () => import('./components/FileDetail.vue')
                },
                {
                    path: '/files',
                    name: 'files',
                    meta: {
                        authenticated: true
                    },
                    component: () => import('./components/Files.vue')
                },
                {
                    path: '/signatures',
                    name: 'signatures',
                    meta: {
                        authenticated: true
                    },
                    component: () => import('./components/Signatures.vue')
                },
                {
                    path: '/signatures/new/:id',
                    meta: {
                        authenticated: true
                    },
                    component: () => import('./components/NewSignature.vue')
                },
                {
                    path: '/signatures/:id',
                    meta: {
                        authenticated: true
                    },
                    component: () => import('./components/Signature.vue')
                },
            ]
        },
        {
            path: '/login',
            name: 'login',
            component: () => import('./pages/Login.vue')
        },
        {
            path: '/logout',
            name: 'logout',
            component: () => import('./pages/Logout.vue')
        },
    ];

    const router = createRouter({
        history: createWebHistory(),
        routes,
    });

    router.beforeEach(
        (to, _from, next) => {
            if (to.matched.some(record => record.meta.authenticated)) {
                if (store.getters.tenantId) {
                    next()
                } else {
                    next({
                        path: '/login'
                        // Redirect to original path if specified
                    })
                }
            } else {
                next()
            }
        }
    );

    router.beforeEach(function (_to, _from, next) {
        window.scrollTo(0, 0);
        next();
    });

    return router;
}