import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import QRCode from "qrcode";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    padding: 0,
    fontFamily: "Helvetica",
  },
  header: {
    backgroundColor: "#1e3a5f",
    padding: "24 28",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  badge: {
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "bold",
    padding: "4 10",
    borderRadius: 12,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  body: {
    padding: "28 28 20",
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  tierName: {
    fontSize: 13,
    color: "#3b82f6",
    fontWeight: "bold",
    marginBottom: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 8,
    fontSize: 11,
  },
  detailLabel: {
    color: "#6b7280",
    width: 80,
  },
  detailValue: {
    color: "#111827",
    flex: 1,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    marginVertical: 16,
  },
  qrSection: {
    alignItems: "center",
    padding: "20 0 8",
  },
  qrLabel: {
    fontSize: 10,
    color: "#6b7280",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 28,
    right: 28,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#9ca3af",
  },
  orderId: {
    fontSize: 9,
    color: "#9ca3af",
    marginTop: 8,
    fontFamily: "Helvetica-Oblique",
  },
  warning: {
    fontSize: 9,
    color: "#f59e0b",
    marginTop: 4,
    textAlign: "center",
  },
});

async function generateQRDataUrl(token: string): Promise<string> {
  return QRCode.toDataURL(token, { width: 160, margin: 1, color: { dark: "#111827", light: "#ffffff" } });
}

interface TicketPdfProps {
  eventName: string;
  venue: string;
  startsAt: string;
  tierName: string;
  buyerName: string;
  buyerEmail: string;
  token: string;
  orderId: string;
  ticketId: string;
}

export async function TicketPdfDocument({
  eventName,
  venue,
  startsAt,
  tierName,
  buyerName,
  buyerEmail,
  token,
  orderId,
  ticketId,
}: TicketPdfProps) {
  const qrDataUrl = await generateQRDataUrl(token);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.brand}>Ingresso MZ</Text>
          <Text style={styles.badge}>Ingresso Digital</Text>
        </View>

        {/* Body */}
        <View style={styles.body}>
          <Text style={styles.eventTitle}>{eventName}</Text>
          <Text style={styles.tierName}>{tierName}</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Local:</Text>
            <Text style={styles.detailValue}>{venue}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Data:</Text>
            <Text style={styles.detailValue}>{startsAt}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Titular:</Text>
            <Text style={styles.detailValue}>{buyerName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email:</Text>
            <Text style={styles.detailValue}>{buyerEmail}</Text>
          </View>

          <View style={styles.divider} />

          {/* QR Code */}
          <View style={styles.qrSection}>
            <Text style={styles.qrLabel}>Apresente este QR code na entrada</Text>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={qrDataUrl} style={{ width: 160, height: 160 }} />
            <Text style={styles.orderId}>Pedido #{orderId} · Ingresso #{ticketId}</Text>
            <Text style={styles.warning}>⚠ Nao partilhe este QR code com terceiros</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>ingresso-mz.vercel.app</Text>
          <Text>Este ingresso e pessoal e intransferrivel.</Text>
        </View>
      </Page>
    </Document>
  );
}
