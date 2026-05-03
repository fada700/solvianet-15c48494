CREATE TABLE public.apertura_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active boolean NOT NULL DEFAULT false,
  title text NOT NULL DEFAULT '¡Apertura SolvianMC!',
  content text NOT NULL DEFAULT 'Te esperamos en la gran apertura de SolvianMC.',
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.apertura_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read apertura"
ON public.apertura_settings FOR SELECT
USING (true);

CREATE POLICY "Admins can update apertura"
ON public.apertura_settings FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert apertura"
ON public.apertura_settings FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.apertura_settings (is_active, title, content) VALUES (false, '¡Gran Apertura SolvianMC!', '¡Únete a la gran apertura de SolvianMC! Te esperamos con sorpresas, eventos y mucho más.');