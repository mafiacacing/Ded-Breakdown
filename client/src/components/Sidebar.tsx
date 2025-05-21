import { Link } from "wouter";

interface SidebarProps {
  isOpen: boolean;
  currentPath: string;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, currentPath }) => {
  const user = {
    name: "John Smith",
    role: "Administrator",
    initials: "JS"
  };

  // Navigation items
  const navItems = [
    { 
      section: "Main", 
      links: [
        { path: "/", label: "Dashboard", icon: "ri-dashboard-line" },
        { path: "/documents", label: "Documents", icon: "ri-file-list-line" },
        { path: "/search", label: "Search", icon: "ri-search-line" },
        { path: "/analysis", label: "Analysis", icon: "ri-flask-line" }
      ]
    },
    {
      section: "Tools",
      links: [
        { path: "/ocr", label: "OCR", icon: "ri-scan-line" },
        { path: "/drive", label: "Drive Integration", icon: "ri-google-drive-line" },
        { path: "/assistant", label: "AI Assistant", icon: "ri-robot-line" }
      ]
    },
    {
      section: "Admin",
      links: [
        { path: "/settings", label: "Settings", icon: "ri-settings-line" },
        { path: "/notifications", label: "Notifications", icon: "ri-notification-line" }
      ]
    }
  ];

  if (!isOpen) {
    return null;
  }

  return (
    <aside className={`md:flex md:flex-col md:w-64 bg-white border-r border-gray-200 h-full ${isOpen ? 'flex flex-col w-64 fixed inset-0 z-40 md:relative' : 'hidden'}`}>
      {/* Logo section */}
      <div className="p-4 flex items-center border-b border-gray-200">
        <i className="ri-file-search-line h-8 w-8 text-primary-700 mr-2 text-2xl"></i>
        <h1 className="text-xl font-bold text-primary-700">AMCP</h1>
      </div>
      
      {/* Navigation menu */}
      <nav className="flex-1 overflow-y-auto scrollbar-hide pt-2 pb-4">
        <div className="px-3 space-y-1">
          {navItems.map((section) => (
            <div key={section.section} className="mb-4">
              <h2 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {section.section}
              </h2>
              {section.links.map((link) => {
                const isActive = currentPath === link.path;
                return (
                  <Link
                    key={link.path}
                    href={link.path}
                    className={`sidebar-item flex items-center px-4 py-2 text-sm font-medium rounded-md 
                    ${isActive 
                      ? 'active text-primary-700 border-l-3 border-primary-700 bg-primary-50' 
                      : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    <i className={`${link.icon} text-lg mr-3`}></i>
                    {link.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </nav>
      
      {/* User profile section */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-700 flex items-center justify-center text-white">
            <span>{user.initials}</span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">{user.name}</p>
            <p className="text-xs font-medium text-gray-500">{user.role}</p>
          </div>
          <button className="ml-auto text-gray-500 hover:text-gray-700">
            <i className="ri-logout-box-line text-lg"></i>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
