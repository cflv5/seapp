<template>
  <div class="card" v-if="mounted">
    <Toast />
    <div class="surface-section" v-if="access && user">
      <div class="font-medium text-3xl text-900 mb-3">
        User
      </div>
      <ul class="list-none p-0 m-0">
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
</template>

<script>
import util from "../util/ServiceUtil";
import { AxiosError } from "axios";

export default {
  data() {
    return {
      tenantId: this.$route.params.id || this.$store.getters.tenantId,
      user: null,
      tenant: null,
      access: false,
      userNotFound: false,
      mounted: false,
      util,
    };
  },

  async created() {
    this.$axios
      .get("http://localhost:8080/v1/api/users/" + this.tenantId)
      .then((response) => {
        console.log(response);
        this.mounted = true;
        if (response.data.responseHeader.success) {
          this.access = true;
          this.user = response.data.tenant;
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
