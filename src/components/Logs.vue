<template>
  <div class="grid">
    <div class="col-12">
      <div class="card">
        <Toast />
        <DataTable
          ref="dt"
          :value="logs"
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
              <h5 class="m-0">User Logs</h5>
              <span class="block mt-2 md:mt-0">
                <InputText
                  v-model="filters['global'].value"
                  placeholder="Search..."
                />
              </span>
            </div>
          </template>

          <Column field="requestId" header="Request Id" :sortable="true">
            <template #body="slotProps">
              <span class="p-column-title">Request Id</span>
              <strong>{{ slotProps.data.requestId }}</strong>
            </template>
          </Column>
          <Column field="length" header="Message" :sortable="true">
            <template #body="slotProps">
              <span class="p-column-title">Message</span>
              {{ slotProps.data.message }}
            </template>
          </Column>
          <Column field="length" header="Date" :sortable="true">
            <template #body="slotProps">
              <span class="p-column-title">Date</span>
                {{ util.formatDateTime(slotProps.data.createdAt) }}
            </template>
          </Column>
        </DataTable>
      </div>
    </div>
  </div>
</template>

<script>
import { FilterMatchMode } from "primevue/api";
import util  from '../util/ServiceUtil'

export default {
  data() {
    return {
      filters: {},
      logs: null,
      util,
    };
  },
  created() {
    this.initFilters();
  },
  mounted() {
    this.fetchLogs();
  },
  methods: {
    fetchLogs() {
      return this.$axios
        .get("http://localhost:8082/v1/api/logs")
        .then((resp) => {
          const { data } = resp;
          if (data.responseHeader.success) {
            this.logs = data.logs;
          } else {
            this.$toast.add({
              severity: "error",
              summary: "Warning",
              detail: data.responseHeader.message.text,
              life: 3000,
            });
          }
        })
        .catch((e) => {
          console.log(e);
          this.$toast.add({
            severity: "error",
            summary: "Warning",
            detail: "An error occured while fetching the users logs",
            life: 3000,
          });
        });
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
