import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute from './routes/ProtectedRoute'
import StudentLayout from './layouts/StudentLayout'
import AdminLayout from './layouts/AdminLayout'

const Login = lazy(() => import('./pages/auth/Login'))
const Home = lazy(() => import('./pages/Home'))
const Register = lazy(() => import('./pages/auth/Register'))
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'))
const GoogleAuthCallback = lazy(() => import('./pages/auth/GoogleAuthCallback'))
const AdminInvitationAccept = lazy(() => import('./pages/auth/AdminInvitationAccept'))
const AccountSettings = lazy(() => import('./pages/account/AccountSettings'))
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'))
const StudentMeals = lazy(() => import('./pages/student/StudentMeals'))
const StudentBookings = lazy(() => import('./pages/student/StudentBookings'))
const StudentSubscription = lazy(() => import('./pages/student/StudentSubscription'))
const StudentPayments = lazy(() => import('./pages/student/StudentPayments'))
const StudentFeedback = lazy(() => import('./pages/student/StudentFeedback'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminBookings = lazy(() => import('./pages/admin/AdminBookings'))
const AdminFeedback = lazy(() => import('./pages/admin/AdminFeedback'))
const AdminMeals = lazy(() => import('./pages/admin/AdminMeals'))
const AdminPayments = lazy(() => import('./pages/admin/AdminPayments'))
const AdminPlans = lazy(() => import('./pages/admin/AdminPlans'))
const AdminSubscriptions = lazy(() => import('./pages/admin/AdminSubscriptions'))
const AdminTeam = lazy(() => import('./pages/admin/AdminTeam'))

function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center" role="status" aria-live="polite" aria-label="Loading page">
      <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-600" />
        Loading workspace
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/auth/google/callback" element={<GoogleAuthCallback />} />
        <Route path="/admin-invitation" element={<AdminInvitationAccept />} />

        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<StudentDashboard />} />
          <Route path="meals" element={<StudentMeals />} />
          <Route path="bookings" element={<StudentBookings />} />
          <Route path="subscription" element={<StudentSubscription />} />
          <Route path="payments" element={<StudentPayments />} />
          <Route path="feedback" element={<StudentFeedback />} />
          <Route path="account" element={<AccountSettings />} />
        </Route>

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="feedback" element={<AdminFeedback />} />
          <Route path="meals" element={<AdminMeals />} />
          <Route path="plans" element={<AdminPlans />} />
          <Route path="subscriptions" element={<AdminSubscriptions />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="team" element={<AdminTeam />} />
          <Route path="account" element={<AccountSettings />} />
        </Route>
      </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
