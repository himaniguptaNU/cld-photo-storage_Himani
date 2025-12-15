<script setup lang="ts">
const supabase = useSupabaseClient();
const router = useRouter();

const formState = reactive({
  email: '',
  password: '',
  error: ''
});

async function handleLogin() {
  formState.error = '';
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: formState.email,
    password: formState.password,
  });

  if (error) {
    formState.error = error.message;
  } else {
    router.push('/');
  }
}

function goToSignup() {
  router.push('/signup');
}
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-gray-100">
    <div class="bg-white p-8 rounded-lg shadow-md w-96">
      <h1 class="text-3xl font-bold mb-6 text-center">Login</h1>
      
      <div v-if="formState.error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {{ formState.error }}
      </div>

      <div class="flex flex-col gap-4">
        <div>
          <label class="block text-sm font-medium mb-2">Email</label>
          <input
            type="email"
            v-model="formState.email"
            placeholder="Enter your email"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">Password</label>
          <input
            type="password"
            v-model="formState.password"
            placeholder="Enter your password"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          @click="handleLogin"
          class="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
        >
          Login
        </button>

        <div class="text-center mt-4">
          <p class="text-sm text-gray-600">
            Don't have an account?
            <button @click="goToSignup" class="text-blue-500 hover:underline">
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>