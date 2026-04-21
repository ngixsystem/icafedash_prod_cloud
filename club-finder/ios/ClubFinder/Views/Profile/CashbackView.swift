import SwiftUI
import CoreImage.CIFilterBuiltins

struct CashbackView: View {
    @EnvironmentObject var auth: AuthService
    @State private var cashback: CashbackResponse?
    @State private var isLoading = true

    private let accent = Color(hex: "#FF7800")

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().tint(accent).padding(.top, 60)
            } else if let cashback {
                VStack(spacing: 20) {
                    // QR Code
                    if let qrImage = generateQR(from: cashback.qr_payload) {
                        Image(uiImage: qrImage)
                            .interpolation(.none)
                            .resizable()
                            .scaledToFit()
                            .frame(width: 200, height: 200)
                            .padding(16)
                            .background(Color.white)
                            .cornerRadius(16)
                    }

                    // Balance
                    VStack(spacing: 4) {
                        Text("Баланс кэшбэка")
                            .font(.system(size: 14))
                            .foregroundColor(.gray)
                        Text("\(Int(cashback.total_cashback)) сум")
                            .font(.system(size: 28, weight: .bold))
                            .foregroundColor(accent)
                    }

                    // Transactions
                    if !cashback.transactions.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("История")
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundColor(.white)

                            ForEach(cashback.transactions) { tx in
                                HStack {
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(tx.club_name)
                                            .font(.system(size: 14, weight: .semibold))
                                            .foregroundColor(.white)
                                        Text(tx.note)
                                            .font(.system(size: 12))
                                            .foregroundColor(.gray)
                                    }
                                    Spacer()
                                    VStack(alignment: .trailing, spacing: 2) {
                                        Text("+\(Int(tx.cashback_amount)) сум")
                                            .font(.system(size: 14, weight: .bold))
                                            .foregroundColor(.green)
                                        Text("\(Int(tx.cashback_percent))%")
                                            .font(.system(size: 11))
                                            .foregroundColor(.gray)
                                    }
                                }
                                .padding(12)
                                .background(Color.white.opacity(0.05))
                                .cornerRadius(12)
                            }
                        }
                    }
                }
                .padding(.horizontal)
            } else {
                Text("Кэшбэк не доступен")
                    .foregroundColor(.gray)
                    .padding(.top, 60)
            }
        }
        .background(.clear)
        .navigationTitle("Кэшбэк")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            guard let token = auth.token else { isLoading = false; return }
            cashback = try? await APIService.shared.getCashback(token: token)
            isLoading = false
        }
    }

    func generateQR(from string: String) -> UIImage? {
        let context = CIContext()
        let filter = CIFilter.qrCodeGenerator()
        filter.message = Data(string.utf8)
        filter.correctionLevel = "M"
        guard let output = filter.outputImage else { return nil }
        let scaled = output.transformed(by: CGAffineTransform(scaleX: 10, y: 10))
        guard let cgImage = context.createCGImage(scaled, from: scaled.extent) else { return nil }
        return UIImage(cgImage: cgImage)
    }
}
