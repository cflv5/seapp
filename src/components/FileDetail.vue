<template>
  <div class="card" v-if="mounted">
    <Toast />
    <div class="surface-section" v-if="access && file">
      <div class="font-medium text-3xl text-900 mb-3">File Information</div>
      <div class="text-500 mb-5 flex justify-content-between">
        <Button
          icon="pi pi-pencil"
          label="Sign"
          class="p-button-rounded p-button-success"
          @click="downloadFile"
        ></Button>
        <Button
          icon="pi pi-download"
          label="Download"
          class="p-button-rounded p-button-danger"
          @click="downloadFile"
        ></Button>
      </div>
      <ul class="list-none p-0 m-0">
        <li
          class="flex align-items-center py-3 px-2 my-3 border-top-1 surface-border flex-wrap"
        >
          <div class="text-500 w-6 md:w-2 font-medium">Name</div>
          <div class="text-900 w-full md:w-8 md:flex-order-0 flex-order-1">
            {{ file.name }}
          </div>
        </li>
        <li
          class="flex align-items-center py-3 px-2 my-3 border-top-1 surface-border flex-wrap"
        >
          <div class="text-500 w-6 md:w-2 font-medium">Size</div>
          <div class="text-900 w-full md:w-8 md:flex-order-0 flex-order-1">
            {{ calculateSize(file.length) }}
          </div>
        </li>
        <li
          class="flex align-items-center py-3 px-2 my-3 border-top-1 border-top-1 surface-border flex-wrap"
        >
          <div class="text-500 w-6 md:w-2 font-medium">Owner</div>
          <div
            class="text-900 w-full md:w-8 md:flex-order-0 flex-order-1 line-height-3"
          >
            <Skeleton
              v-if="!file.ownerName"
              width="10rem"
              class="mb-2"
            ></Skeleton>
            <div v-else>
              {{ file.ownerName }}
            </div>
          </div>
        </li>
        <li
          class="flex align-items-center py-3 px-2 border-top-1 surface-border flex-wrap"
        >
          <div class="text-500 w-6 md:w-2 font-medium">Access</div>
          <div class="text-900 w-full md:w-8 md:flex-order-0 flex-order-1">
            <Chip :label="file.accessType" class="mr-2"></Chip>
          </div>
          <div class="w-6 md:w-2 flex justify-content-end" v-if="true">
            <Button
              label="Edit"
              icon="pi pi-user-edit"
              class="p-button-text"
              @click="updateAccessType()"
            ></Button>
          </div>
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

    <Dialog
      v-model:visible="updateAccessTypeDialog"
      :style="{ minwidth: '450px' }"
      header="Update"
      :modal="true"
    >
      <div v-if="file" class="card">
        <span class="m-2 flex align-items-center">
          <span>
            <strong>{{ file.name }}</strong> has access type
          </span>
          <SelectButton
            v-model="file.accessType"
            :options="['PRIVATE', 'PUBLIC']"
            class="mx-2"
            @change="changeAccessType"
          />
        </span>
      </div>
      <div v-if="file.accessType === 'PRIVATE'" class="card">
        <span> Access Policy List: </span>
        <Skeleton
          v-if="!fileAccessPolicyList"
          height="4rem"
          class="mt-2"
        ></Skeleton>
        <div v-else class="m-2">
          <ul class="px-1">
            <li
              v-for="(item, i) in fileAccessPolicyList"
              :key="item"
              class="flex align-items-center justify-content-between my-2"
            >
              <span>
                {{ item.email }}
              </span>
              <span>
                <Dropdown
                  v-model="fileAccessPolicyList[i].actionModel"
                  :options="['VIEW', 'EDIT']"
                  class="mx-1"
                  @change="updatePolicy($event, fileAccessPolicyList[i].id)"
                />

                <Button
                  icon="pi pi-times"
                  class="p-button-rounded p-button-danger"
                  @click="deleteFileRight(item.id)"
                ></Button>
              </span>
            </li>
          </ul>
        </div>
      </div>

      <template #footer>
        <Button
          label="No"
          icon="pi pi-times"
          class="p-button-text"
          @click="updateAccessTypeDialog = false"
        />
        <Button label="Yes" icon="pi pi-check" class="p-button-text" />
      </template>
    </Dialog>
  </div>
</template>

<script>
import axios, { AxiosError } from "axios";

export default {
  data() {
    return {
      fileId: this.$route.params.id,
      file: null,
      access: false,
      fileNotFound: false,
      mounted: false,
      updateAccessTypeDialog: false,
      fileAccessPolicyList: null,
    };
  },

  async created() {
    let response;
    try {
      response = await axios.get(
        "http://localhost:8081/v1/api/files/" + this.fileId,
        {
          headers: {
            X_TENANT_ID: this.$tenant,
          },
        }
      );
    } catch (e) {
      this.handleError(e);
      this.mounted = true;
      return;
    }
    console.log(response);
    if (response.data.responseHeader.success) {
      this.access = true;
      this.file = response.data.file;
      this.fileAccessType = this.file.accessType;
      this.getFileOwner(response.data.file.tenantId);
    } else {
      this.$toast.add({
        severity: "error",
        summary: "Warning",
        detail: response.data.responseHeader.message.text,
        life: 3000,
      });
    }
    this.mounted = true;
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
    calculateSize(value) {
      if (value > 1024 && value < 1048576) {
        return Math.round(value / 1024) + " KB";
      } else if (value > 1048576) {
        return Math.round(value / 1048576) + " MB";
      } else {
        return value + " Bytes";
      }
    },
    getFileOwner(id) {
      axios
        .get("http://localhost:8080/v1/api/users/" + id, {
          headers: {
            X_TENANT_ID: this.$tenant,
          },
        })
        .then((response) => {
          const data = response.data;

          if (data.responseHeader.success) {
            const { tenant } = data;
            this.file.ownerName = `${tenant.title} ${tenant.name} ${
              tenant.middleName ? tenant.middleName[0] : ""
            }. ${tenant.surname}`;
          } else {
            this.file.ownerName = "Owner could not found";
          }
        });
    },
    updateAccessType() {
      this.updateAccessTypeDialog = true;
      axios
        .get("http://localhost:8081/v1/api/rights/file/" + this.file.fileId, {
          headers: {
            X_TENANT_ID: this.$tenant,
          },
        })
        .then((resp) => {
          const { data } = resp;
          console.log("rights", data);
          if (data.responseHeader.success) {
            this.fileAccessPolicyList = [];
            data.policies.forEach(async (element) => {
              console.log("policy", element);
              const email = await this.fetchUserEmail(element.tenantId);
              console.log("email", email);
              if (email) {
                this.fileAccessPolicyList.push({
                  email,
                  id: element.id,
                  action: element.action,
                  actionModel: element.action
                });
              }
            });
            console.log(this.fileAccessPolicyList);
          }
        });
    },
    async fetchUserEmail(tenantId) {
      console.log("inside fetch", tenantId);
      return await axios
        .get("http://localhost:8080/v1/api/users/" + tenantId, {
          headers: {
            X_TENANT_ID: this.$tenant,
          },
        })
        .then((resp) => {
          if (resp.data.responseHeader.success) {
            return resp.data.tenant.email;
          }
          return null;
        })
        .catch(() => null);
    },
    changeAccessType(e) {
      axios
        .post(
          "http://localhost:8081/v1/api/files/access-type/" + this.file.fileId,
          {
            accessType: e.value,
          },
          {
            headers: {
              X_TENANT_ID: this.$tenant,
            },
          }
        )
        .then((resp) => {
          const { data } = resp;
          if (!data.responseHeader.success) {
            this.file.accessType =
              this.file.accessType === "PRIVATE" ? "PUBLIC" : "PRIVATE";
            this.$toast.add({
              severity: "error",
              summary: "Warning",
              detail: data.responseHeader.message.text,
              life: 3000,
            });
          }
        })
        .catch((e) => {
          console.log("HATA", e);
          this.file.accessType =
            this.file.accessType === "PRIVATE" ? "PUBLIC" : "PRIVATE";
          this.$toast.add({
            severity: "error",
            summary: "Warning",
            detail: "An error occured",
            life: 3000,
          });
        });
    },
    deleteFileRight(id) {
      axios
        .post(
          "http://localhost:8081/v1/api/rights/delete/" +
            id +
            "/file/" +
            this.file.fileId,
          null,
          {
            headers: {
              X_TENANT_ID: this.$tenant,
            },
          }
        )
        .then((resp) => {
          const { data } = resp;
          if (data.responseHeader.success) {
            this.fileAccessPolicyList = this.fileAccessPolicyList.filter(
              (v) => v.id != id
            );
          }
        });
    },
    downloadFile() {
      const file = this.file;
      axios
        .get("http://localhost:8081/v1/api/files/content/" + this.file.fileId, {
          headers: { X_TENANT_ID: this.$tenant },
          responseType: "blob",
        })
        .then(function (response) {
          const { data } = response;
          let fileName = file.name;
          const url = window.URL.createObjectURL(
            new Blob([data], {
              type: file.contentType,
            })
          );
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", fileName);
          document.body.appendChild(link);
          link.click();
        });
    },
    updatePolicy(e, p) {
        console.log(e, p);
    }
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
