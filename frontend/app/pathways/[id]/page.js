export default async function PathwayPage({ params }) {
  const { id } = await params;
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pathways/${id}`);;
  const pathway = await res.json();

  return (
    <div className="p-8 text-white">
      <h1 className="text-4xl font-bold">{pathway.pathway_name}</h1>
      <div className="mt-6 bg-gray-800 p-6 rounded">
        <h2 className="text-sm text-gray-400 uppercase">Description</h2>
        <p className="text-lg mt-2">{pathway.description}</p>
      </div>
    </div>
  );
}