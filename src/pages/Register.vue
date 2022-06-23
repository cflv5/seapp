<template>
  <div class="card">
    <Toast />
    <div class="surface-section flex justify-content-center">
      <div class="font-medium text-3xl text-900 mb-3">Register</div>
      <ul class="list-none p-0 m-0">
        <li
          class="flex align-items-center py-3 px-2 my-3 border-top-1 surface-border flex-wrap"
        >
          <div class="text-900 w-full md:w-8 md:flex-order-0 flex-order-1">
            <div class="flex justify-content-between align-items-center">
              <InputText
                type="email"
                placeholder="Email"
                v-model="user.email"
              />
            </div>
          </div>
        </li>
        <li
          class="flex align-items-center py-3 px-2 my-3 border-top-1 surface-border flex-wrap"
        >
          <div class="text-900 w-full md:w-8 md:flex-order-0 flex-order-1">
            <Password
              placeholder="Password"
              v-model="user.password"
              :feedback="false"
              :toggleMask="true"
              autocomplete="one-time-code"
            />
          </div>
        </li>

        <li
          class="flex align-items-center py-3 px-2 my-3 border-top-1 surface-border flex-wrap"
        >
          <div class="text-900 w-full md:w-8 md:flex-order-0 flex-order-1">
            <InputText type="text" placeholder="Name" v-model="user.name" />
          </div>
        </li>
        <li
          class="flex align-items-center py-3 px-2 my-3 border-top-1 surface-border flex-wrap"
        >
          <div class="text-900 w-full md:w-8 md:flex-order-0 flex-order-1">
            <InputText
              type="text"
              placeholder="Middlename"
              v-model="user.middlename"
            />
          </div>
        </li>
        <li
          class="flex align-items-center py-3 px-2 my-3 border-top-1 surface-border flex-wrap"
        >
          <div class="text-900 w-full md:w-8 md:flex-order-0 flex-order-1">
            <InputText type="text" placeholder="Surname" v-model="user.surname" />
          </div>
        </li>
        <li
          class="flex align-items-center py-3 px-2 my-3 border-top-1 surface-border flex-wrap"
        >
          <div class="text-900 w-full md:w-8 md:flex-order-0 flex-order-1">
            <Button
              label="Register"
              class="p-button-danger block m-auto"
              @click="registerUser"
            ></Button>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      user: {},
    };
  },
  created() {
    if (this.$store.getters.tenantId) {
      this.$router.push("/files");
    }
  },
  methods: {
    registerUser() {
      if (!this.validateForm()) {
        this.$toast.add({
          severity: "error",
          summary: "Error",
          detail: "Please complete the form",
          time: 3000,
        });
        return;
      }
      this.$axios
        .post("http://localhosts:8080/v1/api/users/register", this.user)
        .then((resp) => {
          const { data } = resp;
          if (data.responseHeader.success) {
            this.$router.push("/login");
          } else {
            this.$toast.add({
              severity: "error",
              summary: "Error",
              detail: data.responseHeader.message.text,
              time: 3000,
            });
          }
        });
    },
    validateForm() {
      return !(
        !this.user.email ||
        !this.user.password ||
        !this.user.name ||
        !this.user.surname
      );
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
