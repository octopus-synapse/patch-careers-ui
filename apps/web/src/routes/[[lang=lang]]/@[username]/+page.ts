import { redirect } from '@sveltejs/kit';
export const load = ({ params }: { params: { username?: string } }) => {
  throw redirect(301, `/my-profile/public/@${params.username ?? ''}`);
};
