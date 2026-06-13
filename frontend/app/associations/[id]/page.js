async function getAssociationData(id) {
  try {
    const res = await fetch(`http://localhost:8000/api/v1/associations/${id}`, {
      cache: 'no-store'
    });
    if (!res.ok) {
      console.error(`API Error: ${res.status} for ID: ${id}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error("Fetch failed:", err);
    return null;
  }
}

// 2. Main Page Component
export default async function AssociationPage({ params }) {
  const { id } = await params;
  const data = await getAssociationData(id);

  // 3. Render the UI
  return (
    <div className="p-8 text-white min-h-screen bg-gray-900">
      <h1 className="text-4xl font-bold">Association Details</h1>
      <p className="mt-4 text-xl text-gray-400">ID: {id}</p>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="bg-gray-800 p-4 rounded shadow-md">
          <h2 className="text-sm text-gray-400 uppercase tracking-wider">Gene ID</h2>
          <p className="text-2xl mt-1">{data.gene_id || "N/A"}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded shadow-md">
          <h2 className="text-sm text-gray-400 uppercase tracking-wider">Disease ID</h2>
          <p className="text-2xl mt-1">{data.disease_id || "N/A"}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded shadow-md">
          <h2 className="text-sm text-gray-400 uppercase tracking-wider">Confidence</h2>          
          <p className="text-2xl mt-1">{data.confidence_score || "N/A"}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded shadow-md">
          <h2 className="text-sm text-gray-400 uppercase tracking-wider">Evidence Level</h2>
          <p className="text-2xl mt-1">{data.evidence_level || "N/A"}</p>
        </div>
      </div>
    </div>
  );
}