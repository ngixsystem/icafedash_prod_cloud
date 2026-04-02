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

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView()
                    .tint(Color(hex: "#FF7800"))
                    .padding(.top, 80)
            } else if let club {
                VStack(alignment: .leading, spacing: 0) {
                    // Photo carousel
                    if let photos = club.photos, !photos.isEmpty {
                        TabView(selection: $selectedPhotoIndex) {
                            ForEach(Array(photos.enumerated()), id: \.offset) { idx, photo in
                                AsyncImage(url: URL(string: APIService.shared.baseHost + photo)) { image in
                                    image.resizable().aspectRatio(contentMode: .fill)
                                } placeholder: {
                                    Rectangle().fill(Color.white.opacity(0.05))
                                }
                                .tag(idx)
                            }
                        }
                        .tabViewStyle(.page(indexDisplayMode: .automatic))
                        .frame(height: 220)
                    }

                    VStack(alignment: .leading, spacing: 16) {
                        // Header
                        HStack(alignment: .top) {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(club.name)
                                    .font(.system(size: 24, weight: .bold))
                                    .foregroundColor(.white)
                                Text(club.address)
                                    .font(.system(size: 14))
                                    .foregroundColor(.gray)
                            }
                            Spacer()
                            HStack(spacing: 3) {
                                Image(systemName: "star.fill")
                                    .foregroundColor(Color(hex: "#FF7800"))
                                Text(String(format: "%.1f", club.rating))
                                    .font(.system(size: 16, weight: .bold))
                                    .foregroundColor(.white)
                                if let count = club.rating_count {
                                    Text("(\(count))")
                                        .font(.system(size: 12))
                                        .foregroundColor(.gray)
                                }
                            }
                        }

                        // Working hours
                        if let hours = club.working_hours {
                            HStack(spacing: 6) {
                                Image(systemName: "clock")
                                    .foregroundColor(.gray)
                                    .font(.system(size: 14))
                                Text(hours)
                                    .font(.system(size: 14))
                                    .foregroundColor(.gray)
                            }
                        }

                        // Description
                        if let desc = club.description, !desc.isEmpty {
                            Text(desc)
                                .font(.system(size: 14))
                                .foregroundColor(.gray.opacity(0.8))
                        }

                        // Zones
                        if let zones = club.zones, !zones.isEmpty {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Зоны")
                                    .font(.system(size: 16, weight: .semibold))
                                    .foregroundColor(.white)

                                ForEach(zones) { zone in
                                    HStack {
                                        VStack(alignment: .leading, spacing: 2) {
                                            Text(zone.name)
                                                .font(.system(size: 14, weight: .semibold))
                                                .foregroundColor(.white)
                                            if let specs = zone.specs {
                                                Text(specs)
                                                    .font(.system(size: 11))
                                                    .foregroundColor(.gray)
                                            }
                                        }
                                        Spacer()
                                        Text("\(zone.pcsFree)/\(zone.capacity)")
                                            .font(.system(size: 13))
                                            .foregroundColor(.gray)
                                        if let price = zone.price {
                                            Text(price)
                                                .font(.system(size: 13, weight: .semibold))
                                                .foregroundColor(Color(hex: "#FF7800"))
                                        }
                                    }
                                    .padding(12)
                                    .background(Color.white.opacity(0.05))
                                    .cornerRadius(12)
                                }
                            }
                        }

                        // Tariffs
                        if let tariffs = club.tariffs, !tariffs.isEmpty {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Тарифы")
                                    .font(.system(size: 16, weight: .semibold))
                                    .foregroundColor(.white)

                                ForEach(tariffs) { tariff in
                                    HStack {
                                        Text(tariff.duration)
                                            .font(.system(size: 14))
                                            .foregroundColor(.white)
                                        Spacer()
                                        Text(tariff.priceString)
                                            .font(.system(size: 14, weight: .semibold))
                                            .foregroundColor(Color(hex: "#FF7800"))
                                    }
                                    .padding(12)
                                    .background(Color.white.opacity(0.05))
                                    .cornerRadius(12)
                                }
                            }
                        }

                        // Reviews
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Text("Отзывы")
                                    .font(.system(size: 16, weight: .semibold))
                                    .foregroundColor(.white)
                                Spacer()
                                if auth.isLoggedIn {
                                    Button {
                                        showReviewSheet = true
                                    } label: {
                                        Text("Написать")
                                            .font(.system(size: 12, weight: .semibold))
                                            .foregroundColor(Color(hex: "#FF7800"))
                                    }
                                }
                            }

                            if reviews.isEmpty {
                                Text("Пока нет отзывов")
                                    .font(.system(size: 14))
                                    .foregroundColor(.gray)
                            } else {
                                ForEach(reviews) { review in
                                    VStack(alignment: .leading, spacing: 6) {
                                        HStack {
                                            Text(review.username)
                                                .font(.system(size: 14, weight: .semibold))
                                                .foregroundColor(.white)
                                            Spacer()
                                            HStack(spacing: 2) {
                                                ForEach(1...5, id: \.self) { star in
                                                    Image(systemName: star <= review.rating ? "star.fill" : "star")
                                                        .font(.system(size: 10))
                                                        .foregroundColor(Color(hex: "#FF7800"))
                                                }
                                            }
                                        }
                                        Text(review.text)
                                            .font(.system(size: 13))
                                            .foregroundColor(.gray)
                                    }
                                    .padding(12)
                                    .background(Color.white.opacity(0.05))
                                    .cornerRadius(12)
                                }
                            }
                        }
                    }
                    .padding(16)
                }
            }
        }
        .background(Color(hex: "#121315"))
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showReviewSheet) {
            ReviewSheet(clubId: clubId, rating: $reviewRating, text: $reviewText) {
                await loadReviews()
                showReviewSheet = false
            }
            .presentationDetents([.medium])
        }
        .task {
            await loadData()
        }
    }

    func loadData() async {
        do {
            async let clubData = APIService.shared.getClub(id: clubId)
            async let reviewsData = APIService.shared.getClubReviews(id: clubId)
            club = try await clubData
            reviews = try await reviewsData
        } catch {
            print("Error: \(error)")
        }
        isLoading = false
    }

    func loadReviews() async {
        reviews = (try? await APIService.shared.getClubReviews(id: clubId)) ?? reviews
    }
}

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
