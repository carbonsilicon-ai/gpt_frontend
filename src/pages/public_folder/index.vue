<template>
  <GPT_Page :isSidebarOpen="false">
    <main_list class="bg-muted/40"/>
  </GPT_Page>
</template>

<script setup lang="ts">
import GPT_Page from '@/components/Layout/GPT_Page.vue';
import main_list from '@/pages/public_folder/components/main_list.vue';
</script>

<route lang="yaml">
  meta:
    layout: blank
</route>
