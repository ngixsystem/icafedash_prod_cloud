import Foundation
import CoreLocation

class LocationService: NSObject, ObservableObject, CLLocationManagerDelegate {
    static let shared = LocationService()

    @Published var userLocation: CLLocationCoordinate2D?
    @Published var authorizationStatus: CLAuthorizationStatus = .notDetermined

    private let manager = CLLocationManager()

    override init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyHundredMeters
    }

    func requestPermission() {
        manager.requestWhenInUseAuthorization()
    }

    func requestLocation() {
        manager.requestLocation()
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        userLocation = locations.first?.coordinate
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        print("Location error: \(error.localizedDescription)")
    }

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        authorizationStatus = manager.authorizationStatus
        if manager.authorizationStatus == .authorizedWhenInUse || manager.authorizationStatus == .authorizedAlways {
            manager.requestLocation()
        }
    }

    func distanceKm(to lat: Double, lng: Double) -> Double? {
        guard let loc = userLocation else { return nil }
        let R = 6371.0
        let dLat = (lat - loc.latitude) * .pi / 180
        let dLng = (lng - loc.longitude) * .pi / 180
        let a = sin(dLat / 2) * sin(dLat / 2) +
                cos(loc.latitude * .pi / 180) * cos(lat * .pi / 180) *
                sin(dLng / 2) * sin(dLng / 2)
        let c = 2 * atan2(sqrt(a), sqrt(1 - a))
        return R * c
    }

    func formatDistance(to lat: Double, lng: Double) -> String? {
        guard let km = distanceKm(to: lat, lng: lng) else { return nil }
        if km < 1 { return "\(Int(km * 1000)) м" }
        return String(format: "%.1f км", km)
    }
}
