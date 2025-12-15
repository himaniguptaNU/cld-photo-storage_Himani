# Photo Gallery Application - Technical Assessment

## Overview
A full-stack photo gallery application built with Nuxt 3, Vue 3, TypeScript, and Supabase. Users can upload, view, and delete their photos with role-based access control.

## Features
- User authentication (signup/login)
- Photo upload with validation (max 5MB, image formats only)
- Photo gallery with responsive grid layout
- Secure photo storage with Supabase Storage
- Role-based access control (basic users and admins)
- Delete photos functionality
- Row Level Security (RLS) policies

## Tech Stack
- **Framework**: Nuxt 3
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Storage)
- **Authentication**: Supabase Auth

## Setup Instructions

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd <project-folder>
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SECRET_KEY=your_supabase_service_role_key
```

4. Set up Supabase:
   - Create a new Supabase project
   - Run the SQL scripts from `/database` folder (if you include them)
   - Create a storage bucket named `user-photos`
   - Set up RLS policies (see below)

5. Run the development server:
```bash
npm run dev
```

6. Open http://localhost:3000

## Database Schema

### Photos Table
```sql
CREATE TABLE photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Profiles Table (optional)
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  role TEXT DEFAULT 'basic',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Project Structure
```
├── pages/
│   ├── index.vue           # Gallery page
│   ├── login.vue           # Login page
│   ├── signup.vue          # Signup page
│   └── upload.vue          # Upload page
├── server/
│   └── api/
│       ├── getPhotos.ts    # Fetch all photos
│       ├── uploadPhoto.ts  # Upload new photo
│       └── deletePhoto.ts  # Delete photo
├── middleware/
│   └── auth.ts             # Authentication middleware
└── nuxt.config.ts          # Nuxt configuration
```

## Key Implementation Details

- **Authentication**: Uses Supabase Auth with middleware protection
- **File Upload**: Base64 encoding with server-side validation
- **Storage**: Supabase Storage with signed URLs for secure access
- **Security**: Row Level Security policies ensure users can only access their own photos
- **TypeScript**: Fully typed interfaces for photos and user data

## Challenges & Solutions

1. **User ID Issue**: Initially used `user.id` which was undefined. Fixed by using `user.sub` from the JWT token.
2. **RLS Policies**: Implemented service role client to bypass RLS for admin operations while maintaining security.
3. **Storage Access**: Used signed URLs with 1-hour expiration for secure photo access.

## Time Spent
Approximately 3 hours

## Contact
Himani Gupta - gupta.him@northeastern.edu
