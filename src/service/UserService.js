export default class UserService {
    constructor(vue) {
        this.vue = vue;
        this.url = process.env.VUE_APP_USER_SERVICE_URL;
    }

    login(email, password) {
        const body = {
            email, password
        }
        return this.vue.$axios.post(this.url + "users/login", body)
            .then(response => {
                const { data } = response;
                if (data.header.success) {
                    this.vue.$store.commit('setTenantId', data.tenantId);
                    this.vue.$router.push("/crud");
                }
            });
    }
}
