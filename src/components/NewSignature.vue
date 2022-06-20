<template>
  <Toast />
  <div class="card mb-0" v-if="mounted">
    <div class="surface-section" v-if="access && file">
      <div class="font-medium text-3xl text-900 mb-3">Sign a Document</div>
      <ul class="list-none p-0 m-0">
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
              @click="showFileDetailDialog = true"
            ></Button>
          </div>
        </li>
        <li
          class="flex align-items-center py-3 px-2 my-3 border-top-1 border-top-1 surface-border flex-wrap"
        >
          <div class="text-500 w-6 md:w-2 font-medium">Certificate</div>
          <div
            class="text-900 w-full md:w-8 md:flex-order-0 flex-order-1 line-height-3"
          >
            <Skeleton
              v-if="!certificates"
              width="10rem"
              class="mb-2"
            ></Skeleton>
            <Dropdown
              v-model="certificate"
              :options="certificates"
              optionLabel="name"
              optionValue="certificateId"
              placeholder="Select a Certificate"
            />
          </div>
        </li>
        <li
          v-if="certificate"
          class="flex align-items-center py-3 px-2 my-3 border-top-1 border-top-1 surface-border flex-wrap"
        >
          <div class="text-500 w-6 md:w-2 font-medium">Password</div>
          <Password
            v-model="certificatePassword"
            :feedback="false"
            :toggleMask="true"
            autocomplete="one-time-code"
          />
        </li>
        <li
          class="flex align-items-center justify-content-end py-3 px-2 border-top-1 border-top-1 surface-border flex-wrap"
        >
          <Button
            label="Sign"
            class="p-button-rounded p-button-success"
            @click="signDocument"
          ></Button>
        </li>
      </ul>
    </div>

    <div id="main" v-if="fileNotFound">
      <div class="fof">
        <h1>File Not Found</h1>
      </div>
    </div>
    <div id="main" v-if="!access">
      <div class="fof">
        <h1>Unauthorized</h1>
      </div>
    </div>
  </div>

  <Dialog
    v-model:visible="showFileDetailDialog"
    :style="{ minwidth: '450px' }"
    header="Verify Signature"
    :modal="true"
  >
    <Card style="width: 25rem">
      <template #content>
        <ul class="list-none p-0 m-0">
          <li
            class="flex align-items-center py-3 px-2 my-3 border-top-1 surface-border flex-wrap"
          >
            <div class="text-500 w-6 md:w-2 font-medium">Name</div>
            <Button
              :label="file.name"
              class="p-button-text"
              @click="visitFile"
            ></Button>
          </li>
          <li
            class="flex align-items-center py-3 px-2 my-3 border-top-1 surface-border flex-wrap"
          >
            <div class="text-500 w-6 md:w-2 font-medium">Owner Name</div>
            <Message
              severity="error"
              v-if="!file.tenant || file.tenant.fetchFailed"
            ></Message>
            <span class="ml-5" v-else>
              {{ util.getTenantFullName(file.tenant) }}
            </span>
          </li>
        </ul>
      </template>
    </Card>
    <template #footer>
      <Button
        label="Close"
        class="p-button-outlined"
        @click="showFileDetailDialog = false"
      />
    </template>
  </Dialog>
</template>

<script>
import util from "../util/ServiceUtil";
import SignService from "../service/SignService";
import { AxiosError } from "axios";
import asm from "asmcrypto-lite";
import FileSaver from "file-saver";

export default {
  data() {
    return {
      fileId: this.$route.params.id,
      file: null,
      fileNotFound: false,
      certificates: null,
      certificate: null,
      access: false,
      mounted: false,
      certificatePassword: "",
      showFileDetailDialog: false,
      util,
    };
  },

  async created() {
    this.signService = new SignService(this);

    this.$axios
      .get("http://localhost:8081/v1/api/files/" + this.fileId)
      .then((response) => {
        this.mounted = true;
        if (response.data.responseHeader.success) {
          this.access = true;
          this.file = response.data.file;
          this.fetchTenantsCertificates();
          this.fetchFilesTenant();
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
        this.fileNotFound = true;
      } else {
        this.$toast.add({
          severity: "error",
          summary: "Warning",
          detail: "An error occured. Please reload the page",
          life: 3000,
        });
      }
    },
    signDocument() {
      const file = this.file;
      const signRequest = {};
      this.verifySignatureDialog = false;
      const that = this;
      this.$axios
        .get("http://localhost:8081/v1/api/files/content/" + this.file.fileId, {
          headers: { X_TENANT_ID: this.$store.getters.tenantId },
          responseType: "blob",
        })
        .then(async function (response) {
          const { data } = response;

          signRequest.fileHash = asm.SHA256.hex(await data.arrayBuffer());
          signRequest.fileId = file.fileId;
          signRequest.certificateId = that.certificate;
          signRequest.certificatePassword = that.certificatePassword;

          await that.signService.signDocument(signRequest).then(() => {
            FileSaver.saveAs(data, file.name);
          });
        })
        .catch((e) => {
          console.log("Sign process failed", e);
          this.$toast.add({
            severity: "error",
            summary: "Error",
            detail: "Sign process failed. Make sure password is correct.",
          });
        });
    },
    fetchFilesTenant() {
      this.$axios
        .get("http://localhost:8080/v1/api/users/" + this.file.tenantId)
        .then((resp) => {
          const { data } = resp;
          if (data.responseHeader.success) {
            this.file.tenant = data.tenant;
          } else {
            this.file.tenant = {
              fetchFailed: true,
            };
          }
        })
        .catch((e) => {
          console.log(e);
          this.file.tenant = {
            fetchFailed: true,
          };
        });
    },
    showCertificate() {
      const routeData = this.$router.resolve(
        "/certificates/" + this.certificate.certificateId
      );
      window.open(routeData.href, "_blank");
    },
    visitFile() {
      const routeData = this.$router.resolve("/files/" + this.file.fileId);
      window.open(routeData.href, "_blank");
    },
    fetchTenantsCertificates() {
      this.$axios
        .get("http://localhost:8082/v1/api/certificates/mine/")
        .then((resp) => {
          const { data } = resp;
          if (data.responseHeader.success) {
            this.certificates = data.certificates;
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
