//
//  ReplayMusicApp.swift
//  ReplayMusic
//
//  Created on 11/25/2025.
//

import SwiftUI
import SwiftData

@main
struct ReplayMusicApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        .modelContainer(for: [MusicTrack.self, Playlist.self])
    }
}
