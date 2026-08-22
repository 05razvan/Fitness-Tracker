import { NavLink, Outlet } from 'react-router-dom'
import './AppLayout.css'

const navigation = [
  { label: 'Dashboard', path: '/', icon: '⌂' },
  { label: 'Workouts', path: '/workouts', icon: '◈' },
  { label: 'Exercises', path: '/exercises', icon: '↗' },
  { label: 'Analytics', path: '/analytics', icon: '⌁' },
]

function AppLayout() {
  return (
    <div className="app-shell">
      <aside className="desktop-sidebar">
        <div className="brand">
          <div className="brand-mark">A</div>
          <div>
            <div className="brand-name">ADAPTIVE</div>
            <div className="brand-subtitle">FITNESS INTELLIGENCE</div>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <span className="nav-section-label">WORKSPACE</span>

          {navigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              <span className="nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="status-indicator">
            <span className="status-dot" />
            <span>INTELLIGENCE ONLINE</span>
          </div>
        </div>
      </aside>

      <div className="mobile-header">
        <div className="mobile-brand">
          <div className="brand-mark">A</div>
          <span>ADAPTIVE</span>
        </div>

        <div className="status-dot" aria-label="Intelligence online" />
      </div>

      <main className="app-content">
        <Outlet />
      </main>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {navigation.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `mobile-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <span className="mobile-nav-icon" aria-hidden="true">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export default AppLayout

