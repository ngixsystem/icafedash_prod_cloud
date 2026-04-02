import SwiftUI

struct TransferView: View {
    @EnvironmentObject var auth: AuthService
    @State private var listings: [TransferListing] = []
    @State private var isLoading = true
    @State private var selectedGame = "all"
    @State private var selectedType = "all"
    @State private var showCreateSheet = false

    private let accent = Color(hex: "#FF7800")
    private let games = ["all", "CS2", "Dota 2", "PUBG Mobile"]
    private let types = ["all", "lft", "lfs"]

    var body: some View {
        VStack(spacing: 0) {
            // Filters
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(games, id: \.self) { game in
                        Button {
                            selectedGame = game
                            Task { await loadListings() }
                        } label: {
                            Text(game == "all" ? "Все" : game)
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundColor(selectedGame == game ? .white : .gray)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                                .background(selectedGame == game ? accent.opacity(0.3) : Color.white.opacity(0.06))
                                .cornerRadius(8)
                        }
                    }

                    Divider().frame(height: 20)

                    ForEach(types, id: \.self) { type in
                        Button {
                            selectedType = type
                            Task { await loadListings() }
                        } label: {
                            Text(typeLabel(type))
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundColor(selectedType == type ? .white : .gray)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                                .background(selectedType == type ? accent.opacity(0.3) : Color.white.opacity(0.06))
                                .cornerRadius(8)
                        }
                    }
                }
                .padding(.horizontal)
                .padding(.vertical, 8)
            }

            ScrollView {
                if isLoading {
                    ProgressView().tint(accent).padding(.top, 40)
                } else if listings.isEmpty {
                    Text("Объявлений не найдено")
                        .foregroundColor(.gray)
                        .padding(.top, 40)
                } else {
                    LazyVStack(spacing: 10) {
                        ForEach(listings) { listing in
                            NavigationLink(destination: PlayerProfileView(playerId: listing.player.id)) {
                                TransferCardView(listing: listing)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.horizontal)
                }
            }
        }
        .background(Color(hex: "#121315"))
        .navigationTitle("Трансфер")
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            if auth.isLoggedIn {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showCreateSheet = true
                    } label: {
                        Image(systemName: "plus")
                            .foregroundColor(accent)
                    }
                }
            }
        }
        .sheet(isPresented: $showCreateSheet) {
            CreateListingSheet { await loadListings() }
                .presentationDetents([.medium])
        }
        .task { await loadListings() }
        .refreshable { await loadListings() }
    }

    func loadListings() async {
        let game = selectedGame == "all" ? nil : selectedGame
        let type = selectedType == "all" ? nil : selectedType
        listings = (try? await APIService.shared.getTransferListings(game: game, type: type))?.items ?? []
        isLoading = false
    }

    func typeLabel(_ type: String) -> String {
        switch type {
        case "lft": return "Ищу команду"
        case "lfs": return "Ищу игрока"
        default: return "Все"
        }
    }
}

struct TransferCardView: View {
    let listing: TransferListing

    var body: some View {
        HStack(spacing: 12) {
            AsyncImage(url: URL(string: listing.player.avatar_url.hasPrefix("http") ? listing.player.avatar_url : APIService.shared.baseHost + listing.player.avatar_url)) { image in
                image.resizable().aspectRatio(contentMode: .fill)
            } placeholder: {
                Circle().fill(Color.white.opacity(0.1))
            }
            .frame(width: 40, height: 40)
            .clipShape(Circle())

            VStack(alignment: .leading, spacing: 3) {
                HStack(spacing: 6) {
                    Text(listing.player.username)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(.white)
                    if let elo = listing.player.faceit_elo, let level = listing.player.faceit_level {
                        FaceitLevelBadge(level: level, elo: elo)
                    }
                }

                HStack(spacing: 8) {
                    Text(listing.listing_type == "lft" ? "Ищу команду" : "Ищу игрока")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundColor(listing.listing_type == "lft" ? .cyan : .purple)
                    Text(listing.game)
                        .font(.system(size: 11))
                        .foregroundColor(.gray)
                    if let roles = listing.roles {
                        Text(roles)
                            .font(.system(size: 11))
                            .foregroundColor(.gray)
                    }
                }

                if let desc = listing.description, !desc.isEmpty {
                    Text(desc)
                        .font(.system(size: 12))
                        .foregroundColor(.gray)
                        .lineLimit(2)
                }
            }

            Spacer()
        }
        .padding(12)
        .background(Color.white.opacity(0.05))
        .cornerRadius(12)
    }
}

struct CreateListingSheet: View {
    @EnvironmentObject var auth: AuthService
    @Environment(\.dismiss) var dismiss
    let onCreated: () async -> Void

    @State private var listingType = "lft"
    @State private var game = "CS2"
    @State private var roles = ""
    @State private var description = ""
    @State private var contact = ""

    private let accent = Color(hex: "#FF7800")

    var body: some View {
        NavigationStack {
            VStack(spacing: 14) {
                Picker("Тип", selection: $listingType) {
                    Text("Ищу команду").tag("lft")
                    Text("Ищу игрока").tag("lfs")
                }
                .pickerStyle(.segmented)

                Picker("Игра", selection: $game) {
                    Text("CS2").tag("CS2")
                    Text("Dota 2").tag("Dota 2")
                    Text("PUBG Mobile").tag("PUBG Mobile")
                }
                .pickerStyle(.segmented)

                TextField("Роли (например: AWP, Entry)", text: $roles)
                    .textFieldStyle(DarkFieldStyle())

                TextField("Описание", text: $description)
                    .textFieldStyle(DarkFieldStyle())

                TextField("Контакт (Telegram и т.д.)", text: $contact)
                    .textFieldStyle(DarkFieldStyle())

                Button {
                    Task {
                        guard let token = auth.token else { return }
                        var params: [String: Any] = [
                            "listing_type": listingType,
                            "game": game
                        ]
                        if !roles.isEmpty { params["roles"] = roles }
                        if !description.isEmpty { params["description"] = description }
                        if !contact.isEmpty { params["contact"] = contact }
                        _ = try? await APIService.shared.createTransferListing(params: params, token: token)
                        await onCreated()
                        dismiss()
                    }
                } label: {
                    Text("Создать")
                        .font(.system(size: 16, weight: .semibold))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(accent)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                }

                Spacer()
            }
            .padding()
            .background(Color(hex: "#121315"))
            .navigationTitle("Новое объявление")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}
