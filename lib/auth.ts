import { createServerClient, getUserProfile, type Profile, type UserRole } from './supabase';
import type { GetServerSidePropsContext } from 'next';

interface AuthResult {
  redirect?: { destination: string; permanent: boolean };
  props?: { user: any; profile: Profile };
}

export async function requireAuth(
  ctx: GetServerSidePropsContext,
  allowedRoles?: UserRole[]
): Promise<AuthResult> {
  const supabase = createServerClient(ctx);
  
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  const profile = await getUserProfile(supabase, session.user.id);

  if (!profile) {
    return {
      redirect: {
        destination: '/login?error=no_profile',
        permanent: false,
      },
    };
  }

  if (profile.disabled) {
    return {
      redirect: {
        destination: '/login?error=account_disabled',
        permanent: false,
      },
    };
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    const redirectPath = profile.role === 'admin' ? '/admin' : '/doctor';
    return {
      redirect: {
        destination: redirectPath,
        permanent: false,
      },
    };
  }

  return {
    props: {
      user: session.user,
      profile,
    },
  };
}

export async function requireAdmin(ctx: GetServerSidePropsContext) {
  return requireAuth(ctx, ['admin']);
}

export async function requireDoctor(ctx: GetServerSidePropsContext) {
  return requireAuth(ctx, ['doctor', 'admin']);
}
