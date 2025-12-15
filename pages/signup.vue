<script setup lang="ts">
const supabase = useSupabaseClient();
const router = useRouter();

const formState = reactive({
  email: '',
  password: '',
  confirmPassword: '',
  error: '',
  success: '',
  loading: false
});

async function handleSignup() {
  formState.error = '';
  formState.success = '';
  formState.loading = true;

  // Validation
  if (!formState.email || !formState.password) {
    formState.error = 'Email and password are required';
    formState.loading = false;
    return;
  }

  if (formState.password !== formState.confirmPassword) {
    formState.error = 'Passwords do not match';
    formState.loading = false;
    return;
  }

  if (formState.password.length < 6) {
    formState.error = 'Password must be at least 6 characters';
    formState.loading = false;
    return;
  }

  try {
    // Try to sign up directly
    const { data, error } = await supabase.auth.signUp({
      email: formState.email,
      password: formState.password,
      options: {
        data: {
          role: 'basic'
        }
      }
    });

    if (error) {
      console.error('Signup error:', error);
      
      // Handle various error cases
      if (error.message.includes('already registered') || 
          error.message.includes('User already registered') ||
          error.message.includes('duplicate') ||
          error.message.includes('already exists')) {
        formState.error = 'This email is already registered. Please login instead.';
      } else if (error.message.includes('email')) {
        formState.error = 'Invalid email address. Please check and try again.';
      } else if (error.message.includes('password')) {
        formState.error = 'Password does not meet requirements. Please use at least 6 characters.';
      } else {
        formState.error = error.message;
      }
      formState.loading = false;
      return;
    }

    // Check if signup was successful
    // When email confirmation is DISABLED and user signs up:
    // - data.user exists
    // - data.session exists (user is auto-logged in)
    
    // When user already exists (with confirmation disabled):
    // - Sometimes data.user exists but is the EXISTING user
    // - data.session might be null
    
    // When email confirmation is ENABLED:
    // - data.user exists but email is not confirmed
    // - data.session is null
    
    if (data.user) {
      // Check if this is a new user or existing user
      // If session exists and user was just created, they're logged in
      if (data.session) {
        formState.success = 'Account created successfully! Redirecting to gallery...';
        formState.email = '';
        formState.password = '';
        formState.confirmPassword = '';
        setTimeout(() => {
          router.push('/');
        }, 1500);
      } else {
        // No session - either email confirmation required OR user already exists
        // Check if user has identities (new users have identities)
        if (data.user.identities && data.user.identities.length > 0) {
          // New user - email confirmation required
          formState.success = 'Account created successfully! Redirecting to login...';
          formState.email = '';
          formState.password = '';
          formState.confirmPassword = '';
          setTimeout(() => {
            router.push('/login');
          }, 2000);
        } else {
          // Existing user (identities array is empty)
          formState.error = 'This email is already registered. Please login instead.';
          formState.loading = false;
        }
      }
    } else {
      formState.error = 'Failed to create account. Please try again.';
      formState.loading = false;
    }
  } catch (error: any) {
    console.error('Unexpected error:', error);
    formState.error = error.message || 'An unexpected error occurred. Please try again.';
    formState.loading = false;
  }
}

function goToLogin() {
  router.push('/login');
}
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-gray-100">
    <div class="bg-white p-8 rounded-lg shadow-md w-96">
      <h1 class="text-3xl font-bold mb-6 text-center">Sign Up</h1>
      
      <div v-if="formState.error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <p class="font-semibold">Error</p>
        <p class="text-sm">{{ formState.error }}</p>
      </div>

      <div v-if="formState.success" class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
        <p class="font-semibold">Success!</p>
        <p class="text-sm">{{ formState.success }}</p>
      </div>

      <div class="flex flex-col gap-4">
        <div>
          <label class="block text-sm font-medium mb-2">Email</label>
          <input
            type="email"
            v-model="formState.email"
            placeholder="Enter your email"
            :disabled="formState.loading || !!formState.success"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">Password</label>
          <input
            type="password"
            v-model="formState.password"
            placeholder="Enter your password (min 6 characters)"
            :disabled="formState.loading || !!formState.success"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">Confirm Password</label>
          <input
            type="password"
            v-model="formState.confirmPassword"
            placeholder="Confirm your password"
            :disabled="formState.loading || !!formState.success"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            @keyup.enter="handleSignup"
          />
        </div>

        <button
          @click="handleSignup"
          :disabled="formState.loading || !!formState.success"
          class="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {{ formState.loading ? 'Creating Account...' : 'Sign Up' }}
        </button>

        <div class="text-center mt-4">
          <p class="text-sm text-gray-600">
            Already have an account?
            <button 
              @click="goToLogin" 
              class="text-blue-500 hover:underline"
              :disabled="formState.loading"
            >
              Login here
            </button>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>