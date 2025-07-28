import React, { useContext } from 'react'

import Invoice_appleholidays from './create_invoice/appleholidays/invoice_appleholidays';
import Invoice_shirmila from './create_invoice/shirmila_travels/invoice_shirmila';
import Invoice_aahaas from './create_invoice/aahaas/Invoice_aahaas';
import { CompanyContext } from '../../../contentApi/CompanyProvider';
import ReportsSales from '../../../pages/reports-sales';
import Invoice_List_appleholidays from './list_invoice/Invoice_List_appleholidays';
import Invoice_List_shirmila from './list_invoice/Invoice_List_shirmila';
import Invoice_List_aahaas from './list_invoice/Invoice_List_aahaas';
import Bank_accounts from '../bank_accounts/Bank_accounts';

const Invoice_preview = ({ target }) => {
    const { selectedCompany } = useContext(CompanyContext);

  if (target === "main_invoice_view") {
    switch (selectedCompany) {
      case "appleholidays":
        return <Invoice_List_appleholidays />;
      case "shirmila":
        return <Invoice_List_shirmila />;
      case "aahaas":
        return <Invoice_List_aahaas />;
      default:
        return <Invoice_List_aahaas />;
    }
  }

  if (target === "invoice_create") {
   switch (selectedCompany) {
      case "appleholidays":
        return <Invoice_appleholidays />;
      case "shirmila":
        return <Invoice_shirmila />;
      case "aahaas":
        return <Invoice_aahaas />;
      default:
        return <Invoice_aahaas />;
    }
  }

  if (target === "invoice_bank_accounts") {
   switch (selectedCompany) {
      case "appleholidays":
        return <Bank_accounts />;
      case "shirmila":
        return <Bank_accounts />;
      case "aahaas":
        return <Bank_accounts />;
      default:
        return <Bank_accounts />;
    }
  }

  return <div>Invalid target</div>;
}

export default Invoice_preview