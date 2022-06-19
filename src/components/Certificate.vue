<template>
  <div class="card" v-if="mounted">
    <Toast />
    <div class="surface-section" v-if="access && certificate">
      <div class="font-medium text-3xl text-900 mb-3">
        Certificate Information
      </div>
      <Button
        icon="pi pi-download"
        label="Download Signature"
        class="p-button-rounded p-button-warn mx-2"
        @click="downloadCertificate"
      ></Button>
      <ul class="list-none p-0 m-0">
        <li
          class="flex align-items-center py-3 px-2 my-3 border-top-1 surface-border flex-wrap"
        >
          <div class="text-500 w-6 md:w-2 font-medium">Name</div>
          <div class="text-900 w-full md:w-8 md:flex-order-0 flex-order-1">
            {{ certificate.name }}
          </div>
        </li>
        <li
          class="flex align-items-center py-3 px-2 my-3 border-top-1 surface-border flex-wrap"
        >
          <div class="text-500 w-6 md:w-2 font-medium">Owner</div>
          <div class="text-900 w-full md:w-8 md:flex-order-0 flex-order-1">
            <Skeleton v-if="!tenant" width="10rem" class="mb-2"></Skeleton>
            <span v-else>
              {{ util.getTenantFullName(tenant) }}
            </span>
          </div>
        </li>
        <li
          class="flex align-items-center py-3 px-2 my-3 border-top-1 border-top-1 surface-border flex-wrap"
        >
          <div class="text-500 w-6 md:w-2 font-medium">YTU Verification</div>
          <div
            class="text-900 w-full md:w-8 md:flex-order-0 flex-order-1 line-height-3"
          >
            <Skeleton
              v-if="!verification"
              width="10rem"
              class="mb-2"
            ></Skeleton>
            <span v-else>
              <Badge
                :value="verification.success ? 'Verified' : 'Not Verified'"
                size="large"
                :severity="verification.success ? 'success' : 'danger'"
              ></Badge>
            </span>
          </div>
        </li>
      </ul>
    </div>

    <div id="main" v-if="certificateNotFound">
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
import { AxiosError } from "axios";
import FileSaver from "file-saver";

export default {
  data() {
    return {
      certificateId: this.$route.params.id,
      certificate: null,
      tenant: null,
      access: false,
      certificateNotFound: false,
      verification: null,
      mounted: false,
      util,
    };
  },

  async created() {
    this.$axios
      .get(
        "http://localhost:8082/v1/api/certificates/detail/" + this.certificateId
      )
      .then((response) => {
        this.mounted = true;
        if (response.data.responseHeader.success) {
          this.access = true;
          this.certificate = response.data.certificate;
          this.fetchTenant();
          this.verifyCertificate();
        } else {
          this.$toast.add({
            severity: "error",
            summary: "Error",
            detail: response.data.responseHeader.message.text,
            life: 3000,
          });
        }
      })
      .catch((e) => {
        this.mounted = true;
        this.handleError(e);
      });
  },

  methods: {
    handleError(e) {
      if (e instanceof AxiosError && e.response.status === 404) {
        this.certificateNotFound = true;
      } else {
        this.$toast.add({
          severity: "error",
          summary: "Warning",
          detail: "An error occured. Please reload the page",
          life: 3000,
        });
      }
    },
    verifyCertificate() {
      this.$axios
        .get(
          "http://localhost:8082/v1/api/certificates/validate/" +
            this.certificate.certificateId
        )
        .then((resp) => {
          this.verification = {};
          const { data } = resp;
          if (data.responseHeader.success) {
            this.verification.success = true;
          } else {
            this.verification.success = false;
            this.$toast.add({
              severity: "error",
              summary: "Error",
              detail: resp.data.responseHeader.message.text,
            });
          }
        })
        .catch((e) => {
          this.verification = { success: false };
          console.log(e);
          this.$toast.add({
            severity: "error",
            summary: "Error",
            detail:
              "Error occred while validating the certificate, which does not indicate that certificate is valid.",
          });
        });
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
    downloadCertificate() {
      const certificate = this.certificate;
      this.$axios
        .get(
          "http://localhost:8082/v1/api/certificates/" +
            this.certificate.certificateId,
          {
            responseType: "blob",
          }
        )
        .then(function (response) {
          const { data } = response;
          FileSaver.saveAs(data, certificate.name + ".crt");
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
