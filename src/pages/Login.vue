<template>
  <div
    class="surface-0 flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden"
  >
    <Toast />
    <div class="grid justify-content-center p-2 lg:p-0" style="min-width: 80%">
      <div class="col-12 mt-5 xl:mt-0 text-center">
        <img :src="'/images/logo.png'" alt="Sakai logo" class="mb-5" />
      </div>
      <div
        class="col-12 xl:col-6"
        style="
          border-radius: 56px;
          padding: 0.3rem;
          background: linear-gradient(
            180deg,
            var(--primary-color),
            rgba(33, 150, 243, 0) 30%
          );
        "
      >
        <div
          class="h-full w-full m-0 py-7 px-4"
          style="
            border-radius: 53px;
            background: linear-gradient(
              180deg,
              var(--surface-50) 38.9%,
              var(--surface-0)
            );
          "
        >
          <div class="w-full md:w-10 mx-auto">
            <label for="email1" class="block text-900 text-xl font-medium mb-2"
              >Email</label
            >
            <InputText
              id="email1"
              required="true"
              v-model="email"
              type="text"
              class="w-full mb-3"
              placeholder="Email"
              style="padding: 1rem"
            />

            <label
              for="password1"
              class="block text-900 font-medium text-xl mb-2"
              >Password</label
            >
            <Password
              id="password1"
              :feedback="false"
              v-model="password"
              placeholder="Password"
              :toggleMask="true"
              class="w-full mb-3"
              inputClass="w-full"
              inputStyle="padding:1rem"
              @keyup.enter="login"
            />

            <Button
              label="Sign In"
              class="w-full p-3 text-xl"
              @click="login"
            ></Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import UserService from "../service/UserService";
import util from "../util/ServiceUtil";

export default {
  data() {
    return {
      email: "",
      password: "",
      submitted: false,
    };
  },

  userService: null,

  created() {
    if (this.$store.getters.tenantId) {
      this.$router.push("/files");
      return;
    }
    this.userService = new UserService(this);
  },

  methods: {
    login() {
      const that = this;
      if (!this.submitted) {
        this.submitted = true;
        this.userService.login(this.email, this.password).catch((e) => {
          that.submitted = false;
          this.$toast.add(util.handleAxiosError(e));
        });
      }
    },
  },
};
</script>

<style scoped>
.pi-eye {
  transform: scale(1.6);
  margin-right: 1rem;
}

.pi-eye-slash {
  transform: scale(1.6);
  margin-right: 1rem;
}
</style>
