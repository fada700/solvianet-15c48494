ALTER TABLE public.form_settings DROP CONSTRAINT IF EXISTS form_settings_form_type_check;
ALTER TABLE public.form_settings ADD CONSTRAINT form_settings_form_type_check CHECK (form_type IN ('minecraft','discord','creador'));

INSERT INTO public.form_settings (form_type, is_active)
SELECT 'creador', false
WHERE NOT EXISTS (SELECT 1 FROM public.form_settings WHERE form_type = 'creador');