import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { StoreProvider } from './store'
import Layout from './components/Layout'
import Home from './pages/Home'
import CoachDashboard from './pages/CoachDashboard'
import Search from './pages/Search'
import Shortlists from './pages/Shortlists'
import AthleteProfile from './pages/AthleteProfile'
import GameFilm from './pages/GameFilm'
import MyProfile from './pages/MyProfile'
import MyFilm from './pages/MyFilm'
import MyDocuments from './pages/MyDocuments'
import { AdminQueue, AdminCoaches, AdminAudit } from './pages/Admin'

// HashRouter keeps every page working when the demo is served as static files.
export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="*" element={
            <Layout>
              <Routes>
                <Route path="/coach" element={<CoachDashboard />} />
                <Route path="/search" element={<Search />} />
                <Route path="/shortlists" element={<Shortlists />} />
                <Route path="/athletes/:id" element={<AthleteProfile />} />
                <Route path="/games/:id" element={<GameFilm />} />
                <Route path="/me" element={<MyProfile />} />
                <Route path="/me/film" element={<MyFilm />} />
                <Route path="/me/documents" element={<MyDocuments />} />
                <Route path="/admin" element={<AdminQueue />} />
                <Route path="/admin/coaches" element={<AdminCoaches />} />
                <Route path="/admin/audit" element={<AdminAudit />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          } />
        </Routes>
      </HashRouter>
    </StoreProvider>
  )
}
