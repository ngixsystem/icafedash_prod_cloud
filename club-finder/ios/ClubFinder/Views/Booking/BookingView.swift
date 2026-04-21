import SwiftUI

struct BookingView: View {
    @EnvironmentObject var auth: AuthService
    @State private var bookings: [MyBooking] = []
    @State private var isLoading = true
    @State private var cancelBookingId: Int?
    @State private var cancelReason = ""

    private let accent = Color(hex: "#FF7800")

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().tint(accent).padding(.top, 60)
            } else if bookings.isEmpty {
                VStack(spacing: 12) {
                    Image(systemName: "calendar.badge.exclamationmark")
                        .font(.system(size: 40))
                        .foregroundColor(.gray)
                    Text("Нет бронирований")
                        .foregroundColor(.gray)
                }
                .padding(.top, 60)
            } else {
                LazyVStack(spacing: 10) {
                    ForEach(bookings) { booking in
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                VStack(alignment: .leading, spacing: 3) {
                                    Text(booking.club_name)
                                        .font(.system(size: 15, weight: .bold))
                                        .foregroundColor(.white)
                                    Text(booking.zone_name)
                                        .font(.system(size: 13))
                                        .foregroundColor(.gray)
                                }
                                Spacer()
                                StatusBadge(status: booking.status)
                            }

                            HStack(spacing: 12) {
                                if let start = booking.booking_start_at {
                                    Label(formatDate(start), systemImage: "clock")
                                        .font(.system(size: 12))
                                        .foregroundColor(.gray)
                                }
                                if let duration = booking.duration {
                                    Label(duration, systemImage: "hourglass")
                                        .font(.system(size: 12))
                                        .foregroundColor(.gray)
                                }
                            }

                            if !booking.pc_names.isEmpty {
                                Text("ПК: \(booking.pc_names.joined(separator: ", "))")
                                    .font(.system(size: 12))
                                    .foregroundColor(.gray)
                            }

                            if let reason = booking.cancellation_reason, !reason.isEmpty {
                                Text("Причина: \(reason)")
                                    .font(.system(size: 12))
                                    .foregroundColor(.red.opacity(0.8))
                            }

                            // Chat link
                            if let chatUrl = booking.chat_url, let url = URL(string: chatUrl) {
                                Link(destination: url) {
                                    HStack(spacing: 4) {
                                        Image(systemName: "bubble.left.fill")
                                        Text("Чат")
                                    }
                                    .font(.system(size: 12, weight: .semibold))
                                    .foregroundColor(accent)
                                }
                            }

                            // Cancel button
                            if booking.status == "pending" || booking.status == "approved" {
                                Button {
                                    cancelBookingId = booking.id
                                } label: {
                                    Text("Отменить")
                                        .font(.system(size: 13, weight: .semibold))
                                        .foregroundColor(.red)
                                        .padding(.vertical, 6)
                                        .padding(.horizontal, 12)
                                        .background(Color.red.opacity(0.1))
                                        .cornerRadius(8)
                                }
                            }
                        }
                        .padding(14)
                        .background(Color.white.opacity(0.05))
                        .cornerRadius(14)
                    }
                }
                .padding(.horizontal)
            }
        }
        .background(.clear)
        .navigationTitle("Бронирования")
        .navigationBarTitleDisplayMode(.inline)
        .alert("Отмена бронирования", isPresented: Binding(
            get: { cancelBookingId != nil },
            set: { if !$0 { cancelBookingId = nil } }
        )) {
            TextField("Причина", text: $cancelReason)
            Button("Отменить бронь", role: .destructive) {
                Task {
                    guard let id = cancelBookingId, let token = auth.token else { return }
                    _ = try? await APIService.shared.cancelBooking(id: id, reason: cancelReason, token: token)
                    cancelBookingId = nil
                    cancelReason = ""
                    await loadBookings()
                }
            }
            Button("Назад", role: .cancel) {}
        }
        .task {
            await loadBookings()
        }
        .refreshable {
            await loadBookings()
        }
    }

    func loadBookings() async {
        guard let token = auth.token else { isLoading = false; return }
        bookings = (try? await APIService.shared.getMyBookings(token: token)) ?? []
        isLoading = false
    }

    func formatDate(_ iso: String) -> String {
        let fmt = ISO8601DateFormatter()
        fmt.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        guard let date = fmt.date(from: iso) ?? ISO8601DateFormatter().date(from: iso) else { return iso }
        let df = DateFormatter()
        df.dateFormat = "dd.MM HH:mm"
        return df.string(from: date)
    }
}

struct StatusBadge: View {
    let status: String

    private var color: Color {
        switch status {
        case "approved": return .green
        case "pending": return .yellow
        case "rejected", "cancelled": return .red
        case "completed": return Color(hex: "#00B4D8")
        default: return .gray
        }
    }

    private var label: String {
        switch status {
        case "approved": return "Подтверждено"
        case "pending": return "Ожидание"
        case "rejected": return "Отклонено"
        case "cancelled": return "Отменено"
        case "completed": return "Завершено"
        default: return status
        }
    }

    var body: some View {
        Text(label)
            .font(.system(size: 10, weight: .semibold))
            .foregroundColor(color)
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(color.opacity(0.15))
            .cornerRadius(6)
    }
}
