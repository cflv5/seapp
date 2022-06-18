<template>
  <div class="grid">
    <div class="col-12">
      <div class="card">
        <Toast />
        <DataTable
          ref="dt"
          :value="signatures"
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
              <h5 class="m-0">User Signatures</h5>
              <span class="block mt-2 md:mt-0">
                <InputText
                  v-model="filters['global'].value"
                  placeholder="Search..."
                />
              </span>
            </div>
          </template>

          <Column field="createdAt" header="Time" :sortable="true">
            <template #body="slotProps">
              <span class="p-column-title">Time</span>
              <strong>{{
                util.formatDateTime(slotProps.data.createdAt)
              }}</strong>
            </template>
          </Column>
          <Column field="fileName" header="File" :sortable="true">
            <template #body="slotProps">
              <span class="p-column-title">File</span>
              <div v-if="slotProps.data.fileNameError">
                <InlineMessage>File not accessible</InlineMessage>
              </div>
              <Skeleton
                v-else-if="!slotProps.data.fileName"
                width="10rem"
                class="mb-2"
              ></Skeleton>
              <div v-else>
                {{ slotProps.data.fileName }}
              </div>
            </template>
          </Column>
          <Column
            field="certificateName"
            header="Certificate Name"
            :sortable="true"
            headerStyle="width:14%; min-width:10rem;"
          >
            <template #body="slotProps">
              <span class="p-column-title">Certificate Name</span>
              <div v-if="slotProps.data.certificateNameError">
                <InlineMessage>Certificate not accessible</InlineMessage>
              </div>
              <Skeleton
                v-else-if="!slotProps.data.certificateName"
                width="10rem"
                class="mb-2"
              ></Skeleton>
              <div v-else>
                {{ slotProps.data.certificateName }}
              </div>
            </template>
          </Column>
          <Column header="Show">
            <template #body="slotProps">
              <Button
                icon="pi pi-eye"
                class="p-button-link p-button-success mr-2"
                @click="showSignature(slotProps.data)"
              />
            </template>
          </Column>
        </DataTable>
      </div>
    </div>
  </div>
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
      signatures: null,
    };
  },

  mounted() {
    this.$axios
      .get("http://localhost:8082/v1/api/signatures/mine")
      .then((resp) => {
        const { data } = resp;
        if (data.responseHeader.success) {
          this.signatures = data.signatures;
          this.getFileNames();
          this.getCertificateNames();
        }
      })
      .catch((e) => console.log(e));
  },
  methods: {
    showSignature(signature) {
      // let routeData = this.$router.resolve('/signatures' + signature.id);
      // window.open(routeData.href, "_blank");
      this.$router.push("/signatures/" + signature.id);
    },
    getFileNames() {
      this.signatures.forEach((s) => {
        this.$axios
          .get("http://localhost:8081/v1/api/files/" + s.fileId)
          .then((resp) => {
            const { data } = resp;
            if (data.responseHeader.success) {
              s.fileName = data.file.name;
            } else {
              s.fileNameError = true;
            }
          })
          .catch((e) => {
            console.log(e);
            s.fileNameError = true;
          });
      });
    },
    getCertificateNames() {
      this.signatures.forEach((s) => {
        this.$axios
          .get(
            "http://localhost:8082/v1/api/certificates/detail/" +
              s.certificateId
          )
          .then((resp) => {
            const { data } = resp;
            if (data.responseHeader.success) {
              s.certificateName = data.certificate.name;
            } else {
              s.certificateNameError = true;
            }
          })
          .catch((e) => {
            console.log(e);
            s.certificateNameError = true;
          });
      });
    },
  },
};
</script>
