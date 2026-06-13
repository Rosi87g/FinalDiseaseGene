async function getVariantData(id) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/variants/${id}`);;
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
  return res.json();
}

export default async function VariantPage({ params }) {
  const { id } = await params;
  const variant = await getVariantData(id);

  if (!variant) return <div className="p-8 text-white">Variant not found.</div>;

  return (
    <div className="p-8 text-white min-h-screen bg-gray-900">
      <h1 className="text-4xl font-bold mb-6">{variant.variant_name}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* New Columns Added */}
        <div className="bg-gray-800 p-4 rounded shadow">
          <h2 className="text-sm text-gray-400 uppercase">Variant ID</h2>
          <p className="text-2xl mt-1">{variant.variant_id}</p>
        </div>
        
        <div className="bg-gray-800 p-4 rounded shadow">
          <h2 className="text-sm text-gray-400 uppercase">Gene ID</h2>
          <p className="text-2xl mt-1">{variant.gene_id}</p>
        </div>

        {/* Existing Columns */}
        <div className="bg-gray-800 p-4 rounded shadow">
          <h2 className="text-sm text-gray-400 uppercase">Mutation Type</h2>
          <p className="text-2xl mt-1">{variant.mutation_type}</p>
        </div>
        
        <div className="bg-gray-800 p-4 rounded shadow">
          <h2 className="text-sm text-gray-400 uppercase">Significance</h2>
          <p className="text-2xl mt-1">{variant.clinical_significance}</p>
        </div>
      </div>
    </div>
  );
}