<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
});

const user = useSupabaseUser();
const router = useRouter();

interface Photo {
  id: string;
  file_name: string;
  file_path: string;
  created_at: string;
  user_id: string;
  url: string | null;
}

const userRole = computed(() => user.value?.user_metadata?.role || 'basic');

// Use useFetch - simpler and automatically handles auth
const { data: photosData, pending: loading, refresh: refreshPhotos } = await useFetch('/api/getPhotos', {
  lazy: false
});

const photos = computed(() => photosData.value?.photos || []);

async function deletePhoto(photoId: string, filePath: string) {
  if (!confirm('Are you sure you want to delete this photo?')) {
    return;
  }

  try {
    await $fetch('/api/deletePhoto', {
      method: 'POST',
      body: { photoId, filePath }
    });
    
    await refreshPhotos();
  } catch (error) {
    console.error('Error deleting photo:', error);
    alert('Failed to delete photo');
  }
}

async function logout() {
  const supabase = useSupabaseClient();
  await supabase.auth.signOut();
  router.push('/login');
}
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <div class="bg-white shadow-md">
      <div class="container mx-auto px-4 py-4">
        <div class="flex justify-between items-center">
          <h1 class="text-2xl font-bold">Photo Gallery</h1>
          <div class="flex gap-4 items-center">
            <span class="text-sm text-gray-600">
              Role: <span class="font-semibold">{{ userRole }}</span>
            </span>
            <button
              @click="navigateTo('/upload')"
              class="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
            >
              Upload Photo
            </button>
            <button
              v-if="userRole === 'admin'"
              @click="navigateTo('/users')"
              class="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600"
            >
              Manage Users
            </button>
            <button
              @click="logout"
              class="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 py-8">
      <div v-if="loading" class="text-center py-12">
        <p class="text-gray-600">Loading photos...</p>
      </div>

      <div v-else-if="photos.length === 0" class="text-center py-12">
        <p class="text-gray-600 mb-4">No photos uploaded yet.</p>
        <button
          @click="navigateTo('/upload')"
          class="bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600"
        >
          Upload Your First Photo
        </button>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div
          v-for="photo in photos"
          :key="photo.id"
          class="bg-white rounded-lg shadow-md overflow-hidden"
        >
          <div class="aspect-square bg-gray-200 flex items-center justify-center overflow-hidden">
            <img
              v-if="photo.url"
              :src="photo.url"
              :alt="photo.file_name"
              class="w-full h-full object-cover"
              loading="lazy"
            />
            <div v-else class="text-gray-400">
              <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div class="p-4">
            <p class="font-semibold truncate">{{ photo.file_name }}</p>
            <p class="text-sm text-gray-500">
              {{ new Date(photo.created_at).toLocaleDateString() }}
            </p>
            <button
              v-if="photo.user_id === user?.sub || userRole === 'admin'"
              @click="deletePhoto(photo.id, photo.file_path)"
              class="mt-3 w-full bg-red-500 text-white px-3 py-2 rounded-md text-sm hover:bg-red-600"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
