export default function PropertyPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <main>
      <h1>Property route works</h1>
      <p>ID: {params.id}</p>
    </main>
  );
}