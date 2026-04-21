import SwiftUI

// MARK: - Bebas Neue helper
extension Font {
    static func bebas(_ size: CGFloat) -> Font {
        .custom("BebasNeue-Regular", size: size)
    }
}

struct ClubDetailView: View {
    let clubId: Int
    @EnvironmentObject var auth: AuthService
    @State private var club: Club?
    @State private var reviews: [ClubReview] = []
    @State private var isLoading = true
    @State private var selectedPhotoIndex = 0
    @State private var showReviewSheet = false
    @State private var reviewText = ""
    @State private var reviewRating = 5
    @State private var bookingZone: Zone?
    @State private var showBooking = false

    private let accent = Color(hex: "#FF7800")

    var body: some View {
        ZStack(alignment: .bottom) {
            ScrollView {
                if isLoading {
                    ProgressView().tint(accent).padding(.top, 80)
                } else if let club {
                    VStack(alignment: .leading, spacing: 0) {
                        photoCarousel(club: club)
                        contentBody(club: club)
                    }
                }
            }
            .background(Color(hex: "#0B0D12"))

            // Fixed bottom button
            if !isLoading, let club, auth.isLoggedIn,
               let zones = club.zones, !zones.isEmpty {
                bookButton(club: club, zones: zones)
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showReviewSheet) {
            ReviewSheet(clubId: clubId, rating: $reviewRating, text: $reviewText) {
                await loadReviews()
                showReviewSheet = false
            }
            .presentationDetents([.medium])
        }
        .sheet(item: $bookingZone) { zone in
            if let club {
                ClubBookingSheet(club: club, initialZone: zone)
                    .environmentObject(auth)
            }
        }
        .task { await loadData() }
    }

    // MARK: - Photo carousel

    private func photoCarousel(club: Club) -> some View {
        let allPhotos: [String] = {
            var arr: [String] = []
            if let main = club.main_photo_url, !main.isEmpty { arr.append(main) }
            if let extra = club.photos { arr.append(contentsOf: extra.filter { !$0.isEmpty }) }
            return Array(NSOrderedSet(array: arr) as? [String] ?? arr)
        }()

        return Group {
            if allPhotos.isEmpty {
                Rectangle()
                    .fill(Color(hex: "#1a1b1f"))
                    .frame(height: 220)
            } else {
                TabView(selection: $selectedPhotoIndex) {
                    ForEach(Array(allPhotos.enumerated()), id: \.offset) { idx, photo in
                        let url = photo.hasPrefix("http") ? URL(string: photo) : URL(string: APIService.shared.baseHost + photo)
                        AsyncImage(url: url) { phase in
                            switch phase {
                            case .success(let img): img.resizable().scaledToFill()
                            default: Color(hex: "#1a1b1f")
                            }
                        }
                        .clipped()
                        .tag(idx)
                    }
                }
                .tabViewStyle(.page(indexDisplayMode: .automatic))
                .frame(height: 220)
            }
        }
    }

    // MARK: - Main content

    private func contentBody(club: Club) -> some View {
        VStack(alignment: .leading, spacing: 24) {
            // Address + status chips
            headerInfo(club: club)

            // Zones
            if let zones = club.zones, !zones.isEmpty {
                VStack(alignment: .leading, spacing: 12) {
                    sectionTitle("Зоны")
                    ForEach(zones) { zone in
                        ZoneCard(zone: zone, accent: accent) {
                            bookingZone = zone
                        }
                    }
                }
            }

            // Tariffs
            if let tariffs = club.tariffs, !tariffs.isEmpty {
                VStack(alignment: .leading, spacing: 12) {
                    sectionTitle("Тарифы")
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                        ForEach(tariffs) { tariff in
                            TariffCard(tariff: tariff, accent: accent)
                        }
                    }
                }
            }

            // Reviews
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    sectionTitle("Отзывы")
                    Spacer()
                    if auth.isLoggedIn {
                        Button("Оставить отзыв") { showReviewSheet = true }
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(.white)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 8)
                            .background(Color(hex: "#1E1F22"))
                            .cornerRadius(10)
                            .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color(hex: "#2F3136"), lineWidth: 1))
                    }
                }

                if reviews.isEmpty {
                    Text("Нет отзывов").font(.system(size: 14)).foregroundColor(.gray)
                } else {
                    ForEach(reviews) { review in
                        ReviewCard(review: review, accent: accent)
                    }
                }
            }

            // Bottom padding for fixed button
            Spacer().frame(height: 80)
        }
        .padding(.horizontal, 16)
        .padding(.top, 20)
        .padding(.bottom, 8)
    }

    // MARK: - Header info row

    private func headerInfo(club: Club) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            // Address
            HStack(spacing: 5) {
                Image(systemName: "mappin.circle.fill")
                    .font(.system(size: 13))
                    .foregroundColor(accent)
                Text(club.address)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(Color(hex: "#a5adba"))
                    .lineLimit(1)
            }

            // Status chips row
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    StatusChip(
                        icon: "circle.fill",
                        text: club.isOpen ? "Открыто" : "Закрыто",
                        color: club.isOpen ? Color(hex: "#57F287") : Color(hex: "#ED4245"),
                        filled: true
                    )
                    StatusChip(
                        icon: "desktopcomputer",
                        text: "\(club.pcsFree) свободно",
                        color: .white,
                        filled: false
                    )
                    if let hours = club.working_hours {
                        StatusChip(icon: "wifi", text: "1 Гбит/с", color: .white, filled: false)
                    }
                    if let lat = club.lat, let lng = club.lng, lat != 0, lng != 0 {
                        StatusChip(icon: "location.fill", text: "Маршрут", color: .white, filled: false)
                    }
                }
            }
        }
    }

    // MARK: - Helpers

    private func sectionTitle(_ text: String) -> some View {
        Text(text)
            .font(.bebas(32))
            .foregroundColor(.white)
    }

    private func bookButton(club: Club, zones: [Zone]) -> some View {
        Button {
            bookingZone = zones.first
        } label: {
            Text("Забронировать место")
                .font(.bebas(20))
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(accent)
                .cornerRadius(14)
        }
        .padding(.horizontal, 16)
        .padding(.bottom, 12)
        .background(
            LinearGradient(
                colors: [Color(hex: "#0B0D12"), Color(hex: "#0B0D12").opacity(0)],
                startPoint: .bottom,
                endPoint: .top
            )
            .frame(height: 100)
            .ignoresSafeArea()
        )
    }

    // MARK: - Data loading

    func loadData() async {
        do {
            async let clubData = APIService.shared.getClub(id: clubId)
            async let reviewsData = APIService.shared.getClubReviews(id: clubId)
            club = try await clubData
            reviews = try await reviewsData
        } catch {
            print("ClubDetail error: \(error)")
        }
        isLoading = false
    }

    func loadReviews() async {
        reviews = (try? await APIService.shared.getClubReviews(id: clubId)) ?? reviews
    }
}

// MARK: - Status chip

private struct StatusChip: View {
    let icon: String
    let text: String
    let color: Color
    let filled: Bool

    var body: some View {
        HStack(spacing: 5) {
            Image(systemName: icon)
                .font(.system(size: 10, weight: .semibold))
                .foregroundColor(color)
            Text(text)
                .font(.system(size: 13, weight: .semibold))
                .foregroundColor(color)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 7)
        .background(
            filled
                ? color.opacity(0.15)
                : Color(hex: "#1E1F22")
        )
        .cornerRadius(20)
        .overlay(
            Capsule()
                .stroke(filled ? color.opacity(0.4) : Color(hex: "#2F3136"), lineWidth: 1)
        )
    }
}

// MARK: - Zone Card

private struct ZoneCard: View {
    let zone: Zone
    let accent: Color
    let onBook: () -> Void

    private var fraction: Double {
        guard zone.capacityInt > 0 else { return 0 }
        return Double(zone.pcsFreeInt) / Double(zone.capacityInt)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(zone.name.uppercased())
                        .font(.bebas(18))
                        .foregroundColor(accent)
                    if let price = zone.price, !price.isEmpty {
                        Text(price.uppercased())
                            .font(.bebas(22))
                            .foregroundColor(.white)
                    }
                    if let specs = zone.specs, !specs.isEmpty {
                        Text(specs)
                            .font(.system(size: 12))
                            .foregroundColor(Color(hex: "#a5adba"))
                    }
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 2) {
                    Text("\(zone.pcsFreeInt) свободно из \(zone.capacityInt) ПК")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(Color(hex: "#57F287"))
                    Button(action: onBook) {
                        Text("Забронировать")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundColor(accent)
                    }
                    .padding(.top, 4)
                }
            }

            // Progress bar
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 3)
                        .fill(Color.white.opacity(0.08))
                        .frame(height: 4)
                    RoundedRectangle(cornerRadius: 3)
                        .fill(fraction > 0.5 ? Color(hex: "#57F287") : fraction > 0.2 ? Color(hex: "#FEE75C") : Color(hex: "#ED4245"))
                        .frame(width: geo.size.width * fraction, height: 4)
                }
            }
            .frame(height: 4)
        }
        .padding(14)
        .background(Color(hex: "#16171C"))
        .cornerRadius(14)
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color(hex: "#2F3136"), lineWidth: 1))
    }
}

// MARK: - Tariff Card

private struct TariffCard: View {
    let tariff: Tariff
    let accent: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 5) {
                Image(systemName: "clock")
                    .font(.system(size: 11))
                    .foregroundColor(Color(hex: "#a5adba"))
                Text(tariff.duration)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(Color(hex: "#a5adba"))
                    .lineLimit(1)
            }
            Text(tariff.priceString.uppercased())
                .font(.bebas(22))
                .foregroundColor(accent)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(Color(hex: "#16171C"))
        .cornerRadius(14)
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color(hex: "#2F3136"), lineWidth: 1))
    }
}

// MARK: - Review Card

private struct ReviewCard: View {
    let review: ClubReview
    let accent: Color
    @State private var isExpanded = false

    private static let isoFull: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()
    private static let isoShort = ISO8601DateFormatter()
    private static let display: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "dd.MM.yyyy, HH:mm"
        return f
    }()

    private var formattedDate: String {
        guard let raw = review.created_at else { return "" }
        guard let date = Self.isoFull.date(from: raw) ?? Self.isoShort.date(from: raw) else { return raw }
        return Self.display.string(from: date)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(review.username)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.white)
                Spacer()
                Text(formattedDate)
                    .font(.system(size: 11))
                    .foregroundColor(Color(hex: "#5c6068"))
            }

            HStack(spacing: 3) {
                ForEach(1...5, id: \.self) { star in
                    Image(systemName: star <= review.rating ? "star.fill" : "star")
                        .font(.system(size: 11))
                        .foregroundColor(star <= review.rating ? accent : Color(hex: "#2F3136"))
                }
                Text("\(review.rating)/5")
                    .font(.system(size: 11))
                    .foregroundColor(Color(hex: "#5c6068"))
            }

            Text(review.text)
                .font(.system(size: 13))
                .foregroundColor(Color(hex: "#a5adba"))
                .lineLimit(isExpanded ? nil : 2)

            if review.text.count > 80 {
                Button {
                    withAnimation(.easeInOut(duration: 0.2)) { isExpanded.toggle() }
                } label: {
                    HStack(spacing: 3) {
                        Text(isExpanded ? "Свернуть" : "Развернуть")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundColor(accent)
                        Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                            .font(.system(size: 10, weight: .semibold))
                            .foregroundColor(accent)
                    }
                }
            }
        }
        .padding(14)
        .background(Color(hex: "#16171C"))
        .cornerRadius(14)
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color(hex: "#2F3136"), lineWidth: 1))
    }
}

// MARK: - PC Cell

private struct PCCell: View {
    let pc: ZonePCItem
    let isSelected: Bool
    let accent: Color
    let onTap: () -> Void

    private var statusColor: Color {
        if isSelected { return accent }
        switch pc.status {
        case "free":    return Color(hex: "#57F287")
        case "busy":    return Color(hex: "#ED4245")
        default:        return Color(hex: "#5c6068")
        }
    }

    private var icon: String {
        if isSelected           { return "checkmark.circle.fill" }
        if pc.isFree            { return "desktopcomputer" }
        if pc.status == "busy"  { return "lock.fill" }
        return "desktopcomputer.slash"
    }

    var body: some View {
        Button(action: onTap) {
            VStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.system(size: 18))
                    .foregroundColor(statusColor)
                Text(pc.name)
                    .font(.system(size: 10, weight: .bold, design: .rounded))
                    .foregroundColor(isSelected ? accent : .white)
                    .lineLimit(1)
                if pc.isBusy, let m = pc.member, !m.isEmpty {
                    Text(m)
                        .font(.system(size: 8))
                        .foregroundColor(Color(hex: "#ED4245").opacity(0.8))
                        .lineLimit(1)
                } else {
                    Text(pc.isFree ? "Свободно" : (pc.status == "busy" ? "Занято" : "Офлайн"))
                        .font(.system(size: 8))
                        .foregroundColor(statusColor.opacity(0.8))
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 10)
            .background(isSelected ? accent.opacity(0.2) : statusColor.opacity(0.07))
            .cornerRadius(10)
            .overlay(RoundedRectangle(cornerRadius: 10).stroke(statusColor.opacity(isSelected ? 0.8 : 0.3), lineWidth: 1))
        }
        .disabled(!pc.isFree && !isSelected)
        .opacity(pc.status == "offline" ? 0.4 : 1)
        .buttonStyle(.plain)
    }
}

// MARK: - Booking Sheet

struct ClubBookingSheet: View {
    let club: Club
    let initialZone: Zone
    @EnvironmentObject var auth: AuthService
    @Environment(\.dismiss) private var dismiss

    @State private var selectedZone: Zone
    @State private var zonePCs: [ZonePCItem] = []
    @State private var loadingPCs = false
    @State private var selectedPCNames: Set<String> = []
    @State private var pcCount = 1
    @State private var clientName: String
    @State private var phone = ""
    @State private var duration = "1 час"
    @State private var startDate = Date()
    @State private var isSubmitting = false
    @State private var errorMsg: String?
    @State private var success = false

    private var useFallback: Bool { !loadingPCs && zonePCs.isEmpty }
    private let accent = Color(hex: "#FF7800")
    private let durations = ["30 минут", "1 час", "2 часа", "3 часа", "4 часа", "5 часов", "6 часов"]

    init(club: Club, initialZone: Zone) {
        self.club = club
        self.initialZone = initialZone
        _selectedZone = State(initialValue: initialZone)
        _clientName = State(initialValue: "")
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    if success {
                        successView
                    } else {
                        if let zones = club.zones, zones.count > 1 {
                            VStack(alignment: .leading, spacing: 8) {
                                sheetLabel("ЗОНА")
                                ScrollView(.horizontal, showsIndicators: false) {
                                    HStack(spacing: 8) {
                                        ForEach(zones) { zone in
                                            Button {
                                                selectedZone = zone
                                                selectedPCNames.removeAll()
                                                Task { await loadPCs() }
                                            } label: {
                                                Text(zone.name)
                                                    .font(.system(size: 13, weight: .semibold))
                                                    .foregroundColor(selectedZone.id == zone.id ? .white : Color(hex: "#a5adba"))
                                                    .padding(.horizontal, 14).padding(.vertical, 8)
                                                    .background(selectedZone.id == zone.id ? accent : Color(hex: "#1E1F22"))
                                                    .cornerRadius(8)
                                                    .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color(hex: "#2F3136"), lineWidth: 1))
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        VStack(alignment: .leading, spacing: 8) {
                            if loadingPCs {
                                sheetLabel("ЗАГРУЗКА ПК...")
                                ProgressView().tint(accent).frame(maxWidth: .infinity).padding(.vertical, 20)
                            } else if useFallback {
                                sheetLabel("КОЛИЧЕСТВО ПК")
                                HStack(spacing: 16) {
                                    Button { if pcCount > 1 { pcCount -= 1 } } label: {
                                        Image(systemName: "minus.circle.fill").font(.system(size: 28)).foregroundColor(accent)
                                    }
                                    Text("\(pcCount)").font(.system(size: 24, weight: .bold)).foregroundColor(.white).frame(minWidth: 40, alignment: .center)
                                    Button { if pcCount < 10 { pcCount += 1 } } label: {
                                        Image(systemName: "plus.circle.fill").font(.system(size: 28)).foregroundColor(accent)
                                    }
                                }
                                .frame(maxWidth: .infinity)
                                .padding(14)
                                .background(Color(hex: "#1E1F22"))
                                .cornerRadius(10)
                            } else {
                                HStack(spacing: 12) {
                                    sheetLabel("ВЫБЕРИТЕ ПК")
                                    Spacer()
                                    HStack(spacing: 8) {
                                        legendDot(Color(hex: "#57F287"), "Свободно")
                                        legendDot(Color(hex: "#ED4245"), "Занято")
                                    }
                                }
                                LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 8), count: 4), spacing: 8) {
                                    ForEach(zonePCs) { pc in
                                        PCCell(pc: pc, isSelected: selectedPCNames.contains(pc.name), accent: accent) {
                                            if pc.isFree {
                                                if selectedPCNames.contains(pc.name) { selectedPCNames.remove(pc.name) }
                                                else { selectedPCNames.insert(pc.name) }
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        VStack(alignment: .leading, spacing: 12) {
                            sheetLabel("КОНТАКТНЫЕ ДАННЫЕ")
                            sheetField("Имя", text: $clientName)
                            sheetField("Телефон", text: $phone, keyboard: .phonePad)
                        }

                        VStack(alignment: .leading, spacing: 8) {
                            sheetLabel("ДАТА И ВРЕМЯ")
                            DatePicker("", selection: $startDate, in: Date()..., displayedComponents: [.date, .hourAndMinute])
                                .datePickerStyle(.compact).labelsHidden().colorScheme(.dark)
                        }

                        VStack(alignment: .leading, spacing: 8) {
                            sheetLabel("ДЛИТЕЛЬНОСТЬ")
                            Picker("", selection: $duration) {
                                ForEach(durations, id: \.self) { Text($0).tag($0) }
                            }
                            .pickerStyle(.segmented)
                        }

                        if let err = errorMsg {
                            Text(err).font(.system(size: 13)).foregroundColor(Color(hex: "#ED4245")).multilineTextAlignment(.center).frame(maxWidth: .infinity)
                        }

                        Button {
                            Task { await submit() }
                        } label: {
                            Group {
                                if isSubmitting {
                                    ProgressView().tint(.white)
                                } else {
                                    Text("Подтвердить бронирование").font(.bebas(18)).foregroundColor(.white)
                                }
                            }
                            .frame(maxWidth: .infinity).padding(.vertical, 15)
                            .background(canSubmit ? accent : accent.opacity(0.4)).cornerRadius(12)
                        }
                        .disabled(!canSubmit || isSubmitting)
                    }
                }
                .padding(20)
            }
            .background(Color(hex: "#0B0D12"))
            .navigationTitle("Бронирование")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Закрыть") { dismiss() }.foregroundColor(accent)
                }
            }
        }
        .task { await loadPCs() }
        .onAppear { clientName = auth.user?.username ?? "" }
    }

    private var canSubmit: Bool {
        let hasPC = useFallback ? pcCount >= 1 : !selectedPCNames.isEmpty
        return hasPC && !clientName.isEmpty && !phone.isEmpty
    }

    private var successView: some View {
        VStack(spacing: 16) {
            Image(systemName: "checkmark.circle.fill").font(.system(size: 60)).foregroundColor(Color(hex: "#57F287"))
            Text("Бронирование отправлено!").font(.bebas(28)).foregroundColor(.white)
            Text("Ожидайте подтверждения от клуба").font(.system(size: 14)).foregroundColor(.gray).multilineTextAlignment(.center)
            Button("Закрыть") { dismiss() }
                .font(.bebas(18)).foregroundColor(.white)
                .frame(maxWidth: .infinity).padding(.vertical, 14).background(accent).cornerRadius(12)
        }
        .frame(maxWidth: .infinity).padding(.top, 40)
    }

    private func sheetLabel(_ text: String) -> some View {
        Text(text).font(.system(size: 11, weight: .semibold)).foregroundColor(Color(hex: "#949BA4")).tracking(1)
    }

    private func legendDot(_ color: Color, _ text: String) -> some View {
        HStack(spacing: 4) {
            Circle().fill(color).frame(width: 6, height: 6)
            Text(text).font(.system(size: 10)).foregroundColor(color)
        }
    }

    private func sheetField(_ placeholder: String, text: Binding<String>, keyboard: UIKeyboardType = .default) -> some View {
        TextField(placeholder, text: text)
            .keyboardType(keyboard).font(.system(size: 15)).foregroundColor(.white)
            .padding(12).background(Color(hex: "#1E1F22")).cornerRadius(10)
            .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color(hex: "#2F3136"), lineWidth: 1))
    }

    func loadPCs() async {
        loadingPCs = true
        zonePCs = (try? await APIService.shared.getZonePCs(clubId: club.id, zoneName: selectedZone.name))?.pcs ?? []
        loadingPCs = false
    }

    func submit() async {
        guard let token = auth.token else { return }
        isSubmitting = true
        errorMsg = nil
        let fmt = ISO8601DateFormatter()
        fmt.formatOptions = [.withInternetDateTime]
        let startStr = fmt.string(from: startDate)
        let pcNames: [String] = useFallback ? (1...pcCount).map { "ПК-\($0)" } : Array(selectedPCNames)
        do {
            _ = try await APIService.shared.createBooking(
                clubId: club.id, clientName: clientName, phone: phone,
                zoneName: selectedZone.name, duration: duration, pcNames: pcNames,
                startAt: startStr, token: token
            )
            withAnimation { success = true }
        } catch {
            errorMsg = "Ошибка: \(error.localizedDescription)"
        }
        isSubmitting = false
    }
}

// MARK: - Review Sheet

struct ReviewSheet: View {
    let clubId: Int
    @Binding var rating: Int
    @Binding var text: String
    let onSubmit: () async -> Void
    @EnvironmentObject var auth: AuthService
    @State private var isSubmitting = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                HStack(spacing: 8) {
                    ForEach(1...5, id: \.self) { star in
                        Image(systemName: star <= rating ? "star.fill" : "star")
                            .font(.system(size: 28))
                            .foregroundColor(Color(hex: "#FF7800"))
                            .onTapGesture { rating = star }
                    }
                }
                TextEditor(text: $text)
                    .frame(minHeight: 100).scrollContentBackground(.hidden)
                    .background(Color.white.opacity(0.05)).cornerRadius(12)
                Button {
                    Task {
                        isSubmitting = true
                        _ = try? await APIService.shared.submitReview(clubId: clubId, rating: rating, text: text, token: auth.token ?? "")
                        isSubmitting = false; text = ""; rating = 5
                        await onSubmit()
                    }
                } label: {
                    Text("Отправить").font(.system(size: 16, weight: .semibold))
                        .frame(maxWidth: .infinity).padding(.vertical, 12)
                        .background(Color(hex: "#FF7800")).foregroundColor(.white).cornerRadius(12)
                }
                .disabled(text.isEmpty || isSubmitting).opacity(text.isEmpty ? 0.5 : 1)
                Spacer()
            }
            .padding().background(Color(hex: "#121315"))
            .navigationTitle("Отзыв").navigationBarTitleDisplayMode(.inline)
        }
    }
}
