async function getGeneData(id) {
  // Using the prefix /api/v1/ based on your backend structure
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/genes/${id}`);
  
  if (!res.ok) {
    throw new Error(`Failed to fetch data: ${res.status}`);
  }
  return res.json();
}

export default async function GenePage({ params }) {
  const { id } = await params;
  
  let gene = null;
  let error = null;

  try {
    gene = await getGeneData(id);
    console.log("Full API Response:", gene); // Check your F12 console for this
  } catch (e) {
    error = e.message;
  }

  if (error) {
    return <div className="p-8 text-red-500">Error: {error}</div>;
  }

  if (!gene) {
    return <div className="p-8 text-white">Loading or No Data Found...</div>;
  }

  // RENDER DATA
  // Note: If the fields below are blank, look at the console log 
  // to see if the API keys are named differently (e.g., 'chromosome' vs 'chromoso')
  return (
    <div className="p-8 text-white">
      <h1 className="text-4xl font-bold">{gene.gene_symbol|| "N/A"}</h1>
      <p className="mt-4 text-xl">Name: {gene.gene_name || "N/A"}</p>
      
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-sm text-gray-400">Chromosome</h2>
          <p className="text-2xl">{gene.chromoso || gene.chromosome || "N/A"}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-sm text-gray-400">Function</h2>
          <p className="text-2xl">{gene.function || "N/A"}</p>
        </div>
      </div>

      <div className="mt-6 bg-gray-800 p-4 rounded">
        <h2 className="text-sm text-gray-400">Protein Information</h2>
        <p className="text-lg">{gene.protein || "N/A"}</p>
      </div>
    </div>
  );
}