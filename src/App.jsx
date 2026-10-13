import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { LanguageProvider } from '@/lib/LanguageContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import AppTranslator from '@/components/AppTranslator';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import DialDirectory from './pages/DialDirectory';
import DialServiceDetail from './pages/DialServiceDetail';
import ProtectedRoute from '@/components/ProtectedRoute';
import Profile from './pages/Profile';
import Reports from './pages/Reports';
import DialServiceComparison from './pages/DialServiceComparison';
import VoiceServiceComparison from './pages/VoiceServiceComparison';
import JobsDashboard from './pages/JobsDashboard';
import ThankYou from './pages/ThankYou';
import CreatorDashboard from './pages/CreatorDashboard';
import Disputes from './pages/Disputes';
import HostProfile from './pages/HostProfile';
import ServiceStatus from './pages/ServiceStatus';
import ServiceHistory from './pages/ServiceHistory';
import MonthlyUsageReport from './pages/MonthlyUsageReport';
import VoiceInstructionGuide from './pages/VoiceInstructionGuide';
import CreatorOnboardingPortal from './pages/CreatorOnboardingPortal';
import CreatorAdminDashboard from './pages/CreatorAdminDashboard';
import { Navigate } from 'react-router-dom';
import LiveSignalIndicator from '@/components/LiveSignalIndicator';
import FloatingHomePhoneButton from '@/components/shared/FloatingHomePhoneButton';
import NotificationsBell from '@/components/NotificationsBell';
import MyAccount from './pages/MyAccount';
import DialPricing from './pages/DialPricing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ArtistProfilePage from './pages/ArtistProfilePage';
import ServiceMarketplace from './pages/ServiceMarketplace';
import ArtistAnalytics from './pages/ArtistAnalytics';
import VoicePrompts from './pages/VoicePrompts';
import Audiobooks from './pages/Audiobooks';
import PartnershipPage from './pages/PartnershipPage';
import EmergencyBroadcast from './pages/EmergencyBroadcast';
import RegionalBroadcast from './pages/RegionalBroadcast';
import HowItWorks from './pages/HowItWorks';
import Community from './pages/Community';
import NetworkTech from './pages/NetworkTech';
import CategoryAlerts from './pages/CategoryAlerts';
import NewMemberGuide from './pages/NewMemberGuide';
import VoiceBroadcastDashboard from './pages/VoiceBroadcastDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Contact from './pages/Contact';
import FreeTv from './pages/FreeTv';
import Games from './pages/Games';
import Medical from './pages/Medical';
import AppFooter from '@/components/AppFooter';
import VoiceLibrary from './pages/VoiceLibrary';
import DatingPortal from './pages/DatingPortal';
import DatingDashboard from './pages/DatingDashboard';
import About from './pages/About';
import FaqVoiceFlow from './pages/FaqVoiceFlow';
import DialSimulator from './pages/DialSimulator';
import VoiceSignatureTutorial from './pages/VoiceSignatureTutorial';
import PersonalProfile from './pages/PersonalProfile';
import SmsOptInPolicy from './pages/SmsOptInPolicy';
import { VoiceGuidedProvider } from '@/lib/VoiceGuidedContext';
import { HoppwhistleVoiceProvider } from '@/telephony/hoppwhistle/HoppwhistleVoiceProvider';
import GlobalCallDock from '@/components/phone/GlobalCallDock';
import SocialHub from './pages/SocialHub';
import SocialProfilePage from './pages/SocialProfilePage';
import CommunityGallery from './pages/CommunityGallery';
import MemberDashboard from './pages/MemberDashboard';
import ServicesIndex from './pages/ServicesIndex';
import MerchantDispatchPage from './pages/MerchantDispatch';
import MerchantOnboarding from './pages/MerchantOnboarding';
import OrderHistory from './pages/OrderHistory';
import VoiceGps from './pages/VoiceGps';
import DistributionPortal from './pages/DistributionPortal';
import ShareMyLocation from './pages/ShareMyLocation';
import Phone from './pages/Phone';
import SmsInbox from './pages/SmsInbox';
import CallHistory from './pages/CallHistory';
import AddressBook from './pages/AddressBook';
import Groups from './pages/Groups';
import Advertise from './pages/Advertise';
import Library from './pages/Library';
import AudiobookDetail from './pages/AudiobookDetail';
import NarratorProfile from './pages/NarratorProfile';
import MyLibrary from './pages/MyLibrary';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import MyCourses from './pages/MyCourses';
import ExamPage from './pages/ExamPage';
import VerifyCertificate from './pages/VerifyCertificate';
import InstructorDashboard from './pages/InstructorDashboard';
import InstructorProfilePage from './pages/InstructorProfilePage';
import ReferralPage from './pages/ReferralPage';
import CourseSummary from './pages/CourseSummary';
import CourseCurriculum from './pages/CourseCurriculum';
import DialMotorsPage from './pages/DialMotorsPage';
import DialRealEstatePage from './pages/DialRealEstatePage';
import DialFoodsPage from './pages/DialFoodsPage';
// Add page imports here

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <>
    <AppTranslator />
    <LiveSignalIndicator />
    <FloatingHomePhoneButton />
    <GlobalCallDock />
    <NotificationsBell variant="mobile" />
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/" element={<Home />} />
      <Route path="/services" element={<ServicesIndex />} />
      <Route path="/directory" element={<DialDirectory />} />
      <Route path="/directory/:id" element={<DialServiceDetail />} />
      <Route path="/compare" element={<DialServiceComparison />} />
      <Route path="/compare-services" element={<VoiceServiceComparison />} />
      <Route path="/jobs" element={<JobsDashboard />} />
      <Route path="/creator-dashboard" element={<CreatorDashboard />} />
      <Route path="/disputes" element={<Disputes />} />
      <Route path="/host/:id" element={<HostProfile />} />
      <Route path="/artist/:id" element={<ArtistProfilePage />} />
      <Route path="/marketplace" element={<ServiceMarketplace />} />
      <Route path="/motors" element={<DialMotorsPage />} />
      <Route path="/real-estate" element={<DialRealEstatePage />} />
      <Route path="/foods" element={<DialFoodsPage />} />
      <Route path="/artist-analytics" element={<ArtistAnalytics />} />
      <Route path="/voice-prompts" element={<VoicePrompts />} />
      <Route path="/audiobooks" element={<Audiobooks />} />
      <Route path="/library" element={<Library />} />
      <Route path="/library/:id" element={<AudiobookDetail />} />
      <Route path="/narrator/:name" element={<NarratorProfile />} />
      <Route path="/courses" element={<Courses />} />
      <Route path="/courses/:id" element={<CourseDetail />} />
      <Route path="/courses/:id/curriculum" element={<CourseCurriculum />} />
      <Route path="/instructor/:userId" element={<InstructorProfilePage />} />
      <Route path="/verify/:code" element={<VerifyCertificate />} />
      <Route path="/partnership" element={<PartnershipPage />} />
      <Route path="/emergency-broadcast" element={<EmergencyBroadcast />} />
      <Route path="/how-it-works" element={<HowItWorks />} />
      <Route path="/community" element={<Community />} />
      <Route path="/network-tech" element={<NetworkTech />} />
      <Route path="/category-alerts" element={<CategoryAlerts />} />
      <Route path="/new-member-guide" element={<NewMemberGuide />} />
      <Route path="/voice-broadcasts" element={<VoiceBroadcastDashboard />} />
      <Route path="/status" element={<ServiceStatus />} />
      <Route path="/history" element={<ServiceHistory />} />
      <Route path="/usage-report" element={<MonthlyUsageReport />} />
      <Route path="/voice-guide" element={<VoiceInstructionGuide />} />
      <Route path="/thank-you" element={<ThankYou />} />
      <Route path="/account" element={<MyAccount />} />
      <Route path="/pricing" element={<DialPricing />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/tv" element={<FreeTv />} />
      <Route path="/games" element={<Games />} />
      <Route path="/medical" element={<Medical />} />
      <Route path="/voice-library" element={<VoiceLibrary />} />
      <Route path="/about" element={<About />} />
      <Route path="/simulator" element={<DialSimulator />} />
      <Route path="/voice-gps" element={<VoiceGps />} />
      <Route path="/share-location" element={<ShareMyLocation />} />
      <Route path="/voice-tutorial" element={<VoiceSignatureTutorial />} />
      <Route path="/faq" element={<FaqVoiceFlow />} />
      <Route path="/sms-policy" element={<SmsOptInPolicy />} />
      <Route path="/merchant-onboarding" element={<MerchantOnboarding />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/my-profile" element={<PersonalProfile />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/regional-broadcast" element={<RegionalBroadcast />} />
        <Route path="/creator-onboarding" element={<CreatorOnboardingPortal />} />
        <Route path="/creator-admin" element={<CreatorAdminDashboard />} />
        <Route path="/dating" element={<DatingPortal />} />
        <Route path="/dating-dashboard" element={<DatingDashboard />} />
        <Route path="/community-gallery" element={<CommunityGallery />} />
        <Route path="/social" element={<SocialHub />} />
        <Route path="/social/profile/:handle" element={<SocialProfilePage />} />
        <Route path="/member-dashboard" element={<MemberDashboard />} />
        <Route path="/merchant-dispatch" element={<MerchantDispatchPage />} />
        <Route path="/order-history" element={<OrderHistory />} />
        <Route path="/distribution" element={<DistributionPortal />} />
        <Route path="/phone" element={<Phone />} />
        <Route path="/messages" element={<SmsInbox />} />
        <Route path="/call-history" element={<CallHistory />} />
        <Route path="/address-book" element={<AddressBook />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/my-library" element={<MyLibrary />} />
        <Route path="/my-courses" element={<MyCourses />} />
        <Route path="/courses/:id/summary" element={<CourseSummary />} />
        <Route path="/referral" element={<ReferralPage />} />
        <Route path="/exam/:assessmentId" element={<ExamPage />} />
        <Route path="/instructor" element={<InstructorDashboard />} />
      </Route>
      <Route path="/advertise" element={<Advertise />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
    <AppFooter />
    </>
  );
};


function App() {

  return (
    <AuthProvider>
      <LanguageProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <ScrollToTop />
            <VoiceGuidedProvider>
              <HoppwhistleVoiceProvider>
                <AuthenticatedApp />
              </HoppwhistleVoiceProvider>
            </VoiceGuidedProvider>
          </Router>
          <Toaster />
        </QueryClientProvider>
      </LanguageProvider>
    </AuthProvider>
  )
}

export default App