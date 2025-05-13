import PaperPage from "./paperPage";

export default async function Page( context ) {
  const searchParams = await context?.searchParams;

  return <PaperPage searchParams={searchParams} />;
}