<script lang="ts" setup>
import { Button } from '@/components/ui/button'
</script>

<template>
  <Button 
    variant="link" 
    type="button"
    class="text-muted-foreground" 
    @click="$router.push('/auth/forgot-password')"
  >
    忘记密码？
  </Button>
</template>

<style scoped>

</style>
