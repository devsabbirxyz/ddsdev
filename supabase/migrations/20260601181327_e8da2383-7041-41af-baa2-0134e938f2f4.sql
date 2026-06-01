
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  SELECT id INTO new_user_id FROM auth.users WHERE email = 'dds@dds.local';

  IF new_user_id IS NULL THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin, confirmation_token,
      email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id, 'authenticated', 'authenticated',
      'dds@dds.local',
      crypt('dds12345', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"DDS Admin"}'::jsonb,
      false, '', '', '', ''
    );

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), new_user_id,
      format('{"sub":"%s","email":"%s"}', new_user_id, 'dds@dds.local')::jsonb,
      'email', new_user_id::text, now(), now(), now());
  ELSE
    UPDATE auth.users
    SET encrypted_password = crypt('dds12345', gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        updated_at = now()
    WHERE id = new_user_id;
  END IF;

  INSERT INTO public.users (id, email, full_name)
  VALUES (new_user_id, 'dds@dds.local', 'DDS Admin')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role, is_active)
  VALUES (new_user_id, 'super_admin', true)
  ON CONFLICT DO NOTHING;
END $$;
