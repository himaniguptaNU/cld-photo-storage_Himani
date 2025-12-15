<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
});

const user = useSupabaseUser();
const router = useRouter();

const formState = reactive({
  selectedFile: null as File | null,
  uploading: false,
  error: '',
  success: ''
});

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    
    if (!file.type.startsWith('image/')) {
      formState.error = 'Please select an image file';
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      formState.error = 'File size must be less than 5MB';
      return;
    }
    
    formState.selectedFile = file;
    formState.error = '';
  }
}

async function uploadPhoto() {
  if (!formState.selectedFile) {
    formState.error = 'Please select a file';
    return;
  }

  formState.uploading = true;
  formState.error = '';
  formState.success = '';

  try {
    const base64 = await fileToBase64(formState.selectedFile);
    
    const result = await $fetch('/api/uploadPhoto', {
      method: 'POST',
      body: {
        fileName: formState.selectedFile.name,
        fileData: base64,
        contentType: formState.selectedFile.type
      }
    });

    if (result.success) {
      formState.success = 'Photo uploaded successfully!';
      formState.selectedFile = null;
      
      const fileInput = document.getElementById('fileInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } else {
      formState.error = 'Upload failed';
    }
  } catch (error: any) {
    formState.error = error.message || 'Failed to upload photo';
  } finally {
    formState.uploading = false;
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function goBack() {
  router.push('/');
}
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <div class="container mx-auto px-4 py-8">
      <div class="max-w-2xl mx-auto">
        <div class="bg-white rounded-lg shadow-md p-8">
          <div class="flex justify-between items-center mb-6">
            <h1 class="text-3xl font-bold">Upload Photo</h1>
            <button
              @click="goBack"
              class="text-blue-500 hover:underline"
            >
              ← Back to Gallery
            </button>
          </div>

          <div v-if="formState.error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {{ formState.error }}
          </div>

          <div v-if="formState.success" class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {{ formState.success }}
          </div>

          <div class="space-y-6">
            <div>
              <label class="block text-sm font-medium mb-2">Select Image</label>
              <input
                id="fileInput"
                type="file"
                accept="image/*"
                @change="handleFileSelect"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p class="text-sm text-gray-500 mt-2">
                Supported formats: JPG, PNG, GIF, WebP (Max 5MB)
              </p>
            </div>

            <div v-if="formState.selectedFile" class="bg-gray-50 p-4 rounded-md">
              <p class="text-sm font-medium">Selected file:</p>
              <p class="text-sm text-gray-600">{{ formState.selectedFile.name }}</p>
              <p class="text-sm text-gray-600">
                Size: {{ (formState.selectedFile.size / 1024).toFixed(2) }} KB
              </p>
            </div>

            <button
              @click="uploadPhoto"
              :disabled="!formState.selectedFile || formState.uploading"
              class="w-full bg-blue-500 text-white px-4 py-3 rounded-md hover:bg-blue-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {{ formState.uploading ? 'Uploading...' : 'Upload Photo' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>