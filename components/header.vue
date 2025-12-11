<!-- Example of how to create a reusable component -->
<template>
  <div class="flex flex-row justify-between w-full px-4 pt-4">
    <img
      src="../public/full_logo.png"
      alt="Clear Lakes Dental"
      class="w-[256px] h-[152px]"
    />

    <div class="flex flex-row gap-8 h-fit pt-16">
      <!-- Example of Routing, '/' leads to index, but text leads to corresponding vue file in root/pages/ -->
      <h1
        class="text-3xl font-semibold border-2 border-[#a5dcb0] rounded-lg p-2 hover:bg-[#a5dcb0] hover:text-white"
        @click="navigateTo('/')"
      >
        Main Page
      </h1>
      <h1
        class="text-3xl font-semibold border-2 border-[#9ad7db] rounded-lg p-2 hover:bg-[#9ad7db] hover:text-white"
        @click="navigateTo('/addData')"
      >
        Add Data
      </h1>
    </div>
  </div>
</template>
