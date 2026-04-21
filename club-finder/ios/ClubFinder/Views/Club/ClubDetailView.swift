import SwiftUI

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

    private let accent = Color(hex: "#FF7800")

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().tint(accent).padding(.top, 80)
            } else if let club {
                VStack(alignment: .leading, spacing: 0) {
                    // Photo carousel
                    let allPhotos: [String] = {
                        var arr: [String] = []
                        if let main = club.main_photo_url, !main.isEmpty { arr.append(main) }
                        if let extra = club.photos { arr.append(contentsOf: extra.filter { !$0.isEmpty }) }
                        return Array(NSOrderedSet(array: arr) as? [String] ?? arr)
                    }()

                    if !allPhotos.isEmpty {
                        TabView(selection: $selectedPhotoIndex) {
                            ForEach(Array(allPhotos.enumerated()), id: \.offset) { idx, photo in
                                let url = photo.hasPrefix("http") ? URL(string: photo) : URL(string: APIService.shared.baseHost + photo)
                                AsyncImage(url: url) { image in
                                    image.resizable().aspectRatio(contentMode: .fill)
                                } placeholder: {
                                    Rectangle().fill(Color(hex: "#1E1F22"))
                                }
                                .clipped()
                                .tag(idx)
                            }
                        }
                        .tabViewStyle(.page(indexDisplayMode: .automatic))
                        .frame(height: 300)
                    }

                    VStack(alignment: .leading, spacing: 16) {
                        // Header
                        HStack(alignment: .top, spacing: 12) {
                            if let logo = club.logo, !logo.isEmpty {
                                let logoUrl = logo.hasPrefix("http") ? URL(string: logo) : URL(string: APIService.shared.baseHost + logo)
                                AsyncImage(url: logoUrl) { image in
                                    image.resizable().aspectRatio(contentMode: .fill)
                                } placeholder: {
                                    RoundedRectangle(cornerRadius: 10).fill(Color(hex: "#2F3136"))
                                }
                                .frame(width: 52, height: 52)
                                .clipShape(RoundedRectangle(cornerRadius: 10))
                            }

                            VStack(alignment: .leading, spacing: 4) {
                                Text(club.name)
                                    .font(.system(size: 22, weight: .bold))
                                    .foregroundColor(.white)
                                Text(club.address)
                                    .font(.system(size: 13))
                                    .foregroundColor(Color(hex: "#a5adba"))
                            }

                            Spacer()

                            VStack(alignment: .trailing, spacing: 4) {
                                HStack(spacing: 3) {
                                    Image(systemName: "star.fill").foregroundColor(accent).font(.system(size: 12))
                                    Text(String(format: "%.1f", club.rating))
                                        .font(.system(size: 15, weight: .bold)).foregroundColor(.white)
                                }
                                if let count = club.rating_count {
                                    Text("(\(count))").font(.system(size: 11)).foregroundColor(.gray)
                                }
                            }
                        }

                        // Status + hours
                        HStack(spacing: 12) {
                            HStack(spacing: 5) {
                                Circle()
                                    .fill(club.isOpen ? Color(hex: "#57F287") : Color(hex: "#ED4245"))
                                    .frame(width: 7, height: 7)
                                Text(club.isOpen ? "Открыто" : "Закрыто")
                                    .font(.system(size: 12, weight: .semibold))
                                    .foregroundColor(club.isOpen ? Color(hex: "#57F287") : Color(hex: "#ED4245"))
                            }
                            if let hours = club.working_hours {
                                HStack(spacing: 4) {
                                    Image(systemName: "clock").font(.system(size: 11)).foregroundColor(.gray)
                                    Text(hours).font(.system(size: 12)).foregroundColor(.gray)
                                }
                            }
                        }

                        // Availability bar
                        if club.pcsTotal > 0 {
                            VStack(alignment: .leading, spacing: 6) {
                                HStack {
                                    Text("\(club.pcsFree) свободно")
                                        .font(.system(size: 12)).foregroundColor(Color(hex: "#a5adba"))
                                    Spacer()
                                    Text("\(club.pcsTotal) всего")
                                        .font(.system(size: 12)).foregroundColor(Color(hex: "#a5adba"))
                                }
                                GeometryReader { geo in
                                    let fraction = Double(club.pcsFree) / Double(club.pcsTotal)
                                    let color: Color = fraction > 0.5 ? Color(hex: "#57F287") : fraction > 0.2 ? Color(hex: "#FEE75C") : Color(hex: "#ED4245")
                                    ZStack(alignment: .leading) {
                                        RoundedRectangle(cornerRadius: 2).fill(Color(hex: "#272727")).frame(height: 5)
                                        RoundedRectangle(cornerRadius: 2).fill(color).frame(width: geo.size.width * fraction, height: 5)
                                    }
                                }
                                .frame(height: 5)
                            }
                            .padding(12)
                            .background(Color(hex: "#1E1F22"))
                            .cornerRadius(12)
                            .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color(hex: "#2F3136"), lineWidth: 1))
                        }

                        // Description
                        if let desc = club.description, !desc.isEmpty {
                            Text(desc)
                                .font(.system(size: 14))
                                .foregroundColor(Color(hex: "#a5adba"))
                        }

                        // Zones
                        if let zones = club.zones, !zones.isEmpty {
                            VStack(alignment: .leading, spacing: 10) {
                                SectionHeader(title: "ЗОНЫ")
                                ForEach(zones) { zone in
                                    ZoneRow(zone: zone, accent: accent) {
                                        bookingZone = zone
                                    }
                                }
                            }
                        }

                        // Tariffs
                        if let tariffs = club.tariffs, !tariffs.isEmpty {
                            VStack(alignment: .leading, spacing: 10) {
                                SectionHeader(title: "ТАРИФЫ")
                                ForEach(tariffs) { tariff in
                                    HStack {
                                        Text(tariff.duration)
                                            .font(.system(size: 14)).foregroundColor(.white)
                                        Spacer()
                                        Text(tariff.priceString)
                                            .font(.system(size: 14, weight: .bold)).foregroundColor(accent)
                                    }
                                    .padding(12)
                                    .background(Color(hex: "#1E1F22"))
                                    .cornerRadius(10)
                                    .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color(hex: "#2F3136"), lineWidth: 1))
                                }
                            }
                        }

                        // Book button
                        if auth.isLoggedIn, let zones = club.zones, !zones.isEmpty {
                            Button {
                                bookingZone = zones.first
                            } label: {
                                Text("Забронировать ПК")
                                    .font(.system(size: 16, weight: .bold))
                                    .foregroundColor(.white)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 14)
                                    .background(accent)
                                    .cornerRadius(12)
                            }
                        }

                        // Reviews
                        VStack(alignment: .leading, spacing: 10) {
                            HStack {
                                SectionHeader(title: "ОТЗЫВЫ")
                                Spacer()
                                if auth.isLoggedIn {
                                    Button { showReviewSheet = true } label: {
                                        Text("Написать")
                                            .font(.system(size: 12, weight: .semibold))
                                            .foregroundColor(accent)
                                    }
                                }
                            }
                            if reviews.isEmpty {
                                Text("Пока нет отзывов").font(.system(size: 14)).foregroundColor(.gray)
                            } else {
                                ForEach(reviews) { review in
                                    VStack(alignment: .leading, spacing: 6) {
                                        HStack {
                                            Text(review.username)
                                                .font(.system(size: 14, weight: .semibold)).foregroundColor(.white)
                                            Spacer()
                                            HStack(spacing: 2) {
                                                ForEach(1...5, id: \.self) { star in
                                                    Image(systemName: star <= review.rating ? "star.fill" : "star")
                                                        .font(.system(size: 10)).foregroundColor(accent)
                                                }
                                            }
                                        }
                                        Text(review.text).font(.system(size: 13)).foregroundColor(.gray)
                                    }
                                    .padding(12)
                                    .background(Color(hex: "#1E1F22"))
                                    .cornerRadius(10)
                                    .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color(hex: "#2F3136"), lineWidth: 1))
                                }
                            }
                        }
                    }
                    .padding(16)
                }
            }
        }
        .background(Color(hex: "#0B0D12"))
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

// MARK: - Section Header
private struct SectionHeader: View {
    let title: String
    var body: some View {
        Text(title)
            .font(.system(size: 11, weight: .semibold))
            .foregroundColor(Color(hex: "#949BA4"))
            .tracking(1)
    }
}

// MARK: - Zone Row
private struct ZoneRow: View {
    let zone: Zone
    let accent: Color
    let onBook: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 3) {
                Text(zone.name)
                    .font(.system(size: 14, weight: .semibold)).foregroundColor(.white)
                if let specs = zone.specs, !specs.isEmpty {
                    Text(specs).font(.system(size: 11)).foregroundColor(.gray)
                }
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 2) {
                HStack(spacing: 4) {
                    Text("\(zone.pcsFreeInt)")
                        .font(.system(size: 14, weight: .bold)).foregroundColor(Color(hex: "#57F287"))
                    Text("/").foregroundColor(.gray).font(.system(size: 12))
                    Text("\(zone.capacityInt)")
                        .font(.system(size: 14)).foregroundColor(.gray)
                }
                Text("свободно").font(.system(size: 10)).foregroundColor(.gray)
            }
            if let price = zone.price, !price.isEmpty {
                Text(price)
                    .font(.system(size: 13, weight: .bold)).foregroundColor(accent)
            }
            Button(action: onBook) {
                Image(systemName: "calendar.badge.plus")
                    .font(.system(size: 16))
                    .foregroundColor(accent)
            }
        }
        .padding(12)
        .background(Color(hex: "#1E1F22"))
        .cornerRadius(10)
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color(hex: "#2F3136"), lineWidth: 1))
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
                        // Zone picker
                        if let zones = club.zones, zones.count > 1 {
                            VStack(alignment: .leading, spacing: 8) {
                                label("ЗОНА")
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

                        // PCs grid or fallback counter
                        VStack(alignment: .leading, spacing: 8) {
                            if loadingPCs {
                                label("ЗАГРУЗКА ПК...")
                                ProgressView().tint(accent).frame(maxWidth: .infinity).padding(.vertical, 20)
                            } else if useFallback {
                                label("КОЛИЧЕСТВО ПК")
                                HStack(spacing: 16) {
                                    Button { if pcCount > 1 { pcCount -= 1 } } label: {
                                        Image(systemName: "minus.circle.fill")
                                            .font(.system(size: 28)).foregroundColor(accent)
                                    }
                                    Text("\(pcCount)")
                                        .font(.system(size: 24, weight: .bold)).foregroundColor(.white)
                                        .frame(minWidth: 40, alignment: .center)
                                    Button { if pcCount < 10 { pcCount += 1 } } label: {
                                        Image(systemName: "plus.circle.fill")
                                            .font(.system(size: 28)).foregroundColor(accent)
                                    }
                                }
                                .frame(maxWidth: .infinity)
                                .padding(14)
                                .background(Color(hex: "#1E1F22"))
                                .cornerRadius(10)
                                .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color(hex: "#2F3136"), lineWidth: 1))
                            } else {
                                // Legend + count
                                HStack(spacing: 12) {
                                    label("ВЫБЕРИТЕ ПК")
                                    Spacer()
                                    HStack(spacing: 10) {
                                        legendDot(color: Color(hex: "#57F287"), text: "Свободно")
                                        legendDot(color: Color(hex: "#ED4245"), text: "Занято")
                                        legendDot(color: Color(hex: "#5c6068"), text: "Офлайн")
                                    }
                                }
                                LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 8), count: 4), spacing: 8) {
                                    ForEach(zonePCs) { pc in
                                        PCCell(pc: pc,
                                               isSelected: selectedPCNames.contains(pc.name),
                                               accent: accent) {
                                            if pc.isFree {
                                                if selectedPCNames.contains(pc.name) {
                                                    selectedPCNames.remove(pc.name)
                                                } else {
                                                    selectedPCNames.insert(pc.name)
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        // Form
                        VStack(alignment: .leading, spacing: 12) {
                            label("КОНТАКТНЫЕ ДАННЫЕ")
                            field("Имя", text: $clientName)
                            field("Телефон", text: $phone, keyboard: .phonePad)
                        }

                        VStack(alignment: .leading, spacing: 8) {
                            label("ДАТА И ВРЕМЯ")
                            DatePicker("", selection: $startDate, in: Date()..., displayedComponents: [.date, .hourAndMinute])
                                .datePickerStyle(.compact)
                                .labelsHidden()
                                .colorScheme(.dark)
                        }

                        VStack(alignment: .leading, spacing: 8) {
                            label("ДЛИТЕЛЬНОСТЬ")
                            Picker("", selection: $duration) {
                                ForEach(durations, id: \.self) { Text($0).tag($0) }
                            }
                            .pickerStyle(.segmented)
                        }

                        if let err = errorMsg {
                            Text(err)
                                .font(.system(size: 13))
                                .foregroundColor(Color(hex: "#ED4245"))
                                .multilineTextAlignment(.center)
                                .frame(maxWidth: .infinity)
                        }

                        Button {
                            Task { await submit() }
                        } label: {
                            Group {
                                if isSubmitting {
                                    ProgressView().tint(.white)
                                } else {
                                    Text("Подтвердить бронирование")
                                        .font(.system(size: 16, weight: .bold))
                                        .foregroundColor(.white)
                                }
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(canSubmit ? accent : accent.opacity(0.4))
                            .cornerRadius(12)
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
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 60)).foregroundColor(Color(hex: "#57F287"))
            Text("Бронирование отправлено!")
                .font(.system(size: 20, weight: .bold)).foregroundColor(.white)
            Text("Ожидайте подтверждения от клуба")
                .font(.system(size: 14)).foregroundColor(.gray).multilineTextAlignment(.center)
            Button("Закрыть") { dismiss() }
                .font(.system(size: 16, weight: .bold)).foregroundColor(.white)
                .frame(maxWidth: .infinity).padding(.vertical, 14)
                .background(accent).cornerRadius(12)
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 40)
    }

    private func label(_ text: String) -> some View {
        Text(text)
            .font(.system(size: 11, weight: .semibold))
            .foregroundColor(Color(hex: "#949BA4"))
            .tracking(1)
    }

    private func legendDot(color: Color, text: String) -> some View {
        HStack(spacing: 4) {
            Circle().fill(color).frame(width: 6, height: 6)
            Text(text).font(.system(size: 10)).foregroundColor(color)
        }
    }

    private func field(_ placeholder: String, text: Binding<String>, keyboard: UIKeyboardType = .default) -> some View {
        TextField(placeholder, text: text)
            .keyboardType(keyboard)
            .font(.system(size: 15))
            .foregroundColor(.white)
            .padding(12)
            .background(Color(hex: "#1E1F22"))
            .cornerRadius(10)
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

        let pcNames: [String] = useFallback
            ? (1...pcCount).map { "ПК-\($0)" }
            : Array(selectedPCNames)

        do {
            _ = try await APIService.shared.createBooking(
                clubId: club.id,
                clientName: clientName,
                phone: phone,
                zoneName: selectedZone.name,
                duration: duration,
                pcNames: pcNames,
                startAt: startStr,
                token: token
            )
            withAnimation { success = true }
        } catch {
            errorMsg = "Ошибка: \(error.localizedDescription)"
        }
        isSubmitting = false
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

    private var bgColor: Color {
        if isSelected { return accent.opacity(0.25) }
        switch pc.status {
        case "free":    return Color(hex: "#57F287").opacity(0.08)
        case "busy":    return Color(hex: "#ED4245").opacity(0.08)
        default:        return Color.white.opacity(0.04)
        }
    }

    private var icon: String {
        if isSelected       { return "checkmark.circle.fill" }
        if pc.isFree        { return "desktopcomputer" }
        if pc.status == "busy" { return "lock.fill" }
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
            .background(bgColor)
            .cornerRadius(10)
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .stroke(statusColor.opacity(isSelected ? 0.8 : 0.35), lineWidth: 1)
            )
        }
        .disabled(!pc.isFree && !isSelected)
        .opacity(pc.status == "offline" ? 0.4 : 1)
        .buttonStyle(.plain)
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
                    .frame(minHeight: 100)
                    .scrollContentBackground(.hidden)
                    .background(Color.white.opacity(0.05))
                    .cornerRadius(12)

                Button {
                    Task {
                        isSubmitting = true
                        _ = try? await APIService.shared.submitReview(clubId: clubId, rating: rating, text: text, token: auth.token ?? "")
                        isSubmitting = false
                        text = ""
                        rating = 5
                        await onSubmit()
                    }
                } label: {
                    Text("Отправить")
                        .font(.system(size: 16, weight: .semibold))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(Color(hex: "#FF7800"))
                        .foregroundColor(.white)
                        .cornerRadius(12)
                }
                .disabled(text.isEmpty || isSubmitting)
                .opacity(text.isEmpty ? 0.5 : 1)

                Spacer()
            }
            .padding()
            .background(Color(hex: "#121315"))
            .navigationTitle("Отзыв")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}
