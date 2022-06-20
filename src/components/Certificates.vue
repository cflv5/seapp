<template>
  <div class="grid">
    <div class="col-12">
      <div class="card">
        <Toast />
        <Toolbar class="mb-4">
          <template v-slot:start>
            <div class="my-2">
              <Button
                label="New"
                icon="pi pi-plus"
                class="p-button-success mr-2"
                @click="openNewDialog = true"
              />
            </div>
          </template>
        </Toolbar>
        <DataTable
          ref="dt"
          :value="certificates"
          dataKey="id"
          :paginator="true"
          :rows="10"
          :filters="filters"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          :rowsPerPageOptions="[5, 10, 25]"
          currentPageReportTemplate="Showing {first} to {last} of {totalRecords} files"
          responsiveLayout="scroll"
          class="p-datatable-md"
          :stripedRows="true"
        >
          <template #header>
            <div
              class="flex flex-column md:flex-row md:justify-content-between md:align-items-center"
            >
              <h5 class="m-0">User Certificates</h5>
              <span class="block mt-2 md:mt-0">
                <InputText
                  v-model="filters['global'].value"
                  placeholder="Search..."
                />
              </span>
            </div>
          </template>

          <Column field="createdAt" header="Created At" :sortable="true">
            <template #body="slotProps">
              <span class="p-column-title">Created At</span>
              <strong>{{
                util.formatDateTime(slotProps.data.createdAt)
              }}</strong>
            </template>
          </Column>
          <Column field="fileName" header="Name" :sortable="true">
            <template #body="slotProps">
              <span class="p-column-title">Name</span>
              {{ slotProps.data.name }}
            </template>
          </Column>
          <Column header="Show">
            <template #body="slotProps">
              <Button
                icon="pi pi-eye"
                class="p-button-link p-button-success mr-2"
                @click="showCertificate(slotProps.data)"
              />
              <Button
                icon="pi pi-times"
                class="p-button-link p-button-danger mr-2"
                @click="selectedCertificate = slotProps.data"
              />
            </template>
          </Column>
        </DataTable>
      </div>
    </div>
  </div>

  <Dialog
    v-model:visible="deleteCertificateDialog"
    :style="{ minwidth: '450px' }"
    header="Are you sure?"
    :modal="true"
    :closable="false"
  >
    <Card style="width: 25rem">
      <template #content>
        <p>
          Deleting a certificate will make it passive and it cannot be used in
          further signing operation.
        </p>
      </template>
    </Card>
    <template #footer>
      <Button
        label="Delete"
        class="p-button-outlined p-button-danger"
        @click="deleteCerticate"
      />
      <Button
        label="Close"
        class="p-button-outlined"
        @click="selectedCertificate = null"
      />
    </template>
  </Dialog>
  <Dialog
    v-model:visible="openNewDialog"
    :style="{ minwidth: '450px' }"
    header="Are you sure?"
    :modal="true"
    :closable="false"
  >
    <Card style="width: 25rem">
      <template #content>
        <p>
          This process will create a public/private key pair and X.509
          Certificate using the public key. Then, sign the certificate using
          YTUCESE root certificate. <br /><br />
          A password is mandotory to secure the private key.
        </p>

        <div class="mb-2">
          <div class="text-500 w-6 md:w-2 font-medium">Name</div>
          <InputText type="text" v-model="certificateName" />
        </div>
        <div class="text-500 w-6 md:w-2 font-medium">Password</div>
        <Password
          v-model="certificatePassword"
          :feedback="false"
          :toggleMask="true"
          autocomplete="one-time-code"
        />
      </template>
    </Card>
    <template #footer>
      <Button
        label="Create"
        :disabled="!certificatePassword || !certificateName"
        class="p-button-outlined"
        @click="createCertificate"
      />
      <Button
        label="Close"
        class="p-button-outlined"
        @click="openNewDialog = false"
      />
    </template>
  </Dialog>
</template>

<script>
import { FilterMatchMode } from "primevue/api";
import util from "../util/ServiceUtil";

export default {
  data() {
    return {
      filters: {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
      },
      util,
      certificates: null,
      certificatePassword: null,
      selectedCertificate: null,
      certificateName: null,
      openNewDialog: false,
    };
  },

  mounted() {
    this.fetchTenantsCertificates();
  },
  methods: {
    createCertificate() {
      const body = {
        name: this.certificateName,
        password: this.certificatePassword,
      };
      this.$axios
        .post("http://localhost:8082/v1/api/certificates/new", body)
        .then((resp) => {
          this.openNewDialog = false;
          const { data } = resp;
          if (data.responseHeader.success) {
            this.fetchTenantsCertificates();
            this.$toast.add({
              severity: "success",
              summary: "Success",
              detail: "Certificate successfully created",
              time: 3000,
            });
          } else {
            this.$toast.add({
              severity: "error",
              summary: "Error",
              detail: data.responseHeader.message.text,
              time: 3000,
            });
          }
        })
        .catch((e) => {
          this.openNewDialog = false;
          console.log(e);
          this.$toast.add({
            severity: "error",
            summary: "Error",
            detail: "Could not create certificate",
            time: 3000,
          });
        });
    },
    fetchTenantsCertificates() {
      this.$axios
        .get("http://localhost:8082/v1/api/certificates/mine")
        .then((resp) => {
          const { data } = resp;
          if (data.responseHeader.success) {
            this.certificates = data.certificates;
          }
        })
        .catch((e) => console.log(e));
    },
    showCertificate(signature) {
      this.$router.push("/certificates/" + signature.certificateId);
    },
    deleteCerticate() {
      this.$axios
        .post(
          "http://localhost:8082/v1/api/certificates/delete/" +
            this.selectedCertificate.certificateId
        )
        .then((resp) => {
          const { data } = resp;
          if (data.responseHeader.success) {
            this.$toast.add({
              severity: "success",
              summary: "Success",
              detail: "Certificate successfully deleted",
              time: 3000,
            });
            this.fetchTenantsCertificates();
          } else {
            this.$toast.add({
              severity: "error",
              summary: "Error",
              detail: data.responseHeader.message.text,
              time: 3000,
            });
          }
        })
        .catch((e) => {
          console.log(e);
          this.$toast.add({
            severity: "error",
            summary: "Error",
            detail: "Could not delete the certificate",
            time: 3000,
          });
        });
      this.selectedCertificate = null;
    },
  },

  computed: {
    deleteCertificateDialog() {
      return this.selectedCertificate !== null;
    },
  },
};
</script>
