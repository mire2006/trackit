<template>
  <div class="dashboard-container">
    <h1>Bienvenido a Track it!</h1>
    <p>Este es tu panel de control.</p>
    
    </div>
</template>

<script setup>
import { onMounted } from 'vue';

onMounted(() => {
  console.log('Dashboard montado');
});
</script>

<style>
@import '../styles/App.css'; 
</style>

