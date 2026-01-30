import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import axios from 'axios';
import {BASEURL} from '../utils/BaseUrl';

// Async thunk for fetching approved data
export const fetchApprovedData = createAsyncThunk(
  'approved/fetchData',
  async ({fromDate, toDate, reference, name}, {rejectWithValue}) => {
    try {
      const formData = new FormData();
      if (fromDate) formData.append('from_date', fromDate);
      if (toDate) formData.append('to_date', toDate);
      if (reference) formData.append('ref', reference);
      if (name) formData.append('name', name);

      const res = await fetch(`${BASEURL}dash_approved.php`, {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
        },
      });

      const data = await res.json();
      console.log('Approved Data API Response:', data);
      return data;
    } catch (error) {
      console.log('Approved Data API Error:', error);
      return rejectWithValue(error.message);
    }
  },
);

const ApprovedSlice = createSlice({
  name: 'ApprovedData',
  initialState: {
    approvalCounts: null,
    quotationData: [],
    salesOrderData: [],
    purchaseOrderData: [],
    grnData: [],
    poInvoiceData: [],
    voucherData: [],
    deliveryData: [],
    invoiceData: [],
    electricalJobCards: [],
    mechanicalJobCards: [],
    locationTransferData: [],
    adjustmentData: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearApprovedData: state => {
      state.approvalCounts = null;
      state.quotationData = [];
      state.salesOrderData = [];
      state.purchaseOrderData = [];
      state.grnData = [];
      state.poInvoiceData = [];
      state.voucherData = [];
      state.deliveryData = [];
      state.invoiceData = [];
      state.electricalJobCards = [];
      state.mechanicalJobCards = [];
      state.locationTransferData = [];
      state.adjustmentData = [];
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchApprovedData.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchApprovedData.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload;

        state.approvalCounts = data.approval_data || null;
        state.quotationData = data.data_unapprove_quote || [];
        state.salesOrderData = data.data_unapprove_order || [];
        state.purchaseOrderData = data.data_unapprove_po_order || [];
        state.grnData = data.data_unapprove_grn_order || [];
        state.poInvoiceData = data.data_unapprove_po_invoice || [];
        state.voucherData = data.data_unapprove_voucher || [];
        state.deliveryData = data.data_unapprove_deliveries || [];
        state.invoiceData = data.data_unapprove_invoice || [];
        state.electricalJobCards = data.data_electrical_job_cards || [];
        state.mechanicalJobCards = data.data_Mechnical_job_cards || [];
        state.locationTransferData = data.data_unapprove_loc_transfer || [];
        state.adjustmentData = data.data_unapprove_adjustment || [];
      })
      .addCase(fetchApprovedData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {clearApprovedData} = ApprovedSlice.actions;
export default ApprovedSlice.reducer;
