import PaperPage from "./papersPage";

export default async function Page( context ) {
  const searchParams = await context?.searchParams;

  return <PaperPage searchParams={searchParams} />;
}