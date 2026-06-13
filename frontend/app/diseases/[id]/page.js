// 1. Fetching function for diseases
async function getDiseaseData(id) {
  // Ensure the path matches your backend route for diseases
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/diseases/${id}`);
  
  if (!res.ok) {
    throw new Error(`Failed to fetch disease data: ${res.status}`);
  }
  return res.json();
}

// 2. Main Page Component
export default async function DiseasePage({ params }) {
  const { id } = await params;
  const disease = await getDiseaseData(id);

  // 3. Render the UI
  return (
    <div className="p-8 text-white min-h-screen bg-gray-900">
      <h1 className="text-4xl font-bold">{disease.disease_name || "Unknown Disease"}</h1>
      <p className="mt-4 text-xl">ID: {id}</p>
      
      <div className="mt-6 grid grid-cols-2 gap-4">
        {/* Category Card */}
        <div className="bg-gray-800 p-4 rounded shadow-md">
          <h2 className="text-sm text-gray-400 uppercase tracking-wider">Category</h2>
          <p className="text-2xl mt-1">{disease.category || "N/A"}</p>
        </div>

        {/* ICD Code Card */}
        <div className="bg-gray-800 p-4 rounded shadow-md">
          <h2 className="text-sm text-gray-400 uppercase tracking-wider">ICD Code</h2>
          <p className="text-2xl mt-1">{disease.icd_code || "N/A"}</p>
        </div>
      </div>
    </div>
  );
}