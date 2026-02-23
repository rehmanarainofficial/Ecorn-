import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import Dashboard from '../screens/main/Dashboard';
import Detail from '../screens/main/stacks/DetailScreens/Detail';
import IncomeDetail from '../screens/main/stacks/DetailScreens/IncomeDetail';
import ExpenseDetail from '../screens/main/stacks/DetailScreens/ExpenseDetail';
import PayrollExpenseDetail from '../screens/main/stacks/DetailScreens/PayrollExpenseDetail';
import AdminExpenseDetail from '../screens/main/stacks/DetailScreens/AdminExpenseDetail';
import SellingExpenseDetail from '../screens/main/stacks/DetailScreens/SellingExpenseDetail';
import SalesRevenueDetail from '../screens/main/stacks/DetailScreens/SalesRevenueDetail';
import OtherRevenueDetail from '../screens/main/stacks/DetailScreens/OtherRevenueDetail';
import ShortTermLoanDetail from '../screens/main/stacks/DetailScreens/ShortTermLoanDetail';
import NotificationScreen from '../screens/main/stacks/NotificationScreen';
import MoreDetail from '../screens/main/stacks/DetailScreens/MoreDetail';
import ViewAll from '../screens/main/stacks/DetailScreens/ViewAll';
import AlertScreen from '../screens/main/stacks/AppAlerts/AlertScreen';
import NormalViewAll from '../screens/main/stacks/DetailScreens/NormalViewAll';
import PdfScreen from '../screens/main/stacks/DetailScreens/PdfScreen';
import ProfitAndLossScreen from '../screens/main/stacks/ProfitAndLoss/ProfitAndLossScreen';
import ApprovalScreen from '../screens/main/stacks/ProfitAndLoss/ApprovalScreen';
import Aging from '../screens/main/stacks/AgingAndLedger/Aging';
import Ledger from '../screens/main/stacks/AgingAndLedger/Ledger';
import TopTenScreen from '../screens/main/stacks/DetailScreens/TopTen/TopTenScreen';
import AgingAndLedger from '../screens/main/stacks/AgingAndLedger/AgingAndLedger';
import ViewAllTopTen from '../screens/main/stacks/DetailScreens/TopTen/ViewAllTopTen';
import ShowUnapprovedDetails from '../screens/main/stacks/AppAlerts/ShowUnapprovedDetails';
import SecurityRule from '../screens/main/stacks/DetailScreens/SecurityRule';

//other app
import Home from '../screens/otherappflow/main/Home';
import AddNewCustomer from '../screens/otherappflow/main/AddNewCustomer';
import InsertNewCustomerDetail from '../screens/otherappflow/main/InsertNewCustomerDetail';
import Incentive from '../screens/otherappflow/main/Incentive';

import AddItems from '../screens/otherappflow/main/AddItems';
import ItemList from '../screens/otherappflow/main/ItemList';
import PaymentScreen from '../screens/otherappflow/main/PaymentScreen';
import Profile from '../screens/otherappflow/main/Profile';
import NewOrders from '../screens/otherappflow/main/NewOrders';
import RecoveryOrder from '../screens/otherappflow/main/RecoveryOrder';
import Visit from '../screens/otherappflow/main/Visit';
import OfflineOrders from '../screens/otherappflow/main/OfflineOrders';
import SalesmanList from '../screens/otherappflow/main/SalesmanList';
import SalesmanCustomer from '../screens/otherappflow/main/SalesmanCustomer';
import AsmSalesman from '../screens/otherappflow/main/asm/AsmSalesman';
import AsmDimension from '../screens/otherappflow/main/asm/AsmDimension';
import TodayOrderDetails from '../screens/otherappflow/main/TodayOrderDetails';
import SupplierHome from '../screens/otherappflow/suppliers/SupplierHome';
import SalesScreen from '../screens/main/stacks/Sales/SalesScreen';
import PurchaseScreen from '../screens/main/stacks/purchase/PurchaseScreen';
import InventoryScreen from '../screens/main/stacks/Inventory/InventoryScreen';
import FinanceScreen from '../screens/main/stacks/Finance/FinanceScreen';
import ManufacturingScreen from '../screens/main/stacks/Manufacturing/ManufacturingScreen';
import CrmScreen from '../screens/main/stacks/Crm/CrmScreen';
import ReceivableScreen from '../screens/main/stacks/Sales/ReceivableScreen';
import UploadScreen from '../screens/main/stacks/Sales/UploadScreen';
import AttachDocumentScreen from '../screens/main/stacks/attachDocument/AttachDocumentScreen';
import VoucherScreen from '../screens/main/stacks/attachDocument/VoucherScreen';
import PurchaseOrder from '../screens/main/stacks/attachDocument/PurchaseOrder';
import PDFViewerScreen from '../screens/main/stacks/attachDocument/PDFViewerScreen';
import DeliveryScreen from '../screens/main/stacks/Sales/Delivery/DeliveryScreen';
import DeliveryNote from '../screens/main/stacks/Sales/Delivery/DeliveryNote';
import SaleOrder from '../screens/main/stacks/attachDocument/SaleOrder';
import TrackOrderStatus from '../screens/main/stacks/Sales/TrackOrderStatus';
import AddSuppliersScreen from '../screens/main/stacks/purchase/AddSuppliersScreen';
import AddLeadScreen from '../screens/main/stacks/Crm/AddLeadScreen';
import LeadsListScreen from '../screens/main/stacks/Crm/LeadsListScreen';
import ViewLeads from '../screens/main/stacks/Crm/ViewLeads';
import AddItem from '../screens/main/stacks/Inventory/AddItem';
import InventoryAjustment from '../screens/main/stacks/Inventory/InventoryAjustment';
import LocationTransfer from '../screens/main/stacks/Inventory/LocationTransfer';
import ElectricalJobCardsScreen from '../screens/main/stacks/Manufacturing/ElectricalJobCardsScreen';
import UploadSuppliers from '../screens/main/stacks/purchase/UploadSuppliers';
import MechanicalJobCardsScreen from '../screens/main/stacks/Manufacturing/MechanicalJobCardsScreen';
import MechanicalEstimate from '../screens/main/stacks/Manufacturing/MechanicalEstimate';
import MechanicalProduce from '../screens/main/stacks/Manufacturing/MechanicalProduce';
import StockSheetScreen from '../screens/main/stacks/Inventory/StockSheetScreen';
import ViewItem from '../screens/main/stacks/Inventory/ViewItem';
import GrnAgainst from '../screens/main/stacks/purchase/GrnAgainst';
import ApprovalListScreen from '../screens/main/stacks/AppAlerts/ApprovalListScreen';
import GrnDeliveryNote from '../screens/main/stacks/purchase/GrnDeliveryNote';
import PayableSummary from '../screens/main/stacks/purchase/PayableSummary';
import PdcDetailScreen from '../screens/main/stacks/purchase/PdcDetailScreen';
import ViewLedger from '../screens/main/stacks/Finance/ViewLedger';
import StockMovements from '../screens/main/stacks/Inventory/StockMovements';
import ViewDetailsScreen from '../screens/main/stacks/AppAlerts/ViewDetailsScreen ';
import ExpenseClaim from '../screens/main/stacks/Finance/ExpenseClaim';
import ExpenseClaimInquiry from '../screens/main/stacks/Finance/ExpenseClaimInquiry';
import LocalPurchase from '../screens/main/stacks/Finance/LocalPurchase';
import GLViewScreen from '../screens/main/stacks/AppAlerts/GLViewScreen';
import ViewTransactions from '../components/ViewTransactions';
import ManufacturingView from '../components/ManufacturingView';
import Attendance from '../screens/main/stacks/HCM/Attendance';
import CostCenterScreen from '../screens/main/stacks/Sales/CostCenterScreen';
import ApprovedRecordsScreen from '../screens/main/stacks/Sales/ApprovedRecordsScreen';
import HCMScreen from '../screens/main/stacks/HCM/HCMScreen';
import DVRInquiry from '../screens/main/stacks/HCM/DVRInquiry';

const Stack = createNativeStackNavigator();
const Main = () => {
  return (
    <Stack.Navigator
      initialRouteName="Dashboard"
      screenOptions={{headerShown: false}}>
      <Stack.Screen name="Dashboard" component={Dashboard} />
      <Stack.Screen name="Detail" component={Detail} />
      <Stack.Screen name="IncomeDetail" component={IncomeDetail} />
      <Stack.Screen name="ExpenseDetail" component={ExpenseDetail} />
      <Stack.Screen
        name="PayrollExpenseDetail"
        component={PayrollExpenseDetail}
      />
      <Stack.Screen name="AdminExpenseDetail" component={AdminExpenseDetail} />
      <Stack.Screen
        name="SellingExpenseDetail"
        component={SellingExpenseDetail}
      />
      <Stack.Screen name="SalesRevenueDetail" component={SalesRevenueDetail} />
      <Stack.Screen name="OtherRevenueDetail" component={OtherRevenueDetail} />
      <Stack.Screen
        name="ShortTermLoanDetail"
        component={ShortTermLoanDetail}
      />
      <Stack.Screen name="MoreDetail" component={MoreDetail} />
      <Stack.Screen name="ViewAll" component={ViewAll} />
      <Stack.Screen name="NotificationScreen" component={NotificationScreen} />
      <Stack.Screen name="AlertScreen" component={AlertScreen} />
      <Stack.Screen name="NormalViewAll" component={NormalViewAll} />
      <Stack.Screen name="PdfScreen" component={PdfScreen} />
      <Stack.Screen
        name="ProfitAndLossScreen"
        component={ProfitAndLossScreen}
      />
      <Stack.Screen name="ApprovalScreen" component={ApprovalScreen} />
      <Stack.Screen name="Aging" component={Aging} />
      <Stack.Screen name="Ledger" component={Ledger} />
      <Stack.Screen name="TopTenScreen" component={TopTenScreen} />
      <Stack.Screen name="ViewAllTopTen" component={ViewAllTopTen} />
      <Stack.Screen name="SecurityRule" component={SecurityRule} />

      <Stack.Screen name="AgingAndLedger" component={AgingAndLedger} />
      <Stack.Screen
        name="ShowUnapprovedDetails"
        component={ShowUnapprovedDetails}
      />

      {/* old app */}
      <Stack.Screen name="Home" component={Home} />
      <Stack.Screen name="SalesScreen" component={SalesScreen} />
      <Stack.Screen name="PurchaseScreen" component={PurchaseScreen} />
      <Stack.Screen name="InventoryScreen" component={InventoryScreen} />
      <Stack.Screen
        name="ManufacturingScreen"
        component={ManufacturingScreen}
      />
      <Stack.Screen name="FinanceScreen" component={FinanceScreen} />
      <Stack.Screen name="CrmScreen" component={CrmScreen} />
      <Stack.Screen name="AddNewCustomer" component={AddNewCustomer} />
      <Stack.Screen
        name="InsertNewCustomerDetail"
        component={InsertNewCustomerDetail}
      />
      <Stack.Screen name="Incentive" component={Incentive} />
      <Stack.Screen name="AddItems" component={AddItems} />
      <Stack.Screen name="ItemList" component={ItemList} />
      <Stack.Screen name="PaymentScreen" component={PaymentScreen} />
      <Stack.Screen name="Profile" component={Profile} />
      <Stack.Screen name="NewOrders" component={NewOrders} />
      <Stack.Screen name="RecoveryOrder" component={RecoveryOrder} />
      <Stack.Screen name="Visit" component={Visit} />
      <Stack.Screen name="OfflineOrders" component={OfflineOrders} />
      <Stack.Screen name="SalesmanList" component={SalesmanList} />
      <Stack.Screen name="SalesmanCustomer" component={SalesmanCustomer} />
      <Stack.Screen name="AsmSalesman" component={AsmSalesman} />
      <Stack.Screen name="AsmDimension" component={AsmDimension} />
      <Stack.Screen name="TodayOrderDetails" component={TodayOrderDetails} />
      <Stack.Screen name="SupplierHome" component={SupplierHome} />
      <Stack.Screen name="ReceivableScreen" component={ReceivableScreen} />
      <Stack.Screen name="UploadScreen" component={UploadScreen} />
      <Stack.Screen
        name="AttachDocumentScreen"
        component={AttachDocumentScreen}
      />
      <Stack.Screen name="VoucherScreen" component={VoucherScreen} />
      <Stack.Screen name="PurchaseOrder" component={PurchaseOrder} />
      <Stack.Screen name="PDFViewerScreen" component={PDFViewerScreen} />
      <Stack.Screen name="DeliveryScreen" component={DeliveryScreen} />
      <Stack.Screen name="DeliveryNote" component={DeliveryNote} />
      <Stack.Screen name="SaleOrder" component={SaleOrder} />
      <Stack.Screen name="TrackOrderStatus" component={TrackOrderStatus} />
      <Stack.Screen name="AddSuppliersScreen" component={AddSuppliersScreen} />
      <Stack.Screen name="AddLeadScreen" component={AddLeadScreen} />
      <Stack.Screen name="LeadsListScreen" component={LeadsListScreen} />
      <Stack.Screen name="ViewLeads" component={ViewLeads} />
      <Stack.Screen name="AddItem" component={AddItem} />
      <Stack.Screen name="InventoryAjustment" component={InventoryAjustment} />
      <Stack.Screen name="LocationTransfer" component={LocationTransfer} />
      <Stack.Screen name="UploadSuppliers" component={UploadSuppliers} />
      <Stack.Screen
        name="ElectricalJobCardsScreen"
        component={ElectricalJobCardsScreen}
      />
      <Stack.Screen
        name="MechanicalJobCardsScreen"
        component={MechanicalJobCardsScreen}
      />
      <Stack.Screen name="MechanicalEstimate" component={MechanicalEstimate} />
      <Stack.Screen name="StockSheetScreen" component={StockSheetScreen} />
      <Stack.Screen name="MechanicalProduce" component={MechanicalProduce} />
      <Stack.Screen name="ViewItem" component={ViewItem} />

      <Stack.Screen name="GrnAgainst" component={GrnAgainst} />
      <Stack.Screen name="ApprovalListScreen" component={ApprovalListScreen} />
      <Stack.Screen name="GrnDeliveryNote" component={GrnDeliveryNote} />
      <Stack.Screen name="PayableSummary" component={PayableSummary} />
      <Stack.Screen name="PdcDetailScreen" component={PdcDetailScreen} />
      <Stack.Screen name="ViewLedger" component={ViewLedger} />
      <Stack.Screen name="StockMovements" component={StockMovements} />
      <Stack.Screen name="ViewDetailsScreen" component={ViewDetailsScreen} />
      <Stack.Screen name="ExpenseClaim" component={ExpenseClaim} />
      <Stack.Screen
        name="ExpenseClaimInquiry"
        component={ExpenseClaimInquiry}
      />
      <Stack.Screen name="LocalPurchase" component={LocalPurchase} />
      <Stack.Screen name="GLViewScreen" component={GLViewScreen} />
      <Stack.Screen name="ViewTransactions" component={ViewTransactions} />
      <Stack.Screen name="ManufacturingView" component={ManufacturingView} />
      <Stack.Screen name="Attendance" component={Attendance} />
      <Stack.Screen name="CostCenterScreen" component={CostCenterScreen} />
      <Stack.Screen
        name="ApprovedRecordsScreen"
        component={ApprovedRecordsScreen}
      />
      <Stack.Screen name="HCMScreen" component={HCMScreen} />
      <Stack.Screen name="DVRInquiry" component={DVRInquiry} />
    </Stack.Navigator>
  );
};

export default Main;
