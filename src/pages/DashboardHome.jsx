const DashboardHome = () => {
  return (
    <div className="space-y-3">
      <div className="border-1 p-4 rounded-4xl bg-blue-500 text-white px-4 py-3 flex items-center gap-4">
       <button className="bg-white text-black px-4 py-2 rounded-4xl hover:bg-gray-200 transition-colors">
        Expolre
       </button>
       <button className="bg-white text-black px-4 py-2 rounded-4xl hover:bg-gray-200 transition-colors">
        Events Near You
       </button>
        <input type="button" value="Search" className="bg-white text-black px-60 py-2 rounded-4xl hover:bg-gray-200 transition-colors" />
        <button className="bg-white text-black px-4 py-2 rounded-4xl hover:bg-gray-200 transition-colors">
        Messages
       </button>
       <button className="bg-white text-black px-4 py-2 rounded-4xl hover:bg-gray-200 transition-colors">
        Connections
       </button>
       <button className="bg-white text-black px-4 py-2 rounded-4xl hover:bg-gray-200 transition-colors">
        Trending Topics In JMI
       </button>
      </div>
      <div className="border-1 border-black p-4 rounded-4xl text-white h-[80vh] flex items-center gap-4">
        </div>
    </div>
  )
}

export default DashboardHome
