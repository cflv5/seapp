import { AxiosError } from "axios"

function determineDetailByStatusCode(status) {
    switch (status) {
        case 404:
            return "Resource not found";
        case 401:
        case 403:
            return "Unauthorized";
        default:
            return "An error occured";
    }
}

export default {
    handleAxiosError(e) {
        if (e instanceof AxiosError) {
            const { data, status } = e.response;
            return {
                severity: "error",
                summary: "Error",
                detail: data && data.responseHeader ? data.responseHeader.message.text : determineDetailByStatusCode(status),
                life: 3000
            };

        }
    },

    getTenantFullName(tenant) {
        const title = tenant.title ? tenant.title + " " : "";
        const middlename = tenant.middlename ? tenant.middlename + " " : "";
        return title + tenant.name + " " + middlename + tenant.surname;
    },

    formatDateTime(time) {
        const d = new Date(time * 1000);
        return d.toLocaleString("tr-TR");
    }
}