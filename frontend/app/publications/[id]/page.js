export default async function PubPage({ params }) {
  const { id } = await params;
  
  // 1. Fetch data
  const res = await fetch(`http://localhost:8000/api/v1/publications/${id}`, { cache: 'no-store' });
  
  if (!res.ok) {
    return <div className="p-8 text-white">Publication not found.</div>;
  }
  
  const pub = await res.json();

  return (
    <div className="p-8 text-white min-h-screen bg-gray-900">
      {/* Title and Metadata */}
      <h1 className="text-4xl font-bold">{pub.title}</h1>
      <div className="mt-2 text-lg text-gray-400">
        <span>{pub.journal}</span>
        {pub.year && <span className="ml-2">• {pub.year}</span>}
      </div>

      {/* Abstract Section */}
      <div className="mt-8 bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Abstract</h2>
        <p className="text-gray-300 leading-relaxed">
          {pub.abstract || "No abstract available for this publication."}
        </p>
      </div>

      {/* External Links (Conditional rendering to prevent errors) */}
      {pub.doi && (
        <div className="mt-6">
          <a href={`https://doi.org/${pub.doi}`} className="text-blue-400 hover:underline">
            View DOI: {pub.doi}
          </a>
        </div>
      )}
    </div>
  );
}