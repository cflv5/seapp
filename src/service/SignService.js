import { v4 as uuid } from 'uuid';

export default class SignService {
    constructor(vue) {
        this.vue = vue;
        this.url = "http://localhost:8082/v1/api/";
    }

    verifySignature(body) {
        return this.vue.$axios.post(this.url + "signatures/verify", body, {
            headers: {
                X_REQUEST_ID: uuid()
            }
        })
            .then(resp => {
                const { data } = resp;
                if (data.responseHeader.success) {
                    this.vue.$toast.add({
                        severity: "success",
                        summary: "Success",
                        detail: "Signature successfully verified.",
                        life: 3000
                    });
                } else {
                    this.vue.$toast.add({
                        severity: "Warn",
                        summary: "Warning",
                        detail: data.responseHeader.message.text,
                        life: 300
                    });
                }
            });
    }

    signDocument(body) {
        return this.vue.$axios.post(this.url + "signatures/new", body, {
            headers: {
                X_REQUEST_ID: uuid()
            }
        })
            .then((response) => {
                const { data } = response;
                if (data.responseHeader.success) {
                    this.vue.$router.push("/signatures/" + data.signature.id);
                } else {
                    this.vue.$toast.add({
                        severity: "error",
                        summary: "Error",
                        detail: data.responseHeader.message.text
                    });
                }
            });
    }
}
