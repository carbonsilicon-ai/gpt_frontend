<script setup lang="ts">
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar'

const props = withDefaults(defineProps<{
  isOpen: boolean
}>(), {
  isOpen: false
})

</script>

<template>
  <SidebarProvider :open="props.isOpen">
    <Sidebar>
      <SidebarHeader>
        <slot name="sider_header" />
      </SidebarHeader>

      <SidebarContent>
        <slot name="sider_content" />
      </SidebarContent>

      <SidebarRail />
    </Sidebar>

    <SidebarInset>
      <!-- <SidebarTrigger class="-ml-1 absolute top-0 left-0 px-4 z-10" /> -->
      <slot />
    </SidebarInset>
  </SidebarProvider>
</template>