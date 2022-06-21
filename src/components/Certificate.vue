<template>
  <div class="card" v-if="mounted">
    <Toast />
    <div class="surface-section" v-if="access && certificate">
      <div class="font-medium text-3xl text-900 mb-3">
        Certificate Information
      </div>
      <Button
        icon="pi pi-download"
        label="Download Certificate"
        class="p-button-rounded p-button-warn mx-2"
        @click="downloadCertificate"
      ></Button>
      <ul class="list-none p-0 m-0">
        <li
          class="flex align-items-center py-3 px-2 my-3 border-top-1 surface-border flex-wrap"
        >
          <div class="text-500 w-6 md:w-2 font-medium">Name</div>
          <div class="text-900 w-full md:w-8 md:flex-order-0 flex-order-1">
            <div class="flex justify-content-between align-items-center">
              <span>
                {{ certificate.name }}
              </span>
              <span>
                <ProgressSpinner v-if="!tenantX509Cert" />
                <Button
                  v-else
                  class="p-1 p-button-outlined"
                  label="View"
                  @click="viewDetail = true"
                />
              </span>
            </div>
          </div>
        </li>
        <li
          class="flex align-items-center py-3 px-2 my-3 border-top-1 surface-border flex-wrap"
        >
          <div class="text-500 w-6 md:w-2 font-medium">Owner</div>
          <div class="text-900 w-full md:w-8 md:flex-order-0 flex-order-1">
            <Skeleton v-if="!tenant" width="10rem" class="mb-2"></Skeleton>
            <Button
              :label="util.getTenantFullName(tenant)"
              class="p-button-text p-0"
              @click="visitTenant"
            ></Button>
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

  <Dialog
    v-model:visible="viewDetail"
    :style="{ minwidth: '450px' }"
    header="Certificate Detail"
    :modal="true"
  >
    <Card style="width: 45rem">
      <template #content>
        <ul class="list-none p-0 m-0">
          <li
            class="flex align-items-center py-3 px-2 my-3 surface-border flex-wrap"
          >
            <div class="text-500 w-6 md:w-2 font-medium mr-1">
              Serial Number
            </div>
            <div class="text-900 w-full md:w-8 md:flex-order-0 flex-order-1">
              <span>
                {{ tenantX509Cert.serialNumber }}
              </span>
            </div>
          </li>
          <li
            class="flex align-items-center py-3 px-2 my-3 surface-border flex-wrap"
          >
            <div class="text-500 w-6 md:w-2 font-medium mr-1">Subject</div>
            <div class="text-900 w-full md:w-8 md:flex-order-0 flex-order-1">
              <span>
                {{ tenantX509Cert.subject }}
              </span>
            </div>
          </li>
          <li
            class="flex align-items-center py-3 px-2 my-3 surface-border flex-wrap"
          >
            <div class="text-500 w-6 md:w-2 font-medium mr-1">Issuer</div>
            <div class="text-900 w-full md:w-8 md:flex-order-0 flex-order-1">
              <span>
                {{ tenantX509Cert.issuer }}
              </span>
            </div>
          </li>
          <li
            class="flex align-items-center py-3 px-2 my-3 surface-border flex-wrap"
          >
            <div class="text-500 w-6 md:w-2 font-medium mr-1">Signature</div>
            <div class="text-900 w-full md:w-8 md:flex-order-0 flex-order-1">
              <span>
                {{ tenantX509Cert.signatureAlgorithm.name }} with
                {{ tenantX509Cert.signatureAlgorithm.hash.name }}
              </span>
            </div>
          </li>
          <li
            class="flex align-items-center py-3 px-2 my-3 surface-border flex-wrap"
          >
            <div class="text-500 w-6 md:w-2 font-medium mr-1">
              Valid Through
            </div>
            <div class="text-900 w-full md:w-8 md:flex-order-0 flex-order-1">
              <span>
                {{ tenantX509Cert.notBefore.toLocaleDateString() }} -
                {{ tenantX509Cert.notAfter.toLocaleDateString() }}
              </span>
            </div>
          </li>
        </ul>
      </template>
    </Card>
    <template #footer>
      <Button
        label="Close"
        class="p-button-outlined"
        @click="viewDetail = false"
      />
    </template>
  </Dialog>
</template>

<script>
import util from "../util/ServiceUtil";
import { AxiosError } from "axios";
import FileSaver from "file-saver";
import * as x509 from "@peculiar/x509";

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
      certContent: null,
      viewDetail: false,
      tenantX509Cert: null,
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
    visitTenant() {
      const routeData = this.$router.resolve("/profile/" + this.tenant.tenantId);
      window.open(routeData.href, "_blank");
    },
    async fetchCertificate(id) {
      return this.$axios
        .get("http://localhost:8082/v1/api/certificates/" + id, {
          responseType: "blob",
        })
        .then(function (response) {
          return response.data;
        });
    },
    async verifyCertificate() {
      try {
        this.certContent = await this.fetchCertificate(
          this.certificate.certificateId
        );
        const tenantX509Cert = new x509.X509Certificate(
          await this.certContent.arrayBuffer()
        );
        this.tenantX509Cert = tenantX509Cert;
        const rootCert = await this.fetchCertificate("ytucese");
        const rootX509Cert = new x509.X509Certificate(
          await rootCert.arrayBuffer()
        );
        console.log("Tenant Cert: ", tenantX509Cert);
        console.log("YTUCESE: ", rootX509Cert);
        this.verification = {
          success: await tenantX509Cert.verify(rootX509Cert),
        };
        console.log(
          "Is certificate issued by YTUCESE: ",
          this.verification.success
        );
      } catch (error) {
        console.log(error);
        this.verification = {
          success: false,
        };
      }
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
      if (this.certContent) {
        FileSaver.saveAs(this.certContent, this.certificate.name + ".crt");
      } else {
        const certificate = this.certificate;
        this.fetchCertificate()
          .then(function (data) {
            FileSaver.saveAs(data, certificate.name + ".crt");
          })
          .catch((e) => {
            console.log(e);
            this.$toast.add(util.handleAxiosError(e));
          });
      }
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
