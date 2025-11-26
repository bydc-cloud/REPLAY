//
//  ContentView.swift
//  Design Premium Music Organizer
//
//  Main view with tab-based navigation
//

import SwiftUI
import SwiftData

struct ContentView: View {
    @Environment(\.modelContext) private var modelContext
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            LibraryView()
                .tabItem {
                    Label("Library", systemImage: "music.note.list")
                }
                .tag(0)
            
            PlaylistsView()
                .tabItem {
                    Label("Playlists", systemImage: "music.note")
                }
                .tag(1)
            
            AlbumsView()
                .tabItem {
                    Label("Albums", systemImage: "square.stack")
                }
                .tag(2)
            
            NowPlayingView()
                .tabItem {
                    Label("Now Playing", systemImage: "play.circle.fill")
                }
                .tag(3)
        }
    }
}

#Preview {
    ContentView()
        .modelContainer(for: [MusicTrack.self, Playlist.self, Album.self], inMemory: true)
}
