<template>
    <div class="dashboard-container">
      <h1>Bienvenido a Track it!</h1>
      <p>Este es tu panel de control.</p>
      
      <DashboardMenu /> 
  
      </div>
  </template>
  
  <script setup>
 
  import DashboardMenu from '@/components/DashboardMenu.vue';
  
  import { onMounted } from 'vue';
  
  onMounted(() => {
    console.log('Dashboard montado');
  });
    
  </script>


<style>
@import '../styles/App.css';
</style>

