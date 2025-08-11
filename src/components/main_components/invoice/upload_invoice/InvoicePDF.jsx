// components/InvoicePDF.js
import { Page, Text, View, Document, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 30,
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
  },
  table: { 
    display: "table",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
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
  },
  tableCol: {
    width: "20%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 5,
  },
  totalRow: {
    marginTop: 10,
    textAlign: 'right',
  }
});

export const InvoicePDF = ({ invoice }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text>Sharmila Tours & Travels</Text>
        <Text>No: 148, Aluthmawatha Road, Colombo - 15, Sri Lanka</Text>
        <Text>Tel: 011 23 52 400 | 011 23 45 800</Text>
        <Text>INVOICE</Text>
      </View>

      <View style={{ marginBottom: 20 }}>
        <Text>Invoice #: {invoice.invoice_number}</Text>
        <Text>Date: {new Date(invoice.issue_date).toLocaleDateString()}</Text>
        <Text>Customer: {invoice.customer?.name || 'N/A'}</Text>
      </View>

      <View style={styles.table}>
        {/* Table Header */}
        <View style={styles.tableRow}>
          <View style={styles.tableColHeader}><Text>Description</Text></View>
          <View style={styles.tableColHeader}><Text>Price</Text></View>
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

      <View style={styles.totalRow}>
        <Text>Sub Total: {invoice.currency} {invoice.sub_total}</Text>
        <Text>Total: {invoice.currency} {invoice.total_amount}</Text>
        <Text>Amount Received: {invoice.currency} {invoice.amount_received}</Text>
        <Text>Balance: {invoice.currency} {invoice.balance}</Text>
      </View>

      <View style={{ marginTop: 30 }}>
        <Text>Remarks: {invoice.remarks}</Text>
      </View>
    </Page>
  </Document>
);

