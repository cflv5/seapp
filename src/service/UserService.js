export default class UserService {
    constructor(vue) {
        this.vue = vue;
        this.url = "http://localhost:8080/v1/api/";
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
                    this.vue.$router.push("/files");
                }
            });
    }
}
