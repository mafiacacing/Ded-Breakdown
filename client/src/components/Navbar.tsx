import { useState } from "react";

interface NavbarProps {
  onMenuClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log("Searching for:", searchQuery);
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4">
        {/* Mobile menu button and logo */}
        <div className="flex items-center">
          <button 
            type="button" 
            className="md:hidden text-gray-500 hover:text-gray-700 focus:outline-none"
            onClick={onMenuClick}
            data-event="click:toggleSidebar"
          >
            <i className="ri-menu-line text-2xl"></i>
          </button>
          <div className="md:hidden ml-2">
            <i className="ri-file-search-line text-xl text-primary-700"></i>
          </div>
        </div>
        
        {/* Search bar */}
        <form onSubmit={handleSearch} className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-center max-w-2xl">
          <div className="w-full relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="ri-search-line text-gray-400"></i>
            </div>
            <input 
              type="text" 
              placeholder="Search documents, content or analysis..." 
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>
        
        {/* Right navigation */}
        <div className="flex items-center space-x-4">
          <button type="button" className="text-gray-500 hover:text-gray-700 focus:outline-none">
            <i className="ri-notification-3-line text-xl"></i>
          </button>
          <button type="button" className="text-gray-500 hover:text-gray-700 focus:outline-none">
            <i className="ri-question-line text-xl"></i>
          </button>
          <div className="border-l border-gray-200 h-6 mx-2"></div>
          {/* User dropdown (mobile only) */}
          <div className="md:hidden">
            <button type="button" className="flex items-center focus:outline-none">
              <div className="h-8 w-8 rounded-full bg-primary-700 flex items-center justify-center text-white">
                <span className="text-sm">JS</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
