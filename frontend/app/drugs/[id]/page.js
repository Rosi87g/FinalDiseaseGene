export default async function DrugPage({ params }) {
  const { id } = await params;
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/drugs/${id}`);
  const drug = await res.json();

  return (
    <div className="p-8 text-white">
      <h1 className="text-4xl font-bold">{drug.drug_name}</h1>
      <p className="text-xl mt-2 text-gray-300">Indication: {drug.indication}</p>
      <div className="mt-4 p-4 bg-blue-900 rounded">
        Target Gene ID: {drug.target_gene_id}
      </div>
    </div>
  );
}