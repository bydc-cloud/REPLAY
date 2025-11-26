//
//  MusicOrganizerApp.swift
//  Design Premium Music Organizer
//
//  Main app entry point for iOS
//

import SwiftUI
import SwiftData

@main
struct MusicOrganizerApp: App {
    var sharedModelContainer: ModelContainer = {
        let schema = Schema([
            MusicTrack.self,
            Playlist.self,
            Album.self
        ])
        let modelConfiguration = ModelConfiguration(schema: schema, isStoredInMemoryOnly: false)

        do {
            return try ModelContainer(for: schema, configurations: [modelConfiguration])
        } catch {
            fatalError("Could not create ModelContainer: \(error)")
        }
    }()

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        .modelContainer(sharedModelContainer)
    }
}
