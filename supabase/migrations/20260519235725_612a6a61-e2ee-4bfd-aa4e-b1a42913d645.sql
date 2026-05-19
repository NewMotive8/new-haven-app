
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'dr.loop@gmail.com';

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id, 'authenticated', 'authenticated',
      'dr.loop@gmail.com',
      crypt('SandboxLoop123!', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"display_name":"Dr Loop (Sandbox)"}'::jsonb,
      false
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'dr.loop@gmail.com', 'email_verified', true),
      'email', v_user_id::text, now(), now(), now());
  END IF;

  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (v_user_id, 'dr.loop@gmail.com', 'Dr Loop (Sandbox)')
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;
