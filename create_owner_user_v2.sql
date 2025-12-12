-- Script corregido para crear usuario owner
-- Corrige el error: null value in column "provider_id" of relation "identities"

DO $$
DECLARE
  new_user_id UUID := gen_random_uuid();
  user_email TEXT := 'agaveqboots@gmail.com';
  user_password TEXT := '4g4v3boots';
  encrypted_pw TEXT;
BEGIN
    -- Verificar si el usuario ya existe
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = user_email) THEN
        -- Encriptar contraseña
        encrypted_pw := crypt(user_password, gen_salt('bf'));

        -- Insertar en auth.users
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            recovery_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            user_email,
            encrypted_pw,
            now(),
            now(),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            '{}',
            now(),
            now(),
            '',
            '',
            '',
            ''
        );

        -- Insertar en auth.identities (CORREGIDO: incluyendo provider_id)
        INSERT INTO auth.identities (
            id,
            user_id,
            provider_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id, -- Usamos el mismo ID o uno nuevo
            new_user_id,
            new_user_id::text, -- provider_id ES OBLIGATORIO
            jsonb_build_object('sub', new_user_id, 'email', user_email),
            'email',
            now(),
            now(),
            now()
        );

        RAISE NOTICE 'Usuario creado exitosamente con ID: %', new_user_id;
    ELSE
        RAISE NOTICE 'El usuario % ya existe.', user_email;
    END IF;
END $$;
