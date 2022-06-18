export default class SignService {
    constructor(vue) {
        this.vue = vue;
        this.url = process.env.VUE_APP_SIGN_SERVICE_URL;
    }

    verifySignature(body) {
        return this.vue.$axios.post(this.url + "signatures/verify", body)
            .then(resp => {
                const { data } = resp;
                if (data.responseHeader.success) {
                    this.vue.$toast.add({
                        severity: "success",
                        summary: "Success",
                        detail: "Signature successfully verified."
                    });
                } else {
                    this.vue.$toast.add({
                        severity: "Warn",
                        summary: "Warning",
                        detail: data.responseHeader.message.text
                    });
                }
            });
    }
}
