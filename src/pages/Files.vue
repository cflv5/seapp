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
                @click="openNew"
              />
            </div>
          </template>
        </Toolbar>

        <DataTable
          ref="dt"
          :value="files"
          v-model:selection="selectedProducts"
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
              <h5 class="m-0">User Files</h5>
              <span class="block mt-2 md:mt-0">
                <InputText
                  v-model="filters['global'].value"
                  placeholder="Search..."
                />
              </span>
            </div>
          </template>

          <Column field="name" header="Name" :sortable="true">
            <template #body="slotProps">
              <span class="p-column-title">Name</span>
              <strong>{{ slotProps.data.name }}</strong>
            </template>
          </Column>
          <Column field="length" header="Length" :sortable="true">
            <template #body="slotProps">
              <span class="p-column-title">Length</span>
              {{ formatLength(slotProps.data.length) }}
            </template>
          </Column>
          <Column
            field="accessType"
            header="Access Type"
            :sortable="true"
            headerStyle="width:14%; min-width:10rem;"
          >
            <template #body="slotProps">
              <span class="p-column-title">Access Type</span>
              {{ slotProps.data.accessType }}
            </template>
          </Column>
          <Column header="Show">
            <template #body="slotProps">
              <Button
                icon="pi pi-eye"
                class="p-button-link p-button-success mr-2"
                @click="showFile(slotProps.data)"
              />
            </template>
          </Column>
        </DataTable>

        <Dialog
          v-model:visible="fileDialog"
          :style="{ width: '450px' }"
          header="Product Details"
          :modal="true"
          class="p-fluid"
        >
          <div class="field">
            <label for="inventoryStatus" class="mb-3">Access Type</label>
            <Dropdown
              id="inventoryStatus"
              v-model="file.accessType"
              :options="statuses"
              optionLabel="label"
              placeholder="Select a Status"
            >
            </Dropdown>
          </div>

          <div class="field">
            <label class="mb-3">File</label>
            <div class="formgrid grid">
              <FileUpload
                mode="basic"
                :maxFileSize="1000000"
                label="Upload"
                chooseLabel="Upload"
                class="ml-2 inline-block"
                :customUpload="true"
                @select="myUploader"
                @uploader="cancelUpload"
              />
            </div>
          </div>

          <template #footer>
            <Button
              label="Cancel"
              icon="pi pi-times"
              class="p-button-text"
              @click="fileDialog = false"
            />
            <Button
              label="Save"
              icon="pi pi-check"
              class="p-button-text"
              @click="saveProduct"
            />
          </template>
        </Dialog>
      </div>
    </div>
  </div>
</template>

<script>
import { FilterMatchMode } from "primevue/api";
import asm from "asmcrypto-lite";
import axios from "axios";
import ProductService from "../service/ProductService";

export default {
  data() {
    return {
      fileDialog: false,
      deleteProductDialog: false,
      deleteProductsDialog: false,
      file: {},
      selectedProducts: null,
      filters: {},
      files: null,
      statuses: [
        { label: "Private", value: "PRIVATE" },
        { label: "Public", value: "PUBLIC" },
      ],
    };
  },
  productService: null,
  created() {
    this.productService = new ProductService();
    this.initFilters();
  },
  async mounted() {
    let response;
    try {
      response = await axios.get("http://localhost:8081/v1/api/files/mine", {
        headers: {
          X_TENANT_ID: this.$store.getters.tenantId,
        },
      });
    } catch (e) {
      console.log(e);
      this.$toast.add({
        severity: "error",
        summary: "Warning",
        detail: "An error occured. Please reload the page",
        life: 3000,
      });
      return;
    }
    this.files = response.data.files;
  },
  methods: {
    formatLength(value) {
      if (value > 1024 && value < 1048576) {
        return Math.round(value / 1024) + " Kb";
      } else if (value > 1048576) {
        return Math.round(value / 1048576) + " Mb";
      } else {
        return value + " Bytes";
      }
    },
    async myUploader(event) {
      this.file.content = event.files[0];
      this.file.fileHash = asm.SHA256.hex(await event.files[0].arrayBuffer());
    },
    cancelUpload() {
      this.file = {};
    },
    openNew() {
      this.file = {};
      this.fileDialog = true;
    },
    async saveProduct() {
      if (!this.file.content || !this.file.fileHash || !this.file.accessType) {
        this.$toast.add({
          severity: "error",
          summary: "Warning",
          detail: "Please complete the form",
          life: 3000,
        });
        return;
      }

      const formData = new FormData();

      formData.append("file", this.file.content);
      formData.append(
        "properties",
        new Blob(
          [
            JSON.stringify({
              accessType: this.file.accessType.value,
              hashValue: this.file.fileHash,
            }),
          ],
          {
            type: "application/json",
          }
        ),
        null
      );
      let response;
      try {
        response = await axios.post(
          "http://localhost:8081/v1/api/files",
          formData,
          {
            headers: {
              X_TENANT_ID: this.$store.getters.tenantId,
              "Content-Type": undefined,
            },
          }
        );
      } catch (e) {
        console.log(e);
        this.$toast.add({
          severity: "error",
          summary: "Warning",
          detail: "An error occured",
          life: 3000,
        });
      }
      const resp = response.data;
      if (resp.responseHeader.success === true) {
        this.$toast.add({
          severity: "success",
          summary: "Success",
          detail: "",
          life: 3000,
        });
      } else {
        this.$toast.add({
          severity: "error",
          summary: "Error",
          detail: resp.responseHeader.message.text,
          life: 3000,
        });
      }
      this.fileDialog = false;
    },
    showFile(file) {
      this.$router.push("/files/" + file.fileId);
    },
    confirmDeleteSelected() {
      this.deleteProductsDialog = true;
    },
    initFilters() {
      this.filters = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
      };
    },
  },
};
</script>

<style scoped lang="scss">
@import "../assets/demo/badges.scss";
</style>
