import SwiftUI
import MapKit

struct MapScreenView: View {
    @State private var clubs: [Club] = []
    @State private var position: MapCameraPosition = .region(
        MKCoordinateRegion(
            center: CLLocationCoordinate2D(latitude: 41.311, longitude: 69.279),
            span: MKCoordinateSpan(latitudeDelta: 0.15, longitudeDelta: 0.15)
        )
    )
    @State private var selectedClub: Club?

    var body: some View {
        ZStack {
            Map(position: $position) {
                ForEach(clubs.filter { $0.lat != nil && $0.lng != nil }) { club in
                    Annotation(club.name, coordinate: CLLocationCoordinate2D(latitude: club.lat!, longitude: club.lng!)) {
                        Button {
                            selectedClub = club
                        } label: {
                            VStack(spacing: 2) {
                                Image(systemName: "gamecontroller.fill")
                                    .font(.system(size: 14))
                                    .foregroundColor(.white)
                                    .padding(8)
                                    .background(markerColor(for: club))
                                    .clipShape(Circle())
                                    .shadow(radius: 3)

                                Text("\(club.pcsFree)")
                                    .font(.system(size: 9, weight: .bold))
                                    .foregroundColor(.white)
                                    .padding(.horizontal, 5)
                                    .padding(.vertical, 1)
                                    .background(markerColor(for: club).opacity(0.9))
                                    .cornerRadius(4)
                            }
                        }
                    }
                }
            }
            .mapStyle(.dark)
        }
        .navigationTitle("Карта")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(item: $selectedClub) { club in
            NavigationStack {
                ClubDetailView(clubId: club.id)
            }
            .presentationDetents([.large])
        }
        .task {
            clubs = (try? await APIService.shared.getClubs()) ?? []
        }
    }

    func markerColor(for club: Club) -> Color {
        if club.pcsFree == 0 { return .red }
        if club.pcsFree <= 10 { return .yellow }
        return .green
    }
}
