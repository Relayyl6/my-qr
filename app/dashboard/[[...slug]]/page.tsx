import { redirect } from 'next/navigation';

export default function DashboardCatchAll({
  params,
  searchParams,
}: {
  params: { slug?: string[] };
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const tab =
    (typeof searchParams?.tab === 'string' ? searchParams.tab : null) ||
    (typeof searchParams?.section === 'string' ? searchParams.section : null) ||
    (params?.slug?.[0] === 'microsaas' ? 'vcard' : 'overview');

  redirect(`/?section=${tab}#workspace`);
}
