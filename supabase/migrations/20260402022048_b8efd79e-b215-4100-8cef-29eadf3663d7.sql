
-- Form settings table to control which forms are active
CREATE TABLE public.form_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_type text NOT NULL UNIQUE CHECK (form_type IN ('minecraft', 'discord')),
  is_active boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Insert default settings
INSERT INTO public.form_settings (form_type, is_active) VALUES ('minecraft', false), ('discord', false);

-- Staff applications table
CREATE TABLE public.staff_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  form_type text NOT NULL CHECK (form_type IN ('minecraft', 'discord')),
  answers jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_email text,
  user_name text,
  user_avatar text
);

-- Enable RLS
ALTER TABLE public.form_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_applications ENABLE ROW LEVEL SECURITY;

-- Form settings: anyone can read, only admins can update
CREATE POLICY "Anyone can read form settings" ON public.form_settings FOR SELECT TO public USING (true);
CREATE POLICY "Only admins can update form settings" ON public.form_settings FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Staff applications: users can insert their own, admins can read/update all
CREATE POLICY "Authenticated users can submit applications" ON public.staff_applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own applications" ON public.staff_applications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can read all applications" ON public.staff_applications FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update applications" ON public.staff_applications FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete applications" ON public.staff_applications FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));
