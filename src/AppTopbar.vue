<template>
  <div class="layout-topbar">
    <router-link to="/" class="layout-topbar-logo">
      <img alt="Logo" src="images/logo-dark.svg" />
      <span>SAKAI</span>
    </router-link>
    <button
      class="p-link layout-menu-button layout-topbar-button"
      @click="onMenuToggle"
    >
      <em class="pi pi-bars"></em>
    </button>

    <button
      class="p-link layout-topbar-menu-button layout-topbar-button"
      v-styleclass="{
        selector: '@next',
        enterClass: 'hidden',
        enterActiveClass: 'scalein',
        leaveToClass: 'hidden',
        leaveActiveClass: 'fadeout',
        hideOnOutsideClick: true,
      }"
    >
      <em class="pi pi-ellipsis-v"></em>
    </button>
    <ul class="layout-topbar-menu hidden lg:flex origin-top">
      <li>
        <router-link to="/profile" v-slot="{ href, navigate }">
          <button
            :href="href"
            @click="navigate"
            class="p-link layout-topbar-button"
          >
            <em class="pi pi-user"></em>
            <span>Profile</span>
          </button>
        </router-link>
      </li>
      <li>
        <router-link to="/signout" v-slot="{ href, navigate }">
          <button
            :href="href"
            @click="navigate"
            class="p-link layout-topbar-button"
          >
            <em class="pi pi-sign-out"></em>
            <span>Signout</span>
          </button>
        </router-link>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  methods: {
    onMenuToggle(event) {
      this.$emit("menu-toggle", event);
    },
    onTopbarMenuToggle(event) {
      this.$emit("topbar-menu-toggle", event);
    },
  },
  computed: {
    darkTheme() {
      return this.$appState.darkTheme;
    },
  },
};
</script>