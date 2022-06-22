<template>
  <div class="card" v-if="mounted">
    <Toast />
    <div class="surface-section" v-if="access && user">
      <div class="font-medium text-3xl text-900 mb-3">User</div>
      <ul class="list-none p-0 m-0">
        <li
          class="flex align-items-center py-3 px-2 my-3 border-top-1 surface-border flex-wrap justify-content-center"
        >
          <div
            class="text-900 w-full md:w-8 md:flex-order-0 flex justify-content-center"
          >
            <span
              v-if="profilePicture"
              class="flex flex-column aligns-item-center justify-content-center"
            >
              <Image
                :src="profilePicture"
                imageClass="pp"
                alt="Profile Picture"
                :preview="profilePicture !== '/images/noimage.png'"
              >
                <template #indicator> Preview Profile Picture </template>
              </Image>
              <span v-if="isProfile">
                <FileUpload
                  mode="basic"
                  :maxFileSize="1000000"
                  label="Edit"
                  accept="image/png"
                  chooseLabel="Edit"
                  class="block p-button-text p-1 m-auto"
                  :customUpload="true"
                  :auto="true"
                  @uploader="uploader"
                />
                <Button
                  class="p-button-text p-1"
                  label="Clear"
                  v-if="profilePicture !== '/images/noimage.png'"
                  @click="clearConfirmDiaolog = true"
                />
              </span>
            </span>
            <ProgressSpinner v-else />
          </div>
        </li>
        <li
          class="flex align-items-center py-3 px-2 my-3 border-top-1 surface-border flex-wrap"
        >
          <div class="text-500 w-6 md:w-2 font-medium">Name</div>
          <div class="text-900 w-full md:w-8 md:flex-order-0 flex-order-1">
            <span>
              {{ util.getTenantFullName(user) }}
            </span>
          </div>
        </li>
      </ul>
    </div>

    <div id="main" v-if="userNotFound">
      <div class="fof">
        <h1>User Not Found</h1>
      </div>
    </div>
    <div id="main" v-if="!access">
      <div class="fof">
        <h1>Unauthorized</h1>
      </div>
    </div>
  </div>

  <Dialog v-model:visible="clearConfirmDiaolog" header="Clear" :modal="true">
    <div>
      <p>Are you sure?</p>
    </div>

    <template #footer>
      <Button
        label="Clear"
        class="p-button-text"
        @click="clearProfilePicture"
      />
      <Button
        label="Close"
        class="p-button-text"
        @click="clearConfirmDiaolog = false"
      />
    </template>
  </Dialog>
</template>

<script>
import util from "../util/ServiceUtil";
import { AxiosError } from "axios";

export default {
  data() {
    return {
      tenantId: this.$route.params.id || this.$store.getters.tenantId,
      isProfile: this.$route.params.id === this.$store.getters.tenantId,
      user: null,
      tenant: null,
      access: false,
      userNotFound: false,
      mounted: false,
      profilePicture: "",
      clearConfirmDiaolog: false,
      pp: null,
      util,
    };
  },

  async created() {
    this.$axios
      .get("http://localhost:8080/v1/api/users/" + this.tenantId)
      .then((response) => {
        this.mounted = true;
        if (response.data.responseHeader.success) {
          this.access = true;
          this.user = response.data.tenant;
          this.fetchProfilePicture();
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
        this.userNotFound = true;
      } else {
        this.$toast.add({
          severity: "error",
          summary: "Warning",
          detail: "An error occured. Please reload the page",
          life: 3000,
        });
      }
    },
    uploader(event) {
      this.pp = event.files[0];
      const formData = new FormData();

      formData.append("picture", this.pp);

      this.$axios
        .post("http://localhost:8080/v1/api/users/profile/me/picture", formData)
        .then((resp) => {
          const { data } = resp;
          if (data.responseHeader.success) {
            this.fetchProfilePicture();
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
            detail: "An error occured.",
            life: 3000,
          });
        });
    },
    fetchProfilePicture() {
      this.$axios
        .get(
          "http://localhost:8080/v1/api/users/profile/picture/" +
            this.user.tenantId
        )
        .then((resp) => {
          if (resp.data) {
            this.profilePicture = "data:image/png;base64," + resp.data;
          } else {
            this.profilePicture = "/images/noimage.png";
          }
        })
        .catch((e) => {
          console.log(e);
          this.profilePicture = "/images/noimage.png";
        });
    },
    clearProfilePicture() {
      this.$axios
        .post("http://localhost:8080/v1/api/users/profile/picture/clear")
        .then((resp) => {
          this.clearConfirmDiaolog = false;
          if (resp.data.responseHeader.success) {
            this.profilePicture = "/images/noimage.png";
          } else {
            this.$toast.add({
              severity: "error",
              summary: "Warning",
              detail: "An error occured.",
              life: 3000,
            });
          }
        })
        .catch((e) => {
          console.log(e);
          this.clearConfirmDiaolog = false;
          this.$toast.add({
            severity: "error",
            summary: "Warning",
            detail: "An error occured.",
            life: 3000,
          });
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

@media screen and (min-width: 450px) {
  .pp {
    max-height: 150px;
  }
}
@media screen and (min-width: 746px) {
  .pp {
    max-height: 250px;
  }
}
</style>
