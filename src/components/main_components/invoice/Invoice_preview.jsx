import React, { useContext } from 'react'

import Invoice_appleholidays from './create_invoice/appleholidays/invoice_appleholidays';
import Invoice_shirmila from './create_invoice/shirmila_travels/invoice_shirmila';
import Invoice_aahaas from './create_invoice/aahaas/Invoice_aahaas';
import { CompanyContext } from '../../../contentApi/CompanyProvider';
import ReportsSales from '../../../pages/reports-sales';

const Invoice_preview = ({ target }) => {
    const { selectedCompany } = useContext(CompanyContext);

  if (target === "main_invoice_view") {
    switch (selectedCompany) {
      case "appleholidays":
        return <Invoice_appleholidays />;
      case "shirmila":
        return <Invoice_shirmila />;
      case "aahaas":
      default:
        return <Invoice_aahaas />;
    }
  }

  if (target === "invoice_create") {
   switch (selectedCompany) {
      case "appleholidays":
        return <Invoice_appleholidays />;
      case "shirmila":
        return <Invoice_shirmila />;
      case "aahaas":
      default:
        return <Invoice_aahaas />;
    }
  }

  return <div>Invalid target</div>;
}

export default Invoice_preview