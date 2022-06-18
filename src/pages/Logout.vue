<template>
Logging out...
</template>

<script>
    
export default {
    created() {
        this.$store.commit("setTenantId", "");
        this.$router.push("/login");
    }
}
</script>