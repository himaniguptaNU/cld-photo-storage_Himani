<script setup lang="ts">
/*
Example of how to use Nuxt's server API to get/send data from Supabase
    This is how we do it in actual production for security

const body = {
  table: "table_name",
  bucket: "bucket_name",
  fileName: "file_name",
}

const data = await $fetch("/api/fetchData", {
  method: "POST",
  body,
});

 // uses Nuxt's special $fetch function, basically the same as fetch

console.log(data); // either table data in JSON format or URL to image/whatever asset
*/

// Create dynamic reference to table data
//    Anything inside a 'ref' vue/nuxt will watch for changes and update the DOM
const dataReference = ref<any>(null);
const retrievedData = await $fetch("/api/fetchData", {
  method: "POST",
  body: {
    table: "test",
  },
});

if (retrievedData && retrievedData.length > 0) {
  dataReference.value = retrievedData;
} else {
  dataReference.value = [
    { id: 1, message: "Sample Data 1" },
    { id: 2, message: "Sample Data 2" },
    { id: 3, message: "Sample Data 3" },
    { id: 4, message: "Sample Data 4" },
    { id: 5, message: "Sample Data 5" },
  ];
}

// Using a reactive form state to handle user input
const formState = reactive({
  message: "",
});

// Fill in with code to use our api to send data to Supabase
async function submitForm() {
  console.log("Form State: ", formState);
  // YOUR CODE HERE
}
</script>

<template>
  <!-- Example of how to use a reusable component. No import is needed, all components are automatically imported. -->
  <Header />
  <div class="flex flex-col items-center justify-center">
    <!-- A basic form is provided as an example. Modify it as you please. -->
    <div class="flex flex-col justify-center items-center gap-4 w-full">
      <h2 class="text-2xl font-bold">Table Data</h2>
      <ul>
        <!-- Example of how to cleanly display data via vue loops -->
        <li v-for="item in dataReference" :key="item.id">
          <!-- Example of dynmaically displaying data in our HTML -->
          <span>{{ item }}</span>
        </li>
      </ul>
    </div>

    <div class="flex flex-col justify-center items-center gap-4 w-full mt-8">
      <h2 class="text-2xl font-bold">Form</h2>
      <p>Form State {{ formState }}</p>
      <div class="flex flex-row gap-4">
        <p>Message:</p>
        <!-- v-model allows the input to simultaneously dipslay and update the formState.message variable -->
        <input
          type="text"
          v-model="formState.message"
          placeholder="Enter a message"
        />
      </div>
      <button
        class="bg-blue-500 text-white px-4 py-2 rounded-md"
        @click="submitForm"
      >
        Submit
      </button>
    </div>
  </div>
</template>
