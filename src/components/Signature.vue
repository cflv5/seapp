<template>
  <div class="card" v-if="mounted">
    <Toast />
    <div class="surface-section" v-if="access && signature">
      <div class="font-medium text-3xl text-900 mb-3">
        Signature Information
      </div>
      <Button
        icon="pi pi-pencil"
        label="Download Signature"
        class="p-button-rounded p-button-danger mx-2"
        @click="downloadSignature"
      ></Button>
      <Button
        icon="pi pi-download"
        label="Verify"
        class="p-button-rounded p-button-success"
        @click="verifySignature"
      ></Button>
      <ul class="list-none p-0 m-0">
        <li
          class="flex align-items-center py-3 px-2 my-3 border-top-1 surface-border flex-wrap"
        >
          <div class="text-500 w-6 md:w-2 font-medium">Time</div>
          <div class="text-900 w-full md:w-8 md:flex-order-0 flex-order-1">
            {{ util.formatDateTime(signature.createdAt) }}
          </div>
        </li>
        <li
          class="flex align-items-center py-3 px-2 my-3 border-top-1 surface-border flex-wrap"
        >
          <div class="text-500 w-6 md:w-2 font-medium">File</div>
          <div class="text-900 w-full md:w-8 md:flex-order-0 flex-order-1">
            <Skeleton v-if="!file" width="10rem" class="mb-2"></Skeleton>
            <Button
              v-else
              :label="file.name"
              class="p-button-text p-0"
              @click="visitFile"
            ></Button>
          </div>
        </li>
        <li
          class="flex align-items-center py-3 px-2 my-3 border-top-1 border-top-1 surface-border flex-wrap"
        >
          <div class="text-500 w-6 md:w-2 font-medium">Owner</div>
          <div
            class="text-900 w-full md:w-8 md:flex-order-0 flex-order-1 line-height-3"
          >
            <Skeleton v-if="!certificate" width="10rem" class="mb-2"></Skeleton>
            <Button
              v-else
              :label="certificate.name"
              class="p-button-text p-0"
              @click="showCertificate"
            ></Button>
          </div>
        </li>
      </ul>
    </div>

    <div id="main" v-if="signatureNotFound">
      <div class="fof">
        <h1>Signature Not Found</h1>
      </div>
    </div>
    <div id="main" v-if="!access">
      <div class="fof">
        <h1>Unauthorized</h1>
      </div>
    </div>
  </div>
</template>

<script>
import util from "../util/ServiceUtil";

export default {
  data() {
    return {
      signatureId: this.$route.params.id,
      signature: null,
      file: {},
      certificate: {},
      tenant: {},
      access: false,
      signatureNotFound: false,
      mounted: false,
      showCertificateDialog: false,
      util,
    };
  },

  async created() {
    this.$axios
      .get("http://localhost:8082/v1/api/signatures/" + this.signatureId)
      .then((response) => {
        if (response.data.responseHeader.success) {
          this.access = true;
          this.signature = response.data.signature;
          this.fetchFile();
          this.fetchCertificate();
          this.mounted = true;
        } else {
          this.$toast.add({
            severity: "error",
            summary: "Error",
            detail: response.data.responseHeader.message.text,
            life: 3000,
          });
        }
      })
      .catch((e) => this.$toast.add(util.handleAxiosError(e)));
  },

  methods: {
    showCertificate() {
      const routeData = this.$router.resolve("/certificates/" + this.certificate.certificateId);
      window.open(routeData.href, "_blank");
    },
    verifySignature() {},
    visitFile() {
      const routeData = this.$router.resolve("/files/" + this.file.fileId);
      window.open(routeData.href, "_blank");
    },
    fetchFile() {
      this.$axios
        .get("http://localhost:8081/v1/api/files/" + this.signature.fileId)
        .then((resp) => {
          const { data } = resp;
          if (data.responseHeader.success) {
            this.file = data.file;
          } else {
            this.$toast.add({
              severity: "error",
              summary: "Error",
              detail: data.responseHeader.message.text,
              life: 3000,
            });
          }
        })
        .catch((e) => this.$toast.add(util.handleAxiosError(e)));
    },
    fetchCertificate() {
      this.$axios
        .get(
          "http://localhost:8082/v1/api/certificates/detail/" +
            this.signature.certificateId
        )
        .then((resp) => {
          const { data } = resp;
          if (data.responseHeader.success) {
            this.certificate = data.certificate;
          } else {
            this.$toast.add({
              severity: "error",
              summary: "Error",
              detail: data.responseHeader.message.text,
              life: 3000,
            });
          }
        })
        .catch((e) => this.$toast.add(util.handleAxiosError(e)));
    },
    fetchTenant() {
      this.$axios
        .get("http://localhost:8080/v1/api/users/" + this.certificate.tenantId)
        .then((resp) => {
          if (resp.data.responseHeader.success) {
            this.tenant = resp.data.tenant;
          } else {
            this.$toast.add({
              severity: "error",
              summary: "Error",
              detail: resp.data.responseHeader.message.text,
              life: 3000,
            });
          }
        })
        .catch((e) => this.$toast.add(util.handleAxiosError(e)));
    },
    downloadSignature() {
      const signature = this.signature;
      this.$axios
        .get(
          "http://localhost:8082/v1/api/signatures/file/" + this.signature.id
        )
        .then(function (response) {
          const { data } = response;
          const url = window.URL.createObjectURL(
            new Blob([data], {
              type: "text/plain",
            })
          );
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", signature.id);
          document.body.appendChild(link);
          link.click();
        })
        .catch((e) => {
          console.log(e);
          this.$toast.add(util.handleAxiosError(e));
        });
    },
  },
};
</script>

<style>
* {
  transition: all 0.6s;
}

html {
  height: 100%;
}

body {
  font-family: "Lato", sans-serif;
  color: #888;
  margin: 0;
}

#main {
  display: table;
  width: 100%;
  height: 100vh;
  text-align: center;
}

.fof {
  display: table-cell;
  vertical-align: middle;
}

.fof h1 {
  font-size: 50px;
  display: inline-block;
  padding-right: 12px;
  animation: type 0.5s alternate infinite;
}
</style>
