import {
  AlertTriangle, BookText, Brain, Bug, Calculator, CalendarDays,
  ClipboardList, FileText, Folder, Moon, NotebookPen, Sun, Target, Wrench,
} from "lucide-react";

const GROUPS = [
  {
    label: "Practice",
    tabs: [
      { id: "today", label: "Today", icon: CalendarDays },
      { id: "skills", label: "Skills", icon: Target },
      { id: "drill", label: "Drill", icon: Wrench },
      { id: "bugfinder", label: "Bug Finder", icon: Bug },
      { id: "outage", label: "Outage", icon: AlertTriangle },
      { id: "capacity", label: "Capacity", icon: Calculator },
    ],
  },
  {
    label: "Knowledge",
    tabs: [
      { id: "library", label: "Library", icon: BookText },
      { id: "vocab", label: "Vocabulary", icon: Brain },
    ],
  },
  {
    label: "Workspace",
    tabs: [
      { id: "workspaces", label: "Workspaces", icon: Folder },
      { id: "review", label: "Review", icon: ClipboardList },
      { id: "proposal", label: "Proposal", icon: FileText },
      { id: "notes", label: "Notes", icon: NotebookPen },
    ],
  },
];

export function AppSidebar({ activeTab, onTabChange, theme, onToggleTheme }) {
  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-logo" aria-hidden>HLD</span>
        <strong>Architect Co-pilot</strong>
      </div>
      <nav className="sidebar-nav" aria-label="Primary">
        {GROUPS.map((group) => (
          <div key={group.label} className="sidebar-group">
            <p className="sidebar-group-label">{group.label}</p>
            {group.tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`sidebar-item ${activeTab === tab.id ? "is-active" : ""}`}
                  onClick={() => onTabChange(tab.id)}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>
      <button className="sidebar-theme" onClick={onToggleTheme}>
        {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
      </button>
    </aside>
  );
}
