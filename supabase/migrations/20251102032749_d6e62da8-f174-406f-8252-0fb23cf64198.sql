-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT NOT NULL,
  storage_used BIGINT DEFAULT 0,
  storage_quota BIGINT DEFAULT 5368709120, -- 5GB default
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create enum for file status
CREATE TYPE public.file_status AS ENUM ('active', 'expired', 'revoked', 'deleted');

-- Create files table with all security metadata
CREATE TABLE public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_filename TEXT NOT NULL,
  encrypted_filename TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_mimetype TEXT,
  original_file_hash TEXT NOT NULL, -- SHA-256
  encrypted_aes_key TEXT NOT NULL, -- Base64 encoded
  key_salt TEXT NOT NULL, -- Base64 encoded
  file_iv TEXT NOT NULL, -- Base64 encoded
  key_iv TEXT NOT NULL, -- Base64 encoded
  otp_hash TEXT NOT NULL, -- SHA-256 of OTP
  otp_created_at TIMESTAMPTZ NOT NULL,
  otp_expires_at TIMESTAMPTZ NOT NULL,
  max_access_attempts INTEGER DEFAULT 3,
  access_count INTEGER DEFAULT 0,
  one_time_access BOOLEAN DEFAULT true,
  recipient_email TEXT NOT NULL,
  file_description TEXT,
  file_status file_status DEFAULT 'active',
  upload_timestamp TIMESTAMPTZ DEFAULT now(),
  last_access_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create access logs table for audit trail
CREATE TABLE public.access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES public.files(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  access_type TEXT NOT NULL, -- 'upload', 'download', 'otp_request', 'otp_verify'
  access_status TEXT NOT NULL, -- 'success', 'failure'
  ip_address_hash TEXT, -- Hashed for privacy
  user_agent TEXT,
  failure_reason TEXT,
  timestamp TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Files policies
CREATE POLICY "Users can view own files"
  ON public.files FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own files"
  ON public.files FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own files"
  ON public.files FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own files"
  ON public.files FOR DELETE
  USING (auth.uid() = user_id);

-- Access logs policies (users can only view their own logs)
CREATE POLICY "Users can view logs for their files"
  ON public.access_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.files
      WHERE files.id = access_logs.file_id
      AND files.user_id = auth.uid()
    )
  );

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, email_verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email_confirmed_at IS NOT NULL, false)
  );
  RETURN NEW;
END;
$$;

-- Trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_files_updated_at
  BEFORE UPDATE ON public.files
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_files_user_id ON public.files(user_id);
CREATE INDEX idx_files_status ON public.files(file_status);
CREATE INDEX idx_files_created_at ON public.files(created_at DESC);
CREATE INDEX idx_access_logs_file_id ON public.access_logs(file_id);
CREATE INDEX idx_access_logs_timestamp ON public.access_logs(timestamp DESC);

-- Create storage bucket for encrypted files
INSERT INTO storage.buckets (id, name, public)
VALUES ('encrypted-files', 'encrypted-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for encrypted files
CREATE POLICY "Users can upload encrypted files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'encrypted-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own encrypted files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'encrypted-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own encrypted files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'encrypted-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );