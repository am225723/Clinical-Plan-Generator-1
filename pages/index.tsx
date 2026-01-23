import { createServerClient, getUserProfile } from '@/lib/supabase';

export default function Home() {
  return null;
}

export const getServerSideProps = async (ctx: any) => {
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

  const destination = profile.role === 'admin' ? '/admin' : '/doctor';

  return {
    redirect: {
      destination,
      permanent: false,
    },
  };
};
