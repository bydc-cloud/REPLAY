//
//  ContentView.swift
//  ReplayMusic
//
//  Created on 11/25/2025.
//

import SwiftUI
import SwiftData

struct ContentView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \MusicTrack.dateAdded, order: .reverse) private var tracks: [MusicTrack]
    @Query(sort: \Playlist.dateCreated, order: .reverse) private var playlists: [Playlist]
    
    @StateObject private var playerService = MusicPlayerService()
    @State private var selectedTab: Tab = .library
    @State private var showingImportPicker = false
    
    enum Tab {
        case library
        case playlists
        case nowPlaying
    }
    
    var body: some View {
        NavigationStack {
            ZStack(alignment: .bottom) {
                // Main Content
                TabView(selection: $selectedTab) {
                    LibraryView(tracks: tracks, playerService: playerService)
                        .tag(Tab.library)
                        .tabItem {
                            Label("Library", systemImage: "music.note.list")
                        }
                    
                    PlaylistsView(playlists: playlists)
                        .tag(Tab.playlists)
                        .tabItem {
                            Label("Playlists", systemImage: "music.note.list")
                        }
                    
                    NowPlayingView(playerService: playerService)
                        .tag(Tab.nowPlaying)
                        .tabItem {
                            Label("Now Playing", systemImage: "play.circle.fill")
                        }
                }
                
                // Mini Player Bar (when not on Now Playing tab)
                if selectedTab != .nowPlaying, playerService.currentTrack != nil {
                    MiniPlayerBar(playerService: playerService)
                        .onTapGesture {
                            selectedTab = .nowPlaying
                        }
                }
            }
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        showingImportPicker = true
                    } label: {
                        Label("Import Music", systemImage: "plus")
                    }
                }
            }
            .fileImporter(
                isPresented: $showingImportPicker,
                allowedContentTypes: [.audio],
                allowsMultipleSelection: true
            ) { result in
                Task {
                    await handleImportResult(result)
                }
            }
        }
    }
    
    private func handleImportResult(_ result: Result<[URL], Error>) {
        Task {
            do {
                let urls = try result.get()
                let importService = MusicImportService(modelContext: modelContext)
                _ = try await importService.importMusicFiles(from: urls)
            } catch {
                print("Import failed: \(error)")
            }
        }
    }
}

#Preview {
    ContentView()
        .modelContainer(for: [MusicTrack.self, Playlist.self], inMemory: true)
}
