// components/InvoicePDF.js
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
  },
  companyHeader: {
    marginBottom: 15,
    textAlign: 'center',
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  companyAddress: {
    fontSize: 10,
    marginBottom: 3,
  },
  invoiceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  section: {
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  col: {
    flex: 1,
  },
  label: {
    fontWeight: 'bold',
    marginRight: 5,
  },
  table: { 
    display: "table",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginBottom: 15,
  },
  tableRow: { 
    margin: "auto",
    flexDirection: "row",
  },
  tableColHeader: {
    width: "20%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: '#f0f0f0',
    padding: 5,
    fontSize: 10,
    fontWeight: 'bold',
  },
  tableCol: {
    width: "20%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 5,
    fontSize: 10,
  },
  totals: {
    marginLeft: 'auto',
    width: '40%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    fontSize: 10,
  },
  footer: {
    marginTop: 30,
    fontSize: 10,
    textAlign: 'center',
  },
  thankYou: {
    fontSize: 12,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  accountDetails: {
    marginTop: 15,
    fontSize: 10,
  },
  accountTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
});

// Aahaas Template
const AahaasTemplate = ({ invoice }) => (
  <Page size="A4" style={styles.page}>
    {/* Company Header */}
    <View style={styles.companyHeader}>
      <Image src="/images/logo/aahaas.png" style={{ width: 150, marginBottom: 10, alignSelf: 'center' }} />
      <Text style={styles.companyAddress}>One Galle Face Tower, 2208, 1A Centre Road, Colombo 002</Text>
      <Text style={styles.companyAddress}>Tel: +9411 2352 400 | Web: www.appleholidaysds.com</Text>
    </View>

    {/* Greeting + Notice */}
    <View style={styles.section}>
      <Text style={styles.thankYou}>Dear {invoice.customer?.name || "Customer"}, Thank you for your order</Text>
      <Text>Please find below the receipt for your order</Text>
    </View>

    {/* Order Meta Info */}
    <View style={styles.section}>
      <View style={styles.row}>
        <Text style={styles.label}>Invoice No:</Text>
        <Text>{invoice.id}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Order No:</Text>
        <Text>{invoice.invoice_number}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Order Date:</Text>
        <Text>{new Date(invoice.issue_date).toLocaleDateString()} | {new Date().toLocaleTimeString()}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Payment Type:</Text>
        <Text>
          {invoice.payment_type === "credit" ? "Credit" : "Non-Credit"} | 
          {Number(invoice.balance) <= 0 ? "Full Payment" : "Partial Payment"}
          {invoice.payment_type === "non-credit" && ` &nbsp; ${new Date(invoice.collection_date).toLocaleDateString()}`}
        </Text>
      </View>
    </View>

    {/* Customer Details */}
    <View style={styles.section}>
      <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Customer Details</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Name:</Text>
        <Text>{invoice.customer?.name || "-"}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Address:</Text>
        <Text>{invoice.customer?.address || "-"}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Email:</Text>
        <Text>{invoice.customer?.email || "-"}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Contact:</Text>
        <Text>{invoice.customer?.phone || "-"}</Text>
      </View>
    </View>

    {/* Services / Items */}
    <View style={styles.section}>
      <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Services</Text>
      <View style={styles.table}>
        {/* Table Header */}
        <View style={styles.tableRow}>
          <View style={styles.tableColHeader}><Text>Description</Text></View>
          <View style={styles.tableColHeader}><Text>Unit Fare</Text></View>
          <View style={styles.tableColHeader}><Text>Discount</Text></View>
          <View style={styles.tableColHeader}><Text>Qty</Text></View>
          <View style={styles.tableColHeader}><Text>Amount</Text></View>
        </View>

        {/* Table Rows */}
        {invoice.items?.map((item, index) => (
          <View style={styles.tableRow} key={index}>
            <View style={styles.tableCol}><Text>{item.description}</Text></View>
            <View style={styles.tableCol}><Text>{invoice.currency} {item.price}</Text></View>
            <View style={styles.tableCol}><Text>{item.discount}%</Text></View>
            <View style={styles.tableCol}><Text>{item.quantity}</Text></View>
            <View style={styles.tableCol}>
              <Text>{invoice.currency} {(item.price * item.quantity * (1 - item.discount/100)).toFixed(2)}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>

    {/* Totals */}
    <View style={styles.totals}>
      <View style={styles.totalRow}>
        <Text style={styles.label}>Sub Total:</Text>
        <Text>{invoice.currency} {invoice.sub_total}</Text>
      </View>
      <View style={styles.totalRow}>
        <Text style={styles.label}>Total:</Text>
        <Text>{invoice.currency} {invoice.total_amount}</Text>
      </View>
      <View style={styles.totalRow}>
        <Text style={styles.label}>Amount Received:</Text>
        <Text>{invoice.currency} {invoice.amount_received}</Text>
      </View>
      <View style={styles.totalRow}>
        <Text style={styles.label}>Balance:</Text>
        <Text>{invoice.currency} {invoice.balance}</Text>
      </View>
    </View>

    {/* Account Details */}
    <View style={styles.accountDetails}>
      <Text style={styles.accountTitle}>ACCOUNT DETAILS</Text>
      <View style={styles.row}>
        <Text style={styles.label}>ACCOUNT NAME:</Text>
        <Text>{invoice.account?.account_name || "N/A"}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>ACCOUNT NO:</Text>
        <Text>{invoice.account?.account_no || "N/A"}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>BANK:</Text>
        <Text>{invoice.account?.bank || "N/A"}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>BRANCH:</Text>
        <Text>{invoice.account?.branch || "N/A"}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>IFSC CODE:</Text>
        <Text>{invoice.account?.ifsc_code || "N/A"}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Bank Address:</Text>
        <Text>{invoice.account?.bank_address || "N/A"}</Text>
      </View>
    </View>

    {/* Travel Period */}
    <View style={styles.section}>
      <View style={styles.row}>
        <Text style={styles.label}>Start Date:</Text>
        <Text>{invoice.start_date || "-"}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>End Date:</Text>
        <Text>{invoice.end_date || "-"}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Travel Period:</Text>
        <Text>days</Text>
      </View>
    </View>

    {/* Contact Info */}
    <View style={styles.footer}>
      <Text>Should you have any questions regarding your order, please send an email to info@aahaas.com.</Text>
      <Text>Or contact us at +94 70 722 4227</Text>
    </View>
  </Page>
);

// Apple Holidays Template
const AppleHolidaysTemplate = ({ invoice }) => (
  <Page size="A4" style={styles.page}>
    {/* Company Header */}
    <View style={styles.companyHeader}>
      <Image src="/images/logo/appleholidays_extend.png" style={{ width: 250, marginBottom: 10, alignSelf: 'center' }} />
      <Text style={styles.companyAddress}>One Galle Face Tower, 2208, 1A Centre Road, Colombo 002</Text>
      <Text style={styles.companyAddress}>Tel: 011 2352 400 | Web: www.appleholidaysds.com</Text>
    </View>

    {/* Invoice Title */}
    <View style={styles.header}>
      <Text style={styles.invoiceTitle}>INVOICE</Text>
    </View>

    {/* Invoice Meta and Customer Info */}
    <View style={styles.section}>
      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={styles.label}>To:</Text>
          <Text>{invoice.customer?.name || "N/A"}</Text>
          <Text>{invoice.customer?.address || "N/A"}</Text>
        </View>
        <View style={styles.col}>
          <View style={styles.row}>
            <Text style={styles.label}>Invoice No.</Text>
            <Text>{invoice.invoice_number}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>No.</Text>
            <Text>{invoice.id}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date</Text>
            <Text>{new Date(invoice.issue_date).toLocaleDateString()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Your Ref.</Text>
            <Text>{invoice.your_ref || "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Sales ID</Text>
            <Text>{invoice.sales_id || "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Printed By</Text>
            <Text>{invoice.printed_by || "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Booking No</Text>
            <Text>{invoice.booking_no || "N/A"}</Text>
          </View>
        </View>
      </View>
    </View>

    {/* Items Table */}
    <View style={styles.section}>
      <View style={styles.table}>
        {/* Table Header */}
        <View style={styles.tableRow}>
          <View style={styles.tableColHeader}><Text>Description</Text></View>
          <View style={styles.tableColHeader}><Text>Unit Fare</Text></View>
          <View style={styles.tableColHeader}><Text>Discount</Text></View>
          <View style={styles.tableColHeader}><Text>Qty</Text></View>
          <View style={styles.tableColHeader}><Text>Amount</Text></View>
        </View>

        {/* Table Rows */}
        {invoice.items?.map((item, index) => (
          <View style={styles.tableRow} key={index}>
            <View style={styles.tableCol}><Text>Cost per Adult</Text></View>
            <View style={styles.tableCol}><Text>{invoice.currency} {item.price}</Text></View>
            <View style={styles.tableCol}><Text>{item.discount}%</Text></View>
            <View style={styles.tableCol}><Text>{item.quantity}</Text></View>
            <View style={styles.tableCol}>
              <Text>{invoice.currency} {(item.price * item.quantity * (1 - item.discount/100)).toFixed(2)}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>

    {/* Totals */}
    <View style={styles.totals}>
      <View style={styles.totalRow}>
        <Text style={styles.label}>SUB TOTAL:</Text>
        <Text>{invoice.currency} {invoice.sub_total}</Text>
      </View>
      <View style={styles.totalRow}>
        <Text style={styles.label}>TOTAL:</Text>
        <Text>{invoice.currency} {invoice.total_amount}</Text>
      </View>
      <View style={styles.totalRow}>
        <Text style={styles.label}>AMOUNT RECEIVED:</Text>
        <Text>{invoice.currency} {invoice.amount_received}</Text>
      </View>
      <View style={styles.totalRow}>
        <Text style={styles.label}>BALANCE DUE:</Text>
        <Text>{invoice.currency} {invoice.balance}</Text>
      </View>
    </View>

    {/* Account Details */}
    <View style={styles.accountDetails}>
      <Text style={styles.accountTitle}>ACCOUNT DETAILS</Text>
      <View style={styles.row}>
        <Text style={styles.label}>ACCOUNT NAME:</Text>
        <Text>{invoice.account?.account_name || "N/A"}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>ACCOUNT NO:</Text>
        <Text>{invoice.account?.account_no || "N/A"}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>BANK:</Text>
        <Text>{invoice.account?.bank || "N/A"}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>BRANCH:</Text>
        <Text>{invoice.account?.branch || "N/A"}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>IFSC CODE:</Text>
        <Text>{invoice.account?.ifsc_code || "N/A"}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Bank Address:</Text>
        <Text>{invoice.account?.bank_address || "N/A"}</Text>
      </View>
    </View>

    {/* Payment Instructions / Account Details */}
    <View style={styles.section}>
      {invoice.payment_instructions && (
        <View style={styles.row}>
          <Text>{invoice.payment_instructions}</Text>
        </View>
      )}
      <View style={styles.row}>
        <Text style={styles.label}>Remark:</Text>
        <Text>{invoice.remarks || "N/A"}</Text>
      </View>
    </View>
  </Page>
);

// Sharmila Template
const SharmilaTemplate = ({ invoice }) => (
  <Page size="A4" style={styles.page}>
    {/* Company Header */}
    <View style={styles.companyHeader}>
      <Text style={{...styles.companyName, color: 'red'}}>Sharmila Tours & Travels</Text>
      <Text style={styles.companyAddress}>No: 148, Aluthmawatha Road, Colombo - 15, Sri Lanka</Text>
      <Text style={styles.companyAddress}>Tel: 011 23 52 400 | 011 23 45 800</Text>
      <Text style={styles.companyAddress}>E-mail: fares@sharmilatravels.com</Text>
      <Text style={styles.invoiceTitle}>INVOICE</Text>
    </View>

    {/* Invoice Meta and Customer Info */}
    <View style={styles.section}>
      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={styles.label}>To:</Text>
          <Text>{invoice.customer?.name || "N/A"}</Text>
          <Text>{invoice.customer?.address || "N/A"}</Text>
        </View>
        <View style={styles.col}>
          <View style={styles.row}>
            <Text style={styles.label}>No.</Text>
            <Text>{invoice.invoice_number}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date:</Text>
            <Text>{new Date(invoice.issue_date).toLocaleDateString()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Your Ref.</Text>
            <Text>{invoice.your_ref || "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Sales ID:</Text>
            <Text>{invoice.sales_id || "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Printed By:</Text>
            <Text>{invoice.printed_by || "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Booking ID:</Text>
            <Text>{invoice.booking_id || "N/A"}</Text>
          </View>
        </View>
      </View>
    </View>

    {/* Items Table */}
    <View style={styles.section}>
      <View style={styles.table}>
        {/* Table Header */}
        <View style={styles.tableRow}>
          <View style={{...styles.tableColHeader, backgroundColor: '#343a40', color: 'white'}}><Text>Description</Text></View>
          <View style={{...styles.tableColHeader, backgroundColor: '#343a40', color: 'white'}}><Text>Unit Fare</Text></View>
          <View style={{...styles.tableColHeader, backgroundColor: '#343a40', color: 'white'}}><Text>Discount</Text></View>
          <View style={{...styles.tableColHeader, backgroundColor: '#343a40', color: 'white'}}><Text>Qty</Text></View>
          <View style={{...styles.tableColHeader, backgroundColor: '#343a40', color: 'white'}}><Text>Amount</Text></View>
        </View>

        {/* Table Rows */}
        {invoice.items?.map((item, index) => (
          <View style={styles.tableRow} key={index}>
            <View style={styles.tableCol}><Text>{item.description}</Text></View>
            <View style={styles.tableCol}><Text>{invoice.currency} {item.price}</Text></View>
            <View style={styles.tableCol}><Text>{item.discount}%</Text></View>
            <View style={styles.tableCol}><Text>{item.quantity}</Text></View>
            <View style={styles.tableCol}>
              <Text>{invoice.currency} {(item.price * item.quantity * (1 - item.discount/100)).toFixed(2)}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>

    {/* Payment Instructions */}
    {invoice.payment_instructions && (
      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>Payment Instructions:</Text>
          <Text>{invoice.payment_instructions}</Text>
        </View>
      </View>
    )}

    {/* Totals */}
    <View style={styles.totals}>
      <View style={styles.totalRow}>
        <Text style={styles.label}>Sub Total:</Text>
        <Text>{invoice.currency} {Number(invoice.sub_total).toFixed(2)}</Text>
      </View>
      {invoice.gst && (
        <View style={styles.totalRow}>
          <Text style={styles.label}>GST:</Text>
          <Text>{invoice.currency} {Number(invoice.gst).toFixed(2)}</Text>
        </View>
      )}
      <View style={styles.totalRow}>
        <Text style={styles.label}>Total:</Text>
        <Text>{invoice.currency} {Number(invoice.total_amount).toFixed(2)}</Text>
      </View>
      <View style={styles.totalRow}>
        <Text style={styles.label}>Amount Received:</Text>
        <Text>{invoice.currency} {Number(invoice.amount_received).toFixed(2)}</Text>
      </View>
      <View style={styles.totalRow}>
        <Text style={styles.label}>Balance:</Text>
        <Text>{invoice.currency} {Number(invoice.balance).toFixed(2)}</Text>
      </View>
    </View>

    {/* Account Details */}
    <View style={styles.accountDetails}>
      <Text style={styles.accountTitle}>ACCOUNT DETAILS</Text>
      <View style={styles.row}>
        <Text style={styles.label}>ACCOUNT NAME:</Text>
        <Text>{invoice.account?.account_name || "N/A"}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>ACCOUNT NO:</Text>
        <Text>{invoice.account?.account_no || "N/A"}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>BANK:</Text>
        <Text>{invoice.account?.bank || "N/A"}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>BRANCH:</Text>
        <Text>{invoice.account?.branch || "N/A"}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>IFSC CODE:</Text>
        <Text>{invoice.account?.ifsc_code || "N/A"}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Bank Address:</Text>
        <Text>{invoice.account?.bank_address || "N/A"}</Text>
      </View>
    </View>

    {/* Bottom left: Staff and Remark */}
    <View style={styles.section}>
      {invoice.staff && (
        <View style={styles.row}>
          <Text style={styles.label}>Staff:</Text>
          <Text>{invoice.staff}</Text>
        </View>
      )}
      <View style={styles.row}>
        <Text style={styles.label}>Remark:</Text>
        <Text>{invoice.remarks || "N/A"}</Text>
      </View>
    </View>
  </Page>
);

export const InvoicePDF = ({ invoice, company = "aahaas" }) => {
  // Select template based on company
  if (company === "appleholidays") {
    return <AppleHolidaysTemplate invoice={invoice} />;
  } else if (company === "sharmila") {
    return <SharmilaTemplate invoice={invoice} />;
  } else {
    return <AahaasTemplate invoice={invoice} />;
  }
};