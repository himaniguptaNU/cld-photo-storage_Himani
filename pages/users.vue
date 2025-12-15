<script setup lang="ts">
const user = useSupabaseUser();
const router = useRouter();

const isAdmin = computed(() => {
  if (!user.value) return false;
  const role = user.value.user_metadata?.role;
  return role === 'admin';
});

// Redirect non-admins immediately
watchEffect(() => {
  if (user.value && !isAdmin.value) {
    router.push('/');
  }
});

interface User {
  id: string;
  email: string;
  role: string;
  banned: boolean;
  created_at: string;
}

const users = ref<User[]>([]);
const usersLoading = ref(false);
const usersError = ref('');
const initialLoadDone = ref(false);

const newUserForm = reactive({
  email: '',
  password: '',
  role: 'basic',
  error: '',
  success: '',
  loading: false
});

async function fetchUsers() {
  if (!isAdmin.value) {
    console.log('Not admin, skipping fetch');
    return;
  }

  console.log('Fetching users...');
  usersLoading.value = true;
  usersError.value = '';
  
  try {
    const data = await $fetch('/api/getUsers', {
      method: 'GET'
    });
    
    console.log('Users fetched successfully:', data);
    
    if (data && Array.isArray(data)) {
      users.value = data;
      initialLoadDone.value = true;
    } else {
      usersError.value = 'Invalid response from server';
    }
  } catch (error: any) {
    console.error('Error fetching users:', error);
    usersError.value = error.data?.message || error.message || 'Failed to fetch users';
  } finally {
    usersLoading.value = false;
  }
}

async function createUser() {
  newUserForm.error = '';
  newUserForm.success = '';
  newUserForm.loading = true;

  if (!newUserForm.email || !newUserForm.password) {
    newUserForm.error = 'Email and password are required';
    newUserForm.loading = false;
    return;
  }

  if (newUserForm.password.length < 6) {
    newUserForm.error = 'Password must be at least 6 characters';
    newUserForm.loading = false;
    return;
  }

  try {
    const result = await $fetch('/api/createUser', {
      method: 'POST',
      body: {
        email: newUserForm.email,
        password: newUserForm.password,
        role: newUserForm.role
      }
    });

    if (result.success) {
      newUserForm.success = 'User created successfully!';
      newUserForm.email = '';
      newUserForm.password = '';
      newUserForm.role = 'basic';
      
      // Refresh the user list
      await fetchUsers();
    } else {
      newUserForm.error = result.error || 'Failed to create user';
    }
  } catch (error: any) {
    newUserForm.error = error.data?.message || error.message || 'Failed to create user';
  } finally {
    newUserForm.loading = false;
  }
}

async function toggleBanUser(userId: string, currentBanStatus: boolean) {
  const action = currentBanStatus ? 'unban' : 'ban';
  
  if (!confirm(`Are you sure you want to ${action} this user?`)) {
    return;
  }

  try {
    const result = await $fetch('/api/toggleBanUser', {
      method: 'POST',
      body: { userId, banned: !currentBanStatus }
    });

    if (result.success) {
      await fetchUsers();
    } else {
      alert('Failed to update user status');
    }
  } catch (error) {
    console.error('Error toggling ban:', error);
    alert('Failed to update user status');
  }
}

async function changeUserRole(userId: string, newRole: string) {
  if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
    return;
  }

  try {
    const result = await $fetch('/api/updateUserRole', {
      method: 'POST',
      body: { userId, role: newRole }
    });

    if (result.success) {
      await fetchUsers();
    } else {
      alert('Failed to update user role');
    }
  } catch (error) {
    console.error('Error updating role:', error);
    alert('Failed to update user role');
  }
}

function goBack() {
  router.push('/');
}

// Watch for when user becomes admin and load users
watch(() => isAdmin.value, (newValue) => {
  if (newValue && !initialLoadDone.value) {
    console.log('User is admin, loading users...');
    fetchUsers();
  }
}, { immediate: true });

// Also load on mount if already admin
onMounted(async () => {
  // Wait a tick for user data to be fully loaded
  await nextTick();
  
  if (isAdmin.value && !initialLoadDone.value) {
    console.log('Component mounted as admin, loading users...');
    fetchUsers();
  }
});
</script>

<template>
  <div v-if="!user" class="min-h-screen bg-gray-100 flex items-center justify-center">
    <p class="text-gray-600">Loading...</p>
  </div>

  <div v-else-if="!isAdmin" class="min-h-screen bg-gray-100 flex items-center justify-center">
    <div class="text-center">
      <p class="text-red-600 font-semibold mb-4">Access Denied</p>
      <p class="text-gray-600 mb-4">Admin access required</p>
      <p class="text-sm text-gray-500 mb-4">Your role: {{ user.user_metadata?.role || 'basic' }}</p>
      <button @click="goBack" class="text-blue-500 hover:underline">← Back to Gallery</button>
    </div>
  </div>

  <div v-else class="min-h-screen bg-gray-100">
    <div class="container mx-auto px-4 py-8">
      <!-- Header -->
      <div class="mb-6 flex justify-between items-center">
        <button @click="goBack" class="text-blue-500 hover:underline">
          ← Back to Gallery
        </button>
        <div class="text-sm">
          <span class="text-gray-600">Logged in as:</span>
          <span class="font-semibold ml-1">{{ user.email }}</span>
          <span class="ml-2 px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-semibold">ADMIN</span>
        </div>
      </div>

      <!-- Create New User Section -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 class="text-2xl font-bold mb-4">Create New User</h2>
        
        <div v-if="newUserForm.error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {{ newUserForm.error }}
        </div>

        <div v-if="newUserForm.success" class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {{ newUserForm.success }}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              v-model="newUserForm.email"
              placeholder="user@example.com"
              :disabled="newUserForm.loading"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              v-model="newUserForm.password"
              placeholder="Min 6 characters"
              :disabled="newUserForm.loading"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">Role</label>
            <select
              v-model="newUserForm.role"
              :disabled="newUserForm.loading"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="basic">Basic</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div class="flex items-end">
            <button
              @click="createUser"
              :disabled="newUserForm.loading"
              class="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {{ newUserForm.loading ? 'Creating...' : 'Create User' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Users List -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-2xl font-bold">All Users</h2>
          <button
            @click="fetchUsers"
            :disabled="usersLoading"
            class="text-blue-500 hover:underline text-sm disabled:text-gray-400"
          >
            {{ usersLoading ? 'Loading...' : '🔄 Refresh' }}
          </button>
        </div>

        <!-- Error Message -->
        <div v-if="usersError" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p class="font-semibold">Error loading users:</p>
          <p class="text-sm">{{ usersError }}</p>
          <button @click="fetchUsers" class="mt-2 text-sm underline hover:no-underline">
            Try Again
          </button>
        </div>

        <!-- Loading State -->
        <div v-if="usersLoading && !users.length" class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
          <p class="text-gray-600">Loading users...</p>
        </div>

        <!-- No Users -->
        <div v-else-if="users.length === 0 && !usersError && !usersLoading" class="text-center py-12">
          <p class="text-gray-600 mb-2">No users found.</p>
          <p class="text-sm text-gray-500">Create a user above to get started.</p>
        </div>

        <!-- Users Table -->
        <div v-else-if="!usersError" class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="usr in users" :key="usr.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="text-sm font-medium text-gray-900">
                      {{ usr.email }}
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <select
                    :value="usr.role"
                    @change="changeUserRole(usr.id, ($event.target as HTMLSelectElement).value)"
                    :disabled="usr.id === user?.id"
                    class="px-2 py-1 border border-gray-300 rounded-md text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="basic">Basic</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="usr.banned ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'"
                    class="px-2 py-1 text-xs font-semibold rounded-full"
                  >
                    {{ usr.banned ? 'Banned' : 'Active' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ new Date(usr.created_at).toLocaleDateString() }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    v-if="usr.id !== user?.id"
                    @click="toggleBanUser(usr.id, usr.banned)"
                    :class="usr.banned ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'"
                    class="text-white px-3 py-1 rounded-md transition"
                  >
                    {{ usr.banned ? 'Unban' : 'Ban' }}
                  </button>
                  <span v-else class="text-gray-400 text-xs">You</span>
                </td>
              </tr>
            </tbody>
          </table>
          
          <div class="mt-4 text-sm text-gray-500 text-center">
            Total users: {{ users.length }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>