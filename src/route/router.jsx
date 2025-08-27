import { createBrowserRouter, Navigate } from "react-router-dom";
import RootLayout from "../layout/root";
import Home from "../pages/home";
import Analytics from "../pages/analytics";
import ReportsSales from "../pages/reports-sales";
import ReportsLeads from "../pages/reports-leads";
import ReportsProject from "../pages/reports-project";
import AppsChat from "../pages/apps-chat";
import LayoutApplications from "../layout/layoutApplications";
import AppsEmail from "../pages/apps-email";
import ReportsTimesheets from "../pages/reports-timesheets";
import LoginCover from "../pages/login-cover";
import AppsTasks from "../pages/apps-tasks";
import AppsNotes from "../pages/apps-notes";
import AppsCalender from "../pages/apps-calender";
import AppsStorage from "../pages/apps-storage";
import Proposalist from "../pages/proposal-list";
import CustomersList from "../pages/customers-list";
import ProposalView from "../pages/proposal-view";
import ProposalEdit from "../pages/proposal-edit";
import LeadsList from "../pages/leadsList";
import CustomersView from "../pages/customers-view";
import CustomersCreate from "../pages/customers-create";
import ProposalCreate from "../pages/proposal-create";
import LeadsView from "../pages/leads-view";
import LeadsCreate from "../pages/leads-create";
import PaymentList from "../pages/payment-list";
import PaymentView from "../pages/payment-view/";
import PaymentCreate from "../pages/payment-create";
import ProjectsList from "../pages/projects-list";
import ProjectsView from "../pages/projects-view";
import ProjectsCreate from "../pages/projects-create";
import SettingsGaneral from "../pages/settings-ganeral";
import LayoutSetting from "../layout/layoutSetting";
import SettingsSeo from "../pages/settings-seo";
import SettingsTags from "../pages/settings-tags";
import SettingsEmail from "../pages/settings-email";
import SettingsTasks from "../pages/settings-tasks";
import SettingsLeads from "../pages/settings-leads";
import SettingsMiscellaneous from "../pages/settings-miscellaneous";
import SettingsRecaptcha from "../pages/settings-recaptcha";
import SettingsLocalization from "../pages/settings-localization";
import SettingsCustomers from "../pages/settings-customers";
import SettingsGateways from "../pages/settings-gateways";
import SettingsFinance from "../pages/settings-finance";
import SettingsSupport from "../pages/settings-support";
import LayoutAuth from "../layout/layoutAuth";
import LoginMinimal from "../pages/login-minimal";
import LoginCreative from "../pages/login-creative";
import RegisterCover from "../pages/register-cover";
import RegisterMinimal from "../pages/register-minimal";
import RegisterCreative from "../pages/register-creative";
import ResetCover from "../pages/reset-cover";
import ResetMinimal from "../pages/reset-minimal";
import ResetCreative from "../pages/reset-creative";
import ErrorCover from "../pages/error-cover";
import ErrorCreative from "../pages/error-creative";
import ErrorMinimal from "../pages/error-minimal";
import OtpCover from "../pages/otp-cover";
import OtpMinimal from "../pages/otp-minimal";
import OtpCreative from "../pages/otp-creative";
import MaintenanceCover from "../pages/maintenance-cover";
import MaintenanceMinimal from "../pages/maintenance-minimal";
import MaintenanceCreative from "../pages/maintenance-creative";
import HelpKnowledgebase from "../pages/help-knowledgebase";
import WidgetsLists from "../pages/widgets-lists";
import WidgetsTables from "../pages/widgets-tables";
import WidgetsCharts from "../pages/widgets-charts";
import WidgetsStatistics from "../pages/widgets-statistics";
import WidgetsMiscellaneous from "../pages/widgets-miscellaneous";
// import Invoice_preview from "@/components/main_components/invoice/invoice_preview";
import Invoice_preview from "../components/main_components/invoice/Invoice_preview";
import { useUser } from "../contentApi/UserProvider";

// const ProtectedRoute = ({ children }) => {
//   const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
//   return token ? children : <Navigate to="/login" replace />;
// };

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useUser();
  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
};



export const router = createBrowserRouter([
    {
        path: "/",
        // element: <RootLayout />,
        element: <ProtectedRoute><RootLayout /></ProtectedRoute>,
        children: [
            // {
            //     path: "/",
            //     element: <Home />
            // },
            // {
            //     path: "/invoice/upload",
            //     element: <Invoice_preview target="invoice_upload"/>
            // },
            // {
            //     path: "/invoice",
            //     element: <Invoice_preview target="main_invoice_view"/>
            // },
            // {
            //     path: "/invoice/create",
            //     element: <Invoice_preview target="invoice_create" />
            // },
            // {
            //     path: "/invoice/bank-accounts",
            //     element: <Invoice_preview target="invoice_bank_accounts"/>
            // },
            // {
            //     path: "/invoice/pnl",
            //     element: <Invoice_preview target="invoice_pnl"/>
            // },
            // {
            //     path: "/invoice/summary",
            //     element: <Invoice_preview target="invoice_summary"/>
            // },
            // {
            //     path: "/invoice/refund",
            //     element: <Invoice_preview target="invoice_refund" />
            // },
            // {
            //     path: "/invoice/reconciliation",
            //     element: <Invoice_preview target="invoice_reconciliation" />
            // },
            // {
            //     path: "/reconciliation",
            //     element: <Invoice_preview target="reconciliation" />
            // },
            //   {
            //     path: "/receivables",
            //     element: <Invoice_preview target="receivables_api_list2" />
            // },
            // {
            //     path: "/receivables/api_list",
            //     element: <Invoice_preview target="receivables_api_list" />
            // },
            // {
            //     path: "/receivables/api_list2",
            //     element: <Invoice_preview target="receivables_api_list2" />
            // },
            // {
            //     path: "/receivables/summary_reports",
            //     element: <Invoice_preview target="receivables_summary_reports" />
            // },
            // {
            //     path: "/receivables/sales",
            //     element: <Invoice_preview target="receivables_sales" />
            // },
            // {
            //     path: "/payment/list",
            //     element: <Invoice_preview target="payable_list" />
            // },
            // {
            //     path: "/invoice/reconciliation/actual",
            //     element: <Invoice_preview target="invoice_reconciliation_actual" />
            // },
             {
        path: "/",
        element: <ProtectedRoute><Home /></ProtectedRoute>,
      },
      {
        path: "/invoice/upload",
        element: <ProtectedRoute><Invoice_preview target="invoice_upload" /></ProtectedRoute>,
      },
      {
        path: "/invoice",
        element: <ProtectedRoute><Invoice_preview target="main_invoice_view" /></ProtectedRoute>,
      },
      {
        path: "/invoice/create",
        element: <ProtectedRoute><Invoice_preview target="invoice_create" /></ProtectedRoute>,
      },
      {
        path: "/invoice/bank-accounts",
        element: <ProtectedRoute><Invoice_preview target="invoice_bank_accounts" /></ProtectedRoute>,
      },
      {
        path: "/invoice/pnl",
        element: <ProtectedRoute><Invoice_preview target="invoice_pnl" /></ProtectedRoute>,
      },
      {
        path: "invoice/pnl/actual",
        element: <ProtectedRoute><Invoice_preview target="invoice_pnl" /></ProtectedRoute>,
      },
      {
        path: "/invoice/summary",
        element: <ProtectedRoute><Invoice_preview target="invoice_summary" /></ProtectedRoute>,
      },
      {
        path: "/invoice/refund",
        element: <ProtectedRoute><Invoice_preview target="invoice_refund" /></ProtectedRoute>,
      },
      {
        path: "/invoice/reconciliation",
        element: <ProtectedRoute><Invoice_preview target="invoice_reconciliation" /></ProtectedRoute>,
      },
      {
        path: "/reconciliation",
        element: <ProtectedRoute><Invoice_preview target="reconciliation" /></ProtectedRoute>,
      },
      {
        path: "/receivables",
        element: <ProtectedRoute><Invoice_preview target="receivables_api_list2" /></ProtectedRoute>,
      },
      {
        path: "/receivables/api_list",
        element: <ProtectedRoute><Invoice_preview target="receivables_api_list" /></ProtectedRoute>,
      },
      {
        path: "/receivables/api_list2",
        element: <ProtectedRoute><Invoice_preview target="receivables_api_list2" /></ProtectedRoute>,
      },
      {
        path: "/receivables/summary_reports",
        element: <ProtectedRoute><Invoice_preview target="receivables_summary_reports" /></ProtectedRoute>,
      },
      {
        path: "/receivables/sales",
        element: <ProtectedRoute><Invoice_preview target="receivables_sales" /></ProtectedRoute>,
      },
      {
        path: "/payment/list",
        element: <ProtectedRoute><Invoice_preview target="payable_list" /></ProtectedRoute>,
      },
      {
        path: "/invoice/reconciliation/actual",
        element: <ProtectedRoute><Invoice_preview target="invoice_reconciliation_actual" /></ProtectedRoute>,
      },
      {
        path: "/role_management",
        element: <ProtectedRoute><Invoice_preview target="role_management" /></ProtectedRoute>,
      },
      {
        path: "/activity_management",
        element: <ProtectedRoute><Invoice_preview target="activity_management" /></ProtectedRoute>,
      },
      {
        path: "/summary_reports",
        element: <ProtectedRoute><Invoice_preview target="summary_reports" /></ProtectedRoute>,
      },
      {
        path: "/cheque_print/list",
        element: <ProtectedRoute><Invoice_preview target="cheque_print_list" /></ProtectedRoute>,
      },
      {
        path: "/cheque_print/create",
        element: <ProtectedRoute><Invoice_preview target="cheque_print_create" /></ProtectedRoute>,
      },
            {
                path: "/payment/view",
                element: <PaymentView />
            },
            {
                path: "/payment/create",
                element: <PaymentCreate />
            },
            {
                path: "/customers/list",
                element: <CustomersList />
            },
            {
                path: "/customers/view",
                element: <CustomersView />
            },
            {
                path: "/customers/create",
                element: <CustomersCreate />
            },
            {
                path: "/leads/list",
                element: <LeadsList />
            },
            {
                path: "/leads/view",
                element: <LeadsView />
            },
            {
                path: "/leads/create",
                element: <LeadsCreate />
            },
            {
                path: "/projects/list",
                element: <ProjectsList />
            },
            {
                path: "/projects/view",
                element: <ProjectsView />
            },
            {
                path: "/projects/create",
                element: <ProjectsCreate />
            },
            {
                path: "/widgets/lists",
                element: <WidgetsLists />
            },
            {
                path: "/widgets/tables",
                element: <WidgetsTables />
            },
            {
                path: "/widgets/charts",
                element: <WidgetsCharts/>
            },
            {
                path: "/widgets/statistics",
                element: <WidgetsStatistics/>
            },
            {
                path: "/widgets/miscellaneous",
                element: <WidgetsMiscellaneous/>
            },
            {
                path: "/help/knowledgebase",
                element: <HelpKnowledgebase />
            },

        ]
    },
    {
        path: "/",
        element: <LayoutApplications />,
        children: [
            {
                path: "/applications/chat",
                element: <AppsChat />
            },
            {
                path: "/applications/email",
                element: <AppsEmail />
            },
            {
                path: "/applications/tasks",
                element: <AppsTasks />
            },
            {
                path: "/applications/notes",
                element: <AppsNotes />
            },
            {
                path: "/applications/calender",
                element: <AppsCalender />
            },
            {
                path: "/applications/storage",
                element: <AppsStorage />
            },
        ]
    },
    {
        path: "/",
        element: <LayoutSetting />,
        children: [
            {
                path: "/settings/ganeral",
                element: <SettingsGaneral />
            },
            {
                path: "/settings/seo",
                element: <SettingsSeo />
            },
            {
                path: "/settings/tags",
                element: <SettingsTags />
            },
            {
                path: "/settings/email",
                element: <SettingsEmail />
            },
            {
                path: "/settings/tasks",
                element: <SettingsTasks />
            },
            {
                path: "/settings/leads",
                element: <SettingsLeads />
            },
            {
                path: "/settings/Support",
                element: <SettingsSupport />
            },
            {
                path: "/settings/finance",
                element: <SettingsFinance />
            },
            {
                path: "/settings/gateways",
                element: <SettingsGateways />
            },
            {
                path: "/settings/customers",
                element: <SettingsCustomers />
            },
            {
                path: "/settings/localization",
                element: <SettingsLocalization />
            },
            {
                path: "/settings/recaptcha",
                element: <SettingsRecaptcha />
            },
            {
                path: "/settings/miscellaneous",
                element: <SettingsMiscellaneous />
            },
        ]
    },
    {
        path: "/",
        element: <LayoutAuth />,
        children: [
            {
                path: "/authentication/login/cover",
                element: <LoginCover />
            },
            {
                path: "/authentication/login/minimal",
                element: <LoginMinimal />
            },
            {
                path: "/login",
                element: <LoginCreative />
            },
            {
                path: "/authentication/register/cover",
                element: <RegisterCover />
            },
            {
                path: "/authentication/register/minimal",
                element: <RegisterMinimal />
            },
            {
                path: "/register",
                element: <RegisterCreative />
            },
            {
                path: "/authentication/reset/cover",
                element: <ResetCover />
            },
            {
                path: "/authentication/reset/minimal",
                element: <ResetMinimal />
            },
            {
                path: "/authentication/reset/creative",
                element: <ResetCreative />
            },
            {
                path: "/authentication/404/cover",
                element: <ErrorCover />
            },
            {
                path: "/authentication/404/minimal",
                element: <ErrorMinimal />
            },
            {
                path: "/authentication/404/creative",
                element: <ErrorCreative />
            },
            {
                path: "/authentication/verify/cover",
                element: <OtpCover />
            },
            {
                path: "/authentication/verify/minimal",
                element: <OtpMinimal />
            },
            {
                path: "/authentication/verify/creative",
                element: <OtpCreative />
            },
            {
                path: "/authentication/maintenance/cover",
                element: <MaintenanceCover />
            },
            {
                path: "/authentication/maintenance/minimal",
                element: <MaintenanceMinimal />
            },
            {
                path: "/authentication/maintenance/creative",
                element: <MaintenanceCreative />
            },
        ]
    }
])